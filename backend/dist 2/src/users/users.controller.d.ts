import { UsersService } from './users.service';
import type { Request } from 'express';
type RequestWithUser = Request & {
    user?: {
        sub: string;
        tenantId: string;
    };
};
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    private assertOwner;
    private assertGlobalAdmin;
    getAllUsers(req: RequestWithUser): Promise<{
        id: string;
        name: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        createdAt: Date;
        updatedAt: Date;
        role: import("@prisma/client").$Enums.UserRoleType;
        email: string;
    }[]>;
    createUser(req: RequestWithUser, body: {
        email: string;
        name: string;
        password?: string;
        role: string;
    }): Promise<{
        id: string;
        name: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        role: import("@prisma/client").$Enums.UserRoleType;
        email: string;
        passwordHash: string;
    }>;
    getAllUsersAllTenants(req: RequestWithUser): Promise<{
        id: string;
        name: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        createdAt: Date;
        updatedAt: Date;
        tenant: {
            id: string;
            slug: string;
            name: string;
        };
        role: import("@prisma/client").$Enums.UserRoleType;
        email: string;
    }[]>;
    getAllTenants(req: RequestWithUser): Promise<{
        id: string;
        slug: string;
        name: string;
        status: import("@prisma/client").$Enums.TenantStatus;
        createdAt: Date;
        _count: {
            users: number;
            branches: number;
        };
    }[]>;
    updateUserRole(req: RequestWithUser, userId: string, body: {
        role: 'CLIENT' | 'MEMBER' | 'ADMIN' | 'OWNER' | 'SALES' | 'WAREHOUSE' | 'TRAFFIC';
    }): Promise<{
        id: string;
        name: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        role: import("@prisma/client").$Enums.UserRoleType;
        email: string;
        passwordHash: string;
    }>;
    deleteUser(req: RequestWithUser, userId: string): Promise<{
        id: string;
        name: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        role: import("@prisma/client").$Enums.UserRoleType;
        email: string;
        passwordHash: string;
    }>;
}
export {};
