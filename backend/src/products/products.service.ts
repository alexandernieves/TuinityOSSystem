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
    const {
      barcodes,
      forceCreate,
      categoryId,
      brandId,
      originId,
      tariffId,
      compositionId,
      supplierId,
      ...productData
    } = createProductDto;

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

    // Validate Origin
    if (originId && originId !== '') {
      const origin = await this.prisma.origin.findFirst({
        where: { id: originId, tenantId, deletedAt: null },
      });
      if (!origin) throw new NotFoundException(`Origin ${originId} not found`);
    }

    // Validate Tariff
    if (tariffId && tariffId !== '') {
      const tariff = await this.prisma.tariff.findFirst({
        where: { id: tariffId, tenantId, deletedAt: null },
      });
      if (!tariff) throw new NotFoundException(`Tariff ${tariffId} not found`);
    }

    // Validate Composition
    if (compositionId && compositionId !== '') {
      const composition = await this.prisma.composition.findFirst({
        where: { id: compositionId, tenantId, deletedAt: null },
      });
      if (!composition)
        throw new NotFoundException(`Composition ${compositionId} not found`);
    }

    return this.prisma.product.create({
      data: {
        ...productData,
        tenantId,
        categoryId,
        brandId,
        originId: originId === '' ? null : originId,
        tariffId: tariffId === '' ? null : tariffId,
        compositionId: compositionId === '' ? null : compositionId,
        supplierId: supplierId === '' ? null : supplierId,
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
        origin: true,
        tariff: true,
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
    const { page, limit, search, categoryId, brandId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      tenantId,
      deletedAt: null,
      categoryId: categoryId || undefined,
      brandId: brandId || undefined,
      originId: query.originId || undefined,
      tariffId: (query as any).tariffId || undefined,
      supplierId: (query as any).supplierId || undefined,
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
          brand: true,
          origin: true,
          tariff: true,
          supplier: true,
          inventory: true,
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
        origin: true,
        tariff: true,
        supplier: true,
        inventory: true,
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

    const {
      barcodes,
      categoryId,
      brandId,
      originId,
      tariffId,
      supplierId,
      compositionId,
      ...data
    } = updateProductDto;

    // Validate Category
    if (categoryId && categoryId !== '') {
      await this.prisma.category.findFirstOrThrow({
        where: { id: categoryId, tenantId, deletedAt: null },
      });
    }

    // Validate Brand
    if (brandId && brandId !== '') {
      await this.prisma.brand.findFirstOrThrow({
        where: { id: brandId, tenantId, deletedAt: null },
      });
    }

    // Validate Origin
    if (originId && originId !== '') {
      await this.prisma.origin.findFirstOrThrow({
        where: { id: originId, tenantId, deletedAt: null },
      });
    }

    // Validate Tariff
    if (tariffId && tariffId !== '') {
      await this.prisma.tariff.findFirstOrThrow({
        where: { id: tariffId, tenantId, deletedAt: null },
      });
    }

    // Validate Supplier
    if (supplierId && supplierId !== '') {
      await this.prisma.supplier.findFirstOrThrow({
        where: { id: supplierId, tenantId, deletedAt: null },
      });
    }

    // Validate Composition
    if (compositionId && compositionId !== '') {
      await this.prisma.composition.findFirstOrThrow({
        where: { id: compositionId, tenantId, deletedAt: null },
      });
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...data,
        categoryId: categoryId === '' ? null : categoryId,
        brandId: brandId === '' ? null : brandId,
        originId: originId === '' ? null : originId,
        tariffId: tariffId === '' ? null : tariffId,
        supplierId: supplierId === '' ? null : supplierId,
        compositionId: compositionId === '' ? null : compositionId,
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
      include: {
        barcodes: true,
        category: true,
        brand: true,
        origin: true,
        tariff: true,
      },
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

    // Pre-fetch related entities to optimize lookups
    const [categories, brands, origins, tariffs, compositions, suppliers] = await Promise.all([
      this.prisma.category.findMany({ where: { tenantId, deletedAt: null } }),
      this.prisma.brand.findMany({ where: { tenantId, deletedAt: null } }),
      this.prisma.origin.findMany({ where: { tenantId, deletedAt: null } }),
      this.prisma.tariff.findMany({ where: { tenantId, deletedAt: null } }),
      this.prisma.composition.findMany({ where: { tenantId, deletedAt: null } }),
      this.prisma.supplier.findMany({ where: { tenantId, deletedAt: null } }),
    ]);

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const reference = (row.Referencia || row.referencia || row.internalReference || row.InternalReference)?.toString();
      const description = (row.Descripcion || row.descripcion || row.Description || row.description)?.toString();

      if (!reference && !description) {
        results.errors.push({ row: i + 2, error: 'Falta Referencia o Descripción' });
        continue;
      }

      try {
        // Find or handle Category
        let categoryId: string | null = null;
        const categoryName = row.Categoria || row.categoria || row.Category || row.category || row.Grupo || row.grupo;
        if (categoryName) {
          let category = categories.find(
            (c) => c.name.toLowerCase() === categoryName.toString().toLowerCase(),
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
        const brandName = row.Marca || row.marca || row.Brand || row.brand;
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

        // Find Origin
        let originId: string | null = null;
        const originName = row.Pais_Origen || row.pais_origen || row.Origin || row.origin || row.paisOrigen;
        if (originName) {
          const matchedOrigin = origins.find(
            (o) =>
              o.name.toLowerCase() === originName.toString().toLowerCase() ||
              (o.code && o.code.toLowerCase() === originName.toString().toLowerCase()),
          );
          if (matchedOrigin) originId = matchedOrigin.id;
        }

        // Find Tariff
        let tariffId: string | null = null;
        const tariffCode = row.Arancel || row.arancel || row.TariffCode || row.tariffCode || row.codigoArancelario;
        if (tariffCode) {
          const matchedTariff = tariffs.find(
            (t) => t.code.toString().toLowerCase() === tariffCode.toString().toLowerCase(),
          );
          if (matchedTariff) tariffId = matchedTariff.id;
        }

        // Find Composition
        let compositionId: string | null = null;
        const compName = row.Composicion || row.composicion || row.Composition || row.composition;
        if (compName) {
          let comp = compositions.find((c) => c.name.toLowerCase() === compName.toString().toLowerCase());
          if (!comp) {
            comp = await this.prisma.composition.create({
              data: { name: compName.toString(), tenantId },
            });
            compositions.push(comp);
          }
          compositionId = comp.id;
        }

        // Find Supplier
        let supplierId: string | null = null;
        const suppName = row.Proveedor || row.proveedor || row.Supplier || row.supplier;
        if (suppName) {
          let supp = suppliers.find((s) => s.name.toLowerCase() === suppName.toString().toLowerCase());
          if (supp) supplierId = supp.id;
        }

        const productData: any = {
          description: description || reference,
          description_es: row.Description_ES || row.description_es || description,
          description_en: row.Description_EN || row.description_en || row.Description_Ingles,
          description_pt: row.Description_PT || row.description_pt || row.Description_Portugues,
          internalReference: reference,
          showroomCode: row.Referencia_2 || row.referencia_2 || row.ShowroomCode,
          codigoArancelario: tariffCode?.toString(),
          paisOrigen: originName?.toString(),
          weight: row.Peso || row.peso || row.Weight ? new Prisma.Decimal(row.Peso || row.peso || row.Weight) : null,
          volume: row.Metros_Cubicos || row.Volume ? new Prisma.Decimal(row.Metros_Cubicos || row.Volume) : null,
          volumeCubicFeet: row.Pies_Cubicos || row.VolumeCubicFeet ? new Prisma.Decimal(row.Pies_Cubicos || row.VolumeCubicFeet) : null,
          unitsPerBox: parseInt(row.Cantidad_x_Bulto || row.UnitsPerBox || row.unitsPerBox || 1),
          price_a: new Prisma.Decimal(row.PriceA || row.price_a || row.Precio_A || 0),
          price_b: new Prisma.Decimal(row.PriceB || row.price_b || row.Precio_B || 0),
          price_c: new Prisma.Decimal(row.PriceC || row.price_c || row.Precio_C || 0),
          price_d: new Prisma.Decimal(row.PriceD || row.price_d || row.Precio_D || 0),
          price_e: new Prisma.Decimal(row.PriceE || row.price_e || row.Precio_E || 0),
          lastCifCost: row.Costo_CIF || row.CostoCIF || row.lastCifCost ? new Prisma.Decimal(row.Costo_CIF || row.CostoCIF || row.lastCifCost) : undefined,
          lastFobCost: row.Costo_FOB || row.CostoFOB || row.lastFobCost ? new Prisma.Decimal(row.Costo_FOB || row.CostoFOB || row.lastFobCost) : undefined,
          categoryId,
          brandId,
          originId,
          tariffId,
          compositionId,
          supplierId,
          tenantId,
          updatedBy: userId,
        };

        // Matching Strategy: First by internalReference, then by description
        let existingProduct: any = null;
        if (reference) {
          existingProduct = await this.prisma.product.findFirst({
            where: { internalReference: reference, tenantId, deletedAt: null },
          });
        }

        if (!existingProduct && description) {
          existingProduct = await this.prisma.product.findFirst({
            where: { description: description, tenantId, deletedAt: null },
          });
        }

        if (existingProduct) {
          await this.prisma.product.update({
            where: { id: existingProduct.id },
            data: productData,
          });
          results.updated++;
        } else {
          const newProduct = await this.prisma.product.create({
            data: {
              ...productData,
              createdBy: userId,
            },
          });

          // Handle Barcode for new products or as additional barcodes
          const barcode = row.Codigo_Barra || row.barcode || row.Barcode;
          if (barcode) {
            await this.prisma.productBarcode.create({
              data: {
                barcode: barcode.toString(),
                productId: newProduct.id,
                tenantId,
                isDefault: true,
              },
            });
          }
          results.created++;
        }
      } catch (error) {
        results.errors.push({ row: i + 2, error: error.message });
      }
    }

    return results;
  }
}
