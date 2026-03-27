import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type JournalEntryDocument = JournalEntry & Document;

@Schema({ timestamps: true })
export class JournalEntry {
    @Prop({ required: true, unique: true })
    reference: string; // e.g., 'AS-2026-0001'

    @Prop({ required: true })
    date: Date;

    @Prop({ required: true })
    description: string;

    @Prop({ type: Array, required: true })
    lines: {
        accountId: Types.ObjectId;
        accountCode: string;
        accountName: string;
        debit: number;
        credit: number;
        memo?: string;
    }[];

    @Prop({ default: 'posted', enum: ['draft', 'posted', 'voided'] })
    status: string;

    @Prop()
    sourceType: string; // e.g., 'sale', 'payment', 'purchase', 'adjustment'

    @Prop()
    sourceId: string;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    createdBy: Types.ObjectId;
}

export const JournalEntrySchema = SchemaFactory.createForClass(JournalEntry);
