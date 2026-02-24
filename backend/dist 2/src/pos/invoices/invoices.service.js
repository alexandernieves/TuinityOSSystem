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
exports.InvoicesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const request_context_1 = require("../../common/request-context");
let InvoicesService = class InvoicesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    toDecimal(value) {
        return new client_1.Prisma.Decimal(value);
    }
    clampDecimal(value, min, max) {
        if (value.lessThan(min))
            return min;
        if (value.greaterThan(max))
            return max;
        return value;
    }
    async listInvoices(params) {
        const store = request_context_1.RequestContext.getStore();
        const tenantId = store?.tenantId;
        if (!tenantId) {
            throw new Error('Missing tenantId in request context');
        }
        const take = Number.isFinite(params.take)
            ? Math.max(1, Math.min(100, params.take))
            : 25;
        const skip = Number.isFinite(params.skip) ? Math.max(0, params.skip) : 0;
        const q = params.q?.trim();
        const where = {
            tenantId,
            ...(params.branchId ? { branchId: params.branchId } : {}),
            ...(q
                ? {
                    OR: [
                        { invoiceNumber: { contains: q, mode: 'insensitive' } },
                        { customerName: { contains: q, mode: 'insensitive' } },
                        { customerTaxId: { contains: q, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };
        const [total, items] = await this.prisma.$transaction([
            this.prisma.invoice.count({ where }),
            this.prisma.invoice.findMany({
                where,
                orderBy: [{ issuedAt: 'desc' }],
                skip,
                take,
                select: {
                    id: true,
                    invoiceNumber: true,
                    status: true,
                    issuedAt: true,
                    customerName: true,
                    currency: true,
                    subtotal: true,
                    taxTotal: true,
                    total: true,
                    branch: { select: { id: true, name: true, code: true } },
                },
            }),
        ]);
        return { total, items };
    }
    async getInvoiceById(id) {
        const store = request_context_1.RequestContext.getStore();
        const tenantId = store?.tenantId;
        if (!tenantId) {
            throw new Error('Missing tenantId in request context');
        }
        const invoice = await this.prisma.invoice.findFirst({
            where: {
                id,
                tenantId,
            },
            include: {
                lines: true,
                branch: { select: { id: true, name: true, code: true } },
            },
        });
        if (!invoice) {
            throw new common_1.NotFoundException('Invoice not found');
        }
        return invoice;
    }
    async createInvoice(dto) {
        const store = request_context_1.RequestContext.getStore();
        const tenantId = store?.tenantId;
        const userId = store?.userId;
        if (!tenantId) {
            throw new Error('Missing tenantId in request context');
        }
        const branch = await this.prisma.branch.findFirst({
            where: {
                id: dto.branchId,
                tenantId,
            },
            select: {
                id: true,
                code: true,
                name: true,
            },
        });
        if (!branch) {
            throw new common_1.BadRequestException('Invalid branch');
        }
        const prefix = `FV-${branch.code}-`;
        const result = await this.prisma.$transaction(async (tx) => {
            await tx.invoiceSequence.upsert({
                where: {
                    tenantId_branchId: {
                        tenantId,
                        branchId: branch.id,
                    },
                },
                update: {
                    prefix,
                },
                create: {
                    tenantId,
                    branchId: branch.id,
                    prefix,
                    lastNumber: 0,
                },
            });
            const seq = await tx.invoiceSequence.update({
                where: {
                    tenantId_branchId: {
                        tenantId,
                        branchId: branch.id,
                    },
                },
                data: {
                    lastNumber: { increment: 1 },
                },
                select: {
                    lastNumber: true,
                    prefix: true,
                },
            });
            const sequenceNumber = seq.lastNumber;
            const invoiceNumber = `${seq.prefix}${String(sequenceNumber).padStart(6, '0')}`;
            let subtotal = new client_1.Prisma.Decimal(0);
            let discountTotal = new client_1.Prisma.Decimal(0);
            let taxTotal = new client_1.Prisma.Decimal(0);
            let total = new client_1.Prisma.Decimal(0);
            const lines = dto.lines.map((line) => {
                const quantity = this.toDecimal(line.quantity);
                const unitPrice = this.toDecimal(line.unitPrice);
                const lineSubtotal = quantity.mul(unitPrice);
                let discount = new client_1.Prisma.Decimal(0);
                const discountType = (line.discountType ??
                    'NONE');
                const discountValue = this.toDecimal(line.discountValue ?? 0);
                if (discountType === 'PERCENT') {
                    discount = lineSubtotal.mul(discountValue).div(100);
                }
                else if (discountType === 'AMOUNT') {
                    discount = discountValue;
                }
                discount = this.clampDecimal(discount, new client_1.Prisma.Decimal(0), lineSubtotal);
                const taxable = line.taxable ?? true;
                const taxRate = this.toDecimal(line.taxRate ?? 0.07);
                const taxableBase = lineSubtotal.sub(discount);
                const lineTax = taxable
                    ? taxableBase.mul(taxRate)
                    : new client_1.Prisma.Decimal(0);
                const lineTotal = taxableBase.add(lineTax);
                subtotal = subtotal.add(lineSubtotal);
                discountTotal = discountTotal.add(discount);
                taxTotal = taxTotal.add(lineTax);
                total = total.add(lineTotal);
                return {
                    tenantId,
                    productId: line.productId,
                    description: line.description,
                    quantity,
                    unitPrice,
                    discountType,
                    discountValue,
                    taxable,
                    taxRate,
                    lineSubtotal,
                    lineDiscount: discount,
                    lineTax,
                    lineTotal,
                };
            });
            const created = await tx.invoice.create({
                data: {
                    tenantId,
                    branchId: branch.id,
                    issuedByUserId: userId,
                    invoiceNumber,
                    sequenceNumber,
                    currency: dto.currency ?? 'USD',
                    customerName: dto.customerName,
                    customerTaxId: dto.customerTaxId,
                    customerPhone: dto.customerPhone,
                    subtotal,
                    discountTotal,
                    taxTotal,
                    total,
                    lines: {
                        create: lines,
                    },
                },
                include: {
                    lines: true,
                    branch: { select: { id: true, code: true, name: true } },
                },
            });
            for (const line of dto.lines) {
                if (line.productId) {
                    const qty = Number(line.quantity);
                    await tx.inventory.upsert({
                        where: {
                            tenantId_branchId_productId: {
                                tenantId,
                                branchId: branch.id,
                                productId: line.productId,
                            },
                        },
                        update: { quantity: { decrement: qty } },
                        create: {
                            tenantId,
                            branchId: branch.id,
                            productId: line.productId,
                            quantity: -qty,
                        },
                    });
                    await tx.inventoryMovement.create({
                        data: {
                            tenantId,
                            branchId: branch.id,
                            productId: line.productId,
                            type: 'OUT',
                            quantity: -qty,
                            reason: `Venta B2C #${invoiceNumber}`,
                            referenceId: created.id,
                            createdBy: userId || 'system',
                        },
                    });
                }
            }
            const activeSession = await tx.cashSession.findFirst({
                where: {
                    tenantId,
                    userId: userId || undefined,
                    status: 'OPEN',
                    branchId: branch.id,
                },
            });
            await tx.payment.create({
                data: {
                    tenantId,
                    invoiceId: created.id,
                    amount: total,
                    method: dto.paymentMethod || 'CASH',
                    status: 'COMPLETED',
                    paidAt: new Date(),
                    sessionId: activeSession?.id,
                },
            });
            return created;
        });
        return result;
    }
};
exports.InvoicesService = InvoicesService;
exports.InvoicesService = InvoicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InvoicesService);
//# sourceMappingURL=invoices.service.js.map