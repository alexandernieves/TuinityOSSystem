import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../services/shared/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { AccountingService } from '../accounting/accounting.service';
import { AccountsReceivableService } from '../services/accounts-receivable/accounts-receivable.service';
import { AccountsPayableService } from '../services/accounts-payable/accounts-payable.service';
import { AccountsReceivableEntryType, AccountsPayableEntryType } from '@prisma/client';

@Injectable()
export class PaymentsService {
    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => ClientsService)) private clientsService: ClientsService,
        @Inject(forwardRef(() => SuppliersService)) private suppliersService: SuppliersService,
        private accountingService: AccountingService,
        private arService: AccountsReceivableService,
        private apService: AccountsPayableService,
    ) { }

    async create(createPaymentDto: any): Promise<any> {
        const { type, entityType, entityId, amount } = createPaymentDto;

        // Validación Básica
        if (!amount || amount <= 0) {
            throw new BadRequestException('El monto del pago debe ser mayor a 0');
        }

        if (type === 'inbound' && entityType !== 'client') {
            throw new BadRequestException('Los recibos de ingreso (inbound) deben estar asociados a un cliente');
        }

        if (type === 'outbound' && entityType !== 'supplier') {
            throw new BadRequestException('Los egresos (outbound) deben estar asociados a un proveedor');
        }

        // 1. Guardar Pago
        let savedPayment: any;
        if (type === 'inbound') {
            const count = await this.prisma.receipt.count();
            savedPayment = await this.prisma.receipt.create({
                data: {
                    number: `REC-${Date.now()}-${count + 1}`,
                    customerId: entityId,
                    receiptDate: createPaymentDto.date || new Date(),
                    method: 'CASH', // Default for now
                    status: 'CONFIRMED',
                    amount: amount,
                    notes: createPaymentDto.notes,
                    createdByUserId: createPaymentDto.createdBy
                }
            });
        } else {
            const count = await this.prisma.vendorPayment.count();
            savedPayment = await this.prisma.vendorPayment.create({
                data: {
                    number: `PAG-${Date.now()}-${count + 1}`,
                    supplierId: entityId,
                    paymentDate: createPaymentDto.date || new Date(),
                    method: 'BANK_TRANSFER',
                    status: 'CONFIRMED',
                    amount: amount,
                    notes: createPaymentDto.notes,
                    createdByUserId: createPaymentDto.createdBy
                }
            });
        }

        // 2. Afectar Saldo de la Entidad
        try {
            if (entityType === 'client') {
                await this.clientsService.updateBalance(entityId, -amount);
                
                // Create AR entry
                await this.arService.createAccountsReceivableEntry({
                    customerId: entityId,
                    receiptId: savedPayment.id,
                    entryType: AccountsReceivableEntryType.PAYMENT,
                    amount: amount,
                    notes: createPaymentDto.notes || `Recibo ${savedPayment.number}`,
                    createdByUserId: createPaymentDto.createdBy
                });

            } else if (entityType === 'supplier') {
                await this.suppliersService.updateBalance(entityId, -amount);

                // Create AP entry
                await this.apService.createAccountsPayableEntry({
                    supplierId: entityId,
                    paymentId: savedPayment.id,
                    entryType: AccountsPayableEntryType.PAYMENT,
                    amount: amount,
                    notes: createPaymentDto.notes || `Pago a Proveedor ${savedPayment.number}`,
                    createdByUserId: createPaymentDto.createdBy
                });
            }
        } catch (error) {
            console.error('Error al actualizar el balance de la entidad:', error);
        }

        // 3. Generar Asiento Contable Automático
        this.createAccountingEntryForPayment(savedPayment, type, amount, entityId, createPaymentDto.createdBy).catch(err => {
            console.error('Error creating accounting entry for payment:', err);
        });

        return { ...savedPayment, _id: savedPayment.id };
    }

    private async createAccountingEntryForPayment(payment: any, type: 'inbound' | 'outbound', amount: number, entityId: string, userId?: string) {
        try {
            const accounts = await this.accountingService.findAllAccounts();
            const banco = accounts.find(a => a.code === '1010.02');
            const cxc = accounts.find(a => a.code === '1020.01');
            const cxp = accounts.find(a => a.code === '2010.01');

            if (!banco || !cxc || !cxp) return;

            const lines: { accountId: string; debit: number; credit: number; memo: string }[] = [];
            if (type === 'inbound') {
                 // Cobro: Banco (Dr) vs CxC (Cr)
                 lines.push({ accountId: banco.id, debit: amount, credit: 0, memo: `Cobro Cliente - Recibo ${payment.number}` });
                 lines.push({ accountId: cxc.id, debit: 0, credit: amount, memo: `Aplicación a CxC - Recibo ${payment.number}` });
            } else {
                 // Pago: CxP (Dr) vs Banco (Cr)
                 lines.push({ accountId: cxp.id, debit: amount, credit: 0, memo: `Pago Proveedor - Pago ${payment.number}` });
                 lines.push({ accountId: banco.id, debit: 0, credit: amount, memo: `Salida de Banco - Pago ${payment.number}` });
            }

            await this.accountingService.createEntry({
                date: new Date(),
                description: type === 'inbound' ? `Contabilización Recibo de Caja ${payment.number}` : `Contabilización Pago a Proveedor ${payment.number}`,
                sourceType: type === 'inbound' ? 'receipt' : 'vendor_payment',
                sourceId: payment.id,
                createdByUserId: userId,
                lines
            });
        } catch (e) {
            console.error('Error generating accounting entry for payment:', e);
        }
    }

    async applyReceipt(receiptId: string, invoiceId: string, amount: number, userId: string): Promise<any> {
        return this.arService.processReceiptApplication(receiptId, invoiceId, amount, userId);
    }

    async applyVendorPayment(paymentId: string, purchaseOrderId: string, amount: number, userId: string): Promise<any> {
        return this.apService.processPaymentApplication(paymentId, purchaseOrderId, amount, userId);
    }

    async findAll(filters: any = {}): Promise<any[]> {
        if (filters.type === 'inbound' || filters.entityType === 'client') {
            return this.prisma.receipt.findMany({
                where: {
                    ...(filters.entityId ? { customerId: filters.entityId } : {})
                },
                orderBy: { receiptDate: 'desc' },
                include: { customer: true }
            });
        } else {
            return this.prisma.vendorPayment.findMany({
                where: {
                    ...(filters.entityId ? { supplierId: filters.entityId } : {})
                },
                orderBy: { paymentDate: 'desc' },
                include: { supplier: true }
            });
        }
    }

    async findOne(id: string): Promise<any> {
        // Try receipt first, then vendor payment
        let payment = await this.prisma.receipt.findUnique({ where: { id }, include: { customer: true } }) as any;
        if (!payment) {
            payment = await this.prisma.vendorPayment.findUnique({ where: { id }, include: { supplier: true } });
        }
        if (!payment) throw new NotFoundException(`Pago ${id} no encontrado`);
        return { ...payment, _id: payment.id };
    }
}
