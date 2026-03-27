import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CashRegisterDocument = CashRegister & Document;

@Schema({ timestamps: true })
export class CashRegister {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    userId: string;

    @Prop({ required: true })
    userName: string;

    @Prop({ required: true, default: 'abierta', enum: ['abierta', 'cerrada'] })
    status: string;

    @Prop({ required: true })
    openingAmount: number;

    @Prop()
    closingAmount?: number;

    @Prop()
    expectedAmount?: number;

    @Prop()
    difference?: number;

    @Prop()
    openedAt: Date;

    @Prop()
    closedAt?: Date;

    @Prop({ default: 0 })
    cashSales: number;

    @Prop({ default: 0 })
    cardSales: number;

    @Prop({ default: 0 })
    transferSales: number;

    @Prop({ default: 0 })
    totalSales: number;

    @Prop()
    notes?: string;
}

export const CashRegisterSchema = SchemaFactory.createForClass(CashRegister);
