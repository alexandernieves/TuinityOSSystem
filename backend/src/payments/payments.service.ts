import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { ClientsService } from '../clients/clients.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { AccountingService } from '../accounting/accounting.service';

@Injectable()
export class PaymentsService {
    constructor(
        @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
        @Inject(forwardRef(() => ClientsService)) private clientsService: ClientsService,
        @Inject(forwardRef(() => SuppliersService)) private suppliersService: SuppliersService,
        private accountingService: AccountingService,
    ) { }

    async create(createPaymentDto: any): Promise<PaymentDocument> {
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
        const newPayment = new this.paymentModel(createPaymentDto);
        const savedPayment = await newPayment.save();

        // 2. Afectar Saldo de la Entidad
        try {
            if (entityType === 'client') {
                // Un pago de cliente (inbound) disminuye su deuda (balance).
                await this.clientsService.updateBalance(entityId, -amount);
            } else if (entityType === 'supplier') {
                // Un pago a proveedor (outbound) disminuye nuestra deuda (balance).
                await this.suppliersService.updateBalance(entityId, -amount);
            }
        } catch (error) {
            // Fallback or compensación (opcional en un MVP, pero ideal en prod)
            console.error('Error al actualizar el balance de la entidad:', error);
        }

        // 3. Generar Asiento Contable Automático
        await this.createAccountingEntryForPayment(savedPayment);

        return savedPayment;
    }

    private async createAccountingEntryForPayment(payment: PaymentDocument) {
        try {
            const accounts = await this.accountingService.findAllAccounts();
            const caja = accounts.find(a => a.code === '1010.01');
            const cxc = accounts.find(a => a.code === '1020.01');
            const cxp = accounts.find(a => a.code === '2010.01');

            if (!caja) return;

            const lines: any[] = [];
            if (payment.type === 'inbound' && cxc) {
                // Cobro a Cliente: Caja (D) / CxC (C)
                lines.push({
                    accountId: caja._id,
                    accountCode: caja.code,
                    accountName: caja.name,
                    debit: payment.amount,
                    credit: 0,
                    memo: `Recibo de Caja ${payment._id}`
                });
                lines.push({
                    accountId: cxc._id,
                    accountCode: cxc.code,
                    accountName: cxc.name,
                    debit: 0,
                    credit: payment.amount,
                    memo: `Abono de cliente - Ref: ${payment._id}`
                });
            } else if (payment.type === 'outbound' && cxp) {
                // Pago a Proveedor: CxP (D) / Caja (C)
                lines.push({
                    accountId: cxp._id,
                    accountCode: cxp.code,
                    accountName: cxp.name,
                    debit: payment.amount,
                    credit: 0,
                    memo: `Pago a proveedor - Ref: ${payment._id}`
                });
                lines.push({
                    accountId: caja._id,
                    accountCode: caja.code,
                    accountName: caja.name,
                    debit: 0,
                    credit: payment.amount,
                    memo: `Egreso de caja ${payment._id}`
                });
            }

            if (lines.length === 2) {
                await this.accountingService.createEntry({
                    date: payment.date || new Date(),
                    description: `Pago ${payment.type === 'inbound' ? 'Recibido' : 'Emitido'} - Ref: ${payment._id}`,
                    sourceType: 'payment',
                    sourceId: payment._id.toString(),
                    lines
                });
            }
        } catch (e) {
            console.error('Error automatically creating accounting entry for payment:', e);
        }
    }

    async findAll(filters: any = {}): Promise<PaymentDocument[]> {
        const query: any = {};
        if (filters.type) query.type = filters.type;
        if (filters.entityType) query.entityType = filters.entityType;
        if (filters.entityId) query.entityId = filters.entityId;

        return this.paymentModel.find(query).sort({ date: -1, createdAt: -1 }).exec();
    }

    async findOne(id: string): Promise<PaymentDocument> {
        const payment = await this.paymentModel.findById(id).exec();
        if (!payment) throw new NotFoundException(`Pago ${id} no encontrado`);
        return payment;
    }
}
