import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class DocumentNumbering extends Document {
    @Prop({ required: true, unique: true })
    code: string; // e.g., 'invoice', 'quote', 'purchase'

    @Prop({ required: true })
    documentLabel: string; // e.g., 'Factura', 'Cotización'

    @Prop({ default: '' })
    prefix: string;

    @Prop({ default: 1 })
    currentNumber: number;

    @Prop({ default: 5 })
    paddingLength: number;
}

export const DocumentNumberingSchema = SchemaFactory.createForClass(DocumentNumbering);
