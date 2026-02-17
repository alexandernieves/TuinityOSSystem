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
exports.SalesController = void 0;
const common_1 = require("@nestjs/common");
const sales_service_1 = require("./sales.service");
const create_sale_dto_1 = require("./dto/create-sale.dto");
const sales_query_dto_1 = require("./dto/sales-query.dto");
const refund_sale_dto_1 = require("./dto/refund-sale.dto");
const update_sale_status_dto_1 = require("./dto/update-sale-status.dto");
const last_price_query_dto_1 = require("./dto/last-price-query.dto");
const update_sale_dto_1 = require("./dto/update-sale.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const zod_validation_pipe_1 = require("../products/pipes/zod-validation.pipe");
const permission_key_enum_1 = require("../auth/enums/permission-key.enum");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const request_context_1 = require("../common/request-context");
let SalesController = class SalesController {
    salesService;
    constructor(salesService) {
        this.salesService = salesService;
    }
    getContext() {
        const store = request_context_1.RequestContext.getStore();
        if (!store || !store.tenantId) {
            throw new common_1.BadRequestException('Tenant context missing');
        }
        return { tenantId: store.tenantId, userId: store.userId || 'system' };
    }
    create(createSaleDto) {
        const { tenantId, userId } = this.getContext();
        return this.salesService.create(createSaleDto, tenantId, userId);
    }
    findAll(query) {
        const { tenantId } = this.getContext();
        return this.salesService.findAll(query, tenantId);
    }
    findOne(id) {
        const { tenantId } = this.getContext();
        return this.salesService.findOne(id, tenantId);
    }
    getDashboardStats() {
        const { tenantId } = this.getContext();
        return this.salesService.getDashboardStats(tenantId);
    }
    findByBranch(branchId, query) {
        const { tenantId } = this.getContext();
        return this.salesService.findByBranch(branchId, query, tenantId);
    }
    voidSale(id) {
        const { tenantId, userId } = this.getContext();
        return this.salesService.voidSale(id, tenantId, userId);
    }
    refundSale(id, refundDto) {
        const { tenantId, userId } = this.getContext();
        return this.salesService.refundSale(id, refundDto, tenantId, userId);
    }
    updateStatus(id, updateDto) {
        const { tenantId, userId } = this.getContext();
        return this.salesService.updateStatus(id, updateDto, tenantId, userId);
    }
    update(id, updateDto) {
        const { tenantId, userId } = this.getContext();
        return this.salesService.update(id, updateDto, tenantId, userId);
    }
    async getQuotePdf(id, res) {
        const { tenantId } = this.getContext();
        const pdfBuffer = await this.salesService.generateQuotePdf(id, tenantId);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=Quote-${id}.pdf`,
            'Content-Length': pdfBuffer.length,
        });
        res.end(pdfBuffer);
    }
    getLastPrice(query) {
        const { tenantId } = this.getContext();
        return this.salesService.getLastPrice(query.customerId, query.productId, tenantId);
    }
};
exports.SalesController = SalesController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.CREATE_SALE),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(create_sale_dto_1.createSaleSchema)),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.VIEW_SALES),
    __param(0, (0, common_1.Query)(new zod_validation_pipe_1.ZodValidationPipe(sales_query_dto_1.salesQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.VIEW_SALES),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('stats/dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('branch/:branchId'),
    __param(0, (0, common_1.Param)('branchId')),
    __param(1, (0, common_1.Query)(new zod_validation_pipe_1.ZodValidationPipe(sales_query_dto_1.salesQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findByBranch", null);
__decorate([
    (0, common_1.Post)(':id/void'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.VOID_SALES),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "voidSale", null);
__decorate([
    (0, common_1.Post)(':id/refund'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.VOID_SALES),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(refund_sale_dto_1.refundSaleSchema)),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "refundSale", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.APPROVE_SALES),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(update_sale_status_dto_1.updateSaleStatusSchema)),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.EDIT_SALES),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(update_sale_dto_1.updateSaleSchema)),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "getQuotePdf", null);
__decorate([
    (0, common_1.Get)('last-price'),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(last_price_query_dto_1.lastPriceQuerySchema)),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "getLastPrice", null);
exports.SalesController = SalesController = __decorate([
    (0, common_1.Controller)('sales'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [sales_service_1.SalesService])
], SalesController);
//# sourceMappingURL=sales.controller.js.map