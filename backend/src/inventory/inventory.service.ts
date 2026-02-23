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

  constructor(private readonly prisma: PrismaService) { }

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
    const products = await this.prisma.product.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
        inventory: {
          include: { branch: { select: { name: true } } },
        },
        barcodes: { where: { isDefault: true }, take: 1 },
      },
    });

    return products.map((p) => {
      const existencias = p.inventory.reduce((sum, inv) => sum + Number(inv.quantity), 0);
      const reservas = p.inventory.reduce((sum, inv) => sum + Number(inv.reserved), 0);
      const disponible = existencias - reservas;

      return {
        id: p.id,
        reference: p.internalReference || '---',
        barcode: p.barcodes[0]?.barcode || '---',
        description: p.description,
        brandName: p.brand?.name || '---',
        categoryName: p.category?.name || '---',
        minStock: p.minStock || 0,
        totalQuantity: existencias,
        totalReserved: reservas,
        totalAvailable: disponible,
        branchDetails: p.inventory.map((inv) => ({
          branchId: inv.branchId,
          branchName: inv.branch.name,
          quantity: Number(inv.quantity),
          reserved: Number(inv.reserved),
          available: Number(inv.quantity) - Number(inv.reserved),
        })),
      };
    });
  }

  async getLowStockProducts(tenantId: string) {
    this.logger.log(`Fetching low stock products for tenant: ${tenantId}`);

    // 1. Get all products with minStock > 0 that are not deleted
    const products = await this.prisma.product.findMany({
      where: {
        tenantId,
        deletedAt: null,
        minStock: { gt: 0 }
      },
      include: {
        brand: { select: { name: true } },
        inventory: true,
        barcodes: { where: { isDefault: true }, take: 1 },
      },
    });

    const lowStockList: any[] = [];

    for (const p of products) {
      // 2. Calculate current stock across all branches
      const existencias = p.inventory.reduce((sum, inv) => sum + Number(inv.quantity), 0);
      const reservas = p.inventory.reduce((sum, inv) => sum + Number(inv.reserved), 0);

      // 3. Get incoming stock from pending/partial purchase orders
      const incomingItems = await this.prisma.purchaseOrderItem.findMany({
        where: {
          productId: p.id,
          tenantId,
          purchaseOrder: {
            status: { in: ['DRAFT', 'PARTIAL'] }
          }
        }
      });
      const porLlegar = incomingItems.reduce((sum, item) => sum + (item.quantity - item.receivedQuantity), 0);

      const disponible = existencias - reservas + porLlegar;

      if (disponible <= (p.minStock || 0)) {
        // 4. Get last purchase date
        const lastPurchase = await this.prisma.purchaseOrder.findFirst({
          where: {
            tenantId,
            items: { some: { productId: p.id } },
            status: 'RECEIVED'
          },
          orderBy: { receivedDate: 'desc' },
          select: { receivedDate: true }
        });

        // 5. Get last sale date
        const lastSale = await this.prisma.invoiceLine.findFirst({
          where: {
            tenantId,
            productId: p.id,
            invoice: { status: 'ISSUED' }
          },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        });

        lowStockList.push({
          id: p.id,
          reference: p.internalReference || '---',
          barcode: p.barcodes[0]?.barcode || '---',
          description: p.description,
          minStock: p.minStock || 0,
          quantity: existencias,
          incoming: porLlegar,
          reserved: reservas,
          available: disponible,
          lastPurchaseDate: lastPurchase?.receivedDate || null,
          lastSaleDate: lastSale?.createdAt || null,
          brandName: p.brand?.name || '---',
        });
      }
    }

    this.logger.log(`Returning ${lowStockList.length} low stock products for tenant ${tenantId}`);
    return lowStockList;
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

  async createCountSession(tenantId: string, branchId: string, userId: string, description?: string) {
    return this.prisma.inventoryCount.create({
      data: {
        tenantId,
        branchId,
        createdBy: userId,
        description,
        status: 'DRAFT',
      },
      include: {
        items: true,
      }
    });
  }

  async getActiveCountSession(tenantId: string, branchId: string) {
    const session = await this.prisma.inventoryCount.findFirst({
      where: {
        tenantId,
        branchId,
        status: { in: ['DRAFT', 'IN_PROGRESS'] },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                description: true,
                barcodes: { where: { isDefault: true }, take: 1 },
                internalReference: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!session) return null;

    return {
      ...session,
      totalItems: session.items.reduce((sum, item) => sum + item.countedQuantity, 0),
      totalEntries: session.items.length
    };
  }

  async addCountItem(countId: string, productId: string, quantity: number, tenantId: string) {
    const inventory = await this.prisma.inventory.findFirst({
      where: { tenantId, productId }
    });

    const expected = inventory ? Number(inventory.quantity) : 0;

    return this.prisma.inventoryCountItem.upsert({
      where: {
        inventoryCountId_productId: {
          inventoryCountId: countId,
          productId,
        }
      },
      create: {
        inventoryCountId: countId,
        productId,
        expectedQuantity: expected,
        countedQuantity: quantity,
        variance: quantity - expected,
      },
      update: {
        countedQuantity: { increment: quantity },
        // Variance will be recalculated on close or UI can do it
      }
    });
  }

  async completeCountSession(countId: string, tenantId: string) {
    return this.prisma.$transaction(async (tx) => {
      const count = await tx.inventoryCount.findUnique({
        where: { id: countId },
        include: { items: true }
      });

      if (!count || count.tenantId !== tenantId) throw new NotFoundException('Conteo no encontrado');

      return tx.inventoryCount.update({
        where: { id: countId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        }
      });
    });
  }

  async transferBulk(dto: any, tenantId: string, userId: string) {
    const { fromBranchId, toBranchId, reason, items } = dto;

    if (fromBranchId === toBranchId) {
      throw new BadRequestException('Las sucursales de origen y destino deben ser diferentes');
    }

    const referenceId = `TRF-${Date.now().toString().slice(-6)}`;

    return this.prisma.$transaction(async (tx) => {
      const results: any[] = [];

      for (const item of items) {
        const { productId, quantity } = item;

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
          const product = await tx.product.findUnique({ where: { id: productId }, select: { description: true } });
          throw new BadRequestException(`Stock insuficiente para ${product?.description || 'producto'} en sucursal origen`);
        }

        // 2. Decrement source
        await tx.inventory.update({
          where: { id: sourceInventory.id },
          data: { quantity: { decrement: quantity } },
        });

        // 3. Create OUT movement
        await tx.inventoryMovement.create({
          data: {
            tenantId,
            branchId: fromBranchId,
            productId,
            type: 'TRANSFER_OUT',
            quantity: -quantity, // Must be negative to correctly sum stock
            reason: reason || 'Transferencia Bulk',
            referenceId,
            createdBy: userId,
          },
        });

        // 4. Increment destination
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

        // 5. Create IN movement
        await tx.inventoryMovement.create({
          data: {
            tenantId,
            branchId: toBranchId,
            productId,
            type: 'TRANSFER_IN',
            quantity,
            reason: reason || 'Transferencia Bulk',
            referenceId,
            createdBy: userId,
          },
        });

        results.push({ productId, quantity, status: 'success' });
      }

      return {
        referenceId,
        itemsProcessed: results.length,
        status: 'COMPLETED'
      };
    });
  }

  async recalculateInventory(tenantId: string) {
    const startTime = Date.now();

    return this.prisma.$transaction(async (tx) => {
      // 1. Sum up all movements summary by Product and Branch
      const movementSummaries = await tx.inventoryMovement.groupBy({
        by: ['productId', 'branchId'],
        where: { tenantId },
        _sum: {
          quantity: true,
        },
      });

      // 2. Aggregate all reserved quantities from pending sales
      const salesItems = await tx.saleItem.findMany({
        where: {
          tenantId,
          sale: {
            status: { in: ['PENDING', 'APPROVED_ORDER', 'PACKING', 'PARTIAL'] as any }
          }
        },
        include: {
          sale: { select: { branchId: true } }
        }
      });

      const reservedMap = new Map<string, number>();
      salesItems.forEach(item => {
        const key = `${item.productId}-${item.sale.branchId}`;
        reservedMap.set(key, (reservedMap.get(key) || 0) + Number(item.quantity));
      });

      // 3. Get all current Inventory records
      const currentInventories = await tx.inventory.findMany({
        where: { tenantId },
      });

      // Create a map for quick lookup
      const invMap = new Map<string, { id: string, qty: number, reserved: number }>();
      currentInventories.forEach(inv => {
        invMap.set(`${inv.productId}-${inv.branchId}`, {
          id: inv.id,
          qty: Number(inv.quantity),
          reserved: Number(inv.reserved)
        });
      });

      let itemsProcessed = 0;
      let discrepanciesFound = 0;
      const processedKeys = new Set<string>();

      // 4. Process all branch/product pairs that HAVE movements
      for (const summary of movementSummaries) {
        const key = `${summary.productId}-${summary.branchId}`;
        const calcQty = Number(summary._sum.quantity || 0);
        const calcReserved = reservedMap.get(key) || 0;

        const current = invMap.get(key);

        if (!current || current.qty !== calcQty || current.reserved !== calcReserved) {
          discrepanciesFound++;
          await tx.inventory.upsert({
            where: {
              tenantId_branchId_productId: {
                tenantId,
                productId: summary.productId,
                branchId: summary.branchId,
              }
            },
            create: {
              tenantId,
              productId: summary.productId,
              branchId: summary.branchId,
              quantity: calcQty,
              reserved: calcReserved
            },
            update: {
              quantity: calcQty,
              reserved: calcReserved
            }
          });
        }
        processedKeys.add(key);
        itemsProcessed++;
      }

      // 5. Reset to 0 any inventory record that has NO movements but exists
      for (const inv of currentInventories) {
        const key = `${inv.productId}-${inv.branchId}`;
        if (!processedKeys.has(key)) {
          const calcReserved = reservedMap.get(key) || 0;
          if (Number(inv.quantity) !== 0 || Number(inv.reserved) !== calcReserved) {
            discrepanciesFound++;
            await tx.inventory.update({
              where: { id: inv.id },
              data: {
                quantity: 0,
                reserved: calcReserved
              }
            });
          }
          itemsProcessed++;
        }
      }

      const timeElapsed = ((Date.now() - startTime) / 1000).toFixed(2) + 's';

      return {
        success: true,
        message: 'Recálculo finalizado con éxito',
        details: {
          itemsProcessed,
          discrepanciesFound,
          timeElapsed
        }
      };
    }, {
      timeout: 60000 // 1 minute timeout for heavy calculations
    });
  }
}
