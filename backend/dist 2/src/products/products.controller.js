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
exports.ProductsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const products_service_1 = require("./products.service");
const create_product_dto_1 = require("./dto/create-product.dto");
const update_product_dto_1 = require("./dto/update-product.dto");
const product_query_dto_1 = require("./dto/product-query.dto");
const bulk_update_prices_dto_1 = require("./dto/bulk-update-prices.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const zod_validation_pipe_1 = require("./pipes/zod-validation.pipe");
const permission_key_enum_1 = require("../auth/enums/permission-key.enum");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const request_context_1 = require("../common/request-context");
let ProductsController = class ProductsController {
    productsService;
    constructor(productsService) {
        this.productsService = productsService;
    }
    getContext() {
        const store = request_context_1.RequestContext.getStore();
        if (!store || !store.tenantId) {
            throw new common_1.BadRequestException('Tenant context missing');
        }
        return { tenantId: store.tenantId, userId: store.userId || 'system' };
    }
    create(createProductDto) {
        const { tenantId, userId } = this.getContext();
        return this.productsService.create(createProductDto, tenantId, userId);
    }
    findAll(query) {
        const { tenantId } = this.getContext();
        return this.productsService.findAll(query, tenantId);
    }
    findOne(id) {
        const { tenantId } = this.getContext();
        return this.productsService.findOne(id, tenantId);
    }
    update(id, updateProductDto) {
        const { tenantId, userId } = this.getContext();
        return this.productsService.update(id, updateProductDto, tenantId, userId);
    }
    async remove(id) {
        const { tenantId, userId } = this.getContext();
        await this.productsService.remove(id, tenantId, userId);
    }
    bulkUpdatePrices(dto) {
        const { tenantId, userId } = this.getContext();
        return this.productsService.bulkUpdatePrices(dto.updates, tenantId, userId);
    }
    async uploadImage(id, file) {
        if (!file)
            throw new common_1.BadRequestException('No file uploaded');
        const { tenantId, userId } = this.getContext();
        const imageUrl = `/uploads/products/images/${file.filename}`;
        return this.productsService.updateImage(id, imageUrl, tenantId, userId);
    }
    async import(file) {
        if (!file)
            throw new common_1.BadRequestException('No file uploaded');
        const { tenantId, userId } = this.getContext();
        return this.productsService.bulkImport(file.buffer, tenantId, userId);
    }
};
exports.ProductsController = ProductsController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.EDIT_PRODUCTS),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(create_product_dto_1.createProductSchema)),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)(new zod_validation_pipe_1.ZodValidationPipe(product_query_dto_1.productQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.EDIT_PRODUCTS),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(update_product_dto_1.updateProductSchema)),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.DELETE_PRODUCTS),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('bulk/prices'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.BULK_EDIT_PRICES),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(bulk_update_prices_dto_1.bulkUpdatePricesSchema)),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "bulkUpdatePrices", null);
__decorate([
    (0, common_1.Post)(':id/image'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/products/images',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, `${file.fieldname}-${uniqueSuffix}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "uploadImage", null);
__decorate([
    (0, common_1.Post)('bulk/import'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "import", null);
exports.ProductsController = ProductsController = __decorate([
    (0, common_1.Controller)('products'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [products_service_1.ProductsService])
], ProductsController);
//# sourceMappingURL=products.controller.js.map