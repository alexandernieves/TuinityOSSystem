import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../services/shared/prisma.service';
import { Category } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            _count: {
              select: {
                products: true,
                subproducts: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            children: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findAllFlat() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        parent: {
          select: { name: true }
        },
        _count: {
          select: {
            products: true,
            subproducts: true,
          }
        }
      }
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        parent: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async create(data: { name: string; parentId?: string; isActive?: boolean }) {
    let level = 1;
    let parentId = data.parentId || null;

    if (parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        throw new NotFoundException(`Parent category with ID ${parentId} not found`);
      }

      if (parent.level >= 2) {
        throw new BadRequestException('Cannot create a subcategory under another subcategory. Maximum depth is 2 levels.');
      }

      level = 2;
    }

    return this.prisma.category.create({
      data: {
        name: data.name,
        parentId,
        level,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: string, data: { name?: string; parentId?: string; isActive?: boolean }) {
    const existing = await this.findOne(id);

    let level = existing.level;
    let parentId = data.parentId !== undefined ? data.parentId : existing.parentId;

    if (data.parentId !== undefined) {
      if (data.parentId === id) {
        throw new BadRequestException('A category cannot be its own parent');
      }

      if (data.parentId) {
        const parent = await this.prisma.category.findUnique({
          where: { id: data.parentId },
        });

        if (!parent) {
          throw new NotFoundException(`Parent category with ID ${data.parentId} not found`);
        }

        if (parent.level >= 2) {
          throw new BadRequestException('Target parent is a subcategory. Maximum depth is 2 levels.');
        }

        level = 2;
      } else {
        level = 1;
        parentId = null;
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        parentId,
        level,
        isActive: data.isActive,
      },
    });
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: { select: { id: true } },
        _count: {
          select: {
            products: true,
            subproducts: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (category.children.length > 0) {
      throw new ConflictException('Cannot delete category because it has subcategories');
    }

    if (category._count.products > 0 || category._count.subproducts > 0) {
      throw new ConflictException('Cannot delete category because it has associated products');
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }
}
