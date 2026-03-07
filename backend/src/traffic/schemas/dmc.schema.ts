import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DMCDocument = DMC & Document;

@Schema({ timestamps: true })
export class DMC {
    @Prop({ required: true, unique: true })
    reference: string;

    @Prop({ type: Types.ObjectId, ref: 'Expedient', required: true })
    expedientId: Types.ObjectId;

    @Prop({ required: true, enum: ['salida', 'entrada', 'traspaso'] })
    type: string;

    @Prop({ default: 'borrador', enum: ['borrador', 'completado', 'registrado', 'anulado'] })
    status: string;

    @Prop({ required: true })
    shipperName: string;

    @Prop({ required: true })
    consigneeName: string;

    @Prop({ required: true })
    consigneeCountry: string;

    @Prop({ type: Array })
    merchandiseLines: any[];

    @Prop({ type: Object })
    totals: {
        packages: number;
        cases: number;
        netWeightKg: number;
        grossWeightKg: number;
        volumeM3: number;
        valueFOB: number;
    };

    @Prop({ type: Types.ObjectId, ref: 'User' })
    createdBy: Types.ObjectId;

    @Prop()
    governmentDMCNumber: string;
}

export const DMCSchema = SchemaFactory.createForClass(DMC);
