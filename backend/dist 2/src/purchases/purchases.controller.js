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
exports.PurchasesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const purchases_service_1 = require("./purchases.service");
const create_purchase_order_dto_1 = require("./dto/create-purchase-order.dto");
const receive_purchase_order_dto_1 = require("./dto/receive-purchase-order.dto");
const purchase_query_dto_1 = require("./dto/purchase-query.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const zod_validation_pipe_1 = require("../products/pipes/zod-validation.pipe");
const request_context_1 = require("../common/request-context");
let PurchasesController = class PurchasesController {
    purchasesService;
    constructor(purchasesService) {
        this.purchasesService = purchasesService;
    }
    getContext() {
        const store = request_context_1.RequestContext.getStore();
        if (!store || !store.tenantId) {
            throw new common_1.BadRequestException('Tenant context missing');
        }
        return { tenantId: store.tenantId, userId: store.userId || 'system' };
    }
    create(createPurchaseOrderDto) {
        const { tenantId, userId } = this.getContext();
        return this.purchasesService.create(createPurchaseOrderDto, tenantId, userId);
    }
    uploadFromExcel(file) {
        if (!file) {
            throw new common_1.BadRequestException('File is required');
        }
        const { tenantId } = this.getContext();
        return this.purchasesService.uploadFromExcel(file, tenantId);
    }
    receive(id, receivePurchaseOrderDto) {
        const { tenantId, userId } = this.getContext();
        return this.purchasesService.receive(id, receivePurchaseOrderDto, tenantId, userId);
    }
    findAll(query) {
        const { tenantId } = this.getContext();
        return this.purchasesService.findAll(query, tenantId);
    }
    findOne(id) {
        const { tenantId } = this.getContext();
        return this.purchasesService.findOne(id, tenantId);
    }
    getPurchaseHistory(productId) {
        const { tenantId } = this.getContext();
        return this.purchasesService.getPurchaseHistory(productId, tenantId);
    }
};
exports.PurchasesController = PurchasesController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(create_purchase_order_dto_1.createPurchaseOrderSchema)),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PurchasesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PurchasesController.prototype, "uploadFromExcel", null);
__decorate([
    (0, common_1.Patch)(':id/receive'),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(receive_purchase_order_dto_1.receivePurchaseOrderSchema)),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PurchasesController.prototype, "receive", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)(new zod_validation_pipe_1.ZodValidationPipe(purchase_query_dto_1.purchaseQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PurchasesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PurchasesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('products/:productId/history'),
    __param(0, (0, common_1.Param)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PurchasesController.prototype, "getPurchaseHistory", null);
exports.PurchasesController = PurchasesController = __decorate([
    (0, common_1.Controller)('purchases'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [purchases_service_1.PurchasesService])
], PurchasesController);
//# sourceMappingURL=purchases.controller.js.map