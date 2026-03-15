import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { Session, SessionDocument } from './schemas/session.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
        @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        if (user && user.isActive && (await bcrypt.compare(pass, user.password))) {
            const { password, ...result } = user.toObject();
            return result;
        }
        return null;
    }

    async login(user: any, ip?: string, userAgent?: string) {
        // Create a new session in DB
        const idleTimeout = this.configService.get<number>('SESSION_IDLE_TIMEOUT', 7200);
        
        const session = await this.sessionModel.create({
            userId: user._id,
            loginAt: new Date(),
            lastActivity: new Date(),
            expiresAt: new Date(Date.now() + idleTimeout * 1000),
            ipAddress: ip,
            userAgent: userAgent,
            isActive: true,
        });

        const payload = {
            email: user.email,
            sub: user._id,
            role: user.role,
            sessionId: session._id
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: { ...user, sessionId: session._id },
        };
    }

    async logout(sessionId: string) {
        await this.sessionModel.findByIdAndUpdate(sessionId, {
            isActive: false,
            lastActivity: new Date(),
            expiresAt: new Date()
        });
        return { message: 'Logged out successfully' };
    }

    async validateSession(sessionId: string): Promise<boolean> {
        const session = await this.sessionModel.findById(sessionId);
        if (session && session.isActive) {
            const idleTimeout = this.configService.get<number>('SESSION_IDLE_TIMEOUT', 7200);
            
            // Update last activity and expiration
            session.lastActivity = new Date();
            session.expiresAt = new Date(Date.now() + idleTimeout * 1000);
            await session.save();
            return true;
        }
        return false;
    }

    async getActiveSessions(userId?: string) {
        const query = userId ? { userId, isActive: true } : { isActive: true };
        return this.sessionModel.find(query).populate('userId', 'name email role').exec();
    }

    async invalidateAllUserSessions(userId: string) {
        await this.sessionModel.updateMany({ userId, isActive: true }, { isActive: false });
    }

    async getFullUser(userId: string) {
        return this.usersService.findById(userId);
    }
}
