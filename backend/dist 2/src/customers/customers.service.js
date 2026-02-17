"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let CustomersService = class CustomersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createCustomer(data, tenantId, userId) {
        if (data.taxId) {
            const existing = await this.prisma.customer.findUnique({
                where: { tenantId_taxId: { tenantId, taxId: data.taxId } },
            });
            if (existing) {
                throw new common_1.BadRequestException('Customer with this Tax ID already exists');
            }
        }
        return this.prisma.customer.create({
            data: {
                ...data,
                tenantId,
                createdBy: userId,
                creditLimit: new client_1.Prisma.Decimal(data.creditLimit || 0),
                currentBalance: new client_1.Prisma.Decimal(0),
            },
            include: {
                sales: { take: 5, orderBy: { createdAt: 'desc' } },
                transactions: { take: 10, orderBy: { transactionDate: 'desc' } },
            },
        });
    }
    async listCustomers(tenantId, filters) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 50;
        const skip = (page - 1) * limit;
        const where = {
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
            ...(filters?.creditStatus && { creditStatus: filters.creditStatus }),
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
    async getCustomer(id, tenantId) {
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
            throw new common_1.NotFoundException('Customer not found');
        }
        return customer;
    }
    async updateCustomer(id, data, tenantId, userId) {
        const customer = await this.prisma.customer.findFirst({
            where: { id, tenantId, deletedAt: null },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found');
        }
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
                    creditLimit: new client_1.Prisma.Decimal(data.creditLimit),
                }),
            },
        });
    }
    async deleteCustomer(id, tenantId, userId) {
        const customer = await this.prisma.customer.findFirst({
            where: { id, tenantId, deletedAt: null },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found');
        }
        if (Number(customer.currentBalance) > 0) {
            throw new common_1.BadRequestException('Cannot delete customer with outstanding balance');
        }
        await this.prisma.customer.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
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
    async blockCustomer(id, data, tenantId, userId) {
        const customer = await this.prisma.customer.findFirst({
            where: { id, tenantId, deletedAt: null },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found');
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
    async unblockCustomer(id, tenantId, userId) {
        const customer = await this.prisma.customer.findFirst({
            where: { id, tenantId, deletedAt: null },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found');
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
    async approveCustomer(id, data, tenantId, userId) {
        const customer = await this.prisma.customer.findFirst({
            where: { id, tenantId, deletedAt: null },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found');
        }
        await this.prisma.customer.update({
            where: { id },
            data: {
                isApproved: true,
                approvedBy: userId,
                approvedAt: new Date(),
                customerType: 'CREDIT',
                creditLimit: new client_1.Prisma.Decimal(data.creditLimit),
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
    async createTransaction(data, tenantId, userId) {
        return this.prisma.$transaction(async (tx) => {
            const customer = await tx.customer.findFirst({
                where: { id: data.customerId, tenantId, deletedAt: null },
            });
            if (!customer) {
                throw new common_1.NotFoundException('Customer not found');
            }
            let balanceChange = new client_1.Prisma.Decimal(data.amount);
            if (data.type === 'PAYMENT' || data.type === 'CREDIT_NOTE') {
                balanceChange = balanceChange.negated();
            }
            const newBalance = new client_1.Prisma.Decimal(customer.currentBalance).add(balanceChange);
            const lastTransaction = await tx.customerTransaction.findFirst({
                where: { tenantId },
                orderBy: { transactionNumber: 'desc' },
            });
            const nextNumber = lastTransaction
                ? String(Number(lastTransaction.transactionNumber) + 1).padStart(8, '0')
                : '00000001';
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
                    amount: new client_1.Prisma.Decimal(data.amount),
                    balance: newBalance,
                    transactionDate: new Date(),
                    dueDate: data.dueDate ? new Date(data.dueDate) : null,
                    notes: data.notes,
                    createdBy: userId,
                },
            });
            await tx.customer.update({
                where: { id: data.customerId },
                data: { currentBalance: newBalance },
            });
            if (customer.customerType === 'CREDIT') {
                const creditLimit = new client_1.Prisma.Decimal(customer.creditLimit);
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
    async listTransactions(tenantId, filters) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 50;
        const skip = (page - 1) * limit;
        const where = {
            tenantId,
            isVoided: false,
            ...(filters?.customerId && { customerId: filters.customerId }),
            ...(filters?.branchId && { branchId: filters.branchId }),
            ...(filters?.type && { type: filters.type }),
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
    async voidTransaction(id, data, tenantId, userId) {
        return this.prisma.$transaction(async (tx) => {
            const transaction = await tx.customerTransaction.findFirst({
                where: { id, tenantId, isVoided: false },
            });
            if (!transaction) {
                throw new common_1.NotFoundException('Transaction not found or already voided');
            }
            let balanceChange = new client_1.Prisma.Decimal(transaction.amount);
            if (transaction.type === 'PAYMENT' || transaction.type === 'CREDIT_NOTE') {
                balanceChange = balanceChange.negated();
            }
            balanceChange = balanceChange.negated();
            const customer = await tx.customer.findUnique({
                where: { id: transaction.customerId },
            });
            const newBalance = new client_1.Prisma.Decimal(customer.currentBalance).add(balanceChange);
            await tx.customerTransaction.update({
                where: { id },
                data: {
                    isVoided: true,
                    voidedBy: userId,
                    voidedAt: new Date(),
                    voidReason: data.reason,
                },
            });
            await tx.customer.update({
                where: { id: transaction.customerId },
                data: { currentBalance: newBalance },
            });
            return { success: true };
        });
    }
    async createArea(data, tenantId) {
        const existing = await this.prisma.customerArea.findUnique({
            where: { tenantId_code: { tenantId, code: data.code } },
        });
        if (existing) {
            throw new common_1.BadRequestException('Area code already exists');
        }
        return this.prisma.customerArea.create({
            data: { ...data, tenantId },
        });
    }
    async listAreas(tenantId) {
        return this.prisma.customerArea.findMany({
            where: { tenantId, deletedAt: null, isActive: true },
            include: {
                subAreas: { where: { isActive: true } },
                _count: { select: { salespeople: true } },
            },
            orderBy: { name: 'asc' },
        });
    }
    async updateArea(id, data, tenantId) {
        const area = await this.prisma.customerArea.findFirst({
            where: { id, tenantId, deletedAt: null },
        });
        if (!area) {
            throw new common_1.NotFoundException('Area not found');
        }
        return this.prisma.customerArea.update({
            where: { id },
            data,
        });
    }
    async deleteArea(id, tenantId) {
        const area = await this.prisma.customerArea.findFirst({
            where: { id, tenantId, deletedAt: null },
        });
        if (!area) {
            throw new common_1.NotFoundException('Area not found');
        }
        return this.prisma.customerArea.update({
            where: { id },
            data: { deletedAt: new Date(), isActive: false },
        });
    }
    async createSubArea(data, tenantId) {
        const existing = await this.prisma.customerSubArea.findUnique({
            where: { tenantId_code: { tenantId, code: data.code } },
        });
        if (existing) {
            throw new common_1.BadRequestException('Sub-area code already exists');
        }
        return this.prisma.customerSubArea.create({
            data: { ...data, tenantId },
        });
    }
    async listSubAreas(tenantId, areaId) {
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
    async updateSubArea(id, data, tenantId) {
        const subArea = await this.prisma.customerSubArea.findFirst({
            where: { id, tenantId, deletedAt: null },
        });
        if (!subArea) {
            throw new common_1.NotFoundException('Sub-area not found');
        }
        return this.prisma.customerSubArea.update({
            where: { id },
            data,
        });
    }
    async deleteSubArea(id, tenantId) {
        const subArea = await this.prisma.customerSubArea.findFirst({
            where: { id, tenantId, deletedAt: null },
        });
        if (!subArea) {
            throw new common_1.NotFoundException('Sub-area not found');
        }
        return this.prisma.customerSubArea.update({
            where: { id },
            data: { deletedAt: new Date(), isActive: false },
        });
    }
    async createSalesperson(data, tenantId) {
        const existing = await this.prisma.salesperson.findUnique({
            where: { tenantId_code: { tenantId, code: data.code } },
        });
        if (existing) {
            throw new common_1.BadRequestException('Salesperson code already exists');
        }
        return this.prisma.salesperson.create({
            data: {
                ...data,
                tenantId,
                commissionRate: new client_1.Prisma.Decimal(data.commissionRate || 0),
            },
        });
    }
    async listSalespeople(tenantId, filters) {
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
    async updateSalesperson(id, data, tenantId) {
        const salesperson = await this.prisma.salesperson.findFirst({
            where: { id, tenantId, deletedAt: null },
        });
        if (!salesperson) {
            throw new common_1.NotFoundException('Salesperson not found');
        }
        return this.prisma.salesperson.update({
            where: { id },
            data: {
                ...data,
                ...(data.commissionRate !== undefined && {
                    commissionRate: new client_1.Prisma.Decimal(data.commissionRate),
                }),
            },
        });
    }
    async deleteSalesperson(id, tenantId) {
        const salesperson = await this.prisma.salesperson.findFirst({
            where: { id, tenantId, deletedAt: null },
        });
        if (!salesperson) {
            throw new common_1.NotFoundException('Salesperson not found');
        }
        return this.prisma.salesperson.update({
            where: { id },
            data: { deletedAt: new Date(), isActive: false },
        });
    }
    async getAccountStatement(customerId, tenantId, filters) {
        const customer = await this.prisma.customer.findFirst({
            where: { id: customerId, tenantId, deletedAt: null },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found');
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
                    .reduce((sum, t) => sum.add(t.amount), new client_1.Prisma.Decimal(0)),
                totalPaid: transactions
                    .filter(t => t.type === 'PAYMENT')
                    .reduce((sum, t) => sum.add(t.amount), new client_1.Prisma.Decimal(0)),
                currentBalance: customer.currentBalance,
            },
        };
    }
    async getAgingReport(tenantId) {
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
                if (!t.dueDate)
                    return false;
                return t.dueDate < now;
            });
            const daysOverdue = overdueInvoices.length > 0
                ? Math.floor((now.getTime() - overdueInvoices[0].dueDate.getTime()) / (1000 * 60 * 60 * 24))
                : 0;
            return {
                customerId: customer.id,
                customerName: customer.name,
                taxId: customer.taxId,
                currentBalance: customer.currentBalance,
                creditLimit: customer.creditLimit,
                daysOverdue,
                overdueAmount: overdueInvoices.reduce((sum, t) => sum.add(t.amount), new client_1.Prisma.Decimal(0)),
            };
        });
        return aging.sort((a, b) => b.daysOverdue - a.daysOverdue);
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map