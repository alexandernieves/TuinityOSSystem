import { Injectable } from '@nestjs/common';
import { PrismaService, BaseService } from '../shared';
import {
  AccountsPayableEntry,
  VendorPayment,
  PurchaseOrder,
  PurchaseReceipt,
  PrismaClient,
  AccountsPayableEntryType,
  PurchaseOrderStatus
} from '@prisma/client';

export interface CreateAccountsPayableEntryData {
  supplierId: string;
  purchaseOrderId?: string;
  receiptId?: string;
  paymentId?: string;
  entryType: AccountsPayableEntryType;
  amount: number;
  balanceAfter?: number;
  notes?: string;
  createdByUserId?: string;
}

@Injectable()
export class AccountsPayableService extends BaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Create accounts payable entry
   */
  async createAccountsPayableEntry(data: CreateAccountsPayableEntryData): Promise<AccountsPayableEntry> {
    return this.transaction(async (prisma) => {
      // Calculate balance after if not provided
      let balanceAfter = data.balanceAfter;
      if (balanceAfter === undefined) {
        const lastEntry = await prisma.accountsPayableEntry.findFirst({
          where: { supplierId: data.supplierId },
          orderBy: { occurredAt: 'desc' },
        });
        const currentBalance = lastEntry?.balanceAfter || 0;
        
        if (data.entryType === AccountsPayableEntryType.PURCHASE_CHARGE || 
            data.entryType === AccountsPayableEntryType.DEBIT_NOTE) {
          balanceAfter = Number(currentBalance) + data.amount;
        } else {
          balanceAfter = Number(currentBalance) - data.amount;
        }
      }

      const entry = await prisma.accountsPayableEntry.create({
        data: {
          supplierId: data.supplierId,
          purchaseOrderId: data.purchaseOrderId,
          receiptId: data.receiptId,
          paymentId: data.paymentId,
          entryType: data.entryType,
          amount: data.amount,
          balanceAfter,
          notes: data.notes,
          createdByUserId: data.createdByUserId,
          occurredAt: new Date(),
        },
        include: {
          supplier: true,
          purchaseOrder: true,
          payment: true,
          createdByUser: true,
        },
      });

      // Update supplier current balance
      await prisma.supplier.update({
        where: { id: data.supplierId },
        data: { currentBalance: balanceAfter }
      });

      return entry;
    });
  }

  /**
   * Get supplier balance
   */
  async getSupplierBalance(supplierId: string, asOfDate?: Date): Promise<any> {
    const where: any = { supplierId };
    if (asOfDate) {
      where.occurredAt = { lte: asOfDate };
    }

    const lastEntry = await this.prisma.accountsPayableEntry.findFirst({
      where,
      orderBy: { occurredAt: 'desc' },
    });

    const balance = lastEntry?.balanceAfter || 0;

    // Get aging breakdown (simplified for now)
    const aging = await this.getSupplierAging(supplierId, asOfDate);

    return {
      supplierId,
      balance,
      lastEntryDate: lastEntry?.occurredAt,
      aging,
    };
  }

  /**
   * Get supplier aging report
   */
  async getSupplierAging(supplierId: string, asOfDate?: Date): Promise<any> {
    const cutoffDate = asOfDate || new Date();
    
    // In technical terms, CxP aging usually looks at "Unpaid Received Orders"
    const unpaidPOs = await this.prisma.purchaseOrder.findMany({
      where: {
        supplierId,
        status: { in: ['RECEIVED', 'PARTIALLY_RECEIVED'] },
        orderDate: { lte: cutoffDate },
      }
    });

    const aging = {
      current: 0,
      days30: 0,
      days60: 0,
      days90: 0,
      days90Plus: 0,
    };

    for (const po of unpaidPOs) {
        // Simple logic for POs: if we don't have detailed invoices, use orderDate + terms
        // Assuming we need paymentTerms from Supplier
        const supplier = await this.prisma.supplier.findUnique({ where: { id: supplierId } });
        const terms = supplier?.paymentTerms || 30;
        const dueDate = new Date(po.orderDate);
        dueDate.setDate(dueDate.getDate() + terms);

        const daysOverdue = Math.floor(
            (cutoffDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Calculate paid amount from payments applied... 
        // For now, let's keep it simple: use total - applied...
        // We'll assume the PO total is what we owe initially.
        const outstanding = Number(po.total);

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

    return aging;
  }

  /**
   * Get accounts payable summary
   */
  async getAccountsPayableSummary(asOfDate?: Date): Promise<any> {
    const cutoffDate = asOfDate || new Date();

    const suppliers = await this.prisma.supplier.findMany({
      select: {
        id: true,
        code: true,
        legalName: true,
      },
    });

    const supplierBalances = await Promise.all(
      suppliers.map(async (supplier) => {
        const balanceData = await this.getSupplierBalance(supplier.id, cutoffDate);
        return {
          ...balanceData,
          supplierName: supplier.legalName,
          supplierCode: supplier.code
        };
      })
    );

    const totalBalance = supplierBalances.reduce((sum, item) => {
      return sum + Number(item.balance || 0);
    }, 0);

    const recentEntries = await this.prisma.accountsPayableEntry.findMany({
      take: 10,
      where: { occurredAt: { lte: cutoffDate } },
      orderBy: { occurredAt: 'desc' },
      include: {
        supplier: true,
        purchaseOrder: true,
        payment: true,
      },
    });

    const totalOverdue = supplierBalances.reduce((sum, item) => {
      const overdue = Number(item.aging.days30) + Number(item.aging.days60) + 
                     Number(item.aging.days90) + Number(item.aging.days90Plus);
      return sum + overdue;
    }, 0);

    return {
      totalBalance,
      totalOverdue,
      supplierCount: supplierBalances.filter(s => Number(s.balance) > 0).length,
      supplierBalances: supplierBalances.filter(s => Number(s.balance) > 0),
      recentEntries,
    };
  }

  /**
   * Generate accounts payable report
   */
  async generateAccountsPayableReport(filters: {
    supplierId?: string;
    entryType?: AccountsPayableEntryType;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (filters.supplierId) where.supplierId = filters.supplierId;
    if (filters.entryType) where.entryType = filters.entryType;
    if (filters.startDate || filters.endDate) {
      where.occurredAt = {};
      if (filters.startDate) where.occurredAt.gte = filters.startDate;
      if (filters.endDate) where.occurredAt.lte = filters.endDate;
    }

    const entries = await this.prisma.accountsPayableEntry.findMany({
      where,
      include: {
        supplier: true,
        purchaseOrder: true,
        payment: true,
        createdByUser: true,
      },
      orderBy: { occurredAt: 'desc' },
    });

    return entries;
  }

  /**
   * Compare Order vs Reception vs Payment
   */
  async getPurchaseOrderComparison(poId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        lines: true,
        accountsPayableEntries: {
          where: { entryType: AccountsPayableEntryType.PAYMENT },
        }
      }
    });

    if (!po) return null;

    const orderedTotal = Number(po.total);
    const receivedTotal = po.lines.reduce((sum, line) => {
      return sum + (Number(line.quantityReceived) * Number(line.unitCost));
    }, 0);
    const paidTotal = po.accountsPayableEntries.reduce((sum, entry) => {
      return sum + Number(entry.amount);
    }, 0);

    return {
      poNumber: po.number,
      orderedTotal,
      receivedTotal,
      paidTotal,
      differenceReceived: orderedTotal - receivedTotal,
      differencePaid: receivedTotal - paidTotal,
      status: po.status,
    };
  }

  /**
   * Process Application of a Payment to a Purchase Order
   */
  async processPaymentApplication(paymentId: string, poId: string, amount: number, userId: string) {
    const payment = await this.prisma.vendorPayment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) throw new Error('Pago no encontrado');

    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
    });
    if (!po) throw new Error('Orden de Compra no encontrada');

    // Create a PAYMENT_APPLICATION entry
    const entry = await this.createAccountsPayableEntry({
      supplierId: payment.supplierId,
      paymentId: payment.id,
      purchaseOrderId: po.id,
      entryType: AccountsPayableEntryType.PAYMENT_APPLICATION,
      amount,
      notes: `Aplicación de pago ${payment.number} a la OC ${po.number}`,
      createdByUserId: userId,
    });

    return entry;
  }
}
