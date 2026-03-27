import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService, BaseService } from '../shared';
import {
  InventoryMovement,
  ProductLot,
  PurchaseReceiptLine,
  PrismaClient,
  InventoryMovementType,
  Prisma,
  ProductLot as ProductLotModel
} from '@prisma/client';

export interface CreateInventoryMovementData {
  productId: string;
  warehouseId: string;
  productLotId?: string;
  movementType: InventoryMovementType;
  quantity: number;
  unitCost?: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdByUserId?: string;
}

export interface CreateProductLotData {
  productId: string;
  warehouseId: string;
  purchaseReceiptLineId?: string;
  lotNumber: string;
  expirationDate?: Date;
  manufacturingDate?: Date;
  receivedQuantity: number;
  notes?: string;
}

export interface AdjustInventoryData {
  productId: string;
  warehouseId: string;
  adjustmentQuantity: number;
  reason?: string;
  createdByUserId?: string;
}

export interface SelectedLot {
  lotId: string;
  lotNumber: string;
  quantityToConsume: number;
}

import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class InventoryService extends BaseService {
  constructor(
    prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {
    super(prisma);
  }

  /**
   * Create inventory movement
   */
  async createInventoryMovement(data: CreateInventoryMovementData, tx?: Prisma.TransactionClient): Promise<InventoryMovement> {
    const prisma = tx || this.prisma;
    
    // Execute core movement creation logic
    const movement = await prisma.inventoryMovement.create({
      data: {
        productId: data.productId,
        warehouseId: data.warehouseId,
        productLotId: data.productLotId,
        movementType: data.movementType,
        quantity: data.quantity,
        unitCost: data.unitCost,
        totalCost: data.unitCost ? data.unitCost * data.quantity : undefined,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        notes: data.notes,
        createdByUserId: data.createdByUserId,
        occurredAt: new Date(),
      },
      include: {
        product: true,
        warehouse: true,
        productLot: true,
      },
    });

    // Execute core stock impact logic on the lot
    if (data.productLotId) {
      await this.applyLotStockImpact(
        data.productLotId,
        data.movementType,
        data.quantity,
        prisma
      );
    }

    if (movement.movementType === InventoryMovementType.INVENTORY_ADJUSTMENT_POSITIVE) {
      await this.notificationsService.notifyRole('GERENCIA', {
        type: 'INVENTORY_ADJUSTMENT',
        title: 'Nuevo Ajuste de Inventario',
        message: `Se ha realizado un ajuste de ${movement.quantity} unidades para el producto ${movement.productId}.`,
        module: 'INVENTORY',
        entityType: 'InventoryMovement',
        entityId: movement.id,
        severity: 'WARNING',
        actionUrl: `/inventario/ajustes`,
      });
    }

    return movement;
  }

  /**
   * Create product lot
   */
  async createProductLot(data: CreateProductLotData): Promise<ProductLot> {
    return this.prisma.productLot.create({
      data: {
        productId: data.productId,
        warehouseId: data.warehouseId,
        purchaseReceiptLineId: data.purchaseReceiptLineId,
        lotNumber: data.lotNumber,
        expirationDate: data.expirationDate,
        manufacturingDate: data.manufacturingDate,
        receivedQuantity: data.receivedQuantity,
        availableQuantity: data.receivedQuantity,
        notes: data.notes,
        isActive: true,
      },
      include: {
        product: true,
        warehouse: true,
        purchaseReceiptLine: true,
      },
    });
  }

  /**
   * Adjust inventory
   */
  async adjustInventory(data: AdjustInventoryData): Promise<InventoryMovement> {
    return this.createInventoryMovement({
      productId: data.productId,
      warehouseId: data.warehouseId,
      movementType: InventoryMovementType.INVENTORY_ADJUSTMENT_POSITIVE,
      quantity: data.adjustmentQuantity,
      notes: data.reason,
      createdByUserId: data.createdByUserId,
    });
  }

  /**
   * Get product availability across warehouses
   */
  async getProductAvailability(productId: string): Promise<any> {
    const availability = await this.prisma.productLot.groupBy({
      by: ['warehouseId'],
      where: {
        productId,
        isActive: true,
        availableQuantity: { gt: 0 },
      },
      _sum: {
        availableQuantity: true,
      },
    });

    const warehouses = await this.prisma.warehouse.findMany({
      where: {
        id: { in: availability.map((a) => a.warehouseId) },
      },
    });

    return availability.map((avail) => {
      const warehouse = warehouses.find((w) => w.id === avail.warehouseId);
      return {
        warehouseId: avail.warehouseId,
        warehouseName: warehouse?.name || 'Unknown',
        availableQuantity: avail._sum.availableQuantity || 0,
      };
    });
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(threshold: number = 10): Promise<any> {
    const lowStock = await (this.prisma.productLot.groupBy({
      by: ['productId'],
      where: {
        isActive: true,
      },
      _sum: {
        availableQuantity: true,
      },
      having: {
        availableQuantity: {
          _sum: {
            lte: Number(threshold),
          },
        },
      },
      orderBy: {
        productId: 'asc',
      },
    }) as any);

    const products = await this.prisma.product.findMany({
      where: {
        id: { in: (lowStock || []).map((ls) => ls.productId) },
      },
    });

    return (lowStock || []).map((ls) => {
      const product = products.find((p) => p.id === ls.productId);
      return {
        productId: ls.productId,
        productName: product?.name || 'Unknown',
        sku: product?.sku || 'Unknown',
        totalQuantity: ls._sum.availableQuantity || 0,
      };
    });
  }

  /**
   * Get inventory movements report
   */
  async getInventoryMovementsReport(filters: {
    productId?: string;
    warehouseId?: string;
    movementType?: InventoryMovementType;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (filters.productId) where.productId = filters.productId;
    if (filters.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters.movementType) where.movementType = filters.movementType;
    if (filters.startDate || filters.endDate) {
      where.occurredAt = {};
      if (filters.startDate) where.occurredAt.gte = filters.startDate;
      if (filters.endDate) where.occurredAt.lte = filters.endDate;
    }

    const movements = await this.prisma.inventoryMovement.findMany({
      where,
      include: {
        product: true,
        warehouse: true,
        productLot: true,
        createdByUser: true,
      },
      orderBy: { occurredAt: 'desc' },
    });

    return movements;
  }

  /**
   * Applies the stock impact to a specific lot based on the movement type.
   * This is the core logic for maintaining 'availableQuantity' in the ERP.
   * 
   * ERP Rules:
   * - PURCHASE_RECEIPT / TRANSFER_IN: Increases salable stock.
   * - SALE / TRANSFER_OUT / DAMAGE: Decreases salable stock (strictly validated).
   * - RETURN: Tracked but NOT added to salable stock until inspection.
   * - ADJUSTMENT: Direction is explicit via quantity sign (+/-). Validated if negative.
   */
  public async applyLotStockImpact(
    productLotId: string,
    movementType: InventoryMovementType,
    quantity: number,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    const prisma = tx || this.prisma;
    const lot = await prisma.productLot.findUnique({
      where: { id: productLotId },
    });

    if (!lot) {
      throw new BadRequestException(`Product lot ${productLotId} not found`);
    }

    const currentAvailable = Number(lot.availableQuantity);
    const absoluteMagnitude = Math.abs(quantity);
    let newAvailableQuantity = currentAvailable;

    switch (movementType) {
      case InventoryMovementType.PURCHASE_RECEIPT:
      case InventoryMovementType.TRANSFER_IN:
        // Always adds to available stock
        newAvailableQuantity += absoluteMagnitude;
        break;

      case InventoryMovementType.SALE:
      case InventoryMovementType.TRANSFER_OUT:
      case InventoryMovementType.DAMAGE:
        // Strictly validate that we have enough stock before subtracting
        if (currentAvailable < absoluteMagnitude) {
          throw new BadRequestException(
            `Insufficient stock in lot ${lot.lotNumber}. Available: ${currentAvailable}, Required: ${absoluteMagnitude}`
          );
        }
        newAvailableQuantity -= absoluteMagnitude;
        break;

      case InventoryMovementType.INVENTORY_ADJUSTMENT_POSITIVE:
        // Positive increases, negative decreases. Validate if negative.
        if (quantity < 0 && currentAvailable < absoluteMagnitude) {
          throw new BadRequestException(
            `Adjustment would result in negative stock for lot ${lot.lotNumber}. Available: ${currentAvailable}, Requested reduction: ${absoluteMagnitude}`
          );
        }
        newAvailableQuantity += quantity;
        break;

      case InventoryMovementType.RETURN:
        // ERP Policy: Incoming returns go to a 'Pending Inspection' state.
        // They do NOT impact 'availableQuantity' (salable) immediately.
        // TODO: Implement inspection flow to reconcile this quantity into salable stock or scrap.
        return;

      default:
        // Other types (OTHER) do not impact salable stock by default
        return;
    }

    const updatedLot = await prisma.productLot.update({
      where: { id: productLotId },
      data: { availableQuantity: newAvailableQuantity },
      include: { product: true, warehouse: true }
    });

    // Check for low stock notification
    if (newAvailableQuantity <= 10 && currentAvailable > 10) {
      await this.notificationsService.notifyRole('BODEGA', {
        type: 'STOCK_LOW',
        title: 'Stock Bajo Detectado',
        message: `El producto ${updatedLot.product.name} (${updatedLot.product.sku}) ha bajado de 10 unidades en bodega ${updatedLot.warehouse.name}.`,
        module: 'INVENTORY',
        entityType: 'Product',
        entityId: updatedLot.productId,
        severity: 'CRITICAL',
        actionUrl: `/inventario/stock`,
      });
    }
  }

  /**
   * Get warehouse inventory summary
   */
  async getWarehouseInventorySummary(warehouseId?: string) {
    const where = warehouseId ? { warehouseId } : {};

    const summary = await this.prisma.productLot.groupBy({
      by: ['productId', 'warehouseId'],
      where: {
        ...where,
        isActive: true,
      },
      _sum: {
        availableQuantity: true,
        receivedQuantity: true,
      },
      _count: {
        id: true,
      },
    });

    const products = await this.prisma.product.findMany({
      where: {
        id: { in: (summary || []).map((s) => s.productId) },
      },
    });

    const warehouses = await this.prisma.warehouse.findMany({
      where: warehouseId ? { id: warehouseId } : {},
    });

    return (summary || []).map((item) => {
      const product = products.find((p) => p.id === item.productId);
      const warehouse = warehouses.find((w) => w.id === item.warehouseId);

      return {
        productId: item.productId,
        productName: product?.name || 'Unknown',
        sku: product?.sku || 'Unknown',
        warehouseId: item.warehouseId,
        warehouseName: warehouse?.name || 'Unknown',
        availableQuantity: item._sum.availableQuantity || 0,
        receivedQuantity: item._sum.receivedQuantity || 0,
        lotsCount: item._count.id,
      };
    });
  }

  /**
   * Selects lots for dispatch based on FEFO (First Expired, First Out)
   * with FIFO (First In, First Out) as fallback for lots without expiration date.
   *
   * @param productId The ID of the product to select lots for
   * @param warehouseId The ID of the warehouse where lots are located
   * @param requiredQuantity The quantity needed for dispatch
   * @param tx Optional transactional Prisma client
   * @returns A list of selected lots with the quantity to consume from each
   * @throws BadRequestException if the available quantity is insufficient
   */
  async selectLotsForDispatch(
    productId: string,
    warehouseId: string,
    requiredQuantity: number,
    tx?: Prisma.TransactionClient
  ): Promise<SelectedLot[]> {
    const prisma = tx || this.prisma;

    if (requiredQuantity <= 0) {
      throw new BadRequestException('Required quantity must be greater than zero');
    }

    // 1. Fetch available lots sorted by FEFO, then FIFO
    // FEFO: Closest expiration date first.
    // FIFO (Fallback): Oldest created lots first for those without expiration date.
    const lots = await prisma.productLot.findMany({
      where: {
        productId,
        warehouseId,
        isActive: true,
        availableQuantity: { gt: 0 },
      },
      orderBy: [
        { expirationDate: { sort: 'asc', nulls: 'last' } },
        { createdAt: 'asc' },
      ],
    });

    const selectedLots: SelectedLot[] = [];
    let remainingToSelect = requiredQuantity;

    // 2. Iterate and select quantities
    for (const lot of lots) {
      if (remainingToSelect <= 0) break;

      const available = Number(lot.availableQuantity);
      const toTake = Math.min(available, remainingToSelect);

      selectedLots.push({
        lotId: lot.id,
        lotNumber: lot.lotNumber,
        quantityToConsume: toTake,
      });

      remainingToSelect -= toTake;
    }

    // 3. Validation
    if (remainingToSelect > 0) {
      const totalAvailable = lots.reduce((acc, lot) => acc + Number(lot.availableQuantity), 0);
      throw new BadRequestException(
        `Insufficient inventory for product. Required: ${requiredQuantity}, Available: ${totalAvailable}`
      );
    }

    return selectedLots;
  }

  /**
   * Batch internal transfer from B2B to B2C (or any internal move)
   */
  async batchInternalTransfer(data: {
    sourceWarehouseId: string;
    destinationWarehouseId: string;
    items: { productId: string; quantity: number }[];
    createdByUserId?: string;
  }) {
    return this.transaction(async (tx) => {
      const results: any[] = [];

      for (const item of data.items) {
        // 1. Select lots from source using FEFO
        const selectedLots = await this.selectLotsForDispatch(
          item.productId,
          data.sourceWarehouseId,
          item.quantity,
          tx
        );

        for (const lotSelection of selectedLots) {
          const originalLot = await tx.productLot.findUnique({
            where: { id: lotSelection.lotId },
            include: { product: true }
          });

          if (!originalLot) continue;

          const unitCost = Number(originalLot.product.costAvgWeighted || 0);

          // 2. TRANSFER_OUT from Source
          await this.createInventoryMovement({
            productId: item.productId,
            warehouseId: data.sourceWarehouseId,
            productLotId: originalLot.id,
            movementType: InventoryMovementType.TRANSFER_OUT,
            quantity: lotSelection.quantityToConsume,
            unitCost,
            notes: `Transferencia masiva a sucursal ${data.destinationWarehouseId}`,
            createdByUserId: data.createdByUserId,
          }, tx);

          // Update existence summary for Source
          await tx.inventoryExistence.update({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: data.sourceWarehouseId
              }
            },
            data: {
              existence: { decrement: lotSelection.quantityToConsume },
              available: { decrement: lotSelection.quantityToConsume }
            }
          });

          // 3. Find or Create Lot in Destination
          let destLot = await tx.productLot.findFirst({
            where: {
              warehouseId: data.destinationWarehouseId,
              productId: item.productId,
              lotNumber: originalLot.lotNumber,
              expirationDate: originalLot.expirationDate,
            },
          });

          if (!destLot) {
            destLot = await tx.productLot.create({
              data: {
                productId: item.productId,
                warehouseId: data.destinationWarehouseId,
                lotNumber: originalLot.lotNumber,
                expirationDate: originalLot.expirationDate,
                manufacturingDate: originalLot.manufacturingDate,
                receivedQuantity: 0,
                availableQuantity: 0,
                notes: `Creado por transferencia desde ${data.sourceWarehouseId}`,
                isActive: true,
              },
            });
          }

          // 4. TRANSFER_IN to Destination
          await this.createInventoryMovement({
            productId: item.productId,
            warehouseId: data.destinationWarehouseId,
            productLotId: destLot.id,
            movementType: InventoryMovementType.TRANSFER_IN,
            quantity: lotSelection.quantityToConsume,
            unitCost,
            notes: `Transferencia masiva desde bodega ${data.sourceWarehouseId}`,
            createdByUserId: data.createdByUserId,
          }, tx);

          // Update existence summary for Destination
          await tx.inventoryExistence.upsert({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: data.destinationWarehouseId
              }
            },
            update: {
              existence: { increment: lotSelection.quantityToConsume },
              available: { increment: lotSelection.quantityToConsume }
            },
            create: {
              productId: item.productId,
              warehouseId: data.destinationWarehouseId,
              existence: lotSelection.quantityToConsume,
              available: lotSelection.quantityToConsume
            }
          });
        }
        results.push({ productId: item.productId, quantity: item.quantity, status: 'transferred' });
      }

      return {
        message: 'Batch transfer completed successfully',
        transferredCount: data.items.length,
        results,
      };
    }, { timeout: 30000 });
  }
}

