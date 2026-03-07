import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
    @Prop({ required: true, enum: ['inbound', 'outbound'] })
    type: string; // inbound = cobro a cliente, outbound = pago a proveedor

    @Prop({ required: true, enum: ['client', 'supplier'] })
    entityType: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, required: true, refPath: 'entityType' })
    entityId: string;

    @Prop({ required: true })
    entityName: string; // Para evitar joins constantes

    @Prop({ required: true })
    amount: number;

    @Prop({ required: true, enum: ['efectivo', 'tarjeta', 'transferencia', 'cheque', 'otro'], default: 'transferencia' })
    paymentMethod: string;

    @Prop()
    referenceNumber?: string; // Cheque #, o Ref bancaria

    @Prop()
    referenceDocument?: string; // ID de la venta o compra si aplica a una factura específica

    @Prop({ required: true, default: Date.now })
    date: Date;

    @Prop()
    notes?: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    createdBy: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
