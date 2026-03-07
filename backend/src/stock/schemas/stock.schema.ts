import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StockDocument = Stock & Document;

@Schema({ timestamps: true })
export class Stock {
    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    productId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Warehouse', required: true })
    warehouseId: Types.ObjectId;

    @Prop({ default: 0 })
    existence: number;

    @Prop({ default: 0 })
    reserved: number;

    @Prop({ default: 0 })
    arriving: number;

    @Prop({ default: 0 })
    available: number; // existence + arriving - reserved (Aunque es calculado, puede persistirse para consultas rápidas)
}

export const StockSchema = SchemaFactory.createForClass(Stock);

// Índice compuesto para asegurar que un producto tenga solo una entrada por bodega
StockSchema.index({ productId: 1, warehouseId: 1 }, { unique: true });
