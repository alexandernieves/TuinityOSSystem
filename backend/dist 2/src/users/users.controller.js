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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const users_service_1 = require("./users.service");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async assertOwner(req) {
        const userId = req.user?.sub;
        const tenantId = req.user?.tenantId;
        if (!userId || !tenantId) {
            throw new common_1.ForbiddenException('Acceso denegado');
        }
        const me = await this.usersService.findByIdAndTenant(userId, tenantId);
        if (!me || me.role !== 'OWNER') {
            throw new common_1.ForbiddenException('Solo el OWNER puede gestionar usuarios');
        }
    }
    async assertGlobalAdmin(req) {
        await this.assertOwner(req);
    }
    async getAllUsers(req) {
        await this.assertOwner(req);
        const tenantId = req.user?.tenantId;
        return this.usersService.findAllByTenant(tenantId);
    }
    async createUser(req, body) {
        await this.assertOwner(req);
        const tenantId = req.user?.tenantId;
        const bcrypt = require('bcryptjs');
        const password = body.password || 'Evolution2026';
        const passwordHash = await bcrypt.hash(password, 12);
        return this.usersService.createUser(tenantId, {
            email: body.email,
            name: body.name,
            passwordHash,
            role: body.role,
        });
    }
    async getAllUsersAllTenants(req) {
        await this.assertGlobalAdmin(req);
        return this.usersService.findAllUsersAllTenants();
    }
    async getAllTenants(req) {
        await this.assertGlobalAdmin(req);
        return this.usersService.findAllTenantsWithStats();
    }
    async updateUserRole(req, userId, body) {
        await this.assertOwner(req);
        const tenantId = req.user?.tenantId;
        return this.usersService.updateUserRole(userId, tenantId, body.role);
    }
    async deleteUser(req, userId) {
        await this.assertOwner(req);
        const tenantId = req.user?.tenantId;
        return this.usersService.deleteUser(userId, tenantId);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "createUser", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getAllUsersAllTenants", null);
__decorate([
    (0, common_1.Get)('admin/tenants'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getAllTenants", null);
__decorate([
    (0, common_1.Patch)(':id/role'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateUserRole", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteUser", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map