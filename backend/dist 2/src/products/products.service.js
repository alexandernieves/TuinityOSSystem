"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const request_context_1 = require("../common/request-context");
const client_1 = require("@prisma/client");
const XLSX = __importStar(require("xlsx"));
let ProductsService = class ProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createProductDto, tenantId, userId) {
        const { barcodes, forceCreate, categoryId, brandId, ...productData } = createProductDto;
        if (!forceCreate) {
            await this.detectDuplicates(createProductDto, tenantId);
        }
        if (categoryId) {
            const category = await this.prisma.category.findFirst({
                where: { id: categoryId, tenantId, deletedAt: null },
            });
            if (!category)
                throw new common_1.NotFoundException(`Category ${categoryId} not found`);
        }
        if (brandId) {
            const brand = await this.prisma.brand.findFirst({
                where: { id: brandId, tenantId, deletedAt: null },
            });
            if (!brand)
                throw new common_1.NotFoundException(`Brand ${brandId} not found`);
        }
        return this.prisma.product.create({
            data: {
                ...productData,
                tenantId,
                categoryId,
                brandId,
                createdBy: userId,
                updatedBy: userId,
                barcodes: barcodes && barcodes.length > 0
                    ? {
                        createMany: {
                            data: barcodes.map((code) => ({ barcode: code, tenantId })),
                        },
                    }
                    : undefined,
            },
            include: {
                barcodes: true,
                category: true,
                brand: true,
            },
        });
    }
    async detectDuplicates(dto, tenantId) {
        const { description, codigoArancelario, barcodes } = dto;
        const normalizedDesc = description.trim();
        const potentialMatches = await this.prisma.product.findMany({
            where: {
                tenantId,
                deletedAt: null,
                OR: [
                    { description: { contains: normalizedDesc, mode: 'insensitive' } },
                    { description_es: { contains: normalizedDesc, mode: 'insensitive' } },
                    { description_en: { contains: normalizedDesc, mode: 'insensitive' } },
                    { description_pt: { contains: normalizedDesc, mode: 'insensitive' } },
                    {
                        codigoArancelario: {
                            equals: codigoArancelario,
                            mode: 'insensitive',
                        },
                    },
                    ...(barcodes && barcodes.length > 0
                        ? [{ barcodes: { some: { barcode: { in: barcodes } } } }]
                        : []),
                ],
            },
            include: { barcodes: true },
        });
        if (potentialMatches.length > 0) {
            const matches = potentialMatches.map((p) => {
                let matchedBy = 'description';
                const barcodeMatch = p.barcodes.some((b) => barcodes?.includes(b.barcode));
                const codeMatch = p.codigoArancelario &&
                    codigoArancelario &&
                    p.codigoArancelario.toLowerCase() === codigoArancelario.toLowerCase();
                if (barcodeMatch)
                    matchedBy = 'barcode';
                else if (codeMatch)
                    matchedBy = 'codigoArancelario';
                else
                    matchedBy = 'description';
                return {
                    id: p.id,
                    description: p.description,
                    matchedBy,
                };
            });
            throw new common_1.ConflictException({
                conflict: true,
                message: 'Potential duplicate products found',
                matches,
            });
        }
    }
    async findAll(query, tenantId) {
        const { page, limit, search } = query;
        const skip = (page - 1) * limit;
        const where = {
            tenantId,
            deletedAt: null,
            ...(search
                ? {
                    OR: [
                        { description: { contains: search, mode: 'insensitive' } },
                        { description_es: { contains: search, mode: 'insensitive' } },
                        { description_en: { contains: search, mode: 'insensitive' } },
                        { description_pt: { contains: search, mode: 'insensitive' } },
                        {
                            barcodes: {
                                some: { barcode: { contains: search, mode: 'insensitive' } },
                            },
                        },
                    ],
                }
                : {}),
        };
        const [items, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    barcodes: true,
                    category: true,
                    brand: true
                },
            }),
            this.prisma.product.count({ where }),
        ]);
        return {
            items: items.map((item) => this.filterSensitiveData(item)),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id, tenantId) {
        const product = await this.prisma.product.findFirst({
            where: { id, tenantId, deletedAt: null },
            include: {
                barcodes: true,
                category: true,
                brand: true,
                inventory: true
            },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Product with ID ${id} not found`);
        }
        return this.filterSensitiveData(product);
    }
    filterSensitiveData(product) {
        const store = request_context_1.RequestContext.getStore();
        if (!store)
            return product;
        const permissions = new Set(store.permissions || []);
        const filtered = { ...product };
        if (!permissions.has('VIEW_COSTS') && store.role !== 'OWNER') {
            delete filtered.lastFobCost;
            delete filtered.lastCifCost;
            delete filtered.weightedAvgCost;
        }
        if (!permissions.has('VIEW_PRICES') && store.role !== 'OWNER') {
            delete filtered.price_a;
            delete filtered.price_b;
            delete filtered.price_c;
            delete filtered.price_d;
            delete filtered.price_e;
        }
        return filtered;
    }
    async update(id, updateProductDto, tenantId, userId) {
        await this.findOne(id, tenantId);
        const { barcodes, ...data } = updateProductDto;
        return this.prisma.product.update({
            where: { id },
            data: {
                ...data,
                updatedBy: userId,
                barcodes: barcodes
                    ? {
                        deleteMany: {},
                        createMany: {
                            data: barcodes.map((code) => ({ barcode: code, tenantId })),
                        },
                    }
                    : undefined,
            },
            include: { barcodes: true },
        });
    }
    async remove(id, tenantId, userId) {
        await this.findOne(id, tenantId);
        return this.prisma.product.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
    }
    async bulkUpdatePrices(updates, tenantId, userId) {
        const results = {
            updated: 0,
            errors: [],
        };
        for (const update of updates) {
            try {
                const product = await this.prisma.product.findFirst({
                    where: { id: update.productId, tenantId, deletedAt: null },
                });
                if (!product) {
                    results.errors.push(`Product ${update.productId} not found`);
                    continue;
                }
                const updateData = { updatedBy: userId };
                if (update.price_a !== undefined)
                    updateData.price_a = update.price_a;
                if (update.price_b !== undefined)
                    updateData.price_b = update.price_b;
                if (update.price_c !== undefined)
                    updateData.price_c = update.price_c;
                if (update.price_d !== undefined)
                    updateData.price_d = update.price_d;
                if (update.price_e !== undefined)
                    updateData.price_e = update.price_e;
                await this.prisma.product.update({
                    where: { id: update.productId },
                    data: updateData,
                });
                results.updated++;
            }
            catch (error) {
                results.errors.push(`Error updating ${update.productId}: ${error.message}`);
            }
        }
        return results;
    }
    async updateImage(id, imageUrl, tenantId, userId) {
        const product = await this.prisma.product.findFirst({
            where: { id, tenantId, deletedAt: null },
        });
        if (!product)
            throw new common_1.NotFoundException(`Product ${id} not found`);
        return this.prisma.product.update({
            where: { id },
            data: {
                mainImageUrl: imageUrl,
                updatedBy: userId,
            },
        });
    }
    async bulkImport(buffer, tenantId, userId) {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        const results = {
            created: 0,
            updated: 0,
            errors: [],
        };
        const categories = await this.prisma.category.findMany({
            where: { tenantId },
        });
        const brands = await this.prisma.brand.findMany({ where: { tenantId } });
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const description = row.Description || row.description;
            if (!description) {
                results.errors.push({ row: i + 2, error: 'Missing description' });
                continue;
            }
            try {
                let categoryId = null;
                const categoryName = row.Category || row.category;
                if (categoryName) {
                    let category = categories.find((c) => c.name.toLowerCase() === categoryName.toString().toLowerCase());
                    if (!category) {
                        category = await this.prisma.category.create({
                            data: { name: categoryName.toString(), tenantId },
                        });
                        categories.push(category);
                    }
                    categoryId = category.id;
                }
                let brandId = null;
                const brandName = row.Brand || row.brand;
                if (brandName) {
                    let brand = brands.find((b) => b.name.toLowerCase() === brandName.toString().toLowerCase());
                    if (!brand) {
                        brand = await this.prisma.brand.create({
                            data: { name: brandName.toString(), tenantId },
                        });
                        brands.push(brand);
                    }
                    brandId = brand.id;
                }
                const productData = {
                    description: description.toString(),
                    description_es: (row.Description_ES || row.description_es)?.toString(),
                    description_en: (row.Description_EN || row.description_en)?.toString(),
                    codigoArancelario: (row.TariffCode ||
                        row.tariffCode ||
                        row.codigoArancelario)?.toString(),
                    paisOrigen: (row.Origin || row.origin || row.paisOrigen)?.toString(),
                    weight: row.Weight || row.weight
                        ? new client_1.Prisma.Decimal(row.Weight || row.weight)
                        : null,
                    volume: row.Volume || row.volume
                        ? new client_1.Prisma.Decimal(row.Volume || row.volume)
                        : null,
                    unitsPerBox: row.UnitsPerBox || row.unitsPerBox
                        ? parseInt(row.UnitsPerBox || row.unitsPerBox)
                        : 1,
                    price_a: new client_1.Prisma.Decimal(row.PriceA || row.price_a || 0),
                    price_b: new client_1.Prisma.Decimal(row.PriceB || row.price_b || 0),
                    price_c: new client_1.Prisma.Decimal(row.PriceC || row.price_c || 0),
                    price_d: new client_1.Prisma.Decimal(row.PriceD || row.price_d || 0),
                    price_e: new client_1.Prisma.Decimal(row.PriceE || row.price_e || 0),
                    categoryId,
                    brandId,
                    tenantId,
                    updatedBy: userId,
                };
                const existingProduct = await this.prisma.product.findFirst({
                    where: {
                        description: productData.description,
                        tenantId,
                        deletedAt: null,
                    },
                });
                if (existingProduct) {
                    await this.prisma.product.update({
                        where: { id: existingProduct.id },
                        data: productData,
                    });
                    results.updated++;
                }
                else {
                    await this.prisma.product.create({
                        data: {
                            ...productData,
                            createdBy: userId,
                        },
                    });
                    results.created++;
                }
            }
            catch (error) {
                results.errors.push({ row: i + 2, error: error.message });
            }
        }
        return results;
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map