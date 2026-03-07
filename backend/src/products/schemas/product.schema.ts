import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
    @Prop({ required: true, unique: true })
    reference: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true })
    group: string;

    @Prop({ required: true })
    subGroup: string;

    @Prop({ required: true })
    brand: string;

    @Prop()
    supplier?: string;

    @Prop()
    country?: string;

    @Prop()
    barcode?: string;

    @Prop({ type: [{ code: String, label: String }] })
    barcodes?: { code: string; label: string }[];

    @Prop()
    tariffCode?: string;

    @Prop({ required: true })
    unit: string;

    @Prop({ required: true })
    unitsPerCase: number;

    @Prop()
    reorderPoint?: number;

    @Prop({ required: true })
    minimumQty: number;

    @Prop({ type: { A: Number, B: Number, C: Number, D: Number, E: Number }, required: true })
    prices: { A: number; B: number; C: number; D: number; E: number };

    @Prop({ required: true })
    costFOB: number;

    @Prop({ required: true })
    costCIF: number;

    @Prop({ required: true })
    costAvgWeighted: number;

    @Prop()
    priceB2C?: number;

    @Prop({ default: 'active' })
    status: string;

    @Prop()
    image?: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
