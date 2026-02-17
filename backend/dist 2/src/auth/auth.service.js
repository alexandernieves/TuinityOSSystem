"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcryptjs"));
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    configService;
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    getAccessTokenTtlSeconds() {
        const raw = this.configService.get('JWT_ACCESS_TTL_SECONDS');
        const ttl = raw ? Number(raw) : 900;
        return Number.isFinite(ttl) && ttl > 0 ? ttl : 900;
    }
    getRefreshTokenTtlDays() {
        const raw = this.configService.get('JWT_REFRESH_TTL_DAYS');
        const ttl = raw ? Number(raw) : 30;
        return Number.isFinite(ttl) && ttl > 0 ? ttl : 30;
    }
    hashToken(token) {
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    }
    async registerTenant(dto) {
        const existing = await this.prisma.tenant.findUnique({
            where: {
                slug: dto.tenantSlug,
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('Tenant slug already exists');
        }
        const passwordHash = await bcrypt.hash(dto.adminPassword, 12);
        const result = await this.prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: dto.companyName,
                    slug: dto.tenantSlug,
                },
            });
            const branch = await tx.branch.create({
                data: {
                    tenantId: tenant.id,
                    name: dto.branchName,
                    code: dto.branchCode,
                },
            });
            const roleDefinitions = [
                {
                    name: 'OWNER',
                    permissions: [
                        'MANAGE_TENANT',
                        'MANAGE_USERS',
                        'VIEW_COSTS',
                        'EDIT_PRODUCTS',
                        'DELETE_PRODUCTS',
                        'BULK_EDIT_PRICES',
                        'VIEW_PRICES',
                        'CREATE_SALE',
                        'VIEW_SALES',
                        'EDIT_SALES',
                        'APPROVE_SALES',
                        'VOID_SALES',
                        'MANAGE_CLIENTS',
                        'VIEW_INVENTORY',
                        'ADJUST_INVENTORY',
                        'MANAGE_BRANCHES',
                        'MANAGE_TRAFFIC',
                        'VIEW_TRAFFIC',
                    ],
                },
                {
                    name: 'ADMIN',
                    permissions: [
                        'MANAGE_USERS',
                        'VIEW_COSTS',
                        'EDIT_PRODUCTS',
                        'DELETE_PRODUCTS',
                        'BULK_EDIT_PRICES',
                        'VIEW_PRICES',
                        'VIEW_SALES',
                        'EDIT_SALES',
                        'APPROVE_SALES',
                        'VOID_SALES',
                        'MANAGE_CLIENTS',
                        'VIEW_INVENTORY',
                        'ADJUST_INVENTORY',
                        'MANAGE_BRANCHES',
                        'MANAGE_TRAFFIC',
                        'VIEW_TRAFFIC',
                    ],
                },
                {
                    name: 'SALES',
                    permissions: [
                        'CREATE_SALE',
                        'VIEW_SALES',
                        'VIEW_PRICES',
                        'VIEW_INVENTORY',
                        'MANAGE_CLIENTS',
                    ],
                },
                {
                    name: 'WAREHOUSE',
                    permissions: [
                        'VIEW_INVENTORY',
                        'ADJUST_INVENTORY',
                        'MANAGE_TRAFFIC',
                        'VIEW_TRAFFIC',
                    ],
                },
                {
                    name: 'TRAFFIC',
                    permissions: [
                        'MANAGE_TRAFFIC',
                        'VIEW_TRAFFIC',
                        'VIEW_SALES',
                        'VIEW_INVENTORY',
                    ],
                },
                {
                    name: 'CLIENT',
                    permissions: ['VIEW_SALES'],
                },
                {
                    name: 'MEMBER',
                    permissions: ['VIEW_INVENTORY', 'VIEW_SALES'],
                },
            ];
            const allPermissionKeys = Array.from(new Set(roleDefinitions.flatMap((r) => r.permissions)));
            await tx.permission.createMany({
                data: allPermissionKeys.map((key) => ({ key })),
                skipDuplicates: true,
            });
            const allPermissions = await tx.permission.findMany({
                where: { key: { in: allPermissionKeys } },
            });
            const permissionMap = new Map(allPermissions.map((p) => [p.key, p.id]));
            const createdRoles = [];
            for (const roleDef of roleDefinitions) {
                const role = await tx.role.create({
                    data: {
                        tenantId: tenant.id,
                        name: roleDef.name,
                    },
                });
                createdRoles.push(role);
                const rolePermissionData = roleDef.permissions
                    .map((pKey) => {
                    const pId = permissionMap.get(pKey);
                    return pId ? { roleId: role.id, permissionId: pId } : null;
                })
                    .filter((rp) => rp !== null);
                if (rolePermissionData.length > 0) {
                    await tx.rolePermission.createMany({
                        data: rolePermissionData,
                    });
                }
            }
            const ownerRole = createdRoles.find((r) => r.name === 'OWNER');
            const user = await tx.user.create({
                data: {
                    tenantId: tenant.id,
                    email: dto.adminEmail.toLowerCase(),
                    passwordHash,
                    role: 'OWNER',
                },
            });
            if (ownerRole) {
                await tx.userRole.create({
                    data: {
                        userId: user.id,
                        roleId: ownerRole.id,
                    },
                });
            }
            return { tenant, branch, ownerRole, user };
        });
        return {
            tenantId: result.tenant.id,
            tenantSlug: result.tenant.slug,
            adminUserId: result.user.id,
        };
    }
    async registerClient(dto) {
        const tenant = await this.prisma.tenant.findUnique({
            where: {
                slug: dto.tenantSlug,
            },
        });
        if (!tenant) {
            throw new common_1.BadRequestException('Empresa no encontrada');
        }
        const existingUser = await this.prisma.user.findUnique({
            where: {
                tenantId_email: {
                    tenantId: tenant.id,
                    email: dto.email,
                },
            },
        });
        if (existingUser) {
            throw new common_1.BadRequestException('El usuario ya existe');
        }
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const result = await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    tenantId: tenant.id,
                    name: dto.name,
                    email: dto.email.toLowerCase(),
                    passwordHash,
                    role: 'CLIENT',
                },
            });
            const clientRole = await tx.role.findUnique({
                where: { tenantId_name: { tenantId: tenant.id, name: 'CLIENT' } },
            });
            if (clientRole) {
                await tx.userRole.create({
                    data: {
                        userId: user.id,
                        roleId: clientRole.id,
                    },
                });
            }
            const existingCustomer = await tx.customer.findFirst({
                where: { tenantId: tenant.id, email: dto.email },
            });
            if (!existingCustomer) {
                await tx.customer.create({
                    data: {
                        tenantId: tenant.id,
                        name: dto.name,
                        email: dto.email,
                        phone: dto.phone,
                        customerType: 'CASH',
                        createdBy: user.id,
                    },
                });
            }
            return user;
        });
        const accessTokenTtlSeconds = this.getAccessTokenTtlSeconds();
        const accessToken = await this.jwtService.signAsync({
            sub: result.id,
            tenantId: tenant.id,
        }, {
            expiresIn: accessTokenTtlSeconds,
        });
        const refreshToken = (0, crypto_1.randomBytes)(48).toString('hex');
        const refreshTokenHash = this.hashToken(refreshToken);
        const expiresAt = new Date(Date.now() + this.getRefreshTokenTtlDays() * 24 * 60 * 60 * 1000);
        await this.prisma.session.create({
            data: {
                userId: result.id,
                tokenHash: refreshTokenHash,
                expiresAt,
            },
        });
        return {
            accessToken,
            refreshToken,
            tenantId: tenant.id,
            userId: result.id,
        };
    }
    async login(dto) {
        const tenant = await this.prisma.tenant.findUnique({
            where: {
                slug: dto.tenantSlug,
            },
        });
        if (!tenant) {
            throw new common_1.ForbiddenException('Invalid credentials');
        }
        const user = await this.prisma.user.findUnique({
            where: {
                tenantId_email: {
                    tenantId: tenant.id,
                    email: dto.email.toLowerCase(),
                },
            },
        });
        if (!user) {
            throw new common_1.ForbiddenException('Invalid credentials');
        }
        const ok = await bcrypt.compare(dto.password, user.passwordHash);
        if (!ok) {
            throw new common_1.ForbiddenException('Invalid credentials');
        }
        const accessTokenTtlSeconds = this.getAccessTokenTtlSeconds();
        const accessToken = await this.jwtService.signAsync({
            sub: user.id,
            tenantId: tenant.id,
        }, {
            expiresIn: accessTokenTtlSeconds,
        });
        const refreshToken = (0, crypto_1.randomBytes)(48).toString('hex');
        const refreshTokenHash = this.hashToken(refreshToken);
        const expiresAt = new Date(Date.now() + this.getRefreshTokenTtlDays() * 24 * 60 * 60 * 1000);
        await this.prisma.session.create({
            data: {
                userId: user.id,
                tokenHash: refreshTokenHash,
                expiresAt,
            },
        });
        return {
            accessToken,
            refreshToken,
            tenantId: tenant.id,
            userId: user.id,
        };
    }
    async refresh(refreshToken) {
        const refreshTokenHash = this.hashToken(refreshToken);
        const session = await this.prisma.session.findFirst({
            where: {
                tokenHash: refreshTokenHash,
                revokedAt: null,
                expiresAt: {
                    gt: new Date(),
                },
            },
            include: {
                user: true,
            },
        });
        if (!session) {
            throw new common_1.ForbiddenException('Invalid refresh token');
        }
        const accessTokenTtlSeconds = this.getAccessTokenTtlSeconds();
        const accessToken = await this.jwtService.signAsync({
            sub: session.userId,
            tenantId: session.user.tenantId,
        }, {
            expiresIn: accessTokenTtlSeconds,
        });
        const newRefreshToken = (0, crypto_1.randomBytes)(48).toString('hex');
        const newRefreshTokenHash = this.hashToken(newRefreshToken);
        const expiresAt = new Date(Date.now() + this.getRefreshTokenTtlDays() * 24 * 60 * 60 * 1000);
        await this.prisma.$transaction([
            this.prisma.session.update({
                where: {
                    id: session.id,
                },
                data: {
                    revokedAt: new Date(),
                },
            }),
            this.prisma.session.create({
                data: {
                    userId: session.userId,
                    tokenHash: newRefreshTokenHash,
                    expiresAt,
                },
            }),
        ]);
        return {
            accessToken,
            refreshToken: newRefreshToken,
        };
    }
    async logout(refreshToken) {
        const refreshTokenHash = this.hashToken(refreshToken);
        const session = await this.prisma.session.findFirst({
            where: {
                tokenHash: refreshTokenHash,
                revokedAt: null,
            },
        });
        if (!session) {
            return { ok: true };
        }
        await this.prisma.session.updateMany({
            where: {
                userId: session.userId,
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(),
            },
        });
        return { ok: true };
    }
    async deleteTenantAccount(userId, tenantId) {
        const user = await this.prisma.user.findFirst({
            where: {
                id: userId,
                tenantId,
            },
        });
        if (!user) {
            throw new common_1.ForbiddenException('Acceso denegado');
        }
        if (user.role !== 'OWNER') {
            throw new common_1.ForbiddenException('Solo el OWNER puede eliminar la cuenta');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.salesAnalytics.deleteMany({ where: { tenantId } });
            await tx.product.deleteMany({ where: { tenantId } });
            await tx.tenant.delete({ where: { id: tenantId } });
        });
        return { ok: true };
    }
    async cleanupExpiredSessions() {
        const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        await this.prisma.session.deleteMany({
            where: {
                OR: [
                    {
                        expiresAt: {
                            lt: cutoffDate,
                        },
                    },
                    {
                        revokedAt: {
                            lt: cutoffDate,
                        },
                    },
                ],
            },
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map