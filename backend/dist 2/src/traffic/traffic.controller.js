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
exports.TrafficController = void 0;
const common_1 = require("@nestjs/common");
const traffic_service_1 = require("./traffic.service");
const create_shipment_dto_1 = require("./dto/create-shipment.dto");
const shipment_query_dto_1 = require("./dto/shipment-query.dto");
const update_shipment_dto_1 = require("./dto/update-shipment.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const zod_validation_pipe_1 = require("../products/pipes/zod-validation.pipe");
const request_context_1 = require("../common/request-context");
let TrafficController = class TrafficController {
    trafficService;
    constructor(trafficService) {
        this.trafficService = trafficService;
    }
    getContext() {
        const store = request_context_1.RequestContext.getStore();
        if (!store || !store.tenantId) {
            throw new common_1.BadRequestException('Tenant context missing');
        }
        return { tenantId: store.tenantId, userId: store.userId || 'system' };
    }
    create(createDto) {
        const { tenantId, userId } = this.getContext();
        return this.trafficService.create(createDto, tenantId, userId);
    }
    findAll(query) {
        const { tenantId } = this.getContext();
        return this.trafficService.findAll(query, tenantId);
    }
    getStats() {
        const { tenantId } = this.getContext();
        return this.trafficService.getStats(tenantId);
    }
    findOne(id) {
        const { tenantId } = this.getContext();
        return this.trafficService.findOne(id, tenantId);
    }
    updateDocs(id, updateDto) {
        const { tenantId, userId } = this.getContext();
        return this.trafficService.updateDocs(id, updateDto, tenantId, userId);
    }
    dispatch(id) {
        const { tenantId, userId } = this.getContext();
        return this.trafficService.dispatch(id, tenantId, userId);
    }
    updateStatus(id, status) {
        const { tenantId, userId } = this.getContext();
        return this.trafficService.updateStatus(id, status, tenantId, userId);
    }
    addEvent(id, dto) {
        const { tenantId, userId } = this.getContext();
        return this.trafficService.addEvent(id, dto, tenantId, userId);
    }
    getPackingList(id) {
        const { tenantId } = this.getContext();
        return this.trafficService.getPackingList(id, tenantId);
    }
    async getDmcPdf(id, res) {
        const { tenantId } = this.getContext();
        const pdfBuffer = await this.trafficService.generateDmcPdf(id, tenantId);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=DMC-${id}.pdf`,
            'Content-Length': pdfBuffer.length,
        });
        res.end(pdfBuffer);
    }
    async getBlPdf(id, res) {
        const { tenantId } = this.getContext();
        const pdfBuffer = await this.trafficService.generateBlPdf(id, tenantId);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=BL-${id}.pdf`,
            'Content-Length': pdfBuffer.length,
        });
        res.end(pdfBuffer);
    }
    async getFreeSalePdf(id, res) {
        const { tenantId } = this.getContext();
        const pdfBuffer = await this.trafficService.generateFreeSalePdf(id, tenantId);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=FREE-SALE-${id}.pdf`,
            'Content-Length': pdfBuffer.length,
        });
        res.end(pdfBuffer);
    }
};
exports.TrafficController = TrafficController;
__decorate([
    (0, common_1.Post)('shipments'),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(create_shipment_dto_1.createShipmentSchema)),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TrafficController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('shipments'),
    __param(0, (0, common_1.Query)(new zod_validation_pipe_1.ZodValidationPipe(shipment_query_dto_1.shipmentQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TrafficController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('shipments/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TrafficController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('shipments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TrafficController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('shipments/:id/docs'),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(update_shipment_dto_1.updateTrafficDocsSchema)),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TrafficController.prototype, "updateDocs", null);
__decorate([
    (0, common_1.Post)('shipments/:id/dispatch'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TrafficController.prototype, "dispatch", null);
__decorate([
    (0, common_1.Patch)('shipments/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TrafficController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)('shipments/:id/events'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TrafficController.prototype, "addEvent", null);
__decorate([
    (0, common_1.Get)('shipments/:id/packing-list'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TrafficController.prototype, "getPackingList", null);
__decorate([
    (0, common_1.Get)('shipments/:id/dmc'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TrafficController.prototype, "getDmcPdf", null);
__decorate([
    (0, common_1.Get)('shipments/:id/bl'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TrafficController.prototype, "getBlPdf", null);
__decorate([
    (0, common_1.Get)('shipments/:id/free-sale'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TrafficController.prototype, "getFreeSalePdf", null);
exports.TrafficController = TrafficController = __decorate([
    (0, common_1.Controller)('traffic'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [traffic_service_1.TrafficService])
], TrafficController);
//# sourceMappingURL=traffic.controller.js.map