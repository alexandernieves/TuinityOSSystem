import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WarehouseDocument = Warehouse & Document;

@Schema({ timestamps: true })
export class Warehouse {
    @Prop({ required: true, unique: true })
    code: string; // 'ZL', 'PTY-TIENDA'

    @Prop({ required: true })
    name: string;

    @Prop({ required: true, enum: ['B2B', 'B2C'] })
    type: string;

    @Prop()
    location?: string;

    @Prop({ default: true })
    isActive: boolean;
}

export const WarehouseSchema = SchemaFactory.createForClass(Warehouse);
