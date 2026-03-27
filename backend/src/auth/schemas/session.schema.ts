import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema({ timestamps: true })
export class Session {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    loginAt: Date;

    @Prop({ required: true })
    lastActivity: Date;

    @Prop()
    ipAddress: string;

    @Prop()
    userAgent: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ type: Date, expires: 0 })
    expiresAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
