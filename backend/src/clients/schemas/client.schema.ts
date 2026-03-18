import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ClientDocument = Client & Document;

@Schema({ timestamps: true })
export class Client {
    @Prop({ required: true, unique: true })
    reference: string;

    @Prop({ required: true })
    name: string; // Razón Social o nombre

    @Prop({ required: true })
    documentId: string; // RUC, Cédula o equivalente

    @Prop({ required: true, enum: ['b2b', 'b2c'], default: 'b2b' })
    type: string;

    @Prop()
    contactName?: string;

    @Prop()
    email?: string;

    @Prop()
    phone?: string;

    @Prop()
    mobile?: string;

    @Prop()
    address?: string;

    @Prop()
    country?: string;

    @Prop()
    city?: string;

    @Prop({ default: 0 })
    paymentTerms: number; // Días de crédito

    @Prop({ default: 0 })
    creditLimit: number;

    @Prop({ default: 0 })
    currentBalance: number;

    @Prop({ required: true, enum: ['active', 'inactive'], default: 'active' })
    status: string;

    @Prop()
    notes?: string;
}

export const ClientSchema = SchemaFactory.createForClass(Client);
