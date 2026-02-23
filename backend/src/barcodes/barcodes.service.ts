import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BarcodesService {
  constructor(private readonly prisma: PrismaService) {}

  private get db() {
    return this.prisma as any;
  }

  async create(dto: any, tenantId: string) {
    const { productId, barcode, type, isDefault, description } = dto;

    // Verify product belongs to tenant
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId, deletedAt: null },
    });
    if (!product)
      throw new NotFoundException(
        `Producto con ID ${productId} no encontrado.`,
      );

    // Check barcode uniqueness within tenant
    const existing = await this.db.productBarcode.findFirst({
      where: { tenantId, barcode },
    });
    if (existing)
      throw new ConflictException(`El código '${barcode}' ya está registrado.`);

    // If isDefault, unset previous default for this product
    if (isDefault) {
      await this.db.productBarcode.updateMany({
        where: { tenantId, productId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.db.productBarcode.create({
      data: {
        tenantId,
        productId,
        barcode,
        type: type ?? 'EAN13',
        isDefault: isDefault ?? false,
        description,
      },
      include: {
        product: {
          select: { id: true, description: true, internalReference: true },
        },
      },
    });
  }

  async findAll(query: any, tenantId: string) {
    const { page, limit, search, productId, type } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      ...(productId ? { productId } : {}),
      ...(type ? { type } : {}),
      ...(search
        ? {
            OR: [
              { barcode: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              {
                product: {
                  description: { contains: search, mode: 'insensitive' },
                },
              },
              {
                product: {
                  internalReference: { contains: search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.db.productBarcode.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { product: { description: 'asc' } },
          { isDefault: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          product: {
            select: { id: true, description: true, internalReference: true },
          },
        },
      }),
      this.db.productBarcode.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByProduct(productId: string, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId, deletedAt: null },
    });
    if (!product) throw new NotFoundException(`Producto no encontrado.`);

    return this.db.productBarcode.findMany({
      where: { tenantId, productId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(id: string, tenantId: string) {
    const barcode = await this.db.productBarcode.findFirst({
      where: { id, tenantId },
      include: {
        product: {
          select: { id: true, description: true, internalReference: true },
        },
      },
    });
    if (!barcode)
      throw new NotFoundException(
        `Código de barra con ID ${id} no encontrado.`,
      );
    return barcode;
  }

  async update(id: string, dto: any, tenantId: string) {
    const existing = await this.findOne(id, tenantId);

    if (dto.barcode && dto.barcode !== existing.barcode) {
      const dup = await this.db.productBarcode.findFirst({
        where: { tenantId, barcode: dto.barcode, id: { not: id } },
      });
      if (dup)
        throw new ConflictException(
          `El código '${dto.barcode}' ya está registrado.`,
        );
    }

    // If setting as default, unset others for same product
    if (dto.isDefault) {
      await this.db.productBarcode.updateMany({
        where: {
          tenantId,
          productId: existing.productId,
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    return this.db.productBarcode.update({
      where: { id },
      data: dto,
      include: {
        product: {
          select: { id: true, description: true, internalReference: true },
        },
      },
    });
  }

  async remove(id: string, tenantId: string) {
    const b = await this.findOne(id, tenantId);
    if (b.isDefault) {
      const count = await this.db.productBarcode.count({
        where: { tenantId, productId: b.productId },
      });
      if (count === 1)
        throw new BadRequestException(
          'No se puede eliminar el único código predeterminado del producto.',
        );
    }
    return this.db.productBarcode.delete({ where: { id } });
  }

  async lookup(barcode: string, tenantId: string) {
    const found = await this.db.productBarcode.findFirst({
      where: { tenantId, barcode },
      include: { product: true },
    });
    if (!found)
      throw new NotFoundException(`Código '${barcode}' no encontrado.`);
    return found;
  }
}
