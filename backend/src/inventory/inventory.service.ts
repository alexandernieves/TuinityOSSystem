import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { Prisma, InventoryMovementType } from '@prisma/client';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createMovement(
    dto: CreateMovementDto,
    tenantId: string,
    userId: string,
  ) {
    const {
      productId,
      branchId,
      type,
      quantity,
      reason,
      referenceId,
      unitType,
    } = dto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Check Product existence and tenant
      const product = await tx.product.findFirst({
        where: { id: productId, tenantId, deletedAt: null },
      });
      if (!product)
        throw new NotFoundException(`Product ${productId} not found`);

      // Calculate final quantity based on unit type
      let finalQuantity = quantity;
      if (unitType === 'BOX') {
        finalQuantity = quantity * (product.unitsPerBox || 1);
      }

      if (finalQuantity <= 0) {
        throw new BadRequestException('Quantity must be greater than zero.');
      }

      // Determine quantity change (positive or negative)
      let quantityChange = 0;
      if (type === 'IN') {
        quantityChange = finalQuantity;
      } else if (type === 'OUT') {
        quantityChange = -finalQuantity;
      } else if (type === 'ADJUSTMENT') {
        quantityChange = finalQuantity;
      }

      if (type === 'OUT' && finalQuantity > 0) quantityChange = -finalQuantity;

      // 2. Check Branch existence and tenant
      const branch = await tx.branch.findFirst({
        where: { id: branchId, tenantId },
      });
      if (!branch) throw new NotFoundException(`Branch ${branchId} not found`);

      // 3. Create Movement
      const movement = await tx.inventoryMovement.create({
        data: {
          tenantId,
          branchId,
          productId,
          type,
          quantity: quantityChange, // Store signed value in base units
          reason: unitType === 'BOX' ? `${reason} (${quantity} Boxes)` : reason,
          referenceId,
          createdBy: userId,
        },
      });

      // 4. Update or Create Inventory Record
      // Using upsert would be ideal, but we need to increment.
      // Prisma upsert with increment:
      const inventory = await tx.inventory.upsert({
        where: {
          tenantId_branchId_productId: {
            tenantId,
            branchId,
            productId,
          },
        },
        create: {
          tenantId,
          branchId,
          productId,
          quantity: quantityChange,
        },
        update: {
          quantity: { increment: quantityChange },
        },
      });

      // 5. Prevent negative stock (Strict Rule)
      if (Number(inventory.quantity) < 0) {
        throw new BadRequestException(
          `Insufficient stock. The transaction would result in negative quantity: ${inventory.quantity}`,
        );
      }

      // 6. Ensure Physical Stock covers Reserved Stock
      if (Number(inventory.quantity) < Number(inventory.reserved)) {
        throw new BadRequestException(
          `Insufficient stock. Cannot reduce quantity below reserved amount (${inventory.reserved}). ` +
            `Current: ${inventory.quantity}`,
        );
      }

      return { movement, newStock: inventory.quantity };
    });
  }

  async getInventoryByBranch(branchId: string, tenantId: string) {
    return this.prisma.inventory.findMany({
      where: { branchId, tenantId },
      include: {
        product: {
          select: {
            id: true,
            description: true,
            brand: { select: { name: true } },
          },
        },
      },
    });
  }

  async findGlobalInventory(tenantId: string) {
    // Return products and their stock summed across all branches
    const inventories = await this.prisma.inventory.findMany({
      where: { tenantId },
      include: {
        product: {
          select: {
            id: true,
            description: true,
            brand: { select: { name: true } },
          },
        },
        branch: { select: { name: true } },
      },
    });

    // Group by product
    const productsMap = new Map();
    inventories.forEach((inv: any) => {
      if (!productsMap.has(inv.productId)) {
        productsMap.set(inv.productId, {
          id: inv.product.id,
          description: inv.product.description,
          brandName: inv.product.brand?.name || 'N/A',
          totalQuantity: 0,
          minStock: 0, // Initialize to 0 and accumulate
          lastFobCost: Number(inv.product.lastFobCost || 0),
          lastCifCost: Number(inv.product.lastCifCost || 0),
          branches: [],
        });
      }
      const p = productsMap.get(inv.productId);
      const qty = Number(inv.quantity);
      p.totalQuantity += qty;
      p.minStock += inv.minStock || 0; // Accumulate minStock from all branches
      p.branches.push({
        branchName: inv.branch.name,
        quantity: qty,
      });
    });

    return Array.from(productsMap.values());
  }

  async getMovementsByProduct(
    productId: string,
    branchId: string | undefined,
    tenantId: string,
  ) {
    return this.prisma.inventoryMovement.findMany({
      where: {
        productId,
        tenantId,
        ...(branchId ? { branchId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit history
      include: { branch: { select: { name: true } } },
    });
  }

  async transferInventory(dto: any, tenantId: string, userId: string) {
    const { productId, fromBranchId, toBranchId, quantity, reason } = dto;

    if (fromBranchId === toBranchId) {
      throw new BadRequestException(
        'Source and destination branches must be different',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Check source stock
      const sourceInventory = await tx.inventory.findUnique({
        where: {
          tenantId_branchId_productId: {
            tenantId,
            branchId: fromBranchId,
            productId,
          },
        },
      });

      if (!sourceInventory || Number(sourceInventory.quantity) < quantity) {
        throw new BadRequestException('Insufficient stock in source branch');
      }

      // 2. Reduce from source
      await tx.inventory.update({
        where: { id: sourceInventory.id },
        data: { quantity: { decrement: quantity } },
      });

      // 3. Add to destination
      await tx.inventory.upsert({
        where: {
          tenantId_branchId_productId: {
            tenantId,
            branchId: toBranchId,
            productId,
          },
        },
        create: {
          tenantId,
          branchId: toBranchId,
          productId,
          quantity: quantity,
        },
        update: {
          quantity: { increment: quantity },
        },
      });

      // 4. Record movements
      await tx.inventoryMovement.createMany({
        data: [
          {
            tenantId,
            branchId: fromBranchId,
            productId,
            type: 'OUT',
            quantity: -quantity,
            reason: reason || `Transfer to ${toBranchId}`,
            createdBy: userId,
          },
          {
            tenantId,
            branchId: toBranchId,
            productId,
            type: 'IN',
            quantity: quantity,
            reason: reason || `Transfer from ${fromBranchId}`,
            createdBy: userId,
          },
        ],
      });

      return { success: true };
    });
  }

  async exportExcel(branchId: string, tenantId: string): Promise<Buffer> {
    const inventory = await this.getInventoryByBranch(branchId, tenantId);
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, tenantId },
    });

    const XLSX = require('xlsx');

    const data = inventory.map((item) => ({
      Producto: item.product.description,
      Stock: Number(item.quantity),
      Reservado: Number(item.reserved),
      Disponible: Number(item.quantity) - Number(item.reserved),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

    // Column widths
    ws['!cols'] = [
      { wch: 40 }, // Producto
      { wch: 10 }, // Stock
      { wch: 10 }, // Reservado
      { wch: 10 }, // Disponible
    ];

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }
  async getValuationReport(tenantId: string) {
    const inventory = await this.prisma.inventory.findMany({
      where: { tenantId },
      include: {
        product: {
          select: {
            lastFobCost: true,
            lastCifCost: true,
            categoryId: true,
            category: { select: { name: true } },
          },
        },
      },
    });

    let totalFob = 0;
    let totalCif = 0;
    const byCategory: Record<
      string,
      { fob: number; cif: number; name: string }
    > = {};

    inventory.forEach((inv: any) => {
      const qty = Number(inv.quantity);
      const fob = Number(inv.product.lastFobCost || 0) * qty;
      const cif = Number(inv.product.lastCifCost || 0) * qty;
      const catId = inv.product.categoryId || 'uncategorized';

      totalFob += fob;
      totalCif += cif;

      if (!byCategory[catId]) {
        byCategory[catId] = {
          fob: 0,
          cif: 0,
          name: inv.product.category?.name || 'Sin Categoría',
        };
      }
      byCategory[catId].fob += fob;
      byCategory[catId].cif += cif;
    });

    return {
      summary: {
        totalFob,
        totalCif,
        investmentInFreight: totalCif - totalFob,
      },
      categories: Object.values(byCategory),
    };
  }

  async getStagnantProducts(tenantId: string, days = 120) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // 1. Get IDs of products that HAVE moved recently
    const recentActivity = await this.prisma.inventoryMovement.groupBy({
      by: ['productId'],
      where: {
        tenantId,
        createdAt: { gte: cutoffDate },
      },
    });
    const activeProductIds = new Set(recentActivity.map((p) => p.productId));

    // 2. Get all products with stock > 0
    const productsWithStock = await this.prisma.inventory.findMany({
      where: {
        tenantId,
        quantity: { gt: 0 },
      },
      include: {
        product: {
          select: {
            id: true,
            description: true,
            lastFobCost: true,
            brand: { select: { name: true } },
          },
        },
      },
    });

    // 3. Filter stagnant
    const stagnantProducts = productsWithStock.filter(
      (inv) => !activeProductIds.has(inv.productId),
    );

    // Group by product (since multiple branches might have stock)
    const resultMap = new Map<string, any>();

    for (const item of stagnantProducts) {
      if (!resultMap.has(item.productId)) {
        resultMap.set(item.productId, {
          id: item.productId,
          description: item.product.description,
          brand: item.product.brand?.name || 'N/A',
          totalStock: 0,
          value: 0,
          lastCost: Number(item.product.lastFobCost || 0),
          daysStagnant: days, // At least this many days
        });
      }
      const entry = resultMap.get(item.productId);
      entry.totalStock += Number(item.quantity);
      entry.value += Number(item.quantity) * entry.lastCost;
    }

    return Array.from(resultMap.values());
  }
}
