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
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    prisma;
    logger = new common_1.Logger(PaymentsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createDto, tenantId, userId) {
        const { customerId, saleId, amount, ...paymentData } = createDto;
        return this.prisma.$transaction(async (tx) => {
            const customer = await tx.customer.findFirst({
                where: { id: customerId, tenantId, deletedAt: null },
            });
            if (!customer)
                throw new common_1.NotFoundException(`Customer ${customerId} not found`);
            if (customer.isBlocked)
                throw new common_1.BadRequestException('Cannot process payment for blocked customer');
            if (saleId) {
                const sale = await tx.sale.findFirst({
                    where: { id: saleId, tenantId, customerId },
                });
                if (!sale)
                    throw new common_1.NotFoundException(`Sale ${saleId} not found for this customer`);
            }
            const payment = await tx.paymentRecord.create({
                data: {
                    tenantId,
                    customerId,
                    saleId,
                    amount: new client_1.Prisma.Decimal(amount),
                    paymentDate: paymentData.paymentDate
                        ? new Date(paymentData.paymentDate)
                        : undefined,
                    paymentMethod: paymentData.paymentMethod,
                    reference: paymentData.reference,
                    notes: paymentData.notes,
                    createdBy: userId,
                },
            });
            await tx.customer.update({
                where: { id: customerId },
                data: {
                    currentBalance: { decrement: new client_1.Prisma.Decimal(amount) },
                },
            });
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
    async applyToOldest(customerId, amount, tenantId, userId) {
        const outstandingSales = await this.prisma.sale.findMany({
            where: {
                customerId,
                tenantId,
                paymentMethod: 'CREDIT',
                status: { in: ['COMPLETED', 'PARTIAL'] },
            },
            orderBy: { createdAt: 'asc' },
        });
        return this.create({
            customerId,
            amount,
            notes: 'Applied to oldest outstanding invoices (FIFO)',
            paymentMethod: 'CASH',
        }, tenantId, userId);
    }
    async getAccountStatus(customerId, tenantId) {
        const customer = await this.prisma.customer.findFirst({
            where: { id: customerId, tenantId, deletedAt: null },
        });
        if (!customer)
            throw new common_1.NotFoundException(`Customer ${customerId} not found`);
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
            current: new client_1.Prisma.Decimal(0),
            over30: new client_1.Prisma.Decimal(0),
            over60: new client_1.Prisma.Decimal(0),
            over90: new client_1.Prisma.Decimal(0),
        };
        for (const sale of sales) {
            const diffDays = Math.floor((now.getTime() - sale.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            const outstanding = sale.total;
            if (diffDays <= 30)
                aging.current = aging.current.add(outstanding);
            else if (diffDays <= 60)
                aging.over30 = aging.over30.add(outstanding);
            else if (diffDays <= 90)
                aging.over60 = aging.over60.add(outstanding);
            else
                aging.over90 = aging.over90.add(outstanding);
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
    async findAll(query, tenantId) {
        const { page, limit, customerId, saleId, startDate, endDate, paymentMethod, } = query;
        const skip = (page - 1) * limit;
        const where = {
            tenantId,
            ...(customerId ? { customerId } : {}),
            ...(saleId ? { saleId } : {}),
            ...(paymentMethod ? { paymentMethod: paymentMethod } : {}),
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
    async findOne(id, tenantId) {
        const payment = await this.prisma.paymentRecord.findFirst({
            where: { id, tenantId },
            include: {
                customer: true,
                sale: true,
                auditLogs: true,
            },
        });
        if (!payment)
            throw new common_1.NotFoundException(`Payment ${id} not found`);
        return payment;
    }
    async getSalePayments(saleId, tenantId) {
        return this.prisma.paymentRecord.findMany({
            where: { saleId, tenantId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async notifyOverdue(tenantId) {
        const now = new Date();
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
        const alertsGenerated = [];
        for (const customer of debtors) {
            for (const sale of customer.sales) {
                const diffDays = Math.floor((now.getTime() - sale.createdAt.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays > customer.paymentTermDays) {
                    const message = `Factura ${sale.orderNumber || sale.id.substring(0, 8)} tiene ${diffDays} días de atraso.`;
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
    async generateAccountStatementPdf(customerId, tenantId) {
        const customer = await this.prisma.customer.findFirst({
            where: { id: customerId, tenantId, deletedAt: null },
        });
        if (!customer)
            throw new common_1.NotFoundException(`Customer ${customerId} not found`);
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
        const history = [
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
        const docDefinition = {
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
            const chunks = [];
            pdfDoc.on('data', (chunk) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', reject);
            pdfDoc.end();
        });
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map