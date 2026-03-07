import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AccountDocument = Account & Document;

@Schema({ timestamps: true })
export class Account {
    @Prop({ required: true, unique: true })
    code: string; // e.g., '1010.01'

    @Prop({ required: true })
    name: string; // e.g., 'Caja General'

    @Prop({ required: true, enum: ['asset', 'liability', 'equity', 'revenue', 'expense'] })
    type: string;

    @Prop({ default: 0 })
    balance: number;

    @Prop({ type: String, default: null })
    parentId: string | null;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: false })
    isGroup: boolean; // If true, it can't have entries directly
}

export const AccountSchema = SchemaFactory.createForClass(Account);
