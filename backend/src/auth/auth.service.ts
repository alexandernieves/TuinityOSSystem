import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuditService } from '../services/audit/audit.service';
import { PrismaService } from '../services/shared/prisma.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private prisma: PrismaService,
        private auditService: AuditService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        console.log(`[AUTH-S] Validating user: ${email}`);
        const user = await this.usersService.findByEmail(email);
        
        if (!user) {
            console.log(`[AUTH-S] User not found: ${email}`);
            return null;
        }

        if (!user.isActive) {
            console.log(`[AUTH-S] User is inactive: ${email}`);
            return null;
        }

        const isMatch = await bcrypt.compare(pass, user.passwordHash);
        if (!isMatch) {
            console.log(`[AUTH-S] Password mismatch for: ${email}`);
            return null;
        }

        const { passwordHash, ...result } = user;
        return result;
    }

    async register(userData: any) {
        // En una app real se pueden añadir validaciones extra (e.g., if email is already taken)
        return this.usersService.createPendingUser(userData);
    }

    async login(user: any, ip?: string, userAgent?: string) {
        // Create a new session in DB
        const idleTimeout = this.configService.get<number>('SESSION_IDLE_TIMEOUT', 7200);
        
        const session = await this.prisma.session.create({
            data: {
                userId: user.id,
                loginAt: new Date(),
                lastActivity: new Date(),
                expiresAt: new Date(Date.now() + idleTimeout * 1000),
                ipAddress: ip,
                userAgent: userAgent,
                isActive: true,
            }
        });

        // Log successful login
        await this.auditService.logAuditEvent({
            userId: user.id,
            action: 'LOGIN',
            entity: 'Session',
            entityId: session.id,
            ipAddress: ip,
            userAgent: userAgent,
        });

        const payload = {
            email: user.email,
            sub: user.id,
            role: user.role || 'user',
            sessionId: session.id
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: { ...user, sessionId: session.id },
        };
    }

    async logout(sessionId: string) {
        await this.prisma.session.update({
            where: { id: sessionId },
            data: {
                isActive: false,
                lastActivity: new Date(),
                expiresAt: new Date()
            }
        });
        return { message: 'Logged out successfully' };
    }

    async validateSession(sessionId: string): Promise<boolean> {
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
            include: { user: { select: { email: true } } }
        });
        
        if (!session) {
            console.log(`[AUTH-S] Session not found: ${sessionId}`);
            return false;
        }

        if (!session.isActive) {
            console.log(`[AUTH-S] Session inactive: ${sessionId} for ${session.user.email}`);
            return false;
        }

        // Check expiration
        if (session.expiresAt && session.expiresAt < new Date()) {
            console.log(`[AUTH-S] Session expired: ${sessionId} for ${session.user.email}`);
            // Auto invalidate
            await this.prisma.session.update({
                where: { id: sessionId },
                data: { isActive: false }
            });
            return false;
        }

        const idleTimeout = this.configService.get<number>('SESSION_IDLE_TIMEOUT', 7200);
        
        // Update last activity and expiration
        await this.prisma.session.update({
            where: { id: sessionId },
            data: {
                lastActivity: new Date(),
                expiresAt: new Date(Date.now() + idleTimeout * 1000)
            }
        });
        return true;
    }

    async getActiveSessions(userId?: string) {
        return this.prisma.session.findMany({
            where: {
                ...(userId ? { userId } : {}),
                isActive: true
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    }
                }
            }
        });
    }

    async invalidateAllUserSessions(userId: string) {
        await this.prisma.session.updateMany({
            where: { userId, isActive: true },
            data: { isActive: false }
        });
    }

    async getFullUser(userId: string) {
        return this.usersService.findById(userId);
    }
}
