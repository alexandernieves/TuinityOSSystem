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
exports.IntelligenceController = void 0;
const common_1 = require("@nestjs/common");
const intelligence_service_1 = require("./intelligence.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const request_context_1 = require("../common/request-context");
let IntelligenceController = class IntelligenceController {
    intelligenceService;
    constructor(intelligenceService) {
        this.intelligenceService = intelligenceService;
    }
    getContext() {
        const store = request_context_1.RequestContext.getStore();
        if (!store || !store.tenantId) {
            throw new common_1.BadRequestException('Tenant context missing');
        }
        return { tenantId: store.tenantId, userId: store.userId || 'system' };
    }
    getReplenishment() {
        const { tenantId } = this.getContext();
        return this.intelligenceService.getReplenishmentSuggestions(tenantId);
    }
    getDeadStock() {
        const { tenantId } = this.getContext();
        return this.intelligenceService.getDeadStock(tenantId);
    }
    getForecasting() {
        const { tenantId } = this.getContext();
        return this.intelligenceService.getForecasting(tenantId);
    }
    getPrices() {
        const { tenantId } = this.getContext();
        return this.intelligenceService.getPriceOptimizationSuggestions(tenantId);
    }
    updateSettings(dto) {
        const { tenantId } = this.getContext();
        return this.intelligenceService.updateSettings(tenantId, dto);
    }
    applyPrice(dto) {
        const { tenantId } = this.getContext();
        return this.intelligenceService.applyPriceSuggestion(tenantId, dto.productId, dto.prices);
    }
    query(q) {
        const { tenantId } = this.getContext();
        return this.intelligenceService.processQuery(tenantId, q);
    }
};
exports.IntelligenceController = IntelligenceController;
__decorate([
    (0, common_1.Get)('replenishment'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], IntelligenceController.prototype, "getReplenishment", null);
__decorate([
    (0, common_1.Get)('dead-stock'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], IntelligenceController.prototype, "getDeadStock", null);
__decorate([
    (0, common_1.Get)('forecasting'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], IntelligenceController.prototype, "getForecasting", null);
__decorate([
    (0, common_1.Get)('prices'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], IntelligenceController.prototype, "getPrices", null);
__decorate([
    (0, common_1.Patch)('settings'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IntelligenceController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Post)('apply-price'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IntelligenceController.prototype, "applyPrice", null);
__decorate([
    (0, common_1.Get)('query'),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], IntelligenceController.prototype, "query", null);
exports.IntelligenceController = IntelligenceController = __decorate([
    (0, common_1.Controller)('intelligence'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [intelligence_service_1.IntelligenceService])
], IntelligenceController);
//# sourceMappingURL=intelligence.controller.js.map