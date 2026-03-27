import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SaleDocument = Sale & Document;

@Schema()
class SaleLine {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
    productId: string;

    @Prop({ required: true })
    productReference: string;

    @Prop({ required: true })
    productDescription: string;

    @Prop({ required: true })
    quantity: number;

    @Prop({ required: true })
    unitPrice: number;

    @Prop({ default: 0 })
    discount: number;

    @Prop({ default: 0 })
    tax: number;

    @Prop({ required: true })
    total: number;
}

const SaleLineSchema = SchemaFactory.createForClass(SaleLine);

@Schema({ timestamps: true })
export class Sale {
    @Prop({ required: true, unique: true })
    orderNumber: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    clientId: string;

    @Prop({ required: true })
    clientName: string;

    @Prop({ required: true })
    bodegaId: string;

    @Prop({ required: true })
    bodegaName: string;

    @Prop({
        required: true,
        enum: ['borrador', 'pendiente', 'aprobada', 'empaque', 'facturada', 'despachada', 'cancelada'],
        default: 'pendiente',
    })
    status: string;

    @Prop({ type: [SaleLineSchema] })
    lines: SaleLine[];

    @Prop({ enum: ['pos', 'b2b'], default: 'b2b' })
    type: string;

    @Prop({ required: true })
    subtotal: number;

    @Prop({ default: 0 })
    totalTax: number;

    @Prop({ default: 0 })
    totalDiscount: number;

    @Prop({ required: true })
    total: number;

    @Prop({ required: true })
    createdBy: string;

    @Prop()
    notes?: string;

    @Prop()
    invoiceNumber?: string;

    @Prop()
    invoicedAt?: Date;
}

export const SaleSchema = SchemaFactory.createForClass(Sale);
