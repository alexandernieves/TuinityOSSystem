import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BLDocument = BillOfLading & Document;

@Schema({ timestamps: true })
export class BillOfLading {
    @Prop({ required: true, unique: true })
    reference: string;

    @Prop({ type: Types.ObjectId, ref: 'Expedient', required: true })
    expedientId: Types.ObjectId;

    @Prop({ default: 'borrador', enum: ['borrador', 'completado', 'enviado'] })
    status: string;

    @Prop({ required: true })
    shipperName: string;

    @Prop({ required: true })
    consigneeName: string;

    @Prop({ required: true })
    vesselName: string;

    @Prop({ required: true })
    portOfLoading: string;

    @Prop({ required: true })
    portOfDischarge: string;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    createdBy: Types.ObjectId;
}

export const BillOfLadingSchema = SchemaFactory.createForClass(BillOfLading);
