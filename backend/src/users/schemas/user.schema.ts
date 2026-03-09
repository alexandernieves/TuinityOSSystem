import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true })
    role: string;

    @Prop()
    avatar?: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ type: Object, default: {} })
    dashboardPreferences: Record<string, boolean>;
}

export const UserSchema = SchemaFactory.createForClass(User);
