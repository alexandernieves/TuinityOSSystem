import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
class PriceLevel {
    @Prop({ required: true })
    level: string; // A, B, C, D, E

    @Prop({ required: true })
    name: string;

    @Prop()
    description: string;

    @Prop({ default: true })
    isActive: boolean;
}

@Schema({ _id: false })
class CommissionRate {
    @Prop({ required: true })
    userId: string;

    @Prop({ required: true })
    userName: string;

    @Prop({ default: 0 })
    rate: number;

    @Prop({ default: true })
    isActive: boolean;
}

@Schema({ _id: false })
class PaymentTermOption {
    @Prop({ required: true })
    code: string;

    @Prop({ required: true })
    label: string;

    @Prop({ default: 0 })
    days: number;

    @Prop({ default: true })
    isActive: boolean;
}

@Schema({ timestamps: true })
export class CommercialParams extends Document {
    @Prop({ type: [PriceLevel], default: [] })
    priceLevels: PriceLevel[];

    @Prop({ default: 'C' })
    defaultPriceLevel: string;

    @Prop({ default: 10 })
    commissionThreshold: number;

    @Prop({ type: [CommissionRate], default: [] })
    commissionRates: CommissionRate[];

    @Prop({ default: 7 })
    taxRate: number;

    @Prop({ type: [String], default: ['ZONA LIBRE COLON', 'PANAMA PACIFICO'] })
    taxExemptZones: string[];

    @Prop({ type: [PaymentTermOption], default: [] })
    paymentTermsOptions: PaymentTermOption[];
}

export const CommercialParamsSchema = SchemaFactory.createForClass(CommercialParams);
