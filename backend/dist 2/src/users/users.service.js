"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const request_context_1 = require("../common/request-context");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByTenantAndEmail(tenantId, email) {
        return this.prisma.user.findUnique({
            where: {
                tenantId_email: {
                    tenantId,
                    email,
                },
            },
        });
    }
    async findById(userId) {
        const store = request_context_1.RequestContext.getStore();
        const tenantId = store?.tenantId;
        if (!tenantId) {
            throw new Error('Missing tenantId in request context');
        }
        return this.prisma.user.findFirst({
            where: {
                id: userId,
                tenantId,
            },
        });
    }
    async findByIdAndTenant(userId, tenantId) {
        return this.prisma.user.findFirst({
            where: {
                id: userId,
                tenantId,
            },
        });
    }
    async findAllByTenant(tenantId) {
        return this.prisma.user.findMany({
            where: {
                tenantId,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async findAllUsersAllTenants() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async findAllTenantsWithStats() {
        return this.prisma.tenant.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                createdAt: true,
                _count: {
                    select: {
                        users: true,
                        branches: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async createUser(tenantId, dto) {
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    tenantId,
                    email: dto.email.toLowerCase(),
                    name: dto.name,
                    passwordHash: dto.passwordHash,
                    role: dto.role,
                },
            });
            const role = await tx.role.findFirst({
                where: {
                    tenantId,
                    name: dto.role,
                },
            });
            if (role) {
                await tx.userRole.create({
                    data: {
                        userId: user.id,
                        roleId: role.id,
                    },
                });
            }
            return user;
        });
    }
    async updateUserRole(userId, tenantId, role) {
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.update({
                where: { id: userId },
                data: { role: role },
            });
            await tx.userRole.deleteMany({
                where: { userId },
            });
            const roleRecord = await tx.role.findFirst({
                where: {
                    tenantId,
                    name: role,
                },
            });
            if (roleRecord) {
                await tx.userRole.create({
                    data: {
                        userId,
                        roleId: roleRecord.id,
                    },
                });
            }
            return user;
        });
    }
    async deleteUser(userId, tenantId) {
        return this.prisma.user.delete({
            where: {
                id: userId,
            },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map