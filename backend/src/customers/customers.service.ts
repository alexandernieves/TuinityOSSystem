import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  BlockCustomerDto,
  ApproveCustomerDto,
  CreateCustomerTransactionDto,
  VoidTransactionDto,
  CreateCustomerAreaDto,
  UpdateCustomerAreaDto,
  CreateCustomerSubAreaDto,
  UpdateCustomerSubAreaDto,
  CreateSalespersonDto,
  UpdateSalespersonDto,
} from './dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) { }

  // ==================== CUSTOMERS ====================

  async createCustomer(
    data: CreateCustomerDto,
    tenantId: string,
    userId: string,
  ) {
    // Check for duplicate taxId if provided
    if (data.taxId) {
      const existing = await this.prisma.customer.findUnique({
        where: { tenantId_taxId: { tenantId, taxId: data.taxId } },
      });
      if (existing) {
        throw new BadRequestException('Customer with this Tax ID already exists');
      }
    }

    return this.prisma.customer.create({
      data: {
        ...data,
        tenantId,
        createdBy: userId,
        creditLimit: new Prisma.Decimal(data.creditLimit || 0),
        currentBalance: new Prisma.Decimal(0),
      },
      include: {
        sales: { take: 5, orderBy: { createdAt: 'desc' } },
        transactions: { take: 10, orderBy: { transactionDate: 'desc' } },
      },
    });
  }

  async listCustomers(
    tenantId: string,
    filters?: {
      search?: string;
      customerType?: 'CASH' | 'CREDIT';
      priceLevel?: 'A' | 'B' | 'C' | 'D' | 'E';
      creditStatus?: string;
      isBlocked?: boolean;
      page?: number;
      limit?: number;
    },
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {
      tenantId,
      deletedAt: null,
      ...(filters?.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { taxId: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
      ...(filters?.customerType && { customerType: filters.customerType }),
      ...(filters?.priceLevel && { priceLevel: filters.priceLevel }),
      ...(filters?.creditStatus && { creditStatus: filters.creditStatus as any }),
      ...(filters?.isBlocked !== undefined && { isBlocked: filters.isBlocked }),
    };

    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { sales: true, transactions: true },
          },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCustomer(id: string, tenantId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        sales: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { items: { include: { product: true } } },
        },
        transactions: {
          take: 20,
          orderBy: { transactionDate: 'desc' },
        },
        creditAlerts: {
          where: { isResolved: false },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          take: 10,
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async updateCustomer(
    id: string,
    data: UpdateCustomerDto,
    tenantId: string,
    userId: string,
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Log the change
    await this.prisma.customerAuditLog.create({
      data: {
        tenantId,
        customerId: id,
        action: 'UPDATED',
        changes: JSON.stringify({ before: customer, after: data }),
        createdBy: userId,
      },
    });

    return this.prisma.customer.update({
      where: { id },
      data: {
        ...data,
        ...(data.creditLimit !== undefined && {
          creditLimit: new Prisma.Decimal(data.creditLimit),
        }),
      },
    });
  }

  async deleteCustomer(id: string, tenantId: string, userId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Check if customer has outstanding balance
    if (Number(customer.currentBalance) > 0) {
      throw new BadRequestException(
        'Cannot delete customer with outstanding balance',
      );
    }

    // Soft delete
    await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Log the deletion
    await this.prisma.customerAuditLog.create({
      data: {
        tenantId,
        customerId: id,
        action: 'DELETED',
        createdBy: userId,
      },
    });

    return { success: true };
  }

  async blockCustomer(
    id: string,
    data: BlockCustomerDto,
    tenantId: string,
    userId: string,
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    await this.prisma.customer.update({
      where: { id },
      data: {
        isBlocked: true,
        blockedReason: data.reason,
      },
    });

    await this.prisma.customerAuditLog.create({
      data: {
        tenantId,
        customerId: id,
        action: 'BLOCKED',
        reason: data.reason,
        createdBy: userId,
      },
    });

    return { success: true };
  }

  async unblockCustomer(id: string, tenantId: string, userId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    await this.prisma.customer.update({
      where: { id },
      data: {
        isBlocked: false,
        blockedReason: null,
      },
    });

    await this.prisma.customerAuditLog.create({
      data: {
        tenantId,
        customerId: id,
        action: 'UNBLOCKED',
        createdBy: userId,
      },
    });

    return { success: true };
  }

  async approveCustomer(
    id: string,
    data: ApproveCustomerDto,
    tenantId: string,
    userId: string,
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    await this.prisma.customer.update({
      where: { id },
      data: {
        isApproved: true,
        approvedBy: userId,
        approvedAt: new Date(),
        customerType: 'CREDIT',
        creditLimit: new Prisma.Decimal(data.creditLimit),
        paymentTermDays: data.paymentTermDays,
      },
    });

    await this.prisma.customerAuditLog.create({
      data: {
        tenantId,
        customerId: id,
        action: 'APPROVED',
        changes: JSON.stringify(data),
        createdBy: userId,
      },
    });

    return { success: true };
  }

  // ==================== CUSTOMER TRANSACTIONS (CxC) ====================

  async createTransaction(
    data: CreateCustomerTransactionDto,
    tenantId: string,
    userId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findFirst({
        where: { id: data.customerId, tenantId, deletedAt: null },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      // Calculate new balance
      let balanceChange = new Prisma.Decimal(data.amount);
      if (data.type === 'PAYMENT' || data.type === 'CREDIT_NOTE') {
        balanceChange = balanceChange.negated();
      }

      const newBalance = new Prisma.Decimal(customer.currentBalance).add(balanceChange);

      // Get next transaction number
      const lastTransaction = await tx.customerTransaction.findFirst({
        where: { tenantId },
        orderBy: { transactionNumber: 'desc' },
      });

      const nextNumber = lastTransaction
        ? String(Number(lastTransaction.transactionNumber) + 1).padStart(8, '0')
        : '00000001';

      // Create transaction
      const transaction = await tx.customerTransaction.create({
        data: {
          tenantId,
          customerId: data.customerId,
          branchId: data.branchId,
          type: data.type,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          transactionNumber: nextNumber,
          description: data.description,
          amount: new Prisma.Decimal(data.amount),
          balance: newBalance,
          transactionDate: new Date(),
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          notes: data.notes,
          createdBy: userId,
        },
      });

      // Update customer balance
      await tx.customer.update({
        where: { id: data.customerId },
        data: { currentBalance: newBalance },
      });

      // Check for credit alerts
      if (customer.customerType === 'CREDIT') {
        const creditLimit = new Prisma.Decimal(customer.creditLimit);

        if (newBalance.gt(creditLimit)) {
          await tx.creditAlert.create({
            data: {
              tenantId,
              customerId: data.customerId,
              alertType: 'LIMIT_EXCEEDED',
              severity: 'HIGH',
              message: `Customer balance ($${newBalance.toFixed(2)}) exceeds credit limit ($${creditLimit.toFixed(2)})`,
              amountOverdue: newBalance.sub(creditLimit),
            },
          });
        }
      }

      return transaction;
    });
  }

  async listTransactions(
    tenantId: string,
    filters?: {
      customerId?: string;
      branchId?: string;
      type?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerTransactionWhereInput = {
      tenantId,
      isVoided: false,
      ...(filters?.customerId && { customerId: filters.customerId }),
      ...(filters?.branchId && { branchId: filters.branchId }),
      ...(filters?.type && { type: filters.type as any }),
      ...(filters?.startDate && {
        transactionDate: { gte: new Date(filters.startDate) },
      }),
      ...(filters?.endDate && {
        transactionDate: { lte: new Date(filters.endDate) },
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.customerTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { transactionDate: 'desc' },
        include: {
          customer: { select: { name: true, taxId: true } },
          branch: { select: { name: true } },
        },
      }),
      this.prisma.customerTransaction.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async voidTransaction(
    id: string,
    data: VoidTransactionDto,
    tenantId: string,
    userId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.customerTransaction.findFirst({
        where: { id, tenantId, isVoided: false },
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found or already voided');
      }

      // Reverse the balance change
      let balanceChange = new Prisma.Decimal(transaction.amount);
      if (transaction.type === 'PAYMENT' || transaction.type === 'CREDIT_NOTE') {
        balanceChange = balanceChange.negated();
      }
      balanceChange = balanceChange.negated(); // Reverse it

      const customer = await tx.customer.findUnique({
        where: { id: transaction.customerId },
      });

      const newBalance = new Prisma.Decimal(customer!.currentBalance).add(balanceChange);

      // Void the transaction
      await tx.customerTransaction.update({
        where: { id },
        data: {
          isVoided: true,
          voidedBy: userId,
          voidedAt: new Date(),
          voidReason: data.reason,
        },
      });

      // Update customer balance
      await tx.customer.update({
        where: { id: transaction.customerId },
        data: { currentBalance: newBalance },
      });

      return { success: true };
    });
  }

  // ==================== CUSTOMER AREAS ====================

  async createArea(data: CreateCustomerAreaDto, tenantId: string) {
    const existing = await this.prisma.customerArea.findUnique({
      where: { tenantId_code: { tenantId, code: data.code } },
    });

    if (existing) {
      throw new BadRequestException('Area code already exists');
    }

    return this.prisma.customerArea.create({
      data: { ...data, tenantId },
    });
  }

  async listAreas(tenantId: string) {
    return this.prisma.customerArea.findMany({
      where: { tenantId, deletedAt: null, isActive: true },
      include: {
        subAreas: { where: { isActive: true } },
        _count: { select: { salespeople: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async updateArea(id: string, data: UpdateCustomerAreaDto, tenantId: string) {
    const area = await this.prisma.customerArea.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!area) {
      throw new NotFoundException('Area not found');
    }

    return this.prisma.customerArea.update({
      where: { id },
      data,
    });
  }

  async deleteArea(id: string, tenantId: string) {
    const area = await this.prisma.customerArea.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!area) {
      throw new NotFoundException('Area not found');
    }

    // Soft delete
    return this.prisma.customerArea.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  // ==================== CUSTOMER SUB-AREAS ====================

  async createSubArea(data: CreateCustomerSubAreaDto, tenantId: string) {
    const existing = await this.prisma.customerSubArea.findUnique({
      where: { tenantId_code: { tenantId, code: data.code } },
    });

    if (existing) {
      throw new BadRequestException('Sub-area code already exists');
    }

    return this.prisma.customerSubArea.create({
      data: { ...data, tenantId },
    });
  }

  async listSubAreas(tenantId: string, areaId?: string) {
    return this.prisma.customerSubArea.findMany({
      where: {
        tenantId,
        deletedAt: null,
        isActive: true,
        ...(areaId && { areaId }),
      },
      include: {
        area: true,
        _count: { select: { salespeople: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async updateSubArea(id: string, data: UpdateCustomerSubAreaDto, tenantId: string) {
    const subArea = await this.prisma.customerSubArea.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!subArea) {
      throw new NotFoundException('Sub-area not found');
    }

    return this.prisma.customerSubArea.update({
      where: { id },
      data,
    });
  }

  async deleteSubArea(id: string, tenantId: string) {
    const subArea = await this.prisma.customerSubArea.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!subArea) {
      throw new NotFoundException('Sub-area not found');
    }

    return this.prisma.customerSubArea.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  // ==================== SALESPEOPLE ====================

  async createSalesperson(data: CreateSalespersonDto, tenantId: string) {
    const existing = await this.prisma.salesperson.findUnique({
      where: { tenantId_code: { tenantId, code: data.code } },
    });

    if (existing) {
      throw new BadRequestException('Salesperson code already exists');
    }

    return this.prisma.salesperson.create({
      data: {
        ...data,
        tenantId,
        commissionRate: new Prisma.Decimal(data.commissionRate || 0),
      },
    });
  }

  async listSalespeople(tenantId: string, filters?: { areaId?: string; subAreaId?: string }) {
    return this.prisma.salesperson.findMany({
      where: {
        tenantId,
        deletedAt: null,
        isActive: true,
        ...(filters?.areaId && { areaId: filters.areaId }),
        ...(filters?.subAreaId && { subAreaId: filters.subAreaId }),
      },
      include: {
        area: true,
        subArea: true,
        _count: { select: { sales: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async updateSalesperson(id: string, data: UpdateSalespersonDto, tenantId: string) {
    const salesperson = await this.prisma.salesperson.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!salesperson) {
      throw new NotFoundException('Salesperson not found');
    }

    return this.prisma.salesperson.update({
      where: { id },
      data: {
        ...data,
        ...(data.commissionRate !== undefined && {
          commissionRate: new Prisma.Decimal(data.commissionRate),
        }),
      },
    });
  }

  async deleteSalesperson(id: string, tenantId: string) {
    const salesperson = await this.prisma.salesperson.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!salesperson) {
      throw new NotFoundException('Salesperson not found');
    }

    return this.prisma.salesperson.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  // ==================== REPORTS & ANALYTICS ====================

  async getAccountStatement(customerId: string, tenantId: string, filters?: {
    startDate?: string;
    endDate?: string;
  }) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId, deletedAt: null },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const transactions = await this.prisma.customerTransaction.findMany({
      where: {
        customerId,
        tenantId,
        isVoided: false,
        ...(filters?.startDate && {
          transactionDate: { gte: new Date(filters.startDate) },
        }),
        ...(filters?.endDate && {
          transactionDate: { lte: new Date(filters.endDate) },
        }),
      },
      orderBy: { transactionDate: 'asc' },
      include: {
        branch: { select: { name: true } },
      },
    });

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        taxId: customer.taxId,
        currentBalance: customer.currentBalance,
        creditLimit: customer.creditLimit,
        paymentTermDays: customer.paymentTermDays,
      },
      transactions,
      summary: {
        totalInvoices: transactions.filter(t => t.type === 'INVOICE').length,
        totalPayments: transactions.filter(t => t.type === 'PAYMENT').length,
        totalInvoiced: transactions
          .filter(t => t.type === 'INVOICE')
          .reduce((sum, t) => sum.add(t.amount), new Prisma.Decimal(0)),
        totalPaid: transactions
          .filter(t => t.type === 'PAYMENT')
          .reduce((sum, t) => sum.add(t.amount), new Prisma.Decimal(0)),
        currentBalance: customer.currentBalance,
      },
    };
  }

  async getAgingReport(tenantId: string) {
    const customers = await this.prisma.customer.findMany({
      where: {
        tenantId,
        deletedAt: null,
        customerType: 'CREDIT',
        currentBalance: { gt: 0 },
      },
      include: {
        transactions: {
          where: {
            type: 'INVOICE',
            isVoided: false,
          },
          orderBy: { transactionDate: 'asc' },
        },
      },
    });

    const now = new Date();
    const aging = customers.map(customer => {
      const overdueInvoices = customer.transactions.filter(t => {
        if (!t.dueDate) return false;
        return t.dueDate < now;
      });

      const daysOverdue = overdueInvoices.length > 0
        ? Math.floor((now.getTime() - overdueInvoices[0].dueDate!.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        customerId: customer.id,
        customerName: customer.name,
        taxId: customer.taxId,
        currentBalance: customer.currentBalance,
        creditLimit: customer.creditLimit,
        daysOverdue,
        overdueAmount: overdueInvoices.reduce(
          (sum, t) => sum.add(t.amount),
          new Prisma.Decimal(0),
        ),
      };
    });

    return aging.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }

  async getSegmentationStats(tenantId: string) {
    const stats = await this.prisma.customer.groupBy({
      by: ['priceLevel'],
      where: {
        tenantId,
        deletedAt: null,
      },
      _count: {
        id: true,
      },
      _sum: {
        currentBalance: true,
        creditLimit: true,
      },
    });

    // Also get total sales volume by priceLevel (Requires joining, which groupBy doesn't support directly efficiently for aggregate relationships in one go, 
    // but we can do a raw query or separate aggregation. For simplicity, let's stick to balance/limit/count first 
    // and maybe total sales count if needed, but sales are in another table).

    return stats.map(s => ({
      priceLevel: s.priceLevel,
      count: s._count.id,
      totalBalance: s._sum.currentBalance || new Prisma.Decimal(0),
      totalCreditLimit: s._sum.creditLimit || new Prisma.Decimal(0),
    }));
  }
}
