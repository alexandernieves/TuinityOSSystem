import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sale, SaleDocument } from './schemas/sale.schema';
import { StockService } from '../stock/stock.service';
import { ProductsService } from '../products/products.service';
import { AccountingService } from '../accounting/accounting.service';

import { WarehousesService } from '../warehouses/warehouses.service';

import { CashRegister, CashRegisterDocument } from './schemas/cash-register.schema';

@Injectable()
export class SalesService {
    constructor(
        @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
        @InjectModel(CashRegister.name) private cashRegisterModel: Model<CashRegisterDocument>,
        private stockService: StockService,
        private productsService: ProductsService,
        private warehousesService: WarehousesService,
        private accountingService: AccountingService,
    ) { }

    async getActiveRegister(userId: string): Promise<CashRegisterDocument | null> {
        return this.cashRegisterModel.findOne({ userId, status: 'abierta' }).exec();
    }

    async openCashRegister(userId: string, userName: string, openingAmount: number): Promise<CashRegisterDocument> {
        const active = await this.getActiveRegister(userId);
        if (active) throw new BadRequestException('El usuario ya tiene una caja abierta');

        const newRegister = new this.cashRegisterModel({
            userId,
            userName,
            status: 'abierta',
            openingAmount,
            openedAt: new Date(),
            totalSales: 0,
            cashSales: 0,
            cardSales: 0,
            transferSales: 0,
        });
        return newRegister.save();
    }

    async closeCashRegister(id: string, closingAmount: number, notes?: string): Promise<CashRegisterDocument> {
        const register = await this.cashRegisterModel.findById(id).exec();
        if (!register) throw new NotFoundException('Caja no encontrada');
        if (register.status === 'cerrada') throw new BadRequestException('La caja ya está cerrada');

        register.status = 'cerrada';
        register.closingAmount = closingAmount;
        register.closedAt = new Date();
        register.expectedAmount = register.openingAmount + register.cashSales;
        register.difference = closingAmount - register.expectedAmount;
        register.notes = notes;

        return register.save();
    }

    async createPOSSale(createSaleDto: any): Promise<SaleDocument> {
        // 1. Validar caja abierta
        const userId = createSaleDto.createdBy;
        const activeRegister = await this.getActiveRegister(userId);
        if (!activeRegister) throw new BadRequestException('Debes abrir la caja para realizar ventas POS');

        // Set default client if missing
        if (!createSaleDto.clientId) {
            createSaleDto.clientId = userId; // Fallback to current user ID
        }
        if (!createSaleDto.clientName) {
            createSaleDto.clientName = 'Consumidor Final';
        }

        // 2. Validar / Obtener bodega (asumir default si no viene)
        let bodegaId = createSaleDto.bodegaId;
        if (!bodegaId) {
            const warehouses = await this.warehousesService.findAll();
            if (warehouses.length > 0) {
                bodegaId = warehouses[0]._id.toString();
            } else {
                throw new BadRequestException('No hay bodegas configuradas para POS');
            }
        }
        createSaleDto.bodegaId = bodegaId;
        createSaleDto.status = 'facturada'; // Ventas POS nacen facturadas

        // 3. Validar stock y descontar inmediatamente
        for (const line of createSaleDto.lines) {
            const stock = await this.stockService.findOne(line.productId, bodegaId);
            if (!stock || stock.available < line.quantity) {
                throw new BadRequestException(`Stock insuficiente para ${line.productReference}`);
            }

            // Descuento directo (POS no reserva, vende)
            const newExistence = stock.existence - line.quantity;
            const newAvailable = newExistence - (stock.reserved || 0) + (stock.arriving || 0);
            await this.stockService.updateStock(line.productId, bodegaId, {
                existence: newExistence,
                available: newAvailable,
            });
        }

        // 4. Guardar Venta
        const newSale = new this.saleModel(createSaleDto);
        const savedSale = await newSale.save();

        // 5. Actualizar totales de caja
        const paymentMethod = createSaleDto.paymentMethod || 'efectivo';
        if (paymentMethod === 'efectivo') activeRegister.cashSales += savedSale.total;
        else if (paymentMethod.includes('tarjeta')) activeRegister.cardSales += savedSale.total;
        else activeRegister.transferSales += savedSale.total;

        activeRegister.totalSales += savedSale.total;
        await activeRegister.save();

        // 6. Generar Asiento Contable Automático
        await this.createAccountingEntryForSale(savedSale);

        return savedSale;
    }

    private async createAccountingEntryForSale(sale: SaleDocument) {
        try {
            const accounts = await this.accountingService.findAllAccounts();
            // Simple mapping for demo purposes
            // In a real system, these would be configurable
            const caja = accounts.find(a => a.code === '1010.01');
            const ventas = accounts.find(a => a.code === '4010');

            if (caja && ventas) {
                await this.accountingService.createEntry({
                    date: new Date(),
                    description: `Venta ${sale.type === 'pos' ? 'POS' : 'B2B'} - Ref: ${sale.orderNumber}`,
                    sourceType: 'sale',
                    sourceId: sale._id.toString(),
                    lines: [
                        {
                            accountId: caja._id,
                            accountCode: caja.code,
                            accountName: caja.name,
                            debit: sale.total,
                            credit: 0,
                            memo: `Ingreso por venta ${sale.orderNumber}`
                        },
                        {
                            accountId: ventas._id,
                            accountCode: ventas.code,
                            accountName: ventas.name,
                            debit: 0,
                            credit: sale.total,
                            memo: `Ingreso por venta ${sale.orderNumber}`
                        }
                    ]
                });
                console.log(`[Accounting] Created entry for sale ${sale.orderNumber}`);
            } else {
                console.warn(`[Accounting] Missing accounts: caja(${!!caja}), ventas(${!!ventas}) - skipping entry for sale ${sale.orderNumber}`);
            }
        } catch (e) {
            console.error('Error automatically creating accounting entry for sale:', e);
        }
    }

    async findAll(filters: any = {}): Promise<SaleDocument[]> {
        const query: any = {};
        if (filters.status) query.status = filters.status;
        if (filters.clientId) query.clientId = filters.clientId;
        return this.saleModel.find(query).sort({ createdAt: -1 }).exec();
    }

    async findOne(id: string): Promise<SaleDocument> {
        const sale = await this.saleModel.findById(id).exec();
        if (!sale) throw new NotFoundException(`Venta ${id} no encontrada`);
        return sale;
    }

    async create(createSaleDto: any): Promise<SaleDocument> {
        // 1. Validar / Obtener bodega
        let bodegaId = createSaleDto.bodegaId;
        if (!bodegaId || bodegaId === 'BOD-001') {
            const warehouses = await this.warehousesService.findAll();
            if (warehouses.length > 0) {
                bodegaId = warehouses[0]._id.toString();
            } else {
                throw new BadRequestException('No hay bodegas configuradas en el sistema');
            }
        }
        createSaleDto.bodegaId = bodegaId;

        // 2. Validar stock disponible para todas las líneas
        for (const line of createSaleDto.lines) {
            const stock = await this.stockService.findOne(line.productId, bodegaId);
            const available = stock?.available || 0;
            // Si no hay stock creado para este warehouse, asumimos 0
            if (available < line.quantity) {
                throw new BadRequestException(
                    `Stock insuficiente para el producto ${line.productReference}. Disponible: ${available}`,
                );
            }
        }

        // 3. Guardar Venta
        const newSale = new this.saleModel(createSaleDto);
        const savedSale = await newSale.save();

        // 4. Generar Asiento si ya está facturada (o al facturar)
        if (savedSale.status === 'facturada') {
            await this.createAccountingEntryForSale(savedSale);
        }

        // 5. Reservar stock (Reserved aumenta, Available disminuye)
        for (const line of savedSale.lines) {
            const stock = await this.stockService.findOne(line.productId, savedSale.bodegaId);
            if (stock) {
                const newReserved = (stock.reserved || 0) + line.quantity;
                const newAvailable = stock.existence - newReserved + (stock.arriving || 0);
                await this.stockService.updateStock(line.productId, savedSale.bodegaId, {
                    reserved: newReserved,
                    available: newAvailable,
                });
            }
        }

        return savedSale;
    }

    async updateStatus(id: string, status: string): Promise<SaleDocument> {
        // Normalize status to feminine (as in our schema enum)
        let normalizedStatus = status.toLowerCase();
        if (normalizedStatus === 'facturado') normalizedStatus = 'facturada';
        if (normalizedStatus === 'aprobado') normalizedStatus = 'aprobada';
        if (normalizedStatus === 'cancelado') normalizedStatus = 'cancelada';
        if (normalizedStatus === 'despachado') normalizedStatus = 'despachada';
        if (normalizedStatus === 'empacado') normalizedStatus = 'empaque';

        const sale = await this.findOne(id);
        const oldStatus = sale.status;
        if (oldStatus === normalizedStatus) return sale;

        // Trigger accounting entry if it's being invoiced now
        if (normalizedStatus === 'facturada' && oldStatus !== 'facturada') {
            await this.createAccountingEntryForSale(sale);
        }

        // Lógica de liberación de reserva si se cancela
        if (normalizedStatus === 'cancelada' && oldStatus !== 'facturada' && oldStatus !== 'despachada') {
            for (const line of sale.lines) {
                const stock = await this.stockService.findOne(line.productId, sale.bodegaId);
                if (stock) {
                    const newReserved = Math.max(0, (stock.reserved || 0) - line.quantity);
                    const newAvailable = stock.existence - newReserved + (stock.arriving || 0);
                    await this.stockService.updateStock(line.productId, sale.bodegaId, {
                        reserved: newReserved,
                        available: newAvailable,
                    });
                }
            }
        }

        // Lógica de salida definitiva si se factura/despacha
        if ((normalizedStatus === 'facturada' || normalizedStatus === 'despachada') && oldStatus !== 'facturada' && oldStatus !== 'despachada') {
            for (const line of sale.lines) {
                const stock = await this.stockService.findOne(line.productId, sale.bodegaId);
                if (stock) {
                    const newExistence = Math.max(0, stock.existence - line.quantity);
                    const newReserved = Math.max(0, (stock.reserved || 0) - line.quantity);
                    const newAvailable = newExistence - newReserved + (stock.arriving || 0);
                    await this.stockService.updateStock(line.productId, sale.bodegaId, {
                        existence: newExistence,
                        reserved: newReserved,
                        available: newAvailable,
                    });
                }
            }
        }

        sale.status = normalizedStatus;
        return sale.save();
    }
}
