import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class LotsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Encuentra y consume stock usando FEFO (First Expired, First Out)
   * @returns Los lotes afectados y las cantidades consumidas
   */
  async consumeFEFO(params: {
    productId: string;
    warehouseId: string;
    quantity: number;
    tx?: any;
  }) {
    const { productId, warehouseId, quantity, tx } = params;
    const prisma = tx || this.prisma;

    // 0. Verificar si el producto requiere lotes
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (product?.requiresLot) {
      // Si requiere lote, y no hay lotes, error inmediato
      const lotCount = await prisma.productLot.count({ where: { productId, warehouseId, availableQuantity: { gt: 0 } } });
      if (lotCount === 0) {
        throw new BadRequestException(`El producto ${product.sku} requiere lote para ser vendido/ajustado y no hay lotes disponibles.`);
      }
    }

    // 1. Buscar lotes disponibles ordenados por fecha de expiración (FEFO)
    // Los lotes sin fecha de expiración van al final.
    const availableLots = await prisma.productLot.findMany({
      where: {
        productId,
        warehouseId,
        availableQuantity: { gt: 0 },
        isActive: true,
      },
      orderBy: [
        { expirationDate: 'asc' },
        { createdAt: 'asc' }
      ],
    });

    const totalAvailable = availableLots.reduce((acc, lot) => acc + Number(lot.availableQuantity), 0);
    if (totalAvailable < quantity) {
      throw new BadRequestException(`Stock insuficiente en lotes para el producto. Requerido: ${quantity}, Disponible: ${totalAvailable}`);
    }

    let remainingToConsume = quantity;
    const affectedLots: any[] = [];

    for (const lot of availableLots) {
      if (remainingToConsume <= 0) break;

      const lotAvailable = Number(lot.availableQuantity);
      const toConsumeFromThisLot = Math.min(lotAvailable, remainingToConsume);

      // Actualizar el lote
      await prisma.productLot.update({
        where: { id: lot.id },
        data: {
          availableQuantity: { decrement: toConsumeFromThisLot }
        }
      });

      affectedLots.push({
        lotId: lot.id,
        lotNumber: lot.lotNumber,
        quantity: toConsumeFromThisLot
      });

      remainingToConsume -= toConsumeFromThisLot;
    }

    return affectedLots;
  }

  /**
   * Crea o actualiza un lote durante ingreso (Compra o Ajuste)
   */
  async recordLotEntry(params: {
    productId: string;
    warehouseId: string;
    lotNumber: string;
    expirationDate?: Date | null;
    quantity: number;
    purchaseReceiptLineId?: string;
    tx?: any;
  }) {
    const { productId, warehouseId, lotNumber, expirationDate, quantity, purchaseReceiptLineId, tx } = params;
    const prisma = tx || this.prisma;

    // Buscar si ya existe el lote en esa bodega
    const existingLot = await prisma.productLot.findFirst({
      where: {
        productId,
        warehouseId,
        lotNumber,
        // Si hay fecha de expiración, compararla también para unicidad si el negocio lo requiere, 
        // pero usualmente Warehouse+Product+Lot es la llave.
      }
    });

    if (existingLot) {
      return prisma.productLot.update({
        where: { id: existingLot.id },
        data: {
          receivedQuantity: { increment: quantity },
          availableQuantity: { increment: quantity },
          expirationDate: expirationDate || existingLot.expirationDate
        }
      });
    } else {
      return prisma.productLot.create({
        data: {
          productId,
          warehouseId,
          lotNumber,
          expirationDate,
          receivedQuantity: quantity,
          availableQuantity: quantity,
          purchaseReceiptLineId,
          isActive: true
        }
      });
    }
  }
}
