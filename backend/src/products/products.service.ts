import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestContext } from '../common/request-context';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(
    createProductDto: CreateProductDto,
    tenantId: string,
    userId: string,
  ) {
    const { barcodes, forceCreate, categoryId, brandId, ...productData } =
      createProductDto;

    if (!forceCreate) {
      await this.detectDuplicates(createProductDto, tenantId);
    }

    // Validate Category
    if (categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: categoryId, tenantId, deletedAt: null },
      });
      if (!category)
        throw new NotFoundException(`Category ${categoryId} not found`);
    }

    // Validate Brand
    if (brandId) {
      const brand = await this.prisma.brand.findFirst({
        where: { id: brandId, tenantId, deletedAt: null },
      });
      if (!brand) throw new NotFoundException(`Brand ${brandId} not found`);
    }

    return this.prisma.product.create({
      data: {
        ...productData,
        tenantId,
        categoryId,
        brandId,
        createdBy: userId,
        updatedBy: userId,
        barcodes:
          barcodes && barcodes.length > 0
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

  private async detectDuplicates(dto: CreateProductDto, tenantId: string) {
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
        let matchedBy: 'barcode' | 'description' | 'codigoArancelario' =
          'description';

        // Determinate primary match reason by priority: Barcode > Code > Description
        const barcodeMatch = p.barcodes.some((b) =>
          barcodes?.includes(b.barcode),
        );
        const codeMatch =
          p.codigoArancelario &&
          codigoArancelario &&
          p.codigoArancelario.toLowerCase() === codigoArancelario.toLowerCase();

        if (barcodeMatch) matchedBy = 'barcode';
        else if (codeMatch) matchedBy = 'codigoArancelario';
        else matchedBy = 'description';

        return {
          id: p.id,
          description: p.description,
          matchedBy,
        };
      });

      throw new ConflictException({
        conflict: true,
        message: 'Potential duplicate products found',
        matches,
      });
    }
  }

  async findAll(query: ProductQueryDto, tenantId: string) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
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

  async findOne(id: string, tenantId: string) {
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
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.filterSensitiveData(product);
  }

  private filterSensitiveData(product: any) {
    const store = RequestContext.getStore();
    if (!store) return product;

    const permissions = new Set(store.permissions || []);
    const filtered = { ...product };

    // 1. Hide Costs if no VIEW_COSTS permission
    if (!permissions.has('VIEW_COSTS') && store.role !== 'OWNER') {
      delete filtered.lastFobCost;
      delete filtered.lastCifCost;
      delete filtered.weightedAvgCost;
    }

    // 2. Hide Prices if no VIEW_PRICES permission (typically for Warehouse)
    if (!permissions.has('VIEW_PRICES') && store.role !== 'OWNER') {
      delete filtered.price_a;
      delete filtered.price_b;
      delete filtered.price_c;
      delete filtered.price_d;
      delete filtered.price_e;
    }

    return filtered;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    tenantId: string,
    userId: string,
  ) {
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

  async remove(id: string, tenantId: string, userId: string) {
    await this.findOne(id, tenantId);

    return this.prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  async bulkUpdatePrices(
    updates: Array<{
      productId: string;
      price_a?: number;
      price_b?: number;
      price_c?: number;
      price_d?: number;
      price_e?: number;
    }>,
    tenantId: string,
    userId: string,
  ) {
    const results = {
      updated: 0,
      errors: [] as string[],
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

        const updateData: any = { updatedBy: userId };
        if (update.price_a !== undefined) updateData.price_a = update.price_a;
        if (update.price_b !== undefined) updateData.price_b = update.price_b;
        if (update.price_c !== undefined) updateData.price_c = update.price_c;
        if (update.price_d !== undefined) updateData.price_d = update.price_d;
        if (update.price_e !== undefined) updateData.price_e = update.price_e;

        await this.prisma.product.update({
          where: { id: update.productId },
          data: updateData,
        });

        results.updated++;
      } catch (error) {
        results.errors.push(
          `Error updating ${update.productId}: ${error.message}`,
        );
      }
    }

    return results;
  }

  async updateImage(
    id: string,
    imageUrl: string,
    tenantId: string,
    userId: string,
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!product) throw new NotFoundException(`Product ${id} not found`);

    return this.prisma.product.update({
      where: { id },
      data: {
        mainImageUrl: imageUrl,
        updatedBy: userId,
      },
    });
  }

  async bulkImport(buffer: Buffer, tenantId: string, userId: string) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    const results = {
      created: 0,
      updated: 0,
      errors: [] as { row: number; error: string }[],
    };

    // Pre-fetch categories and brands for the tenant to optimize lookups
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
        // Find or handle Category
        let categoryId: string | null = null;
        const categoryName = row.Category || row.category;
        if (categoryName) {
          let category = categories.find(
            (c) =>
              c.name.toLowerCase() === categoryName.toString().toLowerCase(),
          );
          if (!category) {
            category = await this.prisma.category.create({
              data: { name: categoryName.toString(), tenantId },
            });
            categories.push(category);
          }
          categoryId = category.id;
        }

        // Find or handle Brand
        let brandId: string | null = null;
        const brandName = row.Brand || row.brand;
        if (brandName) {
          let brand = brands.find(
            (b) => b.name.toLowerCase() === brandName.toString().toLowerCase(),
          );
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
          description_es: (
            row.Description_ES || row.description_es
          )?.toString(),
          description_en: (
            row.Description_EN || row.description_en
          )?.toString(),
          codigoArancelario: (
            row.TariffCode ||
            row.tariffCode ||
            row.codigoArancelario
          )?.toString(),
          paisOrigen: (row.Origin || row.origin || row.paisOrigen)?.toString(),
          weight:
            row.Weight || row.weight
              ? new Prisma.Decimal(row.Weight || row.weight)
              : null,
          volume:
            row.Volume || row.volume
              ? new Prisma.Decimal(row.Volume || row.volume)
              : null,
          unitsPerBox:
            row.UnitsPerBox || row.unitsPerBox
              ? parseInt(row.UnitsPerBox || row.unitsPerBox)
              : 1,
          price_a: new Prisma.Decimal(row.PriceA || row.price_a || 0),
          price_b: new Prisma.Decimal(row.PriceB || row.price_b || 0),
          price_c: new Prisma.Decimal(row.PriceC || row.price_c || 0),
          price_d: new Prisma.Decimal(row.PriceD || row.price_d || 0),
          price_e: new Prisma.Decimal(row.PriceE || row.price_e || 0),
          categoryId,
          brandId,
          tenantId,
          updatedBy: userId,
        };

        // Look for existing product by description (Exact match)
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
        } else {
          await this.prisma.product.create({
            data: {
              ...productData,
              createdBy: userId,
            },
          });
          results.created++;
        }
      } catch (error) {
        results.errors.push({ row: i + 2, error: error.message });
      }
    }

    return results;
  }
}
