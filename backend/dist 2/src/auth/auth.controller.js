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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const auth_service_1 = require("./auth.service");
const login_dto_1 = require("./dto/login.dto");
const register_tenant_dto_1 = require("./dto/register-tenant.dto");
const register_client_dto_1 = require("./dto/register-client.dto");
const refresh_dto_1 = require("./dto/refresh.dto");
const logout_dto_1 = require("./dto/logout.dto");
const common_2 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
let AuthController = class AuthController {
    authService;
    usersService;
    constructor(authService, usersService) {
        this.authService = authService;
        this.usersService = usersService;
    }
    async registerTenant(body) {
        const dto = register_tenant_dto_1.RegisterTenantDtoSchema.parse(body);
        return this.authService.registerTenant(dto);
    }
    async registerClient(body) {
        const dto = register_client_dto_1.RegisterClientDtoSchema.parse(body);
        return this.authService.registerClient(dto);
    }
    async login(body) {
        const dto = login_dto_1.LoginDtoSchema.parse(body);
        return this.authService.login(dto);
    }
    async refresh(body) {
        const dto = refresh_dto_1.RefreshDtoSchema.parse(body);
        return this.authService.refresh(dto.refreshToken);
    }
    async logout(body) {
        const dto = logout_dto_1.LogoutDtoSchema.parse(body);
        return this.authService.logout(dto.refreshToken);
    }
    async me(req) {
        const userId = req.user?.sub;
        const tenantId = req.user?.tenantId;
        if (!userId || !tenantId) {
            return {
                userId,
                tenantId,
            };
        }
        const user = await this.usersService.findByIdAndTenant(userId, tenantId);
        return {
            userId,
            tenantId,
            email: user?.email,
            name: user?.name,
            role: user?.role,
        };
    }
    async deleteAccount(req) {
        const userId = req.user?.sub;
        const tenantId = req.user?.tenantId;
        if (!userId || !tenantId) {
            throw new common_1.ForbiddenException('Acceso denegado');
        }
        return this.authService.deleteTenantAccount(userId, tenantId);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    (0, common_1.Post)('register-tenant'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "registerTenant", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    (0, common_1.Post)('register-client'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "registerClient", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60000 } }),
    (0, common_1.Post)('refresh'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_2.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
__decorate([
    (0, common_2.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)('account'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "deleteAccount", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        users_service_1.UsersService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map