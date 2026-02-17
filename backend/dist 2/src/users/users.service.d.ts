import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByTenantAndEmail(tenantId: string, email: string): Promise<{
        id: string;
        name: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        role: import("@prisma/client").$Enums.UserRoleType;
        email: string;
        passwordHash: string;
    } | null>;
    findById(userId: string): Promise<{
        id: string;
        name: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        role: import("@prisma/client").$Enums.UserRoleType;
        email: string;
        passwordHash: string;
    } | null>;
    findByIdAndTenant(userId: string, tenantId: string): Promise<{
        id: string;
        name: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        role: import("@prisma/client").$Enums.UserRoleType;
        email: string;
        passwordHash: string;
    } | null>;
    findAllByTenant(tenantId: string): Promise<{
        id: string;
        name: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        createdAt: Date;
        updatedAt: Date;
        role: import("@prisma/client").$Enums.UserRoleType;
        email: string;
    }[]>;
    findAllUsersAllTenants(): Promise<{
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
    findAllTenantsWithStats(): Promise<{
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
    createUser(tenantId: string, dto: {
        email: string;
        name: string;
        passwordHash: string;
        role: any;
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
    updateUserRole(userId: string, tenantId: string, role: 'CLIENT' | 'MEMBER' | 'ADMIN' | 'OWNER' | 'SALES' | 'WAREHOUSE' | 'TRAFFIC'): Promise<{
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
    deleteUser(userId: string, tenantId: string): Promise<{
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
