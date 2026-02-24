import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationQueryDto } from './dto/location-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────── WAREHOUSES ─────────────────────────────────────────────

  async createWarehouse(dto: CreateWarehouseDto, tenantId: string) {
    const existing = await this.prisma.warehouse.findFirst({
      where: {
        tenantId,
        name: { equals: dto.name, mode: 'insensitive' },
        deletedAt: null,
      },
    });
    if (existing)
      throw new ConflictException(`El almacén '${dto.name}' ya existe.`);

    return this.prisma.warehouse.create({ data: { ...dto, tenantId } });
  }

  async findAllWarehouses(tenantId: string) {
    return this.prisma.warehouse.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { locations: true } },
      },
    });
  }

  async findOneWarehouse(id: string, tenantId: string) {
    const w = await this.prisma.warehouse.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        locations: {
          where: { deletedAt: null },
          orderBy: { name: 'asc' },
        },
        _count: { select: { locations: true } },
      },
    });
    if (!w) throw new NotFoundException(`Almacén con ID ${id} no encontrado`);
    return w;
  }

  async updateWarehouse(id: string, dto: UpdateWarehouseDto, tenantId: string) {
    await this.findOneWarehouse(id, tenantId);

    if (dto.name) {
      const dup = await this.prisma.warehouse.findFirst({
        where: {
          tenantId,
          name: { equals: dto.name, mode: 'insensitive' },
          id: { not: id },
          deletedAt: null,
        },
      });
      if (dup)
        throw new ConflictException(`El almacén '${dto.name}' ya existe.`);
    }

    return this.prisma.warehouse.update({ where: { id }, data: dto });
  }

  async removeWarehouse(id: string, tenantId: string) {
    const w = await this.findOneWarehouse(id, tenantId);
    if (w._count.locations > 0)
      throw new ConflictException(
        `No se puede eliminar un almacén con ${w._count.locations} ubicaciones activas.`,
      );

    return this.prisma.warehouse.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ──────────────── LOCATIONS ──────────────────────────────────────────────

  async createLocation(dto: CreateLocationDto, tenantId: string) {
    await this.findOneWarehouse(dto.warehouseId, tenantId);

    const existing = await this.prisma.location.findFirst({
      where: {
        tenantId,
        warehouseId: dto.warehouseId,
        name: { equals: dto.name, mode: 'insensitive' },
        deletedAt: null,
      },
    });
    if (existing)
      throw new ConflictException(
        `La ubicación '${dto.name}' ya existe en este almacén.`,
      );

    return this.prisma.location.create({ data: { ...dto, tenantId } });
  }

  async findAllLocations(query: LocationQueryDto, tenantId: string) {
    const { page, limit, search, warehouseId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.LocationWhereInput = {
      tenantId,
      deletedAt: null,
      ...(warehouseId ? { warehouseId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
              { type: { contains: search, mode: 'insensitive' } },
              {
                warehouse: { name: { contains: search, mode: 'insensitive' } },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.location.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ warehouse: { name: 'asc' } }, { name: 'asc' }],
        include: { warehouse: true },
      }),
      this.prisma.location.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOneLocation(id: string, tenantId: string) {
    const loc = await this.prisma.location.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { warehouse: true },
    });
    if (!loc)
      throw new NotFoundException(`Ubicación con ID ${id} no encontrada`);
    return loc;
  }

  async updateLocation(id: string, dto: UpdateLocationDto, tenantId: string) {
    await this.findOneLocation(id, tenantId);
    return this.prisma.location.update({ where: { id }, data: dto });
  }

  async removeLocation(id: string, tenantId: string) {
    await this.findOneLocation(id, tenantId);
    return this.prisma.location.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
