import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOriginDto } from './dto/create-origin.dto';
import { UpdateOriginDto } from './dto/update-origin.dto';
import { OriginQueryDto } from './dto/origin-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class OriginsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOriginDto: CreateOriginDto, tenantId: string) {
    const { name } = createOriginDto;

    const existing = await this.prisma.origin.findFirst({
      where: {
        tenantId,
        name: { equals: name, mode: 'insensitive' },
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException(`Origin '${name}' already exists.`);
    }

    return this.prisma.origin.create({
      data: {
        ...createOriginDto,
        tenantId,
      },
    });
  }

  async findAll(query: OriginQueryDto, tenantId: string) {
    const { page, limit, search } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Prisma.OriginWhereInput = {
      tenantId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.origin.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { products: true } },
        },
      }),
      this.prisma.origin.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async findOne(id: string, tenantId: string) {
    const origin = await this.prisma.origin.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!origin) {
      throw new NotFoundException(`Origin with ID ${id} not found`);
    }

    return origin;
  }

  async update(id: string, updateOriginDto: UpdateOriginDto, tenantId: string) {
    await this.findOne(id, tenantId);

    const { name } = updateOriginDto;

    if (name) {
      const existing = await this.prisma.origin.findFirst({
        where: {
          tenantId,
          name: { equals: name, mode: 'insensitive' },
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existing) {
        throw new ConflictException(`Origin '${name}' already exists.`);
      }
    }

    return this.prisma.origin.update({
      where: { id },
      data: updateOriginDto,
    });
  }

  async remove(id: string, tenantId: string) {
    const origin = await this.findOne(id, tenantId);

    const productCount = origin._count.products;

    if (productCount > 0) {
      throw new ConflictException(
        `Cannot delete origin with ${productCount} associated products.`,
      );
    }

    return this.prisma.origin.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
