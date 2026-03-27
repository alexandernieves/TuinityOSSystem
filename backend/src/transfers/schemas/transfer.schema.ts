import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransferDocument = Transfer & Document;

@Schema({ timestamps: true })
export class Transfer {
    @Prop({ required: true, unique: true })
    reference: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Warehouse', required: true })
    sourceWarehouseId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Warehouse', required: true })
    destWarehouseId: Types.ObjectId;

    @Prop()
    observation?: string;

    @Prop({
        type: [
            {
                productId: { type: Types.ObjectId, ref: 'Product', required: true },
                sourceStock: { type: Number, required: true },
                quantityCases: { type: Number, required: true },
                unitsPerCase: { type: Number, required: true },
                resultingUnits: { type: Number, required: true },
                realCostCIF: { type: Number, required: true },
                transferCost: { type: Number, required: true },
                totalValue: { type: Number, required: true },
                receivedQty: { type: Number },
                hasDiscrepancy: { type: Boolean },
                discrepancyNotes: { type: String },
            },
        ],
    })
    lines: {
        productId: Types.ObjectId;
        sourceStock: number;
        quantityCases: number;
        unitsPerCase: number;
        resultingUnits: number;
        realCostCIF: number;
        transferCost: number;
        totalValue: number;
        receivedQty?: number;
        hasDiscrepancy?: boolean;
        discrepancyNotes?: string;
    }[];

    @Prop({ required: true })
    totalCases: number;

    @Prop({ required: true })
    totalUnits: number;

    @Prop({ required: true })
    totalValue: number;

    @Prop({ required: true, default: 1.15 })
    inflationFactor: number;

    @Prop({ required: true, enum: ['borrador', 'enviada', 'recibida', 'recibida_discrepancia'], default: 'borrador' })
    status: string;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    receivedBy?: Types.ObjectId;

    @Prop()
    receivedAt?: Date;

    @Prop()
    hasDiscrepancies?: boolean;

    @Prop()
    discrepancySummary?: string;
}

export const TransferSchema = SchemaFactory.createForClass(Transfer);
