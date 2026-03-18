import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../services/shared/prisma.service';
import { StockService } from '../stock/stock.service';
import { SettingsService } from '../settings/settings.service';
import { ProductsService } from '../products/products.service';
import { AccountingService } from '../accounting/accounting.service';
import { WarehousesService } from '../warehouses/warehouses.service';
import { ClientsService } from '../clients/clients.service';
import { AccountsReceivableService } from '../services/accounts-receivable/accounts-receivable.service';
import { TrafficService } from '../traffic/traffic.service';
import { AccountsReceivableEntryType } from '@prisma/client';

@Injectable()
export class SalesService {
    constructor(
        private prisma: PrismaService,
        private stockService: StockService,
        private productsService: ProductsService,
        private warehousesService: WarehousesService,
        private accountingService: AccountingService,
        private settingsService: SettingsService,
        private clientsService: ClientsService,
        private arService: AccountsReceivableService,
        private trafficService: TrafficService,
    ) { }

    async getActiveRegister(userId: string): Promise<any | null> {
        return this.prisma.cashRegister.findFirst({
            where: { userId, status: 'abierta' }
        });
    }

    async openCashRegister(userId: string, userName: string, openingAmount: number): Promise<any> {
        const active = await this.getActiveRegister(userId);
        if (active) throw new BadRequestException('El usuario ya tiene una caja abierta');

        return this.prisma.cashRegister.create({
            data: {
                userId,
                userName,
                status: 'abierta',
                openingAmount,
                totalSales: 0,
                cashSales: 0,
                cardSales: 0,
                transferSales: 0,
            }
        });
    }

    async closeCashRegister(id: string, closingAmount: number, notes?: string): Promise<any> {
        const register = await this.prisma.cashRegister.findUnique({ where: { id } });
        if (!register) throw new NotFoundException('Caja no encontrada');
        if (register.status === 'cerrada') throw new BadRequestException('La caja ya está cerrada');

        const expectedAmount = Number(register.openingAmount) + Number(register.cashSales);
        
        return this.prisma.cashRegister.update({
            where: { id },
            data: {
                status: 'cerrada',
                closingAmount,
                closedAt: new Date(),
                expectedAmount,
                difference: closingAmount - expectedAmount,
                notes
            }
        });
    }

    async createPOSSale(createSaleDto: any): Promise<any> {
        const userId = createSaleDto.createdBy;
        const activeRegister = await this.prisma.cashRegister.findFirst({
            where: { userId, status: 'abierta' }
        });
        if (!activeRegister) throw new BadRequestException('Debes abrir la caja para realizar ventas POS');

        const warehouseId = createSaleDto.bodegaId || createSaleDto.warehouseId;
        
        return this.prisma.$transaction(async (tx) => {
            // Create Sales Order
            const sale = await tx.salesOrder.create({
                data: {
                    number: createSaleDto.orderNumber || `POS-${Date.now()}`,
                    customerId: createSaleDto.clientId,
                    orderDate: new Date(),
                    status: 'INVOICED',
                    subtotal: createSaleDto.subtotal || createSaleDto.total,
                    total: createSaleDto.total,
                    warehouseId: warehouseId,
                    createdByUserId: userId,
                    lines: {
                        create: createSaleDto.lines.map((l: any) => ({
                            productId: l.productId,
                            quantityOrdered: l.quantity,
                            unitPrice: l.price,
                            lineTotal: l.total
                        }))
                    }
                }
            });

            // Update Register
            const paymentMethod = createSaleDto.paymentMethod || 'efectivo';
            const total = Number(createSaleDto.total);
            
            await tx.cashRegister.update({
                where: { id: activeRegister.id },
                data: {
                    totalSales: { increment: total },
                    ...(paymentMethod === 'efectivo' ? { cashSales: { increment: total } } : {}),
                    ...(paymentMethod.includes('tarjeta') ? { cardSales: { increment: total } } : {}),
                    ...(paymentMethod === 'transferencia' ? { transferSales: { increment: total } } : {}),
                }
            });

            return sale;
        });
    }

    async findAll(filters: any = {}, userRoles: string[] = []): Promise<any[]> {
        const orderStatus = filters.status ? filters.status.toUpperCase() : null;
        
        const orders = await this.prisma.salesOrder.findMany({
            where: {
                ...(orderStatus ? { status: orderStatus as any } : {}),
                ...(filters.clientId ? { customerId: filters.clientId } : {}),
            },
            orderBy: { createdAt: 'desc' },
            include: { customer: true }
        });

        const quotes = await this.prisma.quotation.findMany({
            where: {
                ...(orderStatus ? { status: orderStatus as any } : {}),
                ...(filters.clientId ? { customerId: filters.clientId } : {}),
            },
            orderBy: { createdAt: 'desc' },
            include: { customer: true }
        });

        const invoices = await this.prisma.invoice.findMany({
            where: {
                ...(orderStatus ? { status: orderStatus as any } : {}),
                ...(filters.clientId ? { customerId: filters.clientId } : {}),
            },
            orderBy: { createdAt: 'desc' },
            include: { customer: true }
        });

        const normalizedOrders = orders.map(o => this._maskPriceData({
            ...o,
            documentType: 'pedido',
            orderNumber: o.number,
            clientName: o.customer.legalName,
            clientId: o.customerId,
            total: Number(o.total),
            status: this._mapStatus(o.status, 'order')
        }, userRoles));

        const normalizedQuotes = quotes.map(q => this._maskPriceData({
            ...q,
            documentType: 'cotizacion',
            orderNumber: q.number,
            clientName: q.customer.legalName,
            clientId: q.customerId,
            total: Number(q.total),
            status: this._mapStatus(q.status, 'quote')
        }, userRoles));

        const normalizedInvoices = invoices.map(i => this._maskPriceData({
            ...i,
            documentType: 'factura',
            orderNumber: i.number,
            clientName: i.customer.legalName,
            clientId: i.customerId,
            total: Number(i.total),
            status: this._mapStatus(i.status, 'invoice')
        }, userRoles));

        return [...normalizedOrders, ...normalizedQuotes, ...normalizedInvoices].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    async findOne(id: string, userRoles: string[] = []): Promise<any> {
        let sale = await this.prisma.salesOrder.findUnique({
            where: { id },
            include: { 
                lines: { 
                    include: { 
                        product: { 
                            include: { 
                                brand: true,
                                group: true
                            } 
                        } 
                    } 
                }, 
                customer: { include: { creditProfile: true } },
                packingLists: true,
                expenses: true
            }
        });

        if (sale) {
            // Sort lines by group name and then product name
            const sortedLines = sale.lines.sort((a, b) => {
                const groupA = a.product.group.name.toLowerCase();
                const groupB = b.product.group.name.toLowerCase();
                if (groupA < groupB) return -1;
                if (groupA > groupB) return 1;
                return a.product.name.localeCompare(b.product.name);
            });

            return this._maskPriceData({
                ...sale,
                _id: sale.id,
                documentType: 'pedido',
                orderNumber: sale.number,
                status: this._mapStatus(sale.status, 'order'),
                packingListId: sale.packingLists?.[0]?.id,
                packingListStatus: sale.packingLists?.[0]?.status,
                clientName: sale.customer.legalName,
                clientTaxId: sale.customer.taxId,
                clientCountry: sale.customer.country,
                priceLevel: sale.customer.creditProfile?.priceLevel,
                paymentTerms: sale.customer.creditProfile?.creditDays ? `credito_${sale.customer.creditProfile.creditDays}` : 'contado',
                lines: sortedLines.map(l => ({
                    ...l,
                    productDescription: l.product.name,
                    productReference: l.product.sku,
                    productBrand: l.product.brand?.name,
                    productCategory: l.product.group.name,
                    quantity: Number(l.quantityOrdered),
                    unitPrice: Number(l.unitPrice),
                    unitCost: Number(l.unitCost || 0),
                    subtotal: Number(l.lineTotal),
                    requiresApproval: l.requiresApproval,
                    approvalReason: l.approvalReason
                })),
                expenses: sale.expenses.map(e => ({ ...e, amount: Number(e.amount) }))
            }, userRoles);
        }

        const quotation = await this.prisma.quotation.findUnique({
            where: { id },
            include: { 
                lines: { 
                    include: { 
                        product: { 
                            include: { 
                                brand: true,
                                group: true
                            } 
                        } 
                    } 
                }, 
                customer: { include: { creditProfile: true } },
                expenses: true
            }
        });

        if (quotation) {
            const sortedLines = quotation.lines.sort((a, b) => {
                const groupA = a.product.group.name.toLowerCase();
                const groupB = b.product.group.name.toLowerCase();
                if (groupA < groupB) return -1;
                if (groupA > groupB) return 1;
                return a.product.name.localeCompare(b.product.name);
            });

            return this._maskPriceData({
                ...quotation,
                _id: quotation.id,
                documentType: 'cotizacion',
                orderNumber: quotation.number,
                clientName: quotation.customer.legalName,
                clientTaxId: quotation.customer.taxId,
                clientCountry: quotation.customer.country,
                priceLevel: quotation.customer.creditProfile?.priceLevel,
                paymentTerms: quotation.customer.creditProfile?.creditDays ? `credito_${quotation.customer.creditProfile.creditDays}` : 'contado',
                lines: sortedLines.map(l => ({
                    ...l,
                    productDescription: l.product.name,
                    productReference: l.product.sku,
                    productBrand: l.product.brand?.name,
                    productCategory: l.product.group.name,
                    quantity: Number(l.quantity),
                    unitPrice: Number(l.unitPrice),
                    unitCost: Number(l.unitCost || 0),
                    subtotal: Number(l.lineTotal),
                    requiresApproval: l.requiresApproval,
                    approvalReason: l.approvalReason
                })),
                expenses: quotation.expenses.map(e => ({ ...e, amount: Number(e.amount) }))
            }, userRoles);
        }

        const invoice = await this.prisma.invoice.findUnique({
            where: { id },
            include: { 
                lines: { 
                    include: { 
                        product: { 
                            include: { 
                                brand: true,
                                group: true
                            } 
                        } 
                    } 
                }, 
                customer: { include: { creditProfile: true } },
                expenses: true
            }
        });

        if (invoice) {
            const sortedLines = invoice.lines.sort((a, b) => {
                const groupA = a.product.group.name.toLowerCase();
                const groupB = b.product.group.name.toLowerCase();
                if (groupA < groupB) return -1;
                if (groupA > groupB) return 1;
                return a.product.name.localeCompare(b.product.name);
            });

            return this._maskPriceData({
                ...invoice,
                _id: invoice.id,
                documentType: 'factura',
                orderNumber: invoice.number,
                clientName: invoice.customer.legalName,
                clientTaxId: invoice.customer.taxId,
                clientCountry: invoice.customer.country,
                priceLevel: invoice.customer.creditProfile?.priceLevel,
                paymentTerms: invoice.customer.creditProfile?.creditDays ? `credito_${invoice.customer.creditProfile.creditDays}` : 'contado',
                lines: sortedLines.map(l => ({
                    ...l,
                    productDescription: l.product.name,
                    productReference: l.product.sku,
                    productBrand: l.product.brand?.name,
                    productCategory: l.product.group.name,
                    quantity: Number(l.quantity),
                    unitPrice: Number(l.unitPrice),
                    subtotal: Number(l.lineTotal)
                })),
                expenses: invoice.expenses.map(e => ({ ...e, amount: Number(e.amount) }))
            }, userRoles);
        }

        throw new NotFoundException(`Documento ${id} no encontrado`);
    }

    async create(dto: any): Promise<any> {
        const lines = await Promise.all(dto.lines.map(async (l: any) => {
            const product = await this.prisma.product.findUnique({ where: { id: l.productId } });
            const cost = Number(product?.standardCost || 0);
            const margin = (l.price - cost) / l.price;
            const requiresApproval = margin < 0.10; // Threshold 10%
            return {
                productId: l.productId,
                quantityOrdered: l.quantity,
                unitPrice: l.price,
                lineTotal: l.total,
                unitCost: cost,
                requiresApproval,
                approvalReason: requiresApproval ? 'Margen por debajo del 10%' : null
            };
        }));

        return this.prisma.salesOrder.create({
            data: {
                number: dto.orderNumber || `SAL-${Date.now()}`,
                customerId: dto.clientId,
                orderDate: new Date(),
                status: 'DRAFT',
                subtotal: dto.subtotal,
                expensesTotal: dto.expensesTotal || 0,
                total: dto.total,
                warehouseId: dto.bodegaId || dto.warehouseId,
                createdByUserId: dto.createdBy,
                lines: { create: lines },
                expenses: {
                    create: (dto.expenses || []).map((e: any) => ({
                        description: e.description,
                        amount: e.amount
                    }))
                }
            }
        });
    }

    async updateStatus(id: string, status: string): Promise<any> {
        return this.prisma.salesOrder.update({
            where: { id },
            data: { status: status.toUpperCase() as any }
        });
    }

    // Quotations
    async createQuotation(dto: any): Promise<any> {
        const number = await this.settingsService.getNextNumber('quote');
        const lines = await Promise.all(dto.lines.map(async (l: any) => {
            const product = await this.prisma.product.findUnique({ where: { id: l.productId } });
            const cost = Number(product?.standardCost || 0);
            const margin = (l.price - cost) / (l.price || 1);
            const requiresApproval = margin < 0.10;
            return {
                productId: l.productId,
                quantity: l.quantity,
                unitPrice: l.price,
                lineTotal: l.total,
                unitCost: cost,
                requiresApproval,
                approvalReason: requiresApproval ? 'Margen por debajo del 10%' : null
            };
        }));

        return this.prisma.quotation.create({
            data: {
                number: dto.number || number,
                customerId: dto.clientId,
                quotationDate: new Date(),
                status: 'DRAFT',
                warehouseId: dto.warehouseId,
                subtotal: dto.subtotal,
                expensesTotal: dto.expensesTotal || 0,
                total: dto.total,
                createdByUserId: dto.createdBy,
                lines: { create: lines },
                expenses: {
                    create: (dto.expenses || []).map((e: any) => ({
                        description: e.description,
                        amount: e.amount
                    }))
                }
            }
        });
    }

    async approveQuotation(id: string): Promise<any> {
        return this.prisma.quotation.update({
            where: { id },
            data: { status: 'APPROVED' }
        });
    }

    async convertQuotationToOrder(quotationId: string): Promise<any> {
        const quotation = await this.prisma.quotation.findUnique({
            where: { id: quotationId },
            include: { 
                lines: true,
                expenses: true
            }
        });
        if (!quotation) throw new NotFoundException('Quotation not found');
        if (quotation.status !== 'APPROVED') throw new BadRequestException('Solo se pueden convertir cotizaciones aprobadas (enviadas)');

        const orderNumber = await this.settingsService.getNextNumber('sale');
        return this.prisma.$transaction(async (tx) => {
            const order = await tx.salesOrder.create({
                data: {
                    number: orderNumber,
                    customerId: quotation.customerId,
                    warehouseId: quotation.warehouseId,
                    quotationId: quotation.id,
                    orderDate: new Date(),
                    status: 'DRAFT',
                    subtotal: quotation.subtotal,
                    expensesTotal: quotation.expensesTotal || 0,
                    total: quotation.total,
                    createdByUserId: quotation.createdByUserId,
                    lines: {
                        create: quotation.lines.map(l => ({
                            productId: l.productId,
                            quotationLineId: l.id,
                            quantityOrdered: l.quantity,
                            unitPrice: l.unitPrice,
                            unitCost: l.unitCost,
                            lineTotal: l.lineTotal,
                            requiresApproval: l.requiresApproval,
                            approvalReason: l.approvalReason
                        }))
                    },
                    expenses: {
                        create: quotation.expenses.map(e => ({
                            description: e.description,
                            amount: e.amount
                        }))
                    }
                }
            });

            await tx.quotation.update({
                where: { id: quotationId },
                data: { status: 'CONVERTED' }
            });

            return order;
        });
    }

    async approveSalesOrder(id: string): Promise<any> {
        const order = await this.prisma.salesOrder.findUnique({
            where: { id },
            include: { lines: true }
        });
        if (!order) throw new NotFoundException('Order not found');

        return this.prisma.$transaction(async (tx) => {
            if (!order.warehouseId) throw new BadRequestException('Bodega no especificada en el pedido');
            // Reserve stock for each line
            for (const line of order.lines) {
                await this.stockService.reserveStock(line.productId, order.warehouseId, Number(line.quantityOrdered));
            }

            return tx.salesOrder.update({
                where: { id },
                data: { status: 'RESERVED' }
            });
        });
    }

    async packSalesOrder(id: string): Promise<any> {
        return this.createPackingList(id);
    }

    async createPackingList(orderId: string): Promise<any> {
        const order = await this.prisma.salesOrder.findUnique({
            where: { id: orderId },
            include: { lines: true }
        });
        if (!order) throw new NotFoundException('Order not found');
        if (order.status !== 'RESERVED' && order.status !== 'APPROVED') {
            throw new BadRequestException('El pedido debe estar APROBADO o RESERVADO para crear lista de empaque');
        }

        const number = await this.settingsService.getNextNumber('packing');

        return this.prisma.packingList.create({
            data: {
                number,
                salesOrderId: orderId,
                status: 'DRAFT',
                packingDate: new Date(),
                lines: {
                    create: order.lines.map(l => ({
                        salesOrderLineId: l.id,
                        productId: l.productId,
                        quantityOrdered: l.quantityOrdered,
                        quantityPacked: l.quantityOrdered, // Por defecto empacamos todo
                    }))
                }
            },
            include: { lines: true }
        });
    }

    async confirmPackingList(id: string): Promise<any> {
        const packing = await this.prisma.packingList.findUnique({
            where: { id },
            include: { 
                lines: true,
                salesOrder: { include: { lines: true } }
            }
        });
        if (!packing) throw new NotFoundException('Packing List not found');
        if (packing.status === 'CONFIRMED') throw new BadRequestException('La lista de empaque ya está confirmada');

        return this.prisma.$transaction(async (tx) => {
            for (const line of packing.lines) {
                // 1. Actualizar cantidades en Pedido
                await tx.salesOrderLine.update({
                    where: { id: line.salesOrderLineId },
                    data: { quantityDispatched: { increment: line.quantityPacked } }
                });

                // 2. Registrar movimiento en Kardex
                await tx.inventoryMovement.create({
                    data: {
                        productId: line.productId,
                        warehouseId: packing.salesOrder.warehouseId!,
                        productLotId: line.productLotId,
                        movementType: 'SALE',
                        quantity: Number(line.quantityPacked) * -1,
                        referenceType: 'packing_list',
                        referenceId: packing.id,
                        occurredAt: new Date()
                    }
                });

                const stock = await tx.inventoryExistence.findUnique({
                    where: { 
                        productId_warehouseId: { 
                            productId: line.productId, 
                            warehouseId: packing.salesOrder.warehouseId! 
                        } 
                    }
                });

                if (!stock || Number(stock.existence) < Number(line.quantityPacked)) {
                    throw new BadRequestException(`Stock físico insuficiente para producto ${line.productId}. Disponible: ${stock?.existence || 0}`);
                }

                if (stock) {
                    await tx.inventoryExistence.update({
                        where: { id: stock.id },
                        data: {
                            existence: { decrement: line.quantityPacked },
                            reserved: { decrement: line.quantityPacked },
                            // available no cambia porque bajaron existence y reserved el mismo monto
                        }
                    });
                }
            }

            await tx.packingList.update({
                where: { id },
                data: { status: 'CONFIRMED' }
            });

            await tx.salesOrder.update({
                where: { id: packing.salesOrderId },
                data: { status: 'DISPATCHED' }
            });

            return packing;
        });
    }

    async invoiceSalesOrder(id: string): Promise<any> {
        const order = await this.prisma.salesOrder.findUnique({
            where: { id },
            include: { lines: { include: { product: true } } }
        });
        if (!order) throw new NotFoundException('Order not found');
        if (order.status !== 'DISPATCHED') {
            throw new BadRequestException('El pedido debe estar EMPACADO (CONFIRMADO) para poder facturar');
        }

        const invoiceNumber = await this.settingsService.getNextNumber('sale'); // Or 'invoice' if you have a separate code
        try {
            const invoice = await this.prisma.$transaction(async (tx) => {
            if (!order.warehouseId) throw new BadRequestException('Bodega no especificada en el pedido');
            const invoice = await tx.invoice.create({
                data: {
                    number: invoiceNumber,
                    customerId: order.customerId,
                    salesOrderId: order.id,
                    invoiceDate: new Date(),
                    status: 'ISSUED',
                    subtotal: order.subtotal,
                    total: order.total,
                    createdByUserId: order.createdByUserId,
                    lines: {
                        create: order.lines.map(l => ({
                            productId: l.productId,
                            salesOrderLineId: l.id,
                            quantity: l.quantityOrdered,
                            unitPrice: l.unitPrice,
                            lineTotal: l.lineTotal
                        }))
                    }
                }
            });

            // AR entry naturally handles customer balance updates through the AccountsReceivableService
            
            // 3. Create AR entry inline to share the SAME transaction (tx) and see the uncommitted 'invoice.id'
            const lastEntry = await tx.accountsReceivableEntry.findFirst({
                where: { customerId: order.customerId },
                orderBy: { occurredAt: 'desc' },
            });
            const currentBalance = lastEntry?.balanceAfter || 0;
            const balanceAfter = Number(currentBalance) + Number(order.total);

            await tx.accountsReceivableEntry.create({
                data: {
                    customerId: order.customerId,
                    invoiceId: invoice.id,
                    entryType: AccountsReceivableEntryType.INVOICE_CHARGE,
                    amount: Number(order.total),
                    balanceAfter,
                    notes: `Factura ${invoice.number} por pedido ${order.number}`,
                    createdByUserId: order.createdByUserId ?? undefined,
                    occurredAt: new Date(),
                }
            });

            // Safely update or initialize the Credit Profile balance within the same transaction
            await tx.customerCreditProfile.upsert({
                where: { customerId: order.customerId },
                update: { currentBalance: balanceAfter },
                create: {
                    customerId: order.customerId,
                    currentBalance: balanceAfter,
                    creditLimit: 0,
                    creditDays: 30,
                    priceLevel: 'A'
                }
            });

            // 4. Update order status
            await tx.salesOrder.update({
                where: { id: order.id },
                data: { status: 'INVOICED' }
            });

            return invoice;
        });

            // Automatic Traffic Expedient (Async - executed AFTER transaction commits)
            this.trafficService.createFromInvoice(invoice.id, order.createdByUserId || undefined).catch(err => {
                console.error('Error creating automatic traffic expedient:', err);
            });

            // Automatic Accounting Entry (Async)
            this.createAccountingEntryForInvoice(invoice, order).catch(err => {
                console.error('Error creating accounting entry for invoice:', err);
            });

            return invoice;
        } catch (error: any) {
            console.error('INVOICE ERROR:', error);
            throw new BadRequestException(error.message || 'Error occurred while creating the invoice');
        }
    }
        async getProductSaleHistory(productId: string, customerId: string): Promise<any> {
        const lastLine = await this.prisma.salesOrderLine.findFirst({
            where: {
                productId,
                salesOrder: { customerId, status: { in: ['INVOICED', 'DISPATCHED'] } }
            },
            orderBy: { createdAt: 'desc' },
            include: { salesOrder: { include: { createdByUser: true } } }
        });

        if (!lastLine) return null;

        return {
            price: Number(lastLine.unitPrice),
            quantity: Number(lastLine.quantityOrdered),
            date: lastLine.createdAt,
            orderNumber: lastLine.salesOrder.number,
            vendor: lastLine.salesOrder.createdByUser?.name || 'Desconocido'
        };
    }

    private _maskPriceData(data: any, roles: string[]): any {
        const isVendedor = roles.includes('Vendedor');
        const isBodega = roles.includes('Bodega');
        const isAdmin = roles.includes('Admin') || roles.length === 0;

        if (isAdmin) return data;

        const masked = { ...data };

        if (isBodega) {
            delete masked.subtotal;
            delete masked.total;
            delete masked.expensesTotal;
            if (masked.lines) {
                masked.lines = masked.lines.map((l: any) => {
                    const { unitPrice, lineTotal, unitCost, ...rest } = l;
                    return rest;
                });
            }
        } else if (isVendedor) {
            if (masked.lines) {
                masked.lines = masked.lines.map((l: any) => {
                    const { unitCost, ...rest } = l;
                    return rest;
                });
            }
        }

        return masked;
    }

    private _mapStatus(status: string, type: 'order' | 'quote' | 'invoice'): string {
        const s = status.toUpperCase();
        if (type === 'quote') {
            if (s === 'DRAFT') return 'borrador';
            if (s === 'APPROVED') return 'cotizacion_aprobada';
            if (s === 'CONVERTED') return 'convertida_a_pedido';
        } else if (type === 'order') {
            if (s === 'DRAFT' || s === 'PENDING_APPROVAL') return 'pedido';
            if (s === 'APPROVED' || s === 'RESERVED') return 'pedido_aprobado';
            if (s === 'DISPATCHED') return 'empacado';
            if (s === 'INVOICED') return 'facturado';
        } else if (type === 'invoice') {
            if (s === 'ISSUED') return 'factura_emitida';
            if (s === 'PAID') return 'pagado';
        }
        return s.toLowerCase();
    }

    private async createAccountingEntryForInvoice(invoice: any, order: any) {
        try {
            const accounts = await this.accountingService.findAllAccounts();
            const cxc = accounts.find(a => a.code === '1020.01');
            const ventas = accounts.find(a => a.code === '4010.01');
            const inventario = accounts.find(a => a.code === '1030.01');
            const costoVentas = accounts.find(a => a.code === '5010.01');

            if (!cxc || !ventas || !inventario || !costoVentas) {
                console.warn('Accounting accounts not found for invoice entry');
                return;
            }

            const totalAmount = Number(invoice.total);
            let totalCost = 0;

            for (const line of order.lines) {
                const cost = Number(line.product.costAvgWeighted || line.product.costCIF || 0);
                totalCost += cost * Number(line.quantityOrdered);
            }

            const lines = [
                // 1. Sale record (Revenue & Receivables)
                {
                    accountId: cxc.id,
                    debit: totalAmount,
                    credit: 0,
                    memo: `Factura ${invoice.number} - ${invoice.customer?.legalName || 'Cliente'}`
                },
                {
                    accountId: ventas.id,
                    debit: 0,
                    credit: totalAmount,
                    memo: `Ingreso por venta Factura ${invoice.number}`
                }
            ];

            if (totalCost > 0) {
                // 2. Cost of Sales record (Expense & Asset)
                lines.push({
                    accountId: costoVentas.id,
                    debit: totalCost,
                    credit: 0,
                    memo: `Costo de Venta Factura ${invoice.number}`
                });
                lines.push({
                    accountId: inventario.id,
                    debit: 0,
                    credit: totalCost,
                    memo: `Salida de Inventario Factura ${invoice.number}`
                });
            }

            await this.accountingService.createEntry({
                date: new Date(),
                description: `Contabilización Factura de Venta ${invoice.number}`,
                sourceType: 'invoice',
                sourceId: invoice.id,
                createdByUserId: invoice.createdByUserId,
                lines
            });
        } catch (error) {
            console.error('Error generating accounting entry for invoice:', error);
        }
    }
}
