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
exports.ReceivablesController = void 0;
const common_1 = require("@nestjs/common");
const receivables_service_1 = require("./receivables.service");
const request_context_1 = require("../common/request-context");
const permission_key_enum_1 = require("../auth/enums/permission-key.enum");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
let ReceivablesController = class ReceivablesController {
    service;
    constructor(service) {
        this.service = service;
    }
    getContext() {
        const store = request_context_1.RequestContext.getStore();
        if (!store)
            throw new Error('No context found');
        return store;
    }
    async getDashboard() {
        const { tenantId } = this.getContext();
        return this.service.getDashboard(tenantId);
    }
    async getAgingReport() {
        const { tenantId } = this.getContext();
        return this.service.getAgingReport(tenantId);
    }
    async recordInteraction(dto) {
        const { tenantId, userId } = this.getContext();
        return this.service.recordInteraction(dto, tenantId, userId);
    }
    async getInteractions(customerId) {
        const { tenantId } = this.getContext();
        return this.service.getInteractions(customerId, tenantId);
    }
    async runAutoBlock() {
        const { tenantId } = this.getContext();
        return this.service.runAutomaticBlocking(tenantId);
    }
};
exports.ReceivablesController = ReceivablesController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.VIEW_SALES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReceivablesController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('aging-report'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.VIEW_SALES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReceivablesController.prototype, "getAgingReport", null);
__decorate([
    (0, common_1.Post)('interactions'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.MANAGE_CLIENTS),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReceivablesController.prototype, "recordInteraction", null);
__decorate([
    (0, common_1.Get)('interactions/:customerId'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.VIEW_CLIENTS),
    __param(0, (0, common_1.Param)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReceivablesController.prototype, "getInteractions", null);
__decorate([
    (0, common_1.Post)('auto-block'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.APPROVE_CREDIT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReceivablesController.prototype, "runAutoBlock", null);
exports.ReceivablesController = ReceivablesController = __decorate([
    (0, common_1.Controller)('receivables'),
    __metadata("design:paramtypes", [receivables_service_1.ReceivablesService])
], ReceivablesController);
//# sourceMappingURL=receivables.controller.js.map