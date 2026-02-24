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
var SalesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let SalesService = SalesService_1 = class SalesService {
    prisma;
    logger = new common_1.Logger(SalesService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createSaleDto, tenantId, userId) {
        const { branchId, customerId, items, paymentMethod, status, notes, authorizedBy, } = createSaleDto;
        const initialStatus = status || 'COMPLETED';
        if (initialStatus !== 'QUOTE' && !paymentMethod) {
            throw new common_1.BadRequestException('Payment method is required for non-quote sales');
        }
        return this.prisma.$transaction(async (tx) => {
            const branch = await tx.branch.findFirst({
                where: { id: branchId, tenantId },
            });
            if (!branch)
                throw new common_1.NotFoundException(`Branch ${branchId} not found`);
            let customer = null;
            if (customerId) {
                customer = await tx.customer.findFirst({
                    where: { id: customerId, tenantId, deletedAt: null },
                });
                if (!customer)
                    throw new common_1.NotFoundException(`Customer ${customerId} not found`);
                if (customer.isBlocked && initialStatus !== 'QUOTE') {
                    throw new common_1.BadRequestException(`Customer is blocked: ${customer.blockedReason}`);
                }
                if (paymentMethod === 'CREDIT' &&
                    !customer.isApproved &&
                    initialStatus !== 'QUOTE') {
                    throw new common_1.BadRequestException('Credit sale not allowed for unapproved customer');
                }
                if (paymentMethod === 'CREDIT' && initialStatus !== 'QUOTE') {
                    const overdueSales = await tx.sale.findFirst({
                        where: {
                            customerId: customer.id,
                            tenantId,
                            status: { in: ['COMPLETED', 'PARTIAL'] },
                            paymentMethod: 'CREDIT',
                            dueDate: { lt: new Date() },
                        },
                    });
                    if (overdueSales) {
                        throw new common_1.BadRequestException(`Customer has overdue invoices. Cannot process new credit orders. ` +
                            `Oldest overdue: ${overdueSales.orderNumber || overdueSales.id.substring(0, 8)}`);
                    }
                }
            }
            else if (paymentMethod === 'CREDIT') {
                throw new common_1.BadRequestException('Customer is required for credit sales');
            }
            let dueDate = null;
            if (paymentMethod === 'CREDIT' &&
                customer &&
                customer.paymentTermDays > 0) {
                dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + Number(customer.paymentTermDays));
            }
            let subtotal = new client_1.Prisma.Decimal(0);
            let totalTax = new client_1.Prisma.Decimal(0);
            let totalDiscount = new client_1.Prisma.Decimal(0);
            const itemsToProcess = [];
            for (const item of items) {
                const product = await tx.product.findFirst({
                    where: { id: item.productId, tenantId, deletedAt: null },
                });
                if (!product)
                    throw new common_1.BadRequestException(`Product ${item.productId} not found`);
                if (initialStatus !== 'QUOTE') {
                    const inventory = await tx.inventory.findUnique({
                        where: {
                            tenantId_branchId_productId: {
                                tenantId,
                                branchId,
                                productId: item.productId,
                            },
                        },
                    });
                    const quantity = inventory?.quantity || 0;
                    const reserved = inventory?.reserved || 0;
                    const available = quantity - reserved;
                    if (available < item.quantity) {
                        throw new common_1.BadRequestException(`Insufficient stock for ${product.description}. Available: ${available} (Physical: ${quantity}, Reserved: ${reserved})`);
                    }
                }
                let unitPrice;
                if (item.unitPrice !== undefined) {
                    unitPrice = new client_1.Prisma.Decimal(item.unitPrice);
                }
                else {
                    const level = customer?.priceLevel || 'A';
                    switch (level) {
                        case 'A':
                            unitPrice = product.price_a;
                            break;
                        case 'B':
                            unitPrice = product.price_b;
                            break;
                        case 'C':
                            unitPrice = product.price_c;
                            break;
                        case 'D':
                            unitPrice = product.price_d;
                            break;
                        case 'E':
                            unitPrice = product.price_e;
                            break;
                        default:
                            unitPrice = product.price_a;
                    }
                }
                const quantityDec = new client_1.Prisma.Decimal(item.quantity);
                const discountDec = new client_1.Prisma.Decimal(item.discount || 0);
                const taxAmount = new client_1.Prisma.Decimal(0);
                const lineTotal = unitPrice.mul(quantityDec).minus(discountDec);
                subtotal = subtotal.add(unitPrice.mul(quantityDec));
                totalDiscount = totalDiscount.add(discountDec);
                totalTax = totalTax.add(taxAmount);
                itemsToProcess.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice,
                    taxAmount,
                    discountAmount: discountDec,
                    totalLine: lineTotal,
                });
            }
            const total = subtotal.minus(totalDiscount).add(totalTax);
            if (initialStatus !== 'QUOTE' && paymentMethod === 'CREDIT' && customer) {
                const newBalance = customer.currentBalance.add(total);
                if (newBalance.gt(customer.creditLimit)) {
                    throw new common_1.BadRequestException(`Credit limit exceeded. Available: ${customer.creditLimit.minus(customer.currentBalance)}`);
                }
                await tx.customer.update({
                    where: { id: customerId },
                    data: { currentBalance: { increment: total } },
                });
            }
            const sale = await tx.sale.create({
                data: {
                    tenantId,
                    branchId,
                    customerId,
                    subtotal,
                    tax: totalTax,
                    discount: totalDiscount,
                    total,
                    paymentMethod: paymentMethod || 'CASH',
                    status: initialStatus,
                    dueDate,
                    notes,
                    authorizedBy,
                    authorizedAt: authorizedBy ? new Date() : undefined,
                    createdBy: userId,
                    items: {
                        create: itemsToProcess.map((i) => ({
                            ...i,
                            tenantId,
                        })),
                    },
                },
                include: { items: true },
            });
            if (initialStatus !== 'QUOTE') {
                for (const item of itemsToProcess) {
                    if (initialStatus === 'COMPLETED') {
                        await tx.inventory.update({
                            where: {
                                tenantId_branchId_productId: {
                                    tenantId,
                                    branchId,
                                    productId: item.productId,
                                },
                            },
                            data: { quantity: { decrement: item.quantity } },
                        });
                        await tx.inventoryMovement.create({
                            data: {
                                tenantId,
                                branchId,
                                productId: item.productId,
                                type: 'OUT',
                                quantity: -item.quantity,
                                reason: `Sale ${sale.id}`,
                                referenceId: sale.id,
                                createdBy: userId,
                            },
                        });
                    }
                    else if (initialStatus === 'PENDING' ||
                        initialStatus === 'APPROVED_ORDER' ||
                        initialStatus === 'PACKING') {
                        await tx.inventory.update({
                            where: {
                                tenantId_branchId_productId: {
                                    tenantId,
                                    branchId,
                                    productId: item.productId,
                                },
                            },
                            data: { reserved: { increment: item.quantity } },
                        });
                    }
                }
            }
            return sale;
        });
    }
    async findById(id, tenantId) {
        const sale = await this.prisma.sale.findFirst({
            where: { id, tenantId },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                customer: true,
                branch: true,
            },
        });
        if (!sale)
            throw new common_1.NotFoundException(`Sale ${id} not found`);
        return sale;
    }
    async generateQuotePdf(id, tenantId) {
        const quote = await this.findById(id, tenantId);
        const PdfPrinter = require('pdfmake');
        const fonts = {
            Roboto: {
                normal: 'node_modules/pdfmake/build/vfs_fonts.js',
                bold: 'node_modules/pdfmake/build/vfs_fonts.js',
            },
        };
        const printer = new PdfPrinter(fonts);
        const docDefinition = {
            content: [
                {
                    columns: [
                        { text: 'COTIZACIÓN / QUOTE', style: 'header' },
                        {
                            text: `No: ${quote.orderNumber || quote.id.substring(0, 8)}`,
                            alignment: 'right',
                            style: 'subheader',
                        },
                    ],
                },
                { text: '\n' },
                {
                    columns: [
                        {
                            width: '*',
                            text: [
                                { text: 'Customer:\n', bold: true },
                                { text: quote.customer?.name || 'Walk-in Customer' },
                                { text: `\nTax ID: ${quote.customer?.taxId || 'N/A'}` },
                                { text: `\nEmail: ${quote.customer?.email || 'N/A'}` },
                            ],
                        },
                        {
                            width: 'auto',
                            text: [
                                { text: 'Date:\n', bold: true },
                                { text: quote.createdAt.toLocaleDateString() },
                                { text: '\nBranch:\n', bold: true },
                                { text: quote.branch?.name },
                            ],
                            alignment: 'right',
                        },
                    ],
                },
                { text: '\n\n' },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto'],
                        body: [
                            [
                                { text: 'Description', style: 'tableHeader' },
                                { text: 'Qty', style: 'tableHeader', alignment: 'center' },
                                {
                                    text: 'Unit Price',
                                    style: 'tableHeader',
                                    alignment: 'right',
                                },
                                { text: 'Total', style: 'tableHeader', alignment: 'right' },
                            ],
                            ...quote.items.map((item) => [
                                item.product.description,
                                { text: item.quantity.toString(), alignment: 'center' },
                                {
                                    text: `$${Number(item.unitPrice).toFixed(2)}`,
                                    alignment: 'right',
                                },
                                {
                                    text: `$${Number(item.totalLine).toFixed(2)}`,
                                    alignment: 'right',
                                },
                            ]),
                        ],
                    },
                    layout: 'lightHorizontalLines',
                },
                { text: '\n' },
                {
                    columns: [
                        { width: '*', text: '' },
                        {
                            width: 'auto',
                            table: {
                                body: [
                                    [
                                        'Subtotal:',
                                        {
                                            text: `$${Number(quote.subtotal).toFixed(2)}`,
                                            alignment: 'right',
                                        },
                                    ],
                                    [
                                        'Discount:',
                                        {
                                            text: `$${Number(quote.totalDiscount).toFixed(2)}`,
                                            alignment: 'right',
                                        },
                                    ],
                                    [
                                        'Tax:',
                                        {
                                            text: `$${Number(quote.totalTax).toFixed(2)}`,
                                            alignment: 'right',
                                        },
                                    ],
                                    [
                                        { text: 'TOTAL:', bold: true },
                                        {
                                            text: `$${Number(quote.total).toFixed(2)}`,
                                            alignment: 'right',
                                            bold: true,
                                        },
                                    ],
                                ],
                            },
                            layout: 'noBorders',
                        },
                    ],
                },
                { text: '\n\nNotes:', style: 'subheader' },
                { text: quote.notes || 'This quote is valid for 15 days.' },
            ],
            styles: {
                header: { fontSize: 20, bold: true, color: '#2c3e50' },
                subheader: { fontSize: 14, bold: true, margin: [0, 5, 0, 5] },
                tableHeader: {
                    bold: true,
                    fontSize: 12,
                    color: 'black',
                    fillColor: '#eeeeee',
                },
            },
            defaultStyle: {
                fontSize: 10,
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
    async update(id, updateDto, tenantId, userId) {
        const { items, notes, authorizedBy, paymentMethod, customerId } = updateDto;
        return this.prisma.$transaction(async (tx) => {
            const existingSale = await tx.sale.findFirst({
                where: { id, tenantId },
                include: { items: true, customer: true },
            });
            if (!existingSale)
                throw new common_1.NotFoundException(`Sale ${id} not found`);
            const forbiddenStatuses = ['COMPLETED', 'VOID', 'REFUNDED'];
            if (forbiddenStatuses.includes(existingSale.status)) {
                throw new common_1.BadRequestException(`Cannot edit sale in status ${existingSale.status}`);
            }
            const needsInventoryLogic = [
                'PENDING',
                'APPROVED_ORDER',
                'PACKING',
                'PARTIAL',
            ].includes(existingSale.status);
            let newSubtotal = 0;
            const itemsToProcess = [];
            for (const itemDto of items) {
                const product = await tx.product.findFirst({
                    where: { id: itemDto.productId, tenantId, deletedAt: null },
                });
                if (!product)
                    throw new common_1.NotFoundException(`Product ${itemDto.productId} not found`);
                const unitPrice = itemDto.unitPrice !== undefined
                    ? new client_1.Prisma.Decimal(itemDto.unitPrice)
                    : product.price_a;
                const discount = new client_1.Prisma.Decimal(itemDto.discount);
                const quantity = new client_1.Prisma.Decimal(itemDto.quantity);
                const totalLine = quantity.mul(unitPrice).sub(discount);
                newSubtotal += Number(totalLine);
                itemsToProcess.push({
                    productId: itemDto.productId,
                    quantity,
                    unitPrice,
                    discountAmount: discount,
                    taxAmount: new client_1.Prisma.Decimal(0),
                    total: totalLine,
                });
            }
            const newTotalTax = 0;
            const newTotalDiscount = itemsToProcess.reduce((sum, i) => sum + Number(i.discountAmount), 0);
            const newTotal = newSubtotal + newTotalTax;
            if (existingSale.paymentMethod === 'CREDIT' && existingSale.customerId) {
                const customer = existingSale.customer;
                if (customer) {
                    const balanceDiff = newTotal - Number(existingSale.total);
                    if (balanceDiff > 0) {
                        const newBalance = Number(customer.currentBalance) + balanceDiff;
                        if (newBalance > Number(customer.creditLimit)) {
                            throw new common_1.BadRequestException('Modification exceeds credit limit');
                        }
                    }
                }
            }
            if (needsInventoryLogic) {
                const existingItemsMap = new Map(existingSale.items.map((i) => [i.productId, i]));
                const newItemsMap = new Map(itemsToProcess.map((i) => [i.productId, i]));
                for (const oldItem of existingSale.items) {
                    const newItem = newItemsMap.get(oldItem.productId);
                    const oldQty = Number(oldItem.quantity);
                    const newQty = newItem ? Number(newItem.quantity) : 0;
                    if (newQty < oldQty) {
                        const diff = oldQty - newQty;
                        await tx.inventory.update({
                            where: {
                                tenantId_branchId_productId: {
                                    tenantId,
                                    branchId: existingSale.branchId,
                                    productId: oldItem.productId,
                                },
                            },
                            data: { reserved: { decrement: diff } },
                        });
                    }
                }
                for (const newItem of itemsToProcess) {
                    const oldItem = existingItemsMap.get(newItem.productId);
                    const oldQty = oldItem ? Number(oldItem.quantity) : 0;
                    const newQty = Number(newItem.quantity);
                    if (newQty > oldQty) {
                        const diff = newQty - oldQty;
                        const inventory = await tx.inventory.findUnique({
                            where: {
                                tenantId_branchId_productId: {
                                    tenantId,
                                    branchId: existingSale.branchId,
                                    productId: newItem.productId,
                                },
                            },
                        });
                        const available = (inventory?.quantity || 0) - (inventory?.reserved || 0);
                        if (available < diff) {
                            throw new common_1.BadRequestException(`Insufficient stock for product ${newItem.productId}`);
                        }
                        await tx.inventory.update({
                            where: {
                                tenantId_branchId_productId: {
                                    tenantId,
                                    branchId: existingSale.branchId,
                                    productId: newItem.productId,
                                },
                            },
                            data: { reserved: { increment: diff } },
                        });
                    }
                }
            }
            await tx.saleItem.deleteMany({ where: { saleId: id } });
            return tx.sale.update({
                where: { id },
                data: {
                    customerId: customerId || existingSale.customerId,
                    subtotal: new client_1.Prisma.Decimal(newSubtotal),
                    tax: new client_1.Prisma.Decimal(newTotalTax),
                    discount: new client_1.Prisma.Decimal(newTotalDiscount),
                    total: new client_1.Prisma.Decimal(newTotal),
                    paymentMethod: paymentMethod || existingSale.paymentMethod,
                    notes: notes || existingSale.notes,
                    authorizedBy: authorizedBy || existingSale.authorizedBy,
                    authorizedAt: authorizedBy ? new Date() : existingSale.authorizedAt,
                    updatedAt: new Date(),
                    items: {
                        create: itemsToProcess.map((i) => ({
                            ...i,
                            tenantId,
                        })),
                    },
                },
                include: { items: true },
            });
        });
    }
    async updateStatus(id, updateDto, tenantId, userId) {
        const { status: newStatus, authorizedBy, notes } = updateDto;
        return this.prisma.$transaction(async (tx) => {
            const sale = await tx.sale.findFirst({
                where: { id, tenantId },
                include: {
                    items: { include: { product: true } },
                    customer: true,
                },
            });
            if (!sale)
                throw new common_1.NotFoundException(`Sale ${id} not found`);
            const currentStatus = sale.status;
            if (currentStatus === newStatus)
                return sale;
            if (['PENDING', 'APPROVED_ORDER'].includes(newStatus) &&
                !['PENDING', 'APPROVED_ORDER', 'PACKING', 'COMPLETED'].includes(currentStatus)) {
                if (sale.customerId &&
                    sale.paymentMethod === 'CREDIT' &&
                    sale.customer) {
                    const customer = sale.customer;
                    const newBalance = Number(customer.currentBalance) + Number(sale.total);
                    if (newBalance > Number(customer.creditLimit)) {
                        throw new common_1.BadRequestException(`Credit limit exceeded. Current Balance: ${customer.currentBalance}, ` +
                            `Order Total: ${sale.total}, Limit: ${customer.creditLimit}`);
                    }
                    const overdueSales = await tx.sale.findFirst({
                        where: {
                            customerId: customer.id,
                            tenantId,
                            status: { in: ['COMPLETED', 'PARTIAL'] },
                            paymentMethod: 'CREDIT',
                            dueDate: { lt: new Date() },
                        },
                    });
                    if (overdueSales) {
                        throw new common_1.BadRequestException(`Customer has overdue invoices. Cannot approve new credit orders. ` +
                            `Oldest overdue invoice: ${overdueSales.orderNumber || overdueSales.id.substring(0, 8)}`);
                    }
                }
            }
            if (currentStatus === 'QUOTE' && newStatus === 'PENDING') {
                for (const item of sale.items) {
                    const inventory = await tx.inventory.findUnique({
                        where: {
                            tenantId_branchId_productId: {
                                tenantId,
                                branchId: sale.branchId,
                                productId: item.productId,
                            },
                        },
                    });
                    const quantity = inventory?.quantity || 0;
                    const reserved = inventory?.reserved || 0;
                    const available = quantity - reserved;
                    const itemQty = Number(item.quantity);
                    if (available < itemQty) {
                        throw new common_1.BadRequestException(`Insufficient stock for ${item.product.description} to approve order. Available: ${available}`);
                    }
                    await tx.inventory.update({
                        where: {
                            tenantId_branchId_productId: {
                                tenantId,
                                branchId: sale.branchId,
                                productId: item.productId,
                            },
                        },
                        data: { reserved: { increment: itemQty } },
                    });
                }
            }
            if (['PENDING', 'APPROVED_ORDER', 'PACKING'].includes(currentStatus) &&
                newStatus === 'COMPLETED') {
                for (const item of sale.items) {
                    const itemQty = Number(item.quantity);
                    await tx.inventory.update({
                        where: {
                            tenantId_branchId_productId: {
                                tenantId,
                                branchId: sale.branchId,
                                productId: item.productId,
                            },
                        },
                        data: {
                            quantity: { decrement: itemQty },
                            reserved: { decrement: itemQty },
                        },
                    });
                    await tx.inventoryMovement.create({
                        data: {
                            tenantId,
                            branchId: sale.branchId,
                            productId: item.productId,
                            type: 'OUT',
                            quantity: -itemQty,
                            reason: `Sale Completed ${sale.id}`,
                            referenceId: sale.id,
                            createdBy: userId,
                        },
                    });
                }
            }
            if (['PENDING', 'APPROVED_ORDER', 'PACKING'].includes(currentStatus) &&
                newStatus === 'VOID') {
                for (const item of sale.items) {
                    const itemQty = Number(item.quantity);
                    await tx.inventory.update({
                        where: {
                            tenantId_branchId_productId: {
                                tenantId,
                                branchId: sale.branchId,
                                productId: item.productId,
                            },
                        },
                        data: { reserved: { decrement: itemQty } },
                    });
                }
            }
            return tx.sale.update({
                where: { id },
                data: {
                    status: newStatus,
                    authorizedBy: authorizedBy || undefined,
                    authorizedAt: authorizedBy ? new Date() : undefined,
                    notes: notes || undefined,
                },
            });
        });
    }
    async findByBranch(branchId, query, tenantId) {
        const { page, limit, startDate, endDate } = query;
        const skip = (page - 1) * limit;
        const where = {
            tenantId,
            branchId,
            ...(startDate || endDate
                ? {
                    createdAt: {
                        ...(startDate ? { gte: new Date(startDate) } : {}),
                        ...(endDate ? { lte: new Date(endDate) } : {}),
                    },
                }
                : {}),
        };
        const [items, total] = await Promise.all([
            this.prisma.sale.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    items: {
                        include: {
                            product: {
                                select: { id: true, description: true },
                            },
                        },
                    },
                },
            }),
            this.prisma.sale.count({ where }),
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
    async voidSale(saleId, tenantId, userId) {
        return this.prisma.$transaction(async (tx) => {
            const sale = await tx.sale.findFirst({
                where: { id: saleId, tenantId },
                include: { items: true },
            });
            if (!sale)
                throw new common_1.NotFoundException(`Sale ${saleId} not found`);
            if (sale.status !== 'COMPLETED') {
                throw new common_1.BadRequestException(`Cannot void sale with status ${sale.status}`);
            }
            for (const item of sale.items) {
                await tx.inventory.update({
                    where: {
                        tenantId_branchId_productId: {
                            tenantId,
                            branchId: sale.branchId,
                            productId: item.productId,
                        },
                    },
                    data: {
                        quantity: { increment: Number(item.quantity) },
                    },
                });
                await tx.inventoryMovement.create({
                    data: {
                        tenantId,
                        branchId: sale.branchId,
                        productId: item.productId,
                        type: 'IN',
                        quantity: Number(item.quantity),
                        reason: `Void Sale ${saleId}`,
                        referenceId: saleId,
                        createdBy: userId,
                    },
                });
            }
            return tx.sale.update({
                where: { id: saleId },
                data: { status: 'VOID' },
                include: { items: true },
            });
        });
    }
    async refundSale(saleId, refundDto, tenantId, userId) {
        return this.prisma.$transaction(async (tx) => {
            const sale = await tx.sale.findFirst({
                where: { id: saleId, tenantId },
                include: { items: true },
            });
            if (!sale)
                throw new common_1.NotFoundException(`Sale ${saleId} not found`);
            if (sale.status === 'VOID') {
                throw new common_1.BadRequestException('Cannot refund a voided sale');
            }
            let totalRefundAmount = new client_1.Prisma.Decimal(0);
            for (const refundItem of refundDto.items) {
                const saleItem = sale.items.find((item) => item.productId === refundItem.productId);
                if (!saleItem) {
                    throw new common_1.BadRequestException(`Product ${refundItem.productId} not found in sale`);
                }
                if (Number(refundItem.quantity) > Number(saleItem.quantity)) {
                    throw new common_1.BadRequestException(`Refund quantity (${refundItem.quantity}) exceeds sold quantity (${saleItem.quantity}) for product ${refundItem.productId}`);
                }
                const itemRefundAmount = saleItem.unitPrice
                    .mul(new client_1.Prisma.Decimal(refundItem.quantity))
                    .minus(saleItem.discountAmount
                    .mul(new client_1.Prisma.Decimal(refundItem.quantity))
                    .div(new client_1.Prisma.Decimal(saleItem.quantity)));
                totalRefundAmount = totalRefundAmount.add(itemRefundAmount);
                await tx.inventory.update({
                    where: {
                        tenantId_branchId_productId: {
                            tenantId,
                            branchId: sale.branchId,
                            productId: refundItem.productId,
                        },
                    },
                    data: {
                        quantity: { increment: refundItem.quantity },
                    },
                });
                await tx.inventoryMovement.create({
                    data: {
                        tenantId,
                        branchId: sale.branchId,
                        productId: refundItem.productId,
                        type: 'IN',
                        quantity: refundItem.quantity,
                        reason: `Refund Sale ${saleId}`,
                        referenceId: saleId,
                        createdBy: userId,
                    },
                });
            }
            const newRefundAmount = sale.refundAmount.add(totalRefundAmount);
            const isFullRefund = newRefundAmount.gte(sale.total);
            return tx.sale.update({
                where: { id: saleId },
                data: {
                    status: isFullRefund ? 'REFUNDED' : sale.status,
                    refundAmount: newRefundAmount,
                },
                include: { items: true },
            });
        });
    }
    async getLastPrice(customerId, productId, tenantId) {
        const lastSale = await this.prisma.saleItem.findFirst({
            where: {
                productId,
                sale: {
                    customerId,
                    tenantId,
                    status: { in: ['COMPLETED', 'PARTIAL', 'APPROVED_ORDER'] },
                },
            },
            orderBy: {
                sale: {
                    createdAt: 'desc',
                },
            },
            select: {
                unitPrice: true,
                discountAmount: true,
                quantity: true,
                sale: {
                    select: {
                        createdAt: true,
                        orderNumber: true,
                    },
                },
                product: {
                    select: {
                        description: true,
                    },
                },
            },
        });
        if (!lastSale) {
            return {
                found: false,
                message: 'No previous sales found for this customer and product',
            };
        }
        return {
            found: true,
            unitPrice: lastSale.unitPrice,
            discountAmount: lastSale.discountAmount,
            quantity: lastSale.quantity,
            saleDate: lastSale.sale.createdAt,
            orderNumber: lastSale.sale.orderNumber,
            productDescription: lastSale.product.description,
        };
    }
    async getDashboardStats(tenantId) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        const [pendingOrders, lowStock, productsCount, customersCount, currentMonthSalesRaw, lastMonthSalesRaw, topProductsRaw, recentSales,] = await Promise.all([
            this.prisma.sale.count({
                where: {
                    tenantId,
                    status: { in: ['PENDING', 'APPROVED_ORDER', 'PACKING'] },
                },
            }),
            this.prisma.inventory.count({
                where: {
                    tenantId,
                    minStock: { gt: 0 },
                    quantity: { lte: this.prisma.inventory.fields.minStock },
                },
            }),
            this.prisma.inventory
                .groupBy({
                by: ['productId'],
                where: { tenantId, quantity: { gt: 0 } },
            })
                .then((res) => res.length),
            this.prisma.customer.count({ where: { tenantId } }),
            this.prisma.sale.aggregate({
                where: {
                    tenantId,
                    createdAt: { gte: startOfMonth },
                    status: { in: ['COMPLETED', 'PARTIAL'] },
                },
                _sum: { total: true },
            }),
            this.prisma.sale.aggregate({
                where: {
                    tenantId,
                    createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
                    status: { in: ['COMPLETED', 'PARTIAL'] },
                },
                _sum: { total: true },
            }),
            this.prisma.saleItem.groupBy({
                by: ['productId'],
                where: { sale: { tenantId, status: { in: ['COMPLETED', 'PARTIAL'] } } },
                _sum: { quantity: true },
                orderBy: { _sum: { quantity: 'desc' } },
                take: 5,
            }),
            this.prisma.sale.findMany({
                where: {
                    tenantId,
                    createdAt: { gte: new Date(now.setDate(now.getDate() - 30)) },
                    status: { in: ['COMPLETED', 'PARTIAL', 'APPROVED_ORDER'] },
                },
                select: { total: true, createdAt: true },
            }),
        ]);
        const productIds = topProductsRaw.map((p) => p.productId);
        const productDetails = await this.prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, description: true },
        });
        const topProducts = topProductsRaw.map((p) => ({
            productId: p.productId,
            name: productDetails.find((prod) => prod.id === p.productId)?.description ||
                'Unknown',
            quantity: Number(p._sum.quantity || 0),
        }));
        const currentRevenue = Number(currentMonthSalesRaw._sum.total || 0);
        const lastRevenue = Number(lastMonthSalesRaw._sum.total || 0);
        const growth = lastRevenue === 0
            ? 100
            : Math.round(((currentRevenue - lastRevenue) / lastRevenue) * 100);
        return {
            kpi: {
                totalRevenue: currentRevenue,
                revenueGrowth: growth,
                pendingOrders,
                productsInStock: productsCount,
                lowStockCount: lowStock,
                activeCustomers: customersCount,
                customersGrowth: 0,
            },
            topProducts,
            salesHistory: recentSales,
        };
    }
    async findAll(query, tenantId) {
        const { page = 1, limit = 20, status, q } = query;
        const skip = (page - 1) * limit;
        const where = {
            tenantId,
        };
        if (status) {
            const statusList = status.split(',');
            where.status = { in: statusList };
        }
        if (q) {
            where.OR = [
                { orderNumber: { contains: q, mode: 'insensitive' } },
                { quoteNumber: { contains: q, mode: 'insensitive' } },
                { customer: { name: { contains: q, mode: 'insensitive' } } },
                { customerName: { contains: q, mode: 'insensitive' } },
            ];
        }
        const [items, total] = await Promise.all([
            this.prisma.sale.findMany({
                where,
                include: {
                    customer: { select: { id: true, name: true, taxId: true } },
                    user: { select: { name: true } },
                    branch: { select: { name: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.sale.count({ where }),
        ]);
        return {
            items,
            total,
            page,
            limit,
        };
    }
    async findOne(id, tenantId) {
        const sale = await this.prisma.sale.findFirst({
            where: { id, tenantId },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        taxId: true,
                        creditLimit: true,
                        currentBalance: true,
                    },
                },
                user: { select: { name: true } },
                branch: { select: { name: true } },
                items: {
                    include: {
                        product: { select: { description: true, brand: true } },
                    },
                },
            },
        });
        if (!sale)
            throw new common_1.NotFoundException(`Sale ${id} not found`);
        return sale;
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = SalesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SalesService);
//# sourceMappingURL=sales.service.js.map