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
exports.PermissionsGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const permissions_decorator_1 = require("../decorators/permissions.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
let PermissionsGuard = class PermissionsGuard {
    reflector;
    prisma;
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const requiredPermissions = this.reflector.getAllAndOverride(permissions_decorator_1.PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
        if (!requiredPermissions) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const tenantId = request.headers['x-tenant-id'] || user?.tenantId;
        if (!user || !tenantId) {
            throw new common_1.ForbiddenException('User or Tenant context missing');
        }
        const userRoles = await this.prisma.userRole.findMany({
            where: { userId: user.sub || user.id },
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
            },
        });
        const userPermissions = new Set();
        userRoles.forEach((ur) => {
            ur.role.rolePermissions.forEach((rp) => {
                userPermissions.add(rp.permission.key);
            });
        });
        const fullUser = await this.prisma.user.findUnique({
            where: { id: user.sub || user.id },
        });
        if (fullUser?.role === 'OWNER') {
            request.permissions = Array.from(userPermissions);
            request.role = 'OWNER';
            return true;
        }
        const hasPermission = requiredPermissions.every((permission) => userPermissions.has(permission));
        if (!hasPermission) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        request.permissions = Array.from(userPermissions);
        request.role = fullUser?.role;
        return true;
    }
};
exports.PermissionsGuard = PermissionsGuard;
exports.PermissionsGuard = PermissionsGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], PermissionsGuard);
//# sourceMappingURL=permissions.guard.js.map