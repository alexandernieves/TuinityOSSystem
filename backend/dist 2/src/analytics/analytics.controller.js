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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const analytics_service_1 = require("./analytics.service");
const request_context_1 = require("../common/request-context");
const permission_key_enum_1 = require("../auth/enums/permission-key.enum");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
let AnalyticsController = class AnalyticsController {
    service;
    constructor(service) {
        this.service = service;
    }
    getTenantId() {
        const store = request_context_1.RequestContext.getStore();
        if (!store?.tenantId)
            throw new Error('No tenant context found');
        return store.tenantId;
    }
    async getStats(period = 'month') {
        return this.service.getStats(this.getTenantId(), period);
    }
    async getTopProducts(period = 'month', limit = '10') {
        return this.service.getTopProducts(this.getTenantId(), period, parseInt(limit));
    }
    async getTopCustomers(period = 'month', limit = '10') {
        return this.service.getTopCustomers(this.getTenantId(), period, parseInt(limit));
    }
    async getLowStock(threshold = '10') {
        return this.service.getLowStock(this.getTenantId(), parseInt(threshold));
    }
    async getOverdueInvoices() {
        return this.service.getOverdueInvoices(this.getTenantId());
    }
    async getSalesTrend(period = 'month') {
        return this.service.getSalesTrend(this.getTenantId(), period);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.VIEW_SALES),
    __param(0, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('top-products'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.VIEW_SALES),
    __param(0, (0, common_1.Query)('period')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getTopProducts", null);
__decorate([
    (0, common_1.Get)('top-customers'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.VIEW_SALES),
    __param(0, (0, common_1.Query)('period')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getTopCustomers", null);
__decorate([
    (0, common_1.Get)('low-stock'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.VIEW_INVENTORY),
    __param(0, (0, common_1.Query)('threshold')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getLowStock", null);
__decorate([
    (0, common_1.Get)('overdue-invoices'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.VIEW_SALES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getOverdueInvoices", null);
__decorate([
    (0, common_1.Get)('sales-trend'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.VIEW_SALES),
    __param(0, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getSalesTrend", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.Controller)('analytics'),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map