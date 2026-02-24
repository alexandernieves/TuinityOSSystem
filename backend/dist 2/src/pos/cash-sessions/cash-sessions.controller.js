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
exports.CashSessionsController = void 0;
const common_1 = require("@nestjs/common");
const cash_sessions_service_1 = require("./cash-sessions.service");
const open_session_dto_1 = require("./dto/open-session.dto");
const close_session_dto_1 = require("./dto/close-session.dto");
const zod_validation_pipe_1 = require("../../common/pipes/zod-validation.pipe");
const request_context_1 = require("../../common/request-context");
const permission_key_enum_1 = require("../../auth/enums/permission-key.enum");
const permissions_decorator_1 = require("../../auth/decorators/permissions.decorator");
let CashSessionsController = class CashSessionsController {
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
    getActive() {
        const { userId, tenantId } = this.getContext();
        return this.service.getActiveSession(userId, tenantId);
    }
    open(dto) {
        const { userId, tenantId } = this.getContext();
        return this.service.openSession(dto, userId, tenantId);
    }
    close(id, dto) {
        const { userId, tenantId } = this.getContext();
        return this.service.closeSession(id, dto, userId, tenantId);
    }
    getReport(id) {
        const { tenantId } = this.getContext();
        return this.service.getSessionReport(id, tenantId);
    }
};
exports.CashSessionsController = CashSessionsController;
__decorate([
    (0, common_1.Get)('active'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.MANAGE_POS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CashSessionsController.prototype, "getActive", null);
__decorate([
    (0, common_1.Post)('open'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.MANAGE_POS),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(open_session_dto_1.openSessionSchema)),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CashSessionsController.prototype, "open", null);
__decorate([
    (0, common_1.Patch)(':id/close'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.MANAGE_POS),
    (0, common_1.UsePipes)(new zod_validation_pipe_1.ZodValidationPipe(close_session_dto_1.closeSessionSchema)),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CashSessionsController.prototype, "close", null);
__decorate([
    (0, common_1.Get)(':id/report'),
    (0, permissions_decorator_1.RequirePermissions)(permission_key_enum_1.PermissionKey.MANAGE_POS),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CashSessionsController.prototype, "getReport", null);
exports.CashSessionsController = CashSessionsController = __decorate([
    (0, common_1.Controller)('pos/cash-sessions'),
    __metadata("design:paramtypes", [cash_sessions_service_1.CashSessionsService])
], CashSessionsController);
//# sourceMappingURL=cash-sessions.controller.js.map