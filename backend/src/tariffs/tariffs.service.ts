import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTariffDto } from './dto/create-tariff.dto';
import { UpdateTariffDto } from './dto/update-tariff.dto';
import { TariffQueryDto } from './dto/tariff-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TariffsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTariffDto: CreateTariffDto, tenantId: string) {
    const { code } = createTariffDto;

    const existing = await this.prisma.tariff.findFirst({
      where: {
        tenantId,
        code: { equals: code, mode: 'insensitive' },
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException(`Tariff code '${code}' already exists.`);
    }

    return this.prisma.tariff.create({
      data: {
        ...createTariffDto,
        tenantId,
      },
    });
  }

  async findAll(query: TariffQueryDto, tenantId: string) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TariffWhereInput = {
      tenantId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { code: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.tariff.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
        include: {
          _count: { select: { products: true } },
        },
      }),
      this.prisma.tariff.count({ where }),
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
    const tariff = await this.prisma.tariff.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!tariff) {
      throw new NotFoundException(`Tariff with ID ${id} not found`);
    }

    return tariff;
  }

  async update(id: string, updateTariffDto: UpdateTariffDto, tenantId: string) {
    await this.findOne(id, tenantId);

    const { code } = updateTariffDto;

    if (code) {
      const existing = await this.prisma.tariff.findFirst({
        where: {
          tenantId,
          code: { equals: code, mode: 'insensitive' },
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existing) {
        throw new ConflictException(`Tariff code '${code}' already exists.`);
      }
    }

    return this.prisma.tariff.update({
      where: { id },
      data: updateTariffDto,
    });
  }

  async remove(id: string, tenantId: string) {
    const tariff = await this.findOne(id, tenantId);

    const productCount = tariff._count.products;

    if (productCount > 0) {
      throw new ConflictException(
        `Cannot delete tariff with ${productCount} associated products.`,
      );
    }

    return this.prisma.tariff.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
