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
exports.CustomersController = void 0;
const common_1 = require("@nestjs/common");
const customers_service_1 = require("./customers.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const zod_validation_pipe_1 = require("../common/pipes/zod-validation.pipe");
const request_context_1 = require("../common/request-context");
const dto_1 = require("./dto");
let CustomersController = class CustomersController {
    customersService;
    constructor(customersService) {
        this.customersService = customersService;
    }
    async createCustomer(dto) {
        const store = request_context_1.RequestContext.getStore();
        if (!store?.tenantId || !store?.userId) {
            throw new common_1.UnauthorizedException();
        }
        return this.customersService.createCustomer(dto, store.tenantId, store.userId);
    }
    async listCustomers(search, customerType, creditStatus, isBlocked, page, limit) {
        const store = request_context_1.RequestContext.getStore();
        if (!store?.tenantId)
            throw new common_1.UnauthorizedException();
        return this.customersService.listCustomers(store.tenantId, {
            search,
            customerType,
            creditStatus,
            isBlocked: isBlocked === 'true',
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
    }
    async getCustomer(id) {
        const store = request_context_1.RequestContext.getStore();
        if (!store?.tenantId)
            throw new common_1.UnauthorizedException();
        return this.customersService.getCustomer(id, store.tenantId);
    }
    async updateCustomer(id, dto) {
        const store = request_context_1.RequestContext.getStore();
        if (!store?.tenantId || !store?.userId) {
            throw new common_1.UnauthorizedException();
        }
        return this.customersService.updateCustomer(id, dto, store.tenantId, store.userId);
    }
    async deleteCustomer(id) {
        const store = request_context_1.RequestContext.getStore();
        if (!store?.tenantId || !store?.userId) {
            throw new common_1.UnauthorizedException();
        }
        return this.customersService.deleteCustomer(id, store.tenantId, store.userId);
    }
    async blockCustomer(id, dto) {
        const store = request_context_1.RequestContext.getStore();
        if (!store?.tenantId || !store?.userId) {
            throw new common_1.UnauthorizedException();
        }
        return this.customersService.blockCustomer(id, dto, store.tenantId, store.userId);
    }
    async unblockCustomer(id) {
        const store = request_context_1.RequestContext.getStore();
        if (!store?.tenantId || !store?.userId) {
            throw new common_1.UnauthorizedException();
        }
        return this.customersService.unblockCustomer(id, store.tenantId, store.userId);
    }
    async approveCustomer(id, dto) {
        const store = request_context_1.RequestContext.getStore();
        if (!store?.tenantId || !store?.userId) {
            throw new common_1.UnauthorizedException();
        }
        return this.customersService.approveCustomer(id, dto, store.tenantId, store.userId);
    }
    async getAccountStatement(id, startDate, endDate) {
        const store = request_context_1.RequestContext.getStore();
        if (!store?.tenantId)
            throw new common_1.UnauthorizedException();
        return this.customersService.getAccountStatement(id, store.tenantId, {
            startDate,
            endDate,
        });
    }
    async createTransaction(dto) {
        const store = request_context_1.RequestContext.getStore();
        if (!store?.tenantId || !store?.userId) {
            throw new common_1.UnauthorizedException();
        }
        return this.customersService.createTransaction(dto, store.tenantId, store.userId);
    }
    async listTransactions(customerId, branchId, type, startDate, endDate, page, limit) {
        const store = request_context_1.RequestContext.getStore();
        if (!store?.tenantId)
            throw new common_1.UnauthorizedException();
        return this.customersService.listTransactions(store.tenantId, {
            customerId,
            branchId,
            type,
            startDate,
            endDate,
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
    }
    async voidTransaction(id, dto) {
        const store = request_context_1.RequestContext.getStore();
        if (!store?.tenantId || !store?.userId) {
            throw new common_1.UnauthorizedException();
        }
        return this.customersService.voidTransaction(id, dto, store.tenantId, store.userId);
    }
    async createArea(dto) {
        const store = request_context_1.RequestContext.getStore();
        if (!store?.tenantId)
            throw new common_1.UnauthorizedException();
        return this.customersService.createArea(dto, store.tenantId);
    }
    async listAreas() {
        const store = request_context_1.RequestContext.getStore();
        if (!store?.tenantId)
            throw new common_1.UnauthorizedException();
        return this.customersService.listAreas(store.tenantId);
    }
    async updateArea(id, dto) {
        const store = request_context_1.RequestContext.getStore();
        if (!store?.tenantId)
            throw new common_1.UnauthorizedException();
        return this.customersService.updateArea(id, dto, store.tenantId);
    }
    async deleteArea(id) {
        const store = request_context_1.RequestContext.getStore();
        if (!store?.tenantId)
            throw new common_1.UnauthorizedException();
        return this.customersService.deleteArea(id, store.tenantId);
    }
    async createSubArea(dto) {
        const store = request_context_1.RequestContext.getStore();
        if (!store?.tenantId)
            throw new common_1.UnauthorizedException();
        return this.customersService.createSubArea(dto, store.tenantId);
    }
    async listSubAreas(areaId) {
        const store = request_context_1.RequestContext.getStore();
        if (!store?.tenantId)
            throw new common_1.UnauthorizedException();
        return this.customersService.listSubAreas(store.tenantId, areaId);
    }
    async updateSubArea(id, dto) {
        const store = request_context_1.RequestContext.getStore();
        if (!store?.tenantId)
            throw new common_1.UnauthorizedException();
        return this.customersService.updateSubArea(id, dto, store.tenantId);
    }
    async deleteSubArea(id) {
        const store = request_context_1.RequestContext.getStore();
        if (!store?.tenantId)
            throw new common_1.UnauthorizedException();
        return this.customersService.deleteSubArea(id, store.tenantId);
    }
    async createSalesperson(dto) {
        const store = request_context_1.RequestContext.getStore();
        if (!store?.tenantId)
            throw new common_1.UnauthorizedException();
        return this.customersService.createSalesperson(dto, store.tenantId);
    }
    async listSalespeople(areaId, subAreaId) {
        const store = request_context_1.RequestContext.getStore();
        if (!store?.tenantId)
            throw new common_1.UnauthorizedException();
        return this.customersService.listSalespeople(store.tenantId, { areaId, subAreaId });
    }
    async updateSalesperson(id, dto) {
        const store = request_context_1.RequestContext.getStore();
        if (!store?.tenantId)
            throw new common_1.UnauthorizedException();
        return this.customersService.updateSalesperson(id, dto, store.tenantId);
    }
    async deleteSalesperson(id) {
        const store = request_context_1.RequestContext.getStore();
        if (!store?.tenantId)
            throw new common_1.UnauthorizedException();
        return this.customersService.deleteSalesperson(id, store.tenantId);
    }
    async getAgingReport() {
        const store = request_context_1.RequestContext.getStore();
        if (!store?.tenantId)
            throw new common_1.UnauthorizedException();
        return this.customersService.getAgingReport(store.tenantId);
    }
};
exports.CustomersController = CustomersController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(dto_1.createCustomerSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "createCustomer", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('customerType')),
    __param(2, (0, common_1.Query)('creditStatus')),
    __param(3, (0, common_1.Query)('isBlocked')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "listCustomers", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "getCustomer", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(dto_1.updateCustomerSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "updateCustomer", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "deleteCustomer", null);
__decorate([
    (0, common_1.Post)(':id/block'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(dto_1.blockCustomerSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "blockCustomer", null);
__decorate([
    (0, common_1.Post)(':id/unblock'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "unblockCustomer", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(dto_1.approveCustomerSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "approveCustomer", null);
__decorate([
    (0, common_1.Get)(':id/statement'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "getAccountStatement", null);
__decorate([
    (0, common_1.Post)('transactions'),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(dto_1.createCustomerTransactionSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "createTransaction", null);
__decorate([
    (0, common_1.Get)('transactions/list'),
    __param(0, (0, common_1.Query)('customerId')),
    __param(1, (0, common_1.Query)('branchId')),
    __param(2, (0, common_1.Query)('type')),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "listTransactions", null);
__decorate([
    (0, common_1.Post)('transactions/:id/void'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(dto_1.voidTransactionSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "voidTransaction", null);
__decorate([
    (0, common_1.Post)('areas'),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(dto_1.createCustomerAreaSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "createArea", null);
__decorate([
    (0, common_1.Get)('areas'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "listAreas", null);
__decorate([
    (0, common_1.Put)('areas/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(dto_1.updateCustomerAreaSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "updateArea", null);
__decorate([
    (0, common_1.Delete)('areas/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "deleteArea", null);
__decorate([
    (0, common_1.Post)('sub-areas'),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(dto_1.createCustomerSubAreaSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "createSubArea", null);
__decorate([
    (0, common_1.Get)('sub-areas'),
    __param(0, (0, common_1.Query)('areaId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "listSubAreas", null);
__decorate([
    (0, common_1.Put)('sub-areas/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(dto_1.updateCustomerSubAreaSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "updateSubArea", null);
__decorate([
    (0, common_1.Delete)('sub-areas/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "deleteSubArea", null);
__decorate([
    (0, common_1.Post)('salespeople'),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(dto_1.createSalespersonSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "createSalesperson", null);
__decorate([
    (0, common_1.Get)('salespeople'),
    __param(0, (0, common_1.Query)('areaId')),
    __param(1, (0, common_1.Query)('subAreaId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "listSalespeople", null);
__decorate([
    (0, common_1.Put)('salespeople/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(dto_1.updateSalespersonSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "updateSalesperson", null);
__decorate([
    (0, common_1.Delete)('salespeople/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "deleteSalesperson", null);
__decorate([
    (0, common_1.Get)('reports/aging'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "getAgingReport", null);
exports.CustomersController = CustomersController = __decorate([
    (0, common_1.Controller)('customers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [customers_service_1.CustomersService])
], CustomersController);
//# sourceMappingURL=customers.controller.js.map