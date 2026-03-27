import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AdjustmentDocument = Adjustment & Document;

@Schema({ timestamps: true })
export class Adjustment {
    @Prop({ required: true, unique: true })
    reference: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Warehouse', required: true })
    warehouseId: Types.ObjectId;

    @Prop({ required: true, enum: ['positivo', 'negativo'] })
    type: string;

    @Prop({ required: true, enum: ['merma', 'rotura', 'robo', 'error_conteo', 'vencimiento', 'devolucion', 'otro'] })
    reason: string;

    @Prop()
    observation?: string;

    @Prop({
        type: [
            {
                productId: { type: Types.ObjectId, ref: 'Product', required: true },
                currentStock: { type: Number, required: true },
                adjustmentQty: { type: Number, required: true },
                resultingStock: { type: Number, required: true },
                costCIF: { type: Number, required: true },
                lineValue: { type: Number, required: true },
                detail: { type: String },
            },
        ],
    })
    lines: {
        productId: Types.ObjectId;
        currentStock: number;
        adjustmentQty: number;
        resultingStock: number;
        costCIF: number;
        lineValue: number;
        detail?: string;
    }[];

    @Prop({ required: true })
    totalItems: number;

    @Prop({ required: true })
    totalValue: number;

    @Prop({ required: true, enum: ['pendiente', 'aprobado', 'rechazado', 'aplicado'], default: 'pendiente' })
    status: string;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    approvedBy?: Types.ObjectId;

    @Prop()
    approvedAt?: Date;

    @Prop()
    appliedAt?: Date;
}

export const AdjustmentSchema = SchemaFactory.createForClass(Adjustment);
