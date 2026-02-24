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
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CategoriesService = class CategoriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createCategoryDto, tenantId) {
        const { name, parentId } = createCategoryDto;
        const existing = await this.prisma.category.findFirst({
            where: {
                tenantId,
                name: { equals: name, mode: 'insensitive' },
                parentId: parentId || null,
                deletedAt: null,
            },
        });
        if (existing) {
            throw new common_1.ConflictException(`Category '${name}' already exists under this parent.`);
        }
        if (parentId) {
            const parent = await this.findOne(parentId, tenantId);
            if (!parent) {
                throw new common_1.NotFoundException(`Parent category ${parentId} not found.`);
            }
        }
        return this.prisma.category.create({
            data: {
                ...createCategoryDto,
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
            this.prisma.category.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
                include: {
                    parent: { select: { id: true, name: true } },
                    children: {
                        select: {
                            id: true,
                            name: true,
                            _count: { select: { products: true } },
                        },
                    },
                    _count: { select: { products: true } },
                },
            }),
            this.prisma.category.count({ where }),
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
        const category = await this.prisma.category.findFirst({
            where: { id, tenantId, deletedAt: null },
            include: {
                parent: true,
                children: true,
                _count: { select: { products: true } },
            },
        });
        if (!category) {
            throw new common_1.NotFoundException(`Category with ID ${id} not found`);
        }
        return category;
    }
    async update(id, updateCategoryDto, tenantId) {
        await this.findOne(id, tenantId);
        const { parentId } = updateCategoryDto;
        if (parentId === id) {
            throw new common_1.ConflictException('A category cannot be its own parent.');
        }
        if (parentId) {
            const parent = await this.findOne(parentId, tenantId);
        }
        return this.prisma.category.update({
            where: { id },
            data: updateCategoryDto,
        });
    }
    async remove(id, tenantId) {
        const category = await this.findOne(id, tenantId);
        const productCount = category._count.products;
        const childrenCount = category.children.length;
        if (productCount > 0) {
            throw new common_1.ConflictException(`Cannot delete category with ${productCount} associated products.`);
        }
        if (childrenCount > 0) {
            throw new common_1.ConflictException(`Cannot delete category with ${childrenCount} sub-categories.`);
        }
        return this.prisma.category.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map