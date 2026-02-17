import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandQueryDto } from './dto/brand-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBrandDto: CreateBrandDto, tenantId: string) {
    const { name } = createBrandDto;

    // Check unique constraint (tenant + name)
    const existing = await this.prisma.brand.findFirst({
      where: {
        tenantId,
        name: { equals: name, mode: 'insensitive' },
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException(`Brand '${name}' already exists.`);
    }

    return this.prisma.brand.create({
      data: {
        ...createBrandDto,
        tenantId,
      },
    });
  }

  async findAll(query: BrandQueryDto, tenantId: string) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BrandWhereInput = {
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

  async findOne(id: string, tenantId: string) {
    const brand = await this.prisma.brand.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    return brand;
  }

  async update(id: string, updateBrandDto: UpdateBrandDto, tenantId: string) {
    await this.findOne(id, tenantId);

    const { name } = updateBrandDto;

    // Check if new name conflicts with another brand
    if (name) {
      const existing = await this.prisma.brand.findFirst({
        where: {
          tenantId,
          name: { equals: name, mode: 'insensitive' },
          id: { not: id }, // Exclude self
          deletedAt: null,
        },
      });

      if (existing) {
        throw new ConflictException(`Brand '${name}' already exists.`);
      }
    }

    return this.prisma.brand.update({
      where: { id },
      data: updateBrandDto,
    });
  }

  async remove(id: string, tenantId: string) {
    const brand = await this.findOne(id, tenantId);

    const productCount = brand._count.products;

    if (productCount > 0) {
      throw new ConflictException(
        `Cannot delete brand with ${productCount} associated products.`,
      );
    }

    return this.prisma.brand.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
