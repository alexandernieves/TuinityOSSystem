import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SupplierQueryDto } from './dto/supplier-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSupplierDto: CreateSupplierDto, tenantId: string) {
    const { name } = createSupplierDto;

    const existing = await this.prisma.supplier.findFirst({
      where: {
        tenantId,
        name: { equals: name, mode: 'insensitive' },
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Supplier with name '${name}' already exists.`,
      );
    }

    return this.prisma.supplier.create({
      data: {
        ...createSupplierDto,
        tenantId,
      },
    });
  }

  async findAll(query: SupplierQueryDto, tenantId: string) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SupplierWhereInput = {
      tenantId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
              { taxId: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { products: true } },
        },
      }),
      this.prisma.supplier.count({ where }),
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
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    return supplier;
  }

  async update(
    id: string,
    updateSupplierDto: UpdateSupplierDto,
    tenantId: string,
  ) {
    await this.findOne(id, tenantId);

    const { name } = updateSupplierDto;

    if (name) {
      const existing = await this.prisma.supplier.findFirst({
        where: {
          tenantId,
          name: { equals: name, mode: 'insensitive' },
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existing) {
        throw new ConflictException(
          `Supplier with name '${name}' already exists.`,
        );
      }
    }

    return this.prisma.supplier.update({
      where: { id },
      data: updateSupplierDto,
    });
  }

  async remove(id: string, tenantId: string) {
    const supplier = await this.findOne(id, tenantId);

    const productCount = supplier._count.products;

    if (productCount > 0) {
      throw new ConflictException(
        `Cannot delete supplier with ${productCount} associated products.`,
      );
    }

    return this.prisma.supplier.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
