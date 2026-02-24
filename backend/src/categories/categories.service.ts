import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryQueryDto } from './dto/category-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto, tenantId: string) {
    const { name, parentId } = createCategoryDto;

    // Check unique constraint (tenant + name + parentId)
    const existing = await this.prisma.category.findFirst({
      where: {
        tenantId,
        name: { equals: name, mode: 'insensitive' },
        parentId: parentId || null,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Category '${name}' already exists under this parent.`,
      );
    }

    if (parentId) {
      // Create ensuring parent exists in same tenant
      const parent = await this.findOne(parentId, tenantId);
      if (!parent) {
        throw new NotFoundException(`Parent category ${parentId} not found.`);
      }
    }

    return this.prisma.category.create({
      data: {
        ...createCategoryDto,
        tenantId,
      },
    });
  }

  async findAll(query: CategoryQueryDto, tenantId: string) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CategoryWhereInput = {
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

  async findOne(id: string, tenantId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        parent: true,
        children: true,
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    tenantId: string,
  ) {
    await this.findOne(id, tenantId);

    const { parentId } = updateCategoryDto;

    // Prevent setting self as parent
    if (parentId === id) {
      throw new ConflictException('A category cannot be its own parent.');
    }

    // Check if new parent exists if changing parent
    if (parentId) {
      const parent = await this.findOne(parentId, tenantId);
      // Basic circle check (A -> B -> A) is complex, for MVP just immediate parent validity
    }

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async remove(id: string, tenantId: string) {
    const category = await this.findOne(id, tenantId);

    const productCount = category._count.products;
    const childrenCount = category.children.length;

    if (productCount > 0) {
      throw new ConflictException(
        `Cannot delete category with ${productCount} associated products.`,
      );
    }

    if (childrenCount > 0) {
      throw new ConflictException(
        `Cannot delete category with ${childrenCount} sub-categories.`,
      );
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
