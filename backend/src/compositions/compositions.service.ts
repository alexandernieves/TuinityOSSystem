import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompositionDto } from './dto/create-composition.dto';
import { UpdateCompositionDto } from './dto/update-composition.dto';
import { CompositionQueryDto } from './dto/composition-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CompositionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCompositionDto: CreateCompositionDto, tenantId: string) {
    const { name } = createCompositionDto;

    // Check unique constraint (tenant + name)
    const existing = await this.prisma.composition.findFirst({
      where: {
        tenantId,
        name: { equals: name, mode: 'insensitive' },
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException(`Composition '${name}' already exists.`);
    }

    return this.prisma.composition.create({
      data: {
        ...createCompositionDto,
        tenantId,
      },
    });
  }

  async findAll(query: CompositionQueryDto, tenantId: string) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CompositionWhereInput = {
      tenantId,
      deletedAt: null,
      ...(search
        ? {
            name: { contains: search, mode: 'insensitive' },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.composition.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { products: true } },
        },
      }),
      this.prisma.composition.count({ where }),
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
    const composition = await this.prisma.composition.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!composition) {
      throw new NotFoundException(`Composition with ID ${id} not found`);
    }

    return composition;
  }

  async update(
    id: string,
    updateCompositionDto: UpdateCompositionDto,
    tenantId: string,
  ) {
    await this.findOne(id, tenantId);

    const { name } = updateCompositionDto;

    // Check if new name conflicts with another composition
    if (name) {
      const existing = await this.prisma.composition.findFirst({
        where: {
          tenantId,
          name: { equals: name, mode: 'insensitive' },
          id: { not: id }, // Exclude self
          deletedAt: null,
        },
      });

      if (existing) {
        throw new ConflictException(`Composition '${name}' already exists.`);
      }
    }

    return this.prisma.composition.update({
      where: { id },
      data: updateCompositionDto,
    });
  }

  async remove(id: string, tenantId: string) {
    const composition = await this.findOne(id, tenantId);

    const productCount = composition._count.products;

    if (productCount > 0) {
      throw new ConflictException(
        `Cannot delete composition with ${productCount} associated products.`,
      );
    }

    return this.prisma.composition.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
