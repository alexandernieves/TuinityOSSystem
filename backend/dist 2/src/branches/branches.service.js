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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const request_context_1 = require("../common/request-context");
let BranchesService = class BranchesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getTenantId() {
        const store = request_context_1.RequestContext.getStore();
        const tenantId = store?.tenantId;
        if (!tenantId) {
            throw new Error('Missing tenantId in request context');
        }
        return tenantId;
    }
    async listForTenant() {
        const tenantId = this.getTenantId();
        return this.prisma.branch.findMany({
            where: { tenantId },
            orderBy: [{ name: 'asc' }],
        });
    }
    async findOne(id) {
        const tenantId = this.getTenantId();
        const branch = await this.prisma.branch.findFirst({
            where: { id, tenantId },
        });
        if (!branch)
            throw new common_1.NotFoundException('Sucursal no encontrada');
        return branch;
    }
    async create(dto) {
        const tenantId = this.getTenantId();
        const existing = await this.prisma.branch.findUnique({
            where: {
                tenantId_code: { tenantId, code: dto.code },
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('Ya existe una sucursal con ese código.');
        }
        return this.prisma.branch.create({
            data: {
                ...dto,
                tenantId,
            },
        });
    }
    async update(id, dto) {
        const tenantId = this.getTenantId();
        const branch = await this.findOne(id);
        if (dto.code && dto.code !== branch.code) {
            const existing = await this.prisma.branch.findUnique({
                where: {
                    tenantId_code: { tenantId, code: dto.code },
                },
            });
            if (existing) {
                throw new common_1.BadRequestException('Ya existe otra sucursal con el código solicitado.');
            }
        }
        return this.prisma.branch.update({
            where: { id },
            data: dto,
        });
    }
    async delete(id) {
        try {
            return await this.prisma.branch.delete({
                where: { id },
            });
        }
        catch (error) {
            throw new common_1.BadRequestException('No se puede eliminar la sucursal porque tiene registros asociados.');
        }
    }
};
exports.BranchesService = BranchesService;
exports.BranchesService = BranchesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BranchesService);
//# sourceMappingURL=branches.service.js.map