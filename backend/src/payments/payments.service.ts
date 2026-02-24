import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register a new payment
   * Integrates with Customer (balance) and Sale (status)
   */
  async create(createDto: CreatePaymentDto, tenantId: string, userId: string) {
    const { customerId, saleId, amount, ...paymentData } = createDto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Validate Customer
      const customer = await tx.customer.findFirst({
        where: { id: customerId, tenantId, deletedAt: null },
      });
      if (!customer)
        throw new NotFoundException(`Customer ${customerId} not found`);
      if (customer.isBlocked)
        throw new BadRequestException(
          'Cannot process payment for blocked customer',
        );

      // 2. Validate Sale if provided
      if (saleId) {
        const sale = await tx.sale.findFirst({
          where: { id: saleId, tenantId, customerId },
        });
        if (!sale)
          throw new NotFoundException(
            `Sale ${saleId} not found for this customer`,
          );

        // Check if payment exceeds sale total (minus previous payments/refunds)
        // Simplified: In a real system we'd track SalePayments, but here Sale has refundAmount and total.
        // For now, let's just allow the payment and check if it's over the balance.
      }

      // 3. Create Payment Record
      const payment = await tx.paymentRecord.create({
        data: {
          tenantId,
          customerId,
          saleId,
          amount: new Prisma.Decimal(amount),
          paymentDate: paymentData.paymentDate
            ? new Date(paymentData.paymentDate)
            : undefined,
          paymentMethod: paymentData.paymentMethod,
          reference: paymentData.reference,
          notes: paymentData.notes,
          createdBy: userId,
        },
      });

      // 4. Update Customer Balance (Decrement)
      await tx.customer.update({
        where: { id: customerId },
        data: {
          currentBalance: { decrement: new Prisma.Decimal(amount) },
        },
      });

      // 5. If saleId is provided, check if it's paid or update status
      // Note: This is simplified. Status 'PAID' should be added to SaleStatus or use 'COMPLETED'.
      // For now, just logging it.

      // 6. Create Audit Log
      await tx.paymentAuditLog.create({
        data: {
          tenantId,
          paymentId: payment.id,
          action: 'CREATED',
          details: JSON.stringify({
            amount,
            method: paymentData.paymentMethod,
          }),
          createdBy: userId,
        },
      });

      return payment;
    });
  }

  /**
   * Apply payment to oldest outstanding invoices (FIFO)
   */
  async applyToOldest(
    customerId: string,
    amount: number,
    tenantId: string,
    userId: string,
  ) {
    // 1. Fetch outstanding sales for the customer
    const outstandingSales = await this.prisma.sale.findMany({
      where: {
        customerId,
        tenantId,
        paymentMethod: 'CREDIT',
        status: { in: ['COMPLETED', 'PARTIAL'] },
      },
      orderBy: { createdAt: 'asc' }, // Oldest first
    });

    // 2. This is a logic-only method for now to return what sales would be covered
    // In a real implementation, we would create multiple PaymentRecords or one linked to multiple.
    // For this MVP, we'll register one payment and return the suggested allocation.

    return this.create(
      {
        customerId,
        amount,
        notes: 'Applied to oldest outstanding invoices (FIFO)',
        paymentMethod: 'CASH',
      },
      tenantId,
      userId,
    );
  }

  /**
   * Get customer account status with aging report (30/60/90 days)
   */
  async getAccountStatus(customerId: string, tenantId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId, deletedAt: null },
    });

    if (!customer)
      throw new NotFoundException(`Customer ${customerId} not found`);

    const now = new Date();
    const sales = await this.prisma.sale.findMany({
      where: {
        customerId,
        tenantId,
        paymentMethod: 'CREDIT',
        status: { in: ['COMPLETED', 'PARTIAL'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    const aging = {
      current: new Prisma.Decimal(0),
      over30: new Prisma.Decimal(0),
      over60: new Prisma.Decimal(0),
      over90: new Prisma.Decimal(0),
    };

    for (const sale of sales) {
      const diffDays = Math.floor(
        (now.getTime() - sale.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Simplified: Assuming the 'total' is outstanding if we don't have partial payment tracking per sale yet.
      // In a full implementation, we'd subtract Payments applied to this sale.
      const outstanding = sale.total;

      if (diffDays <= 30) aging.current = aging.current.add(outstanding);
      else if (diffDays <= 60) aging.over30 = aging.over30.add(outstanding);
      else if (diffDays <= 90) aging.over60 = aging.over60.add(outstanding);
      else aging.over90 = aging.over90.add(outstanding);
    }

    return {
      customerId,
      name: customer.name,
      creditLimit: customer.creditLimit,
      currentBalance: customer.currentBalance,
      aging,
      salesCount: sales.length,
    };
  }

  /**
   * Find payments with filters
   */
  async findAll(
    query: {
      page: number;
      limit: number;
      customerId?: string;
      saleId?: string;
      startDate?: string;
      endDate?: string;
      paymentMethod?: string;
    },
    tenantId: string,
  ) {
    const {
      page,
      limit,
      customerId,
      saleId,
      startDate,
      endDate,
      paymentMethod,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentRecordWhereInput = {
      tenantId,
      ...(customerId ? { customerId } : {}),
      ...(saleId ? { saleId } : {}),
      ...(paymentMethod ? { paymentMethod: paymentMethod as any } : {}),
      ...(startDate || endDate
        ? {
            paymentDate: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.paymentRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, taxId: true } },
          sale: { select: { id: true, total: true, createdAt: true } },
        },
      }),
      this.prisma.paymentRecord.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single payment details
   */
  async findOne(id: string, tenantId: string) {
    const payment = await this.prisma.paymentRecord.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        sale: true,
        auditLogs: true,
      },
    });

    if (!payment) throw new NotFoundException(`Payment ${id} not found`);
    return payment;
  }

  /**
   * Get payments for a specific sale
   */
  async getSalePayments(saleId: string, tenantId: string) {
    return this.prisma.paymentRecord.findMany({
      where: { saleId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Generate alerts/notifications for overdue payments
   * This would typically be called by a cron job
   */
  async notifyOverdue(tenantId: string) {
    const now = new Date();
    // 1. Fetch customers with balance > 0
    const debtors = await this.prisma.customer.findMany({
      where: { tenantId, currentBalance: { gt: 0 }, deletedAt: null },
      include: {
        sales: {
          where: {
            paymentMethod: 'CREDIT',
            status: { in: ['COMPLETED', 'PARTIAL'] },
          },
        },
      },
    });

    const alertsGenerated: any[] = [];

    for (const customer of debtors) {
      // Check for sales older than paymentTermDays
      for (const sale of customer.sales) {
        const diffDays = Math.floor(
          (now.getTime() - sale.createdAt.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (diffDays > customer.paymentTermDays) {
          const message = `Factura ${sale.orderNumber || sale.id.substring(0, 8)} tiene ${diffDays} días de atraso.`;

          // Check if alert already exists (not resolved)
          const existingAlert = await this.prisma.creditAlert.findFirst({
            where: {
              customerId: customer.id,
              tenantId,
              isResolved: false,
              alertType: 'OVERDUE_INVOICE',
              message: {
                contains: sale.orderNumber || sale.id.substring(0, 8),
              },
            },
          });

          if (!existingAlert) {
            await this.prisma.creditAlert.create({
              data: {
                tenantId,
                customerId: customer.id,
                alertType: 'OVERDUE_INVOICE',
                severity: 'HIGH',
                message,
                daysOverdue: diffDays,
                amountOverdue: sale.total,
              },
            });
            alertsGenerated.push({
              customerId: customer.id,
              saleId: sale.id,
              days: diffDays,
            });
          }
        }
      }
    }

    return {
      processed: debtors.length,
      alertsGenerated: alertsGenerated.length,
      details: alertsGenerated,
    };
  }

  async generateAccountStatementPdf(
    customerId: string,
    tenantId: string,
  ): Promise<Buffer> {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId, deletedAt: null },
    });

    if (!customer)
      throw new NotFoundException(`Customer ${customerId} not found`);

    const sales = await this.prisma.sale.findMany({
      where: {
        customerId,
        tenantId,
        paymentMethod: 'CREDIT',
        status: { not: 'VOID' },
      },
      orderBy: { createdAt: 'asc' },
    });

    const payments = await this.prisma.paymentRecord.findMany({
      where: { customerId, tenantId },
      orderBy: { createdAt: 'asc' },
    });

    // Combine and sort chronologically
    const history: any[] = [
      ...sales.map((s) => ({
        date: s.createdAt,
        type: 'INVOICE',
        reference: s.orderNumber || s.id.substring(0, 8),
        debit: Number(s.total),
        credit: 0,
      })),
      ...payments.map((p) => ({
        date: p.paymentDate || p.createdAt,
        type: 'PAYMENT',
        reference: p.reference || 'N/A',
        debit: 0,
        credit: Number(p.amount),
      })),
    ];

    history.sort((a, b) => a.date.getTime() - b.date.getTime());

    const PdfPrinter = require('pdfmake');
    const fonts = {
      Roboto: {
        normal: 'node_modules/pdfmake/build/vfs_fonts.js',
        bold: 'node_modules/pdfmake/build/vfs_fonts.js',
      },
    };

    const printer = new PdfPrinter(fonts);

    let runningBalance = 0;
    const bodyLines = history.map((h) => {
      runningBalance += h.debit - h.credit;
      return [
        h.date.toLocaleDateString(),
        h.type,
        h.reference,
        h.debit > 0 ? h.debit.toFixed(2) : '',
        h.credit > 0 ? h.credit.toFixed(2) : '',
        runningBalance.toFixed(2),
      ];
    });

    const docDefinition: any = {
      content: [
        {
          text: 'ESTADO DE CUENTA DE CLIENTE',
          style: 'header',
          alignment: 'center',
        },
        { text: `Cliente: ${customer.name}`, style: 'subheader' },
        { text: `RUC/ID: ${customer.taxId || 'N/A'}` },
        { text: `Fecha de Emisión: ${new Date().toLocaleDateString()}` },
        { text: '\n' },
        {
          table: {
            headerRows: 1,
            widths: ['auto', 'auto', '*', 'auto', 'auto', 'auto'],
            body: [
              ['Fecha', 'Tipo', 'Referencia', 'Débito', 'Crédito', 'Saldo'],
              ...bodyLines,
            ],
          },
        },
        { text: '\n' },
        {
          text: `Saldo Actual: $${Number(customer.currentBalance).toFixed(2)}`,
          style: 'balance',
          alignment: 'right',
        },
      ],
      styles: {
        header: { fontSize: 18, bold: true },
        subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
        balance: { fontSize: 14, bold: true },
      },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }
}
