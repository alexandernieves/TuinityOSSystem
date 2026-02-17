import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import type { Request } from 'express';
type RequestWithUser = Request & {
    user?: {
        sub: string;
        tenantId: string;
    };
};
export declare class AuthController {
    private readonly authService;
    private readonly usersService;
    constructor(authService: AuthService, usersService: UsersService);
    registerTenant(body: unknown): Promise<{
        tenantId: string;
        tenantSlug: string;
        adminUserId: string;
    }>;
    registerClient(body: unknown): Promise<{
        accessToken: string;
        refreshToken: string;
        tenantId: string;
        userId: string;
    }>;
    login(body: unknown): Promise<{
        accessToken: string;
        refreshToken: string;
        tenantId: string;
        userId: string;
    }>;
    refresh(body: unknown): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(body: unknown): Promise<{
        ok: boolean;
    }>;
    me(req: RequestWithUser): Promise<{
        userId: string | undefined;
        tenantId: string | undefined;
        email?: undefined;
        name?: undefined;
        role?: undefined;
    } | {
        userId: string;
        tenantId: string;
        email: string | undefined;
        name: string | null | undefined;
        role: import("@prisma/client").$Enums.UserRoleType | undefined;
    }>;
    deleteAccount(req: RequestWithUser): Promise<{
        ok: boolean;
    }>;
}
export {};
