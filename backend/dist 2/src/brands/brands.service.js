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
exports.BrandsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BrandsService = class BrandsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createBrandDto, tenantId) {
        const { name } = createBrandDto;
        const existing = await this.prisma.brand.findFirst({
            where: {
                tenantId,
                name: { equals: name, mode: 'insensitive' },
                deletedAt: null,
            },
        });
        if (existing) {
            throw new common_1.ConflictException(`Brand '${name}' already exists.`);
        }
        return this.prisma.brand.create({
            data: {
                ...createBrandDto,
                tenantId,
            },
        });
    }
    async findAll(query, tenantId) {
        const { page, limit, search } = query;
        const skip = (page - 1) * limit;
        const where = {
            tenantId,
            deletedAt: null,
            ...(search
                ? {
                    name: { contains: search, mode: 'insensitive' },
                }
                : {}),
        };
        const [items, total] = await Promise.all([
            this.prisma.brand.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
                include: {
                    _count: { select: { products: true } },
                },
            }),
            this.prisma.brand.count({ where }),
        ]);
        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id, tenantId) {
        const brand = await this.prisma.brand.findFirst({
            where: { id, tenantId, deletedAt: null },
            include: {
                _count: { select: { products: true } },
            },
        });
        if (!brand) {
            throw new common_1.NotFoundException(`Brand with ID ${id} not found`);
        }
        return brand;
    }
    async update(id, updateBrandDto, tenantId) {
        await this.findOne(id, tenantId);
        const { name } = updateBrandDto;
        if (name) {
            const existing = await this.prisma.brand.findFirst({
                where: {
                    tenantId,
                    name: { equals: name, mode: 'insensitive' },
                    id: { not: id },
                    deletedAt: null,
                },
            });
            if (existing) {
                throw new common_1.ConflictException(`Brand '${name}' already exists.`);
            }
        }
        return this.prisma.brand.update({
            where: { id },
            data: updateBrandDto,
        });
    }
    async remove(id, tenantId) {
        const brand = await this.findOne(id, tenantId);
        const productCount = brand._count.products;
        if (productCount > 0) {
            throw new common_1.ConflictException(`Cannot delete brand with ${productCount} associated products.`);
        }
        return this.prisma.brand.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });
    }
};
exports.BrandsService = BrandsService;
exports.BrandsService = BrandsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BrandsService);
//# sourceMappingURL=brands.service.js.map