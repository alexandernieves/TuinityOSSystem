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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const inventory_service_1 = require("./inventory.service");
const create_movement_dto_1 = require("./dto/create-movement.dto");
const transfer_inventory_dto_1 = require("./dto/transfer-inventory.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const zod_validation_pipe_1 = require("../products/pipes/zod-validation.pipe");
const request_context_1 = require("../common/request-context");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const permission_key_enum_1 = require("../auth/enums/permission-key.enum");
let InventoryController = class InventoryController {
    inventoryService;
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    getContext() {
        const store = request_context_1.RequestContext.getStore();
        if (!store || !store.tenantId) {
            throw new common_1.BadRequestException('Tenant context missing');
        }
        return { tenantId: store.tenantId, userId: store.userId || 'system' };
    }
    createMovement(createMovementDto) {
        const { tenantId, userId } = this.getContext();
        return this.inventoryService.createMovement(createMovementDto, tenantId, userId);
    }
    getInventoryByBranch(branchId) {
        const { tenantId } = this.getContext();
        return this.inventoryService.getInventoryByBranch(branchId, tenantId);
    }
    getMovementsByProduct(productId, branchId) {
        const { tenantId } = this.getContext();
        return this.inventoryService.getMovementsByProduct(productId, branchId, tenantId);
    }
    getGlobalInventory() {
        const { tenantId } = this.getContext();
        return this.inventoryService.findGlobalInventory(tenantId);
    }
    getStagnantProducts(days) {
        const { tenantId } = this.getContext();
        const daysNum = days ? parseInt(days) : 120;
        return this.inventoryService.getStagnantProducts(tenantId, daysNum);
    }
    getValuationReport() {
        const { tenantId } = this.getContext();
        return this.inventoryService.getValuationReport(tenantId);
    }
    async transferInventory(dto) {
        const { tenantId, userId } = this.getContext();
        return this.inventoryService.transferInventory(dto, tenantId, userId);
    }
    async exportExcel(branchId, res) {
        const { tenantId } = this.getContext();
        const buffer = await this.inventoryService.exportExcel(branchId, tenantId);
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename=inventario-${branchId}.xlsx`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Post)('movements'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.ADJUST_INVENTORY),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(create_movement_dto_1.createMovementSchema)),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "createMovement", null);
__decorate([
    (0, common_1.Get)('branch/:branchId'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.VIEW_INVENTORY),
    __param(0, (0, common_1.Param)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getInventoryByBranch", null);
__decorate([
    (0, common_1.Get)('movements/:productId'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.VIEW_INVENTORY),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getMovementsByProduct", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.VIEW_INVENTORY),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getGlobalInventory", null);
__decorate([
    (0, common_1.Get)('stagnant'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.VIEW_INVENTORY),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getStagnantProducts", null);
__decorate([
    (0, common_1.Get)('valuation'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.VIEW_COSTS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getValuationReport", null);
__decorate([
    (0, common_1.Post)('transfers'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.ADJUST_INVENTORY),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(transfer_inventory_dto_1.transferInventorySchema)),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "transferInventory", null);
__decorate([
    (0, common_1.Get)('branch/:branchId/export'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.VIEW_INVENTORY),
    __param(0, (0, common_1.Param)('branchId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "exportExcel", null);
exports.InventoryController = InventoryController = __decorate([
    (0, common_1.Controller)('inventory'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map