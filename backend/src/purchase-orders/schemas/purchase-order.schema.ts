import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Supplier } from '../../suppliers/schemas/supplier.schema';
import { Product } from '../../products/schemas/product.schema';

export type PurchaseOrderDocument = PurchaseOrder & Document;

@Schema()
class ExpenseBreakdown {
    @Prop({ default: 0 })
    freight: number;

    @Prop({ default: 0 })
    insurance: number;

    @Prop({ default: 0 })
    customs: number;

    @Prop({ default: 0 })
    handling: number;

    @Prop({ default: 0 })
    other: number;

    @Prop({ default: 0 })
    total: number;
}

const ExpenseBreakdownSchema = SchemaFactory.createForClass(ExpenseBreakdown);

@Schema()
class PurchaseOrderLine {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
    productId: string;

    @Prop({ required: true })
    productReference: string;

    @Prop({ required: true })
    productDescription: string;

    @Prop({ required: true })
    quantity: number;

    @Prop({ default: 0 })
    quantityReceived: number;

    @Prop({ required: true })
    unitCostFOB: number;

    @Prop({ required: true })
    totalFOB: number;

    @Prop()
    unitCostCIF?: number;

    @Prop()
    totalCIF?: number;
}

const PurchaseOrderLineSchema = SchemaFactory.createForClass(PurchaseOrderLine);

@Schema({ timestamps: true })
export class PurchaseOrder {
    @Prop({ required: true, unique: true })
    orderNumber: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Supplier', required: true })
    supplierId: string;

    @Prop({ required: true })
    supplierName: string;

    @Prop()
    supplierInvoice?: string;

    @Prop({ required: true })
    bodegaId: string;

    @Prop({ required: true })
    bodegaName: string;

    @Prop({
        required: true,
        enum: ['pendiente', 'en_transito', 'en_recepcion', 'completada', 'cancelada'],
        default: 'pendiente',
    })
    status: string;

    @Prop()
    expectedArrivalDate?: string;

    @Prop()
    actualArrivalDate?: string;

    @Prop({ type: [PurchaseOrderLineSchema] })
    lines: PurchaseOrderLine[];

    @Prop({ required: true })
    totalFOB: number;

    @Prop()
    expensePercentage?: number;

    @Prop({ type: ExpenseBreakdownSchema })
    expenseBreakdown?: ExpenseBreakdown;

    @Prop()
    totalExpenses?: number;

    @Prop()
    totalCIF?: number;

    @Prop({ default: false })
    costProrated: boolean;

    @Prop()
    proratedAt?: string;

    @Prop()
    proratedBy?: string;

    @Prop({ default: false })
    costIncreaseAlert: boolean;

    @Prop({ required: true })
    createdBy: string;

    @Prop()
    notes?: string;

    @Prop([String])
    attachments?: string[];
}

export const PurchaseOrderSchema = SchemaFactory.createForClass(PurchaseOrder);
