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
exports.SalePaymentsController = exports.CustomerPaymentsController = exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const payments_service_1 = require("./payments.service");
const create_payment_dto_1 = require("./dto/create-payment.dto");
const payment_query_dto_1 = require("./dto/payment-query.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const zod_validation_pipe_1 = require("../products/pipes/zod-validation.pipe");
const request_context_1 = require("../common/request-context");
let PaymentsController = class PaymentsController {
    paymentsService;
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    getContext() {
        const store = request_context_1.RequestContext.getStore();
        if (!store || !store.tenantId) {
            throw new common_1.BadRequestException('Tenant context missing');
        }
        return { tenantId: store.tenantId, userId: store.userId || 'system' };
    }
    create(createPaymentDto) {
        const { tenantId, userId } = this.getContext();
        return this.paymentsService.create(createPaymentDto, tenantId, userId);
    }
    findOne(id) {
        const { tenantId } = this.getContext();
        return this.paymentsService.findOne(id, tenantId);
    }
    findAll(query) {
        const { tenantId } = this.getContext();
        return this.paymentsService.findAll(query, tenantId);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(create_payment_dto_1.createPaymentSchema)),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)(new zod_validation_pipe_1.ZodValidationPipe(payment_query_dto_1.paymentQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "findAll", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.Controller)('payments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
let CustomerPaymentsController = class CustomerPaymentsController {
    paymentsService;
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    getTenantId() {
        const store = request_context_1.RequestContext.getStore();
        if (!store || !store.tenantId)
            throw new common_1.BadRequestException('Tenant context missing');
        return store.tenantId;
    }
    getCustomerPayments(customerId) {
        const tenantId = this.getTenantId();
        return this.paymentsService.findAll({ page: 1, limit: 100, customerId }, tenantId);
    }
    getAccountStatus(customerId) {
        const tenantId = this.getTenantId();
        return this.paymentsService.getAccountStatus(customerId, tenantId);
    }
    async getAccountStatementPdf(customerId, res) {
        const tenantId = this.getTenantId();
        const pdfBuffer = await this.paymentsService.generateAccountStatementPdf(customerId, tenantId);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=STATEMENT-${customerId}.pdf`,
            'Content-Length': pdfBuffer.length,
        });
        res.end(pdfBuffer);
    }
};
exports.CustomerPaymentsController = CustomerPaymentsController;
__decorate([
    (0, common_1.Get)('payments'),
    __param(0, (0, common_1.Param)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CustomerPaymentsController.prototype, "getCustomerPayments", null);
__decorate([
    (0, common_1.Get)('account-status'),
    __param(0, (0, common_1.Param)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CustomerPaymentsController.prototype, "getAccountStatus", null);
__decorate([
    (0, common_1.Get)('account-statement'),
    __param(0, (0, common_1.Param)('customerId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomerPaymentsController.prototype, "getAccountStatementPdf", null);
exports.CustomerPaymentsController = CustomerPaymentsController = __decorate([
    (0, common_1.Controller)('customers/:customerId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], CustomerPaymentsController);
let SalePaymentsController = class SalePaymentsController {
    paymentsService;
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    getSalePayments(saleId) {
        const store = request_context_1.RequestContext.getStore();
        if (!store || !store.tenantId)
            throw new common_1.BadRequestException('Tenant context missing');
        return this.paymentsService.getSalePayments(saleId, store.tenantId);
    }
};
exports.SalePaymentsController = SalePaymentsController;
__decorate([
    (0, common_1.Get)('payments'),
    __param(0, (0, common_1.Param)('saleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalePaymentsController.prototype, "getSalePayments", null);
exports.SalePaymentsController = SalePaymentsController = __decorate([
    (0, common_1.Controller)('sales/:saleId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], SalePaymentsController);
//# sourceMappingURL=payments.controller.js.map