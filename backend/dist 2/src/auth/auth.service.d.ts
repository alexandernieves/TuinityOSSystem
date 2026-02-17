import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { RegisterClientDto } from './dto/register-client.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    private getAccessTokenTtlSeconds;
    private getRefreshTokenTtlDays;
    private hashToken;
    registerTenant(dto: RegisterTenantDto): Promise<{
        tenantId: string;
        tenantSlug: string;
        adminUserId: string;
    }>;
    registerClient(dto: RegisterClientDto): Promise<{
        accessToken: string;
        refreshToken: string;
        tenantId: string;
        userId: string;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        tenantId: string;
        userId: string;
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(refreshToken: string): Promise<{
        ok: boolean;
    }>;
    deleteTenantAccount(userId: string, tenantId: string): Promise<{
        ok: boolean;
    }>;
    cleanupExpiredSessions(): Promise<void>;
}
