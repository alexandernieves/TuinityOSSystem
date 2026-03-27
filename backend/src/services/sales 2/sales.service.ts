import { Injectable } from '@nestjs/common';
import { PrismaService, BaseService } from '../shared';
import {
  Quotation,
  SalesOrder,
  Invoice,
  Receipt,
  ReceiptApplication,
  AccountsReceivableEntry,
  PrismaClient,
  QuotationStatus,
  SalesOrderStatus,
  InvoiceStatus,
  ReceiptStatus,
  AccountsReceivableEntryType,
  ReceiptMethod,
  JournalEntryStatus,
  InventoryMovementType,
  Prisma
} from '@prisma/client';
import { InventoryService, SelectedLot } from '../inventory/inventory.service';
import { NotificationsService } from '../../notifications/notifications.service';

export interface CreateQuotationData {
  customerId: string;
  lines: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  notes?: string;
  createdByUserId?: string;
}

export interface CreateSalesOrderData {
  customerId: string;
  quotationId?: string;
  lines: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  requestedDispatchDate?: Date;
  notes?: string;
  createdByUserId?: string;
}

export interface IssueInvoiceData {
  customerId: string;
  salesOrderId?: string;
  lines: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  dueDate?: Date;
  notes?: string;
  createdByUserId?: string;
}

export interface CreateReceiptData {
  customerId: string;
  amount: number;
  method: ReceiptMethod;
  reference?: string;
  notes?: string;
  createdByUserId?: string;
}

export interface ApplyReceiptData {
  receiptId: string;
  invoiceId: string;
  appliedAmount: number;
}

@Injectable()
export class SalesService extends BaseService {
  constructor(
    prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly notificationsService: NotificationsService
  ) {
    super(prisma);
  }

  /**
   * Create a new quotation
   */
  async createQuotation(data: CreateQuotationData): Promise<Quotation> {
    const number = this.generateNumber('QOT');
    
    return this.transaction(async (prisma) => {
      // Create quotation header
      const quotation = await prisma.quotation.create({
        data: {
          number,
          customerId: data.customerId,
          quotationDate: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          status: QuotationStatus.DRAFT,
          subtotal: 0,
          total: 0,
          notes: data.notes,
          createdByUserId: data.createdByUserId,
        },
      });

      // Create quotation lines
      let subtotal = 0;
      const lines = await Promise.all(
        data.lines.map(async (line) => {
          const lineTotal = line.quantity * line.unitPrice;
          subtotal += lineTotal;

          return prisma.quotationLine.create({
            data: {
              quotationId: quotation.id,
              productId: line.productId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              lineTotal,
            },
          });
        })
      );

      // Update quotation totals
      const updatedQuotation = await prisma.quotation.update({
        where: { id: quotation.id },
        data: { subtotal, total: subtotal },
        include: { lines: true, customer: true },
      });

      const needsApproval = Number(updatedQuotation.total) > 5000;
      if (needsApproval) {
        await prisma.quotation.update({
          where: { id: updatedQuotation.id },
          data: { status: QuotationStatus.PENDING_APPROVAL }
        });
      }

      await this.notificationsService.notifyRole('GERENCIA', {
        type: needsApproval ? 'QUOTATION_NEEDS_APPROVAL' : 'QUOTATION_CREATED',
        title: needsApproval ? 'Cotización REQUIERE APROBACIÓN' : 'Nueva Cotización',
        message: needsApproval 
          ? `La cotización ${updatedQuotation.number} para ${updatedQuotation.customer.legalName} excede el límite de $5,000 (${Number(updatedQuotation.total).toLocaleString('es-PA', { style: 'currency', currency: 'USD' })}) y requiere aprobación.`
          : `Se ha creado la cotización ${updatedQuotation.number} para ${updatedQuotation.customer.legalName} por ${Number(updatedQuotation.total).toLocaleString('es-PA', { style: 'currency', currency: 'USD' })}.`,
        module: 'SALES',
        entityType: 'Quotation',
        entityId: updatedQuotation.id,
        severity: needsApproval ? 'WARNING' : 'INFO',
        actionUrl: `/ventas/cotizaciones/${updatedQuotation.id}`,
      });

      return updatedQuotation;
    });
  }

  /**
   * Convert quotation to sales order
   */
  async convertQuotationToSalesOrder(
    quotationId: string,
    createdByUserId?: string
  ): Promise<SalesOrder> {
    return this.transaction(async (prisma) => {
      const quotation = await prisma.quotation.findUnique({
        where: { id: quotationId },
        include: { lines: true },
      });

      if (!quotation) {
        throw new Error('Quotation not found');
      }

      const number = this.generateNumber('SO');
      
      // Create sales order
      const salesOrder = await prisma.salesOrder.create({
        data: {
          number,
          customerId: quotation.customerId,
          quotationId: quotation.id,
          orderDate: new Date(),
          status: SalesOrderStatus.DRAFT,
          subtotal: quotation.subtotal,
          total: quotation.total,
          notes: quotation.notes,
          createdByUserId,
        },
      });

      // Create sales order lines
      await Promise.all(
        quotation.lines.map((line) =>
          prisma.salesOrderLine.create({
            data: {
              salesOrderId: salesOrder.id,
              quotationLineId: line.id,
              productId: line.productId,
              quantityOrdered: line.quantity,
              unitPrice: line.unitPrice,
              lineTotal: line.lineTotal,
            },
          })
        )
      );

      // Update quotation status
      await prisma.quotation.update({
        where: { id: quotationId },
        data: { status: QuotationStatus.CONVERTED },
      });

      return prisma.salesOrder.findUnique({
        where: { id: salesOrder.id },
        include: { lines: true, customer: true, quotation: true },
      }) as Promise<SalesOrder>;
    });
  }

  /**
   * Issue invoice from sales order
   * Validates and creates an invoice for pending quantities
   */
  async issueInvoiceFromSalesOrder(
    salesOrderId: string,
    dueDate?: Date,
    notes?: string,
    createdByUserId?: string
  ): Promise<Invoice> {
    return this.transaction(async (prisma) => {
      // Fetch sales order with its lines
      const salesOrder = await prisma.salesOrder.findUnique({
        where: { id: salesOrderId },
        include: { lines: true },
      });

      // Validation 1: Sales order must exist
      if (!salesOrder) {
        throw new Error(`Sales order with ID ${salesOrderId} not found`);
      }

      // Validation 2: Status must be APPROVED or RESERVED
      if (
        salesOrder.status !== SalesOrderStatus.APPROVED &&
        salesOrder.status !== SalesOrderStatus.RESERVED &&
        salesOrder.status !== SalesOrderStatus.PARTIALLY_INVOICED
      ) {
        throw new Error(
          `Cannot invoice sales order with status ${salesOrder.status}. Expected: APPROVED, RESERVED, or PARTIALLY_INVOICED`
        );
      }

      // Validation 3: Must have at least one line
      if (!salesOrder.lines || salesOrder.lines.length === 0) {
        throw new Error('Sales order has no lines to invoice');
      }

      // Calculate pending quantities for each line
      const linesWithPending = salesOrder.lines.map((line) => {
        const pendingQuantity =
          Number(line.quantityOrdered) - Number(line.quantityInvoiced || 0);
        return {
          ...line,
          pendingQuantity,
        };
      });

      // Filter only lines with pending quantity
      const pendingLines = linesWithPending.filter(
        (line) => line.pendingQuantity > 0
      );

      // Validation 4: Must have at least one pending line
      if (pendingLines.length === 0) {
        throw new Error('No pending quantities to invoice for this sales order');
      }

      // Calculate invoice totals from pending quantities
      let invoiceSubtotal = 0;
      const invoiceLinesData = pendingLines.map((line) => {
        const lineTotal = line.pendingQuantity * Number(line.unitPrice);
        invoiceSubtotal += lineTotal;
        return {
          salesOrderLineId: line.id,
          productId: line.productId,
          quantity: line.pendingQuantity,
          unitPrice: Number(line.unitPrice),
          lineTotal,
        };
      });

      const invoiceTotal = invoiceSubtotal;

      // Generate invoice number
      const number = this.generateNumber('INV');

      // Create invoice
      const invoice = await prisma.invoice.create({
        data: {
          number,
          customerId: salesOrder.customerId,
          salesOrderId: salesOrder.id,
          invoiceDate: new Date(),
          dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: InvoiceStatus.ISSUED,
          subtotal: invoiceSubtotal,
          total: invoiceTotal,
          notes,
          createdByUserId,
        },
      });

      // Create invoice lines
      await Promise.all(
        invoiceLinesData.map((lineData) =>
          prisma.invoiceLine.create({
            data: {
              invoiceId: invoice.id,
              salesOrderLineId: lineData.salesOrderLineId,
              productId: lineData.productId,
              quantity: lineData.quantity,
              unitPrice: lineData.unitPrice,
              lineTotal: lineData.lineTotal,
            },
          })
        )
      );

      // Update sales order lines: add dispatched quantity
      await Promise.all(
        pendingLines.map((line) =>
          prisma.salesOrderLine.update({
            where: { id: line.id },
            data: {
              quantityInvoiced:
                Number(line.quantityInvoiced || 0) + line.pendingQuantity,
            },
          })
        )
      );

      // Check if all lines are fully invoiced to determine new status
      const updatedLines = await prisma.salesOrderLine.findMany({
        where: { salesOrderId: salesOrderId },
      });

      const allLinesFullyInvoiced = updatedLines.every(
        (line) =>
          Number(line.quantityInvoiced) >= Number(line.quantityOrdered)
      );

      const newStatus = allLinesFullyInvoiced
        ? SalesOrderStatus.INVOICED
        : SalesOrderStatus.PARTIALLY_INVOICED;

      // Update sales order status
      await prisma.salesOrder.update({
        where: { id: salesOrderId },
        data: { status: newStatus },
      });

      // Create Accounts Receivable Entry
      await prisma.accountsReceivableEntry.create({
        data: {
          customerId: salesOrder.customerId,
          invoiceId: invoice.id,
          entryType: AccountsReceivableEntryType.INVOICE_CHARGE,
          amount: invoiceTotal,
          notes: `Invoice ${number} issued from Sales Order ${salesOrder.number}`,
          occurredAt: new Date(),
          createdByUserId,
        },
      });

      // Create Audit Log
      await prisma.auditLog.create({
        data: {
          userId: createdByUserId,
          action: 'ISSUE_INVOICE',
          entity: 'Invoice',
          entityId: invoice.id,
          newData: {
            invoiceNumber: number,
            salesOrderId: salesOrderId,
            customerId: salesOrder.customerId,
            total: invoiceTotal,
            lines: invoiceLinesData,
          },
          createdAt: new Date(),
        },
      });

      // Create Journal Entry for accounting (POSTED because invoice is already issued)
      // Look up required accounts
      const arAccount = await prisma.account.findUnique({
        where: { code: 'AR_TRADE' },
      });
      const revenueAccount = await prisma.account.findUnique({
        where: { code: 'SALES_REVENUE' },
      });

      if (!arAccount) {
        throw new Error(
          'Accounting account AR_TRADE (Accounts Receivable) not found. Please create this account before invoicing.'
        );
      }
      if (!revenueAccount) {
        throw new Error(
          'Accounting account SALES_REVENUE (Sales Revenue) not found. Please create this account before invoicing.'
        );
      }

      const jeNumber = this.generateNumber('JE');
      const journalEntry = await prisma.journalEntry.create({
        data: {
          number: jeNumber,
          entryDate: invoice.invoiceDate,
          status: JournalEntryStatus.POSTED,
          referenceType: 'INVOICE',
          referenceId: invoice.id,
          memo: `Invoice ${number} issued from Sales Order ${salesOrder.number}`,
          createdByUserId,
          postedByUserId: createdByUserId,
          postedAt: invoice.invoiceDate,
        },
      });

      // Create journal entry lines: Debit AR, Credit Revenue
      await prisma.journalEntryLine.createMany({
        data: [
          {
            journalEntryId: journalEntry.id,
            accountId: arAccount.id,
            debit: invoiceTotal,
            credit: 0,
            memo: `Accounts Receivable - Invoice ${number}`,
          },
          {
            journalEntryId: journalEntry.id,
            accountId: revenueAccount.id,
            debit: 0,
            credit: invoiceTotal,
            memo: `Sales Revenue - Invoice ${number}`,
          },
        ],
      });

      // TODO: Create inventory movements when products are shipped
      // This will be implemented when integrating with inventory service
      // await this.inventoryService.createInventoryMovement({...})

      const finalInvoice = await prisma.invoice.findUnique({
        where: { id: invoice.id },
        include: { lines: true, customer: true, salesOrder: true },
      }) as Invoice;

      await this.notificationsService.notifyRole('CONTADURIA', {
        type: 'INVOICE_ISSUED',
        title: 'Nueva Factura Generada',
        message: `Se ha emitido la factura ${finalInvoice.number} para ${(finalInvoice as any).customer.legalName} por ${Number(finalInvoice.total).toLocaleString('es-PA', { style: 'currency', currency: 'USD' })}.`,
        module: 'SALES',
        entityType: 'Invoice',
        entityId: finalInvoice.id,
        severity: 'SUCCESS',
        actionUrl: `/ventas/facturas/${finalInvoice.id}`,
      });

      return finalInvoice;
    });
  }

  /**
   * Create receipt
   */
  async createReceipt(data: CreateReceiptData): Promise<Receipt> {
    const number = this.generateNumber('RCP');
    
    const receipt = await this.prisma.receipt.create({
      data: {
        number,
        customerId: data.customerId,
        receiptDate: new Date(),
        method: data.method,
        status: ReceiptStatus.CONFIRMED,
        amount: data.amount,
        reference: data.reference,
        notes: data.notes,
        createdByUserId: data.createdByUserId,
      },
      include: { customer: true },
    });

    await this.notificationsService.notifyRole('CONTADURIA', {
      type: 'RECEIPT_CREATED',
      title: 'Nuevo Pago Recibido',
      message: `Se ha registrado un pago de ${(receipt as any).customer.legalName} por ${Number(receipt.amount).toLocaleString('es-PA', { style: 'currency', currency: 'USD' })} (Ref: ${receipt.reference || 'N/A'}).`,
      module: 'SALES',
      entityType: 'Receipt',
      entityId: receipt.id,
      severity: 'SUCCESS',
      actionUrl: `/ventas/cobros`,
    });

    return receipt;
  }

  /**
   * Apply receipt to invoice
   */
  async applyReceiptToInvoice(data: ApplyReceiptData): Promise<ReceiptApplication> {
    return this.transaction(async (prisma) => {
      // Create receipt application
      const application = await prisma.receiptApplication.create({
        data: {
          receiptId: data.receiptId,
          invoiceId: data.invoiceId,
          appliedAmount: data.appliedAmount,
        },
        include: { receipt: true, invoice: true },
      });

      // Update invoice status based on payments
      const invoice = await prisma.invoice.findUnique({
        where: { id: data.invoiceId },
        include: { receiptApplications: true },
      });

      if (invoice) {
        const totalPaid = invoice.receiptApplications.reduce(
          (sum, app) => sum + Number(app.appliedAmount),
          0
        );

        let newStatus: InvoiceStatus;
        if (totalPaid >= Number(invoice.total)) {
          newStatus = InvoiceStatus.PAID;
        } else if (totalPaid > 0) {
          newStatus = InvoiceStatus.PARTIALLY_PAID;
        } else {
          newStatus = InvoiceStatus.ISSUED;
        }

        await prisma.invoice.update({
          where: { id: data.invoiceId },
          data: { status: newStatus },
        });
      }

      return application;
    });
  }

  /**
   * Dispatch sales order
   * Creates inventory movements for sales order lines based on available lots
   */
  async dispatchSalesOrder(
    salesOrderId: string,
    warehouseId: string,
    dispatchedByUserId: string
  ): Promise<SalesOrder> {
    return this.transaction(async (prisma) => {
      // Fetch sales order with its lines
      const salesOrder = await prisma.salesOrder.findUnique({
        where: { id: salesOrderId },
        include: { lines: true },
      });

      // Validation 1: Sales order must exist
      if (!salesOrder) {
        throw new Error(`Sales order with ID ${salesOrderId} not found`);
      }

      // Validation 2: Must have at least one line
      if (!salesOrder.lines || salesOrder.lines.length === 0) {
        throw new Error('Sales order has no lines to dispatch');
      }

      // Validation 3: Status must allow dispatch
      const validStatusForDispatch: SalesOrderStatus[] = [
        SalesOrderStatus.APPROVED,
        SalesOrderStatus.RESERVED,
        SalesOrderStatus.INVOICED,
        SalesOrderStatus.PARTIALLY_INVOICED,
        SalesOrderStatus.PARTIALLY_DISPATCHED,
      ];
      if (!validStatusForDispatch.includes(salesOrder.status as SalesOrderStatus)) {
        throw new Error(
          `Cannot dispatch sales order with status ${salesOrder.status}. Expected: APPROVED, RESERVED, INVOICED, or PARTIALLY_INVOICED`
        );
      }

      // Validation 4: Warehouse must exist and be active
      const warehouse = await prisma.warehouse.findUnique({
        where: { id: warehouseId },
      });
      if (!warehouse || !warehouse.isActive) {
        throw new Error(`Warehouse ${warehouseId} is not valid or active`);
      }

      const dispatchAuditLines: any[] = [];
      
      // Iterate through lines to process dispatch
      for (const line of salesOrder.lines) {
        const quantityOrdered = Number(line.quantityOrdered);
        const quantityInvoiced = Number(line.quantityInvoiced || 0);
        const currentDispatched = Number(line.quantityDispatched || 0);
        const pendingToDispatch = quantityOrdered - currentDispatched;

        if (pendingToDispatch <= 0) continue;

        // 1. Select lots using the Inventory Service policy (FEFO/FIFO)
        const selectedLots: SelectedLot[] = await this.inventoryService.selectLotsForDispatch(
          line.productId,
          warehouseId,
          pendingToDispatch,
          prisma
        );

        const lineLog = {
          productId: line.productId,
          quantityRequested: pendingToDispatch,
          lotsUsed: [] as any[],
        };

        let totalDispatchedForLine = 0;

        // 2. Process each selected lot
        for (const selection of selectedLots) {
          // Create an individual inventory movement for this lot
          await prisma.inventoryMovement.create({
            data: {
              productId: line.productId,
              warehouseId: warehouseId,
              productLotId: selection.lotId,
              movementType: InventoryMovementType.SALE,
              quantity: selection.quantityToConsume,
              referenceType: 'SALES_ORDER',
              referenceId: salesOrder.id,
              occurredAt: new Date(),
              createdByUserId: dispatchedByUserId,
              notes: `Dispatch from lot ${selection.lotNumber} for SO ${salesOrder.number}`,
            },
          });

          // 3. Apply the real impact to the lot's stock
          await this.inventoryService.applyLotStockImpact(
            selection.lotId,
            InventoryMovementType.SALE,
            selection.quantityToConsume,
            prisma
          );

          lineLog.lotsUsed.push({
            lotId: selection.lotId,
            lotNumber: selection.lotNumber,
            quantity: selection.quantityToConsume,
          });

          totalDispatchedForLine += selection.quantityToConsume;
        }

        // 4. Update quantityDispatched in the line accumulatively
        await prisma.salesOrderLine.update({
          where: { id: line.id },
          data: {
            quantityDispatched: currentDispatched + totalDispatchedForLine,
          },
        });

        dispatchAuditLines.push(lineLog);
      }

      // 5. Check final status of the order
      const allLines = await prisma.salesOrderLine.findMany({
        where: { salesOrderId: salesOrderId },
      });

      const allLinesFullyDispatched = allLines.every(
        (line) =>
          Number(line.quantityDispatched) >= Number(line.quantityOrdered)
      );

      const newStatus = allLinesFullyDispatched
        ? SalesOrderStatus.DISPATCHED
        : SalesOrderStatus.PARTIALLY_DISPATCHED;

      // Update sales order status
      await prisma.salesOrder.update({
        where: { id: salesOrderId },
        data: { status: newStatus },
      });

      // 6. Create Detailed Audit Log
      await prisma.auditLog.create({
        data: {
          userId: dispatchedByUserId,
          action: 'DISPATCH_SALES_ORDER',
          entity: 'SalesOrder',
          entityId: salesOrderId,
          newData: {
            salesOrderId: salesOrderId,
            warehouseId: warehouseId,
            dispatchedLines: dispatchAuditLines,
            status: newStatus,
          },
          createdAt: new Date(),
        },
      });

      return prisma.salesOrder.findUnique({
        where: { id: salesOrderId },
        include: { lines: true, customer: true },
      }) as Promise<SalesOrder>;
    });
  }

  /**
   * Get sales dashboard data
   */
  async getSalesDashboard() {
    const [
      totalQuotations,
      totalSalesOrders,
      totalInvoices,
      totalReceipts,
      recentQuotations,
      recentSalesOrders,
      recentInvoices
    ] = await this.prisma.$transaction([
      this.prisma.quotation.count(),
      this.prisma.salesOrder.count(),
      this.prisma.invoice.count(),
      this.prisma.receipt.count(),
      this.prisma.quotation.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: true },
      }),
      this.prisma.salesOrder.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: true },
      }),
      this.prisma.invoice.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: true },
      }),
    ]);

    return {
      totals: {
        quotations: totalQuotations,
        salesOrders: totalSalesOrders,
        invoices: totalInvoices,
        receipts: totalReceipts,
      },
      recent: {
        quotations: recentQuotations,
        salesOrders: recentSalesOrders,
        invoices: recentInvoices,
      },
    };
  }
}
