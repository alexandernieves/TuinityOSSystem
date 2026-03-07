import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExpedientDocument = Expedient & Document;

@Schema({ timestamps: true })
export class Expedient {
    @Prop({ required: true, unique: true })
    reference: string;

    @Prop({ required: true, enum: ['salida', 'entrada', 'traspaso', 'transferencia'] })
    type: string;

    @Prop({ default: 'pendiente', enum: ['pendiente', 'en_proceso', 'documentado', 'despachado', 'en_transito', 'entregado', 'cancelado'] })
    status: string;

    @Prop({ default: 'normal', enum: ['urgente', 'normal', 'anticipado'] })
    priority: string;

    @Prop({ required: true })
    sourceDocumentId: string;

    @Prop({ required: true, enum: ['factura', 'orden_compra', 'transferencia'] })
    sourceDocumentType: string;

    @Prop({ required: true })
    counterpartName: string;

    @Prop()
    counterpartCountry: string;

    @Prop({ type: Object })
    totals: {
        packages: number;
        cases: number;
        netWeightKg: number;
        grossWeightKg: number;
        volumeM3: number;
        valueFOB: number;
    };

    @Prop({ type: Object })
    transport: {
        mode: string;
        carrierName?: string;
        vesselName?: string;
        voyageNumber?: string;
        portOfLoading: string;
        portOfDischarge?: string;
        etd?: string;
        eta?: string;
    };

    @Prop({ type: Types.ObjectId, ref: 'User' })
    createdBy: Types.ObjectId;

    @Prop()
    notes: string;
}

export const ExpedientSchema = SchemaFactory.createForClass(Expedient);
