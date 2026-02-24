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
var PurchasesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchasesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let PurchasesService = PurchasesService_1 = class PurchasesService {
    prisma;
    logger = new common_1.Logger(PurchasesService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async uploadFromExcel(file, tenantId) {
        const XLSX = require('xlsx');
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);
        if (!data || data.length === 0) {
            throw new common_1.BadRequestException('Excel file is empty or invalid format');
        }
        const items = [];
        const errors = [];
        let totalFob = new client_1.Prisma.Decimal(0);
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 2;
            const sku = row['SKU'] ||
                row['sku'] ||
                row['Codigo'] ||
                row['Item'] ||
                row['Part Number'];
            const name = row['Description'] ||
                row['Descripcion'] ||
                row['Nombre'] ||
                row['Producto'];
            const qty = Number(row['Quantity'] ||
                row['quantity'] ||
                row['Cantidad'] ||
                row['Qty'] ||
                row['Unidades']);
            const price = Number(row['UnitPrice'] ||
                row['price'] ||
                row['Precio'] ||
                row['FOB'] ||
                row['Costo Unitario']);
            if (!sku && !name) {
                continue;
            }
            let product = null;
            if (!product && (name || sku)) {
                const searchTerm = name || sku;
                product = await this.prisma.product.findFirst({
                    where: {
                        description: { equals: String(searchTerm), mode: 'insensitive' },
                        tenantId,
                        deletedAt: null,
                    },
                });
            }
            if (!product && (name || sku)) {
                const searchTerm = name || sku;
                product = await this.prisma.product.findFirst({
                    where: {
                        description: { contains: String(searchTerm), mode: 'insensitive' },
                        tenantId,
                        deletedAt: null,
                    },
                });
            }
            if (!product) {
                errors.push(`Row ${rowNum}: Product '${sku || name}' not found in catalog.`);
                continue;
            }
            if (isNaN(qty) || qty <= 0) {
                errors.push(`Row ${rowNum}: Invalid Quantity for '${sku || name}'.`);
                continue;
            }
            const validPrice = isNaN(price) ? 0 : price;
            items.push({
                productId: product.id,
                description: product.description,
                quantity: qty,
                unitFobValue: validPrice,
            });
            totalFob = totalFob.add(new client_1.Prisma.Decimal(qty).mul(new client_1.Prisma.Decimal(validPrice)));
        }
        if (errors.length > 0) {
            return {
                status: 'partial_error',
                message: 'Some rows have errors',
                errors,
                validItems: items,
                totalFob: totalFob.toNumber(),
            };
        }
        return {
            status: 'success',
            items,
            totalFob: totalFob.toNumber(),
        };
    }
    async create(createDto, tenantId, userId) {
        const { branchId, supplierName, invoiceNumber, items, ...orderData } = createDto;
        return this.prisma.$transaction(async (tx) => {
            const branch = await tx.branch.findFirst({
                where: { id: branchId, tenantId },
            });
            if (!branch)
                throw new common_1.NotFoundException(`Branch ${branchId} not found`);
            if (invoiceNumber) {
                const existing = await tx.purchaseOrder.findFirst({
                    where: { tenantId, supplierName, invoiceNumber },
                });
                if (existing) {
                    throw new common_1.BadRequestException(`Invoice ${invoiceNumber} from ${supplierName} already exists`);
                }
            }
            const fobValue = new client_1.Prisma.Decimal(orderData.fobValue);
            const freightCost = new client_1.Prisma.Decimal(orderData.freightCost || 0);
            const insuranceCost = new client_1.Prisma.Decimal(orderData.insuranceCost || 0);
            const dutiesCost = new client_1.Prisma.Decimal(orderData.dutiesCost || 0);
            const otherCosts = new client_1.Prisma.Decimal(orderData.otherCosts || 0);
            const totalExpenses = freightCost
                .add(insuranceCost)
                .add(dutiesCost)
                .add(otherCosts);
            const totalCifValue = fobValue.add(totalExpenses);
            let calculatedFobTotal = new client_1.Prisma.Decimal(0);
            const itemsData = [];
            for (const item of items) {
                const product = await tx.product.findFirst({
                    where: { id: item.productId, tenantId, deletedAt: null },
                });
                if (!product) {
                    throw new common_1.BadRequestException(`Product ${item.productId} not found`);
                }
                const quantity = new client_1.Prisma.Decimal(item.quantity);
                const unitFobValue = new client_1.Prisma.Decimal(item.unitFobValue);
                const subtotalFob = quantity.mul(unitFobValue);
                calculatedFobTotal = calculatedFobTotal.add(subtotalFob);
                itemsData.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitFobValue,
                    subtotalFob,
                });
            }
            if (!calculatedFobTotal.equals(fobValue)) {
                this.logger.warn(`FOB mismatch: provided ${fobValue}, calculated ${calculatedFobTotal}. Using calculated value.`);
            }
            const finalItemsData = itemsData.map((item) => {
                const proportion = item.subtotalFob.div(calculatedFobTotal);
                const itemExpenses = totalExpenses.mul(proportion);
                const subtotalCif = item.subtotalFob.add(itemExpenses);
                const unitCifValue = subtotalCif.div(new client_1.Prisma.Decimal(item.quantity));
                return {
                    tenantId,
                    productId: item.productId,
                    quantity: item.quantity,
                    receivedQuantity: 0,
                    unitFobValue: item.unitFobValue,
                    unitCifValue,
                    subtotalFob: item.subtotalFob,
                    subtotalCif,
                };
            });
            const purchaseOrder = await tx.purchaseOrder.create({
                data: {
                    tenantId,
                    branchId,
                    supplierName,
                    invoiceNumber,
                    proformaNumber: orderData.proformaNumber,
                    fobValue: calculatedFobTotal,
                    freightCost,
                    insuranceCost,
                    dutiesCost,
                    otherCosts,
                    totalCifValue,
                    orderDate: orderData.orderDate
                        ? new Date(orderData.orderDate)
                        : new Date(),
                    expectedDate: orderData.expectedDate
                        ? new Date(orderData.expectedDate)
                        : null,
                    notes: orderData.notes,
                    createdBy: userId,
                    items: {
                        create: finalItemsData,
                    },
                },
                include: {
                    items: {
                        include: {
                            product: {
                                select: { id: true, description: true },
                            },
                        },
                    },
                },
            });
            await tx.purchaseAuditLog.create({
                data: {
                    tenantId,
                    purchaseOrderId: purchaseOrder.id,
                    action: 'CREATED',
                    details: JSON.stringify({ itemCount: items.length }),
                    createdBy: userId,
                },
            });
            return purchaseOrder;
        });
    }
    async receive(purchaseOrderId, receiveDto, tenantId, userId) {
        return this.prisma.$transaction(async (tx) => {
            const purchaseOrder = await tx.purchaseOrder.findFirst({
                where: { id: purchaseOrderId, tenantId },
                include: { items: true },
            });
            if (!purchaseOrder) {
                throw new common_1.NotFoundException(`Purchase Order ${purchaseOrderId} not found`);
            }
            if (purchaseOrder.status === 'RECEIVED') {
                throw new common_1.BadRequestException('Purchase Order already fully received');
            }
            const allItemsFullyReceived = true;
            for (const receivedItem of receiveDto.items) {
                const orderItem = purchaseOrder.items.find((item) => item.productId === receivedItem.productId);
                if (!orderItem) {
                    throw new common_1.BadRequestException(`Product ${receivedItem.productId} not found in purchase order`);
                }
                const remainingQty = new client_1.Prisma.Decimal(orderItem.quantity).minus(new client_1.Prisma.Decimal(orderItem.receivedQuantity));
                const receivedQtyDecimal = new client_1.Prisma.Decimal(receivedItem.quantity);
                if (receivedQtyDecimal.gt(remainingQty)) {
                    throw new common_1.BadRequestException(`Cannot receive ${receivedItem.quantity} units. Only ${remainingQty} remaining for product ${receivedItem.productId}`);
                }
                await tx.purchaseOrderItem.update({
                    where: { id: orderItem.id },
                    data: {
                        receivedQuantity: { increment: receivedQtyDecimal.toNumber() },
                    },
                });
                const product = await tx.product.findUnique({
                    where: { id: receivedItem.productId },
                });
                if (!product)
                    throw new common_1.NotFoundException(`Product ${receivedItem.productId} not found`);
                const inventoryAgg = await tx.inventory.aggregate({
                    where: { tenantId, productId: receivedItem.productId },
                    _sum: { quantity: true },
                });
                const currentTotalQty = inventoryAgg._sum.quantity ?? new client_1.Prisma.Decimal(0);
                const oldTotalValue = new client_1.Prisma.Decimal(currentTotalQty).mul(product.weightedAvgCost || 0);
                const newReceivedValue = receivedQtyDecimal.mul(orderItem.unitCifValue);
                const newTotalQty = new client_1.Prisma.Decimal(currentTotalQty).add(receivedQtyDecimal);
                const newWeightedAvgCost = oldTotalValue
                    .add(newReceivedValue)
                    .div(newTotalQty);
                await tx.product.update({
                    where: { id: receivedItem.productId },
                    data: {
                        weightedAvgCost: newWeightedAvgCost,
                        lastFobCost: orderItem.unitFobValue,
                        lastCifCost: orderItem.unitCifValue,
                    },
                });
                const existingInventory = await tx.inventory.findUnique({
                    where: {
                        tenantId_branchId_productId: {
                            tenantId,
                            branchId: purchaseOrder.branchId,
                            productId: receivedItem.productId,
                        },
                    },
                });
                if (existingInventory) {
                    await tx.inventory.update({
                        where: {
                            tenantId_branchId_productId: {
                                tenantId,
                                branchId: purchaseOrder.branchId,
                                productId: receivedItem.productId,
                            },
                        },
                        data: {
                            quantity: { increment: receivedQtyDecimal.toNumber() },
                        },
                    });
                }
                else {
                    await tx.inventory.create({
                        data: {
                            tenantId,
                            branchId: purchaseOrder.branchId,
                            productId: receivedItem.productId,
                            quantity: receivedItem.quantity,
                            minStock: 0,
                            maxStock: 0,
                            reorderPoint: 0,
                        },
                    });
                }
                await tx.inventoryMovement.create({
                    data: {
                        tenantId,
                        branchId: purchaseOrder.branchId,
                        productId: receivedItem.productId,
                        type: 'IN',
                        quantity: receivedItem.quantity,
                        reason: `Purchase Order ${purchaseOrder.invoiceNumber || purchaseOrder.id}`,
                        referenceId: purchaseOrderId,
                        createdBy: userId,
                    },
                });
            }
            const updatedItems = await tx.purchaseOrderItem.findMany({
                where: { purchaseOrderId },
            });
            const allReceived = updatedItems.every((item) => new client_1.Prisma.Decimal(item.receivedQuantity).greaterThanOrEqualTo(new client_1.Prisma.Decimal(item.quantity)));
            const newStatus = allReceived ? 'RECEIVED' : 'PARTIAL';
            const updated = await tx.purchaseOrder.update({
                where: { id: purchaseOrderId },
                data: {
                    status: newStatus,
                    receivedDate: allReceived
                        ? receiveDto.receivedDate
                            ? new Date(receiveDto.receivedDate)
                            : new Date()
                        : undefined,
                },
                include: {
                    items: true,
                },
            });
            await tx.purchaseAuditLog.create({
                data: {
                    tenantId,
                    purchaseOrderId,
                    action: allReceived ? 'RECEIVED_FULL' : 'RECEIVED_PARTIAL',
                    details: JSON.stringify({
                        receivedItems: receiveDto.items.map((i) => ({
                            productId: i.productId,
                            quantity: i.quantity,
                        })),
                    }),
                    createdBy: userId,
                },
            });
            return updated;
        });
    }
    async findAll(query, tenantId) {
        const { page, limit, supplierName, status, startDate, endDate } = query;
        const skip = (page - 1) * limit;
        const where = {
            tenantId,
            ...(supplierName
                ? { supplierName: { contains: supplierName, mode: 'insensitive' } }
                : {}),
            ...(status ? { status: status } : {}),
            ...(startDate || endDate
                ? {
                    orderDate: {
                        ...(startDate ? { gte: new Date(startDate) } : {}),
                        ...(endDate ? { lte: new Date(endDate) } : {}),
                    },
                }
                : {}),
        };
        const [items, total] = await Promise.all([
            this.prisma.purchaseOrder.findMany({
                where,
                skip,
                take: limit,
                orderBy: { orderDate: 'desc' },
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
            this.prisma.purchaseOrder.count({ where }),
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
        const purchaseOrder = await this.prisma.purchaseOrder.findFirst({
            where: { id, tenantId },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                description: true,
                                lastFobCost: true,
                                weightedAvgCost: true,
                            },
                        },
                    },
                },
                auditLogs: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!purchaseOrder) {
            throw new common_1.NotFoundException(`Purchase Order ${id} not found`);
        }
        return purchaseOrder;
    }
    async getPurchaseHistory(productId, tenantId) {
        const history = await this.prisma.purchaseOrderItem.findMany({
            where: {
                productId,
                tenantId,
            },
            include: {
                purchaseOrder: {
                    select: {
                        id: true,
                        supplierName: true,
                        invoiceNumber: true,
                        orderDate: true,
                        receivedDate: true,
                        status: true,
                    },
                },
            },
            orderBy: {
                purchaseOrder: {
                    orderDate: 'desc',
                },
            },
        });
        return history;
    }
};
exports.PurchasesService = PurchasesService;
exports.PurchasesService = PurchasesService = PurchasesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PurchasesService);
//# sourceMappingURL=purchases.service.js.map