import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SupplierDocument = Supplier & Document;

@Schema({ timestamps: true })
export class Supplier {
    @Prop({ required: true, unique: true })
    name: string;

    @Prop({ required: true })
    country: string;

    @Prop()
    contact?: string;

    @Prop()
    email?: string;

    @Prop()
    phone?: string;

    @Prop({ type: Object })
    columnTemplate?: {
        productReference?: string;
        productDescription?: string;
        quantity?: string;
        unitCostFOB?: string;
        barcode?: string;
        tariffCode?: string;
    };

    @Prop({ default: true })
    isActive: boolean;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);
