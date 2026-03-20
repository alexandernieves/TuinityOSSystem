import { Injectable } from '@nestjs/common';
import { PrismaService, BaseService } from '../shared';
import {
  AccountsReceivableEntry,
  Receipt,
  ReceiptApplication,
  Invoice,
  PrismaClient,
  AccountsReceivableEntryType,
  ReceiptStatus,
  InvoiceStatus
} from '@prisma/client';

export interface CreateAccountsReceivableEntryData {
  customerId: string;
  invoiceId?: string;
  receiptId?: string;
  entryType: AccountsReceivableEntryType;
  amount: number;
  balanceAfter?: number;
  notes?: string;
  createdByUserId?: string;
}

export interface GetCustomerBalanceData {
  customerId: string;
  asOfDate?: Date;
}

import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class AccountsReceivableService extends BaseService {
  constructor(
    prisma: PrismaService,
    private readonly notificationsService: NotificationsService
  ) {
    super(prisma);
  }

  /**
   * Create accounts receivable entry
   */
  async createAccountsReceivableEntry(data: CreateAccountsReceivableEntryData): Promise<AccountsReceivableEntry> {
    return this.transaction(async (prisma) => {
      // Calculate balance after if not provided
      let balanceAfter = data.balanceAfter;
      if (balanceAfter === undefined) {
        const lastEntry = await prisma.accountsReceivableEntry.findFirst({
          where: { customerId: data.customerId },
          orderBy: { occurredAt: 'desc' },
        });
        const currentBalance = lastEntry?.balanceAfter || 0;
        
        if (data.entryType === AccountsReceivableEntryType.INVOICE_CHARGE || 
            data.entryType === AccountsReceivableEntryType.DEBIT_NOTE) {
          balanceAfter = Number(currentBalance) + data.amount;
        } else {
          balanceAfter = Number(currentBalance) - data.amount;
        }
      }

      const entry = await prisma.accountsReceivableEntry.create({
        data: {
          customerId: data.customerId,
          invoiceId: data.invoiceId,
          receiptId: data.receiptId,
          entryType: data.entryType,
          amount: data.amount,
          balanceAfter,
          notes: data.notes,
          createdByUserId: data.createdByUserId,
          occurredAt: new Date(),
        },
        include: {
          customer: true,
          invoice: true,
          receipt: true,
          createdByUser: true,
        },
      });

      // Update customer credit profile current balance
      await prisma.customerCreditProfile.upsert({
        where: { customerId: data.customerId },
        update: { currentBalance: balanceAfter },
        create: {
          customerId: data.customerId,
          currentBalance: balanceAfter,
          creditLimit: 0,
          creditDays: 30,
          priceLevel: 'A'
        }
      });

      return entry;
    });
  }

  /**
   * Get customer balance
   */
  async getCustomerBalance(customerId: string, asOfDate?: Date): Promise<any> {
    const where: any = { customerId };
    if (asOfDate) {
      where.occurredAt = { lte: asOfDate };
    }

    const lastEntry = await this.prisma.accountsReceivableEntry.findFirst({
      where,
      orderBy: { occurredAt: 'desc' },
    });

    const balance = lastEntry?.balanceAfter || 0;

    // Get aging breakdown
    const aging = await this.getCustomerAging(customerId, asOfDate);

    return {
      customerId,
      balance,
      lastEntryDate: lastEntry?.occurredAt,
      aging,
    };
  }

  /**
   * Get customer aging report
   */
  async getCustomerAging(customerId: string, asOfDate?: Date): Promise<any> {
    const cutoffDate = asOfDate || new Date();
    const periods = {
      current: 0,
      days30: 30,
      days60: 60,
      days90: 90,
      days90Plus: 91,
    };

    const unpaidInvoices = await this.prisma.invoice.findMany({
      where: {
        customerId,
        status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID] },
        invoiceDate: { lte: cutoffDate },
      },
      include: {
        receiptApplications: true,
      },
    });

    const aging = {
      current: 0,
      days30: 0,
      days60: 0,
      days90: 0,
      days90Plus: 0,
    };

    for (const invoice of unpaidInvoices) {
      const dueDate = invoice.dueDate || invoice.invoiceDate || cutoffDate;
      const daysOverdue = Math.floor(
        (cutoffDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const totalPaid = invoice.receiptApplications.reduce(
        (sum, app) => sum + Number(app.appliedAmount),
        0
      );
      const outstanding = Number(invoice.total) - totalPaid;

      if (outstanding <= 0) continue;

      if (daysOverdue <= 0) {
        aging.current += outstanding;
      } else if (daysOverdue <= 30) {
        aging.days30 += outstanding;
      } else if (daysOverdue <= 60) {
        aging.days60 += outstanding;
      } else if (daysOverdue <= 90) {
        aging.days90 += outstanding;
      } else {
        aging.days90Plus += outstanding;
      }
    }

    // Trigger notification if overdue is significant
    const totalOverdue = aging.days30 + aging.days60 + aging.days90 + aging.days90Plus;
    if (totalOverdue > 1000) {
        await this.notificationsService.notifyRole('GERENCIA', {
            type: 'CUSTOMER_OVERDUE',
            title: 'Cliente con Saldo Vencido Crítico',
            message: `El cliente con ID ${customerId} tiene un saldo vencido de ${totalOverdue.toLocaleString('es-PA', { style: 'currency', currency: 'USD' })}.`,
            module: 'SALES',
            entityType: 'Customer',
            entityId: customerId,
            severity: 'CRITICAL',
            actionUrl: `/clientes/${customerId}`,
        });
    }

    return aging;
  }

  /**
   * Get accounts receivable summary
   */
  async getAccountsReceivableSummary(asOfDate?: Date): Promise<any> {
    const cutoffDate = asOfDate || new Date();

    const customers = await this.prisma.customer.findMany({
      select: {
        id: true,
        code: true,
        legalName: true,
      },
    });

    const customerBalances = await Promise.all(
      customers.map(async (customer) => {
        const balanceData = await this.getCustomerBalance(customer.id, cutoffDate);
        return {
          ...balanceData,
          customerName: customer.legalName,
          customerCode: customer.code
        };
      })
    );

    const totalBalance = customerBalances.reduce((sum, customer) => {
      return sum + Number(customer.balance || 0);
    }, 0);

    const recentEntries = await this.prisma.accountsReceivableEntry.findMany({
      take: 10,
      where: { occurredAt: { lte: cutoffDate } },
      orderBy: { occurredAt: 'desc' },
      include: {
        customer: true,
        invoice: true,
        receipt: true,
      },
    });

    const totalOverdue = customerBalances.reduce((sum, customer) => {
      const overdue = Number(customer.aging.days30) + Number(customer.aging.days60) + 
                     Number(customer.aging.days90) + Number(customer.aging.days90Plus);
      return sum + overdue;
    }, 0);

    return {
      totalBalance,
      totalOverdue,
      customerCount: customerBalances.filter(c => Number(c.balance) > 0).length,
      customerBalances: customerBalances.filter(c => Number(c.balance) > 0),
      recentEntries,
    };
  }

  /**
   * Process receipt application with accounts receivable entries
   */
  async processReceiptApplication(
    receiptId: string,
    invoiceId: string,
    appliedAmount: number,
    createdByUserId?: string
  ): Promise<ReceiptApplication> {
    return this.transaction(async (prisma) => {
      // Get receipt and invoice details
      const [receipt, invoice] = await Promise.all([
        prisma.receipt.findUnique({ where: { id: receiptId } }),
        prisma.invoice.findUnique({ where: { id: invoiceId } }),
      ]);

      if (!receipt || !invoice) {
        throw new Error('Receipt or Invoice not found');
      }

      // Create receipt application
      const application = await prisma.receiptApplication.create({
        data: {
          receiptId,
          invoiceId,
          appliedAmount,
        },
        include: { receipt: true, invoice: true },
      });

      // Create accounts receivable entry for payment application
      await this.createAccountsReceivableEntry({
        customerId: receipt.customerId,
        invoiceId,
        receiptId,
        entryType: AccountsReceivableEntryType.PAYMENT_APPLICATION,
        amount: appliedAmount,
        notes: `Payment applied to invoice ${invoice.number}`,
        createdByUserId,
      });

      await this.notificationsService.notifyRole('CONTADURIA', {
        type: 'PAYMENT_APPLIED',
        title: 'Cobro Aplicado',
        message: `Se ha aplicado un pago de ${appliedAmount.toLocaleString('es-PA', { style: 'currency', currency: 'USD' })} a la factura ${invoice.number}.`,
        module: 'SALES',
        entityType: 'Invoice',
        entityId: invoiceId,
        severity: 'SUCCESS',
        actionUrl: `/clientes/cxc/${receipt.customerId}`,
      });

      // Update invoice status
      const totalPayments = await prisma.receiptApplication.aggregate({
        where: { invoiceId },
        _sum: { appliedAmount: true },
      });

      const totalPaid = Number(totalPayments._sum.appliedAmount || 0);
      let newStatus: InvoiceStatus;

      if (totalPaid >= Number(invoice.total)) {
        newStatus = InvoiceStatus.PAID;
      } else if (totalPaid > 0) {
        newStatus = InvoiceStatus.PARTIALLY_PAID;
      } else {
        newStatus = InvoiceStatus.ISSUED;
      }

      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: newStatus },
      });

      return application;
    });
  }

  /**
   * Generate accounts receivable report
   */
  async generateAccountsReceivableReport(filters: {
    customerId?: string;
    entryType?: AccountsReceivableEntryType;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.entryType) where.entryType = filters.entryType;
    if (filters.startDate || filters.endDate) {
      where.occurredAt = {};
      if (filters.startDate) where.occurredAt.gte = filters.startDate;
      if (filters.endDate) where.occurredAt.lte = filters.endDate;
    }

    const entries = await this.prisma.accountsReceivableEntry.findMany({
      where,
      include: {
        customer: true,
        invoice: true,
        receipt: true,
        createdByUser: true,
      },
      orderBy: { occurredAt: 'desc' },
    });

    return entries;
  }
}
