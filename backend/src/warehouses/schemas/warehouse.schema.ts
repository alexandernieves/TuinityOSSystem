import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WarehouseDocument = Warehouse & Document;

@Schema({ timestamps: true })
export class Warehouse {
    @Prop({ required: true, unique: true })
    code: string; // 'ZL', 'PTY-TIENDA'

    @Prop({ required: true })
    name: string;

    @Prop({ required: true, enum: ['B2B', 'B2C', 'oficina', 'bodega', 'tienda', 'zona_libre'] })
    type: string;

    @Prop()
    address?: string;

    @Prop()
    city?: string;

    @Prop()
    country?: string;

    @Prop()
    phone?: string;

    @Prop()
    manager?: string;

    @Prop({ default: false })
    isHeadquarters: boolean;

    @Prop({ default: true })
    isActive: boolean;
}

export const WarehouseSchema = SchemaFactory.createForClass(Warehouse);
