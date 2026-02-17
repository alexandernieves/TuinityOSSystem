import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PurchasesService {
  private readonly logger = new Logger(PurchasesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new purchase order with automatic CIF calculation
   */
  async uploadFromExcel(file: any, tenantId: string) {
    const XLSX = require('xlsx');
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (!data || data.length === 0) {
      throw new BadRequestException('Excel file is empty or invalid format');
    }

    const items: any[] = [];
    const errors: string[] = [];
    let totalFob = new Prisma.Decimal(0);

    // Iterate rows
    // Map Spanish/English headers to key fields
    for (let i = 0; i < data.length; i++) {
      const row: any = data[i];
      const rowNum = i + 2;

      const sku =
        row['SKU'] ||
        row['sku'] ||
        row['Codigo'] ||
        row['Item'] ||
        row['Part Number'];
      const name =
        row['Description'] ||
        row['Descripcion'] ||
        row['Nombre'] ||
        row['Producto'];
      const qty = Number(
        row['Quantity'] ||
          row['quantity'] ||
          row['Cantidad'] ||
          row['Qty'] ||
          row['Unidades'],
      );
      const price = Number(
        row['UnitPrice'] ||
          row['price'] ||
          row['Precio'] ||
          row['FOB'] ||
          row['Costo Unitario'],
      );

      if (!sku && !name) {
        // Skip empty rows or rows without identifier
        continue;
      }

      // Find Product by Name (Description)
      let product: any = null;

      /*
            // SKU search removed as sku field does not exist on Product model
            if (sku) {
                product = await this.prisma.product.findFirst({
                    where: { sku: String(sku), tenantId, deletedAt: null },
                });
            }
            */

      // Try to find by description if strict name match
      if (!product && (name || sku)) {
        const searchTerm = name || sku;
        product = await this.prisma.product.findFirst({
          where: {
            description: { equals: String(searchTerm), mode: 'insensitive' },
            tenantId,
            deletedAt: null,
          },
        });
      }

      // Fallback: contains search
      if (!product && (name || sku)) {
        const searchTerm = name || sku;
        product = await this.prisma.product.findFirst({
          where: {
            description: { contains: String(searchTerm), mode: 'insensitive' },
            tenantId,
            deletedAt: null,
          },
        });
      }

      if (!product) {
        errors.push(
          `Row ${rowNum}: Product '${sku || name}' not found in catalog.`,
        );
        continue;
      }

      if (isNaN(qty) || qty <= 0) {
        errors.push(`Row ${rowNum}: Invalid Quantity for '${sku || name}'.`);
        continue;
      }

      // Price might be 0, allow it but maybe warn?
      const validPrice = isNaN(price) ? 0 : price;

      items.push({
        productId: product.id,
        // sku: product.sku, // Removed
        description: product.description,
        quantity: qty,
        unitFobValue: validPrice,
      });

      totalFob = totalFob.add(
        new Prisma.Decimal(qty).mul(new Prisma.Decimal(validPrice)),
      );
    }

    if (errors.length > 0) {
      // We can return partial success or full errors. Let's return errors so user fixes input.
      // Or better, return format with valid/invalid
      return {
        status: 'partial_error',
        message: 'Some rows have errors',
        errors,
        validItems: items,
        totalFob: totalFob.toNumber(),
      };
    }

    return {
      status: 'success',
      items, // Frontend will use this list to populate the "Create Purchase Order" form
      totalFob: totalFob.toNumber(),
    };
  }

  /**
   * Create a new purchase order with automatic CIF calculation
   */
  async create(
    createDto: CreatePurchaseOrderDto,
    tenantId: string,
    userId: string,
  ) {
    const { branchId, supplierName, invoiceNumber, items, ...orderData } =
      createDto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Validate Branch
      const branch = await tx.branch.findFirst({
        where: { id: branchId, tenantId },
      });
      if (!branch) throw new NotFoundException(`Branch ${branchId} not found`);

      // 2. Check for duplicate invoice
      if (invoiceNumber) {
        const existing = await tx.purchaseOrder.findFirst({
          where: { tenantId, supplierName, invoiceNumber },
        });
        if (existing) {
          throw new BadRequestException(
            `Invoice ${invoiceNumber} from ${supplierName} already exists`,
          );
        }
      }

      // 3. Calculate totals
      const fobValue = new Prisma.Decimal(orderData.fobValue);
      const freightCost = new Prisma.Decimal(orderData.freightCost || 0);
      const insuranceCost = new Prisma.Decimal(orderData.insuranceCost || 0);
      const dutiesCost = new Prisma.Decimal(orderData.dutiesCost || 0);
      const otherCosts = new Prisma.Decimal(orderData.otherCosts || 0);

      const totalExpenses = freightCost
        .add(insuranceCost)
        .add(dutiesCost)
        .add(otherCosts);
      const totalCifValue = fobValue.add(totalExpenses);

      // 4. Validate and prepare items
      let calculatedFobTotal = new Prisma.Decimal(0);
      const itemsData: any[] = [];

      for (const item of items) {
        // Verify product exists
        const product = await tx.product.findFirst({
          where: { id: item.productId, tenantId, deletedAt: null },
        });
        if (!product) {
          throw new BadRequestException(`Product ${item.productId} not found`);
        }

        const quantity = new Prisma.Decimal(item.quantity);
        const unitFobValue = new Prisma.Decimal(item.unitFobValue);
        const subtotalFob = quantity.mul(unitFobValue);

        calculatedFobTotal = calculatedFobTotal.add(subtotalFob);

        itemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          unitFobValue,
          subtotalFob,
        });
      }

      // 5. Validate FOB total matches
      if (!calculatedFobTotal.equals(fobValue)) {
        this.logger.warn(
          `FOB mismatch: provided ${fobValue}, calculated ${calculatedFobTotal}. Using calculated value.`,
        );
      }

      // 6. Calculate CIF per item (proportional distribution)
      const finalItemsData = itemsData.map((item) => {
        // Proportion of this item's FOB to total FOB
        const proportion = item.subtotalFob.div(calculatedFobTotal);

        // Proportional share of expenses
        const itemExpenses = totalExpenses.mul(proportion);

        // CIF = FOB + proportional expenses
        const subtotalCif = item.subtotalFob.add(itemExpenses);
        const unitCifValue = subtotalCif.div(new Prisma.Decimal(item.quantity));

        return {
          tenantId,
          productId: item.productId,
          quantity: item.quantity,
          receivedQuantity: 0,
          unitFobValue: item.unitFobValue,
          unitCifValue,
          subtotalFob: item.subtotalFob,
          subtotalCif,
        };
      });

      // 7. Create Purchase Order
      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          tenantId,
          branchId,
          supplierName,
          invoiceNumber,
          proformaNumber: orderData.proformaNumber,
          fobValue: calculatedFobTotal,
          freightCost,
          insuranceCost,
          dutiesCost,
          otherCosts,
          totalCifValue,
          orderDate: orderData.orderDate
            ? new Date(orderData.orderDate)
            : new Date(),
          expectedDate: orderData.expectedDate
            ? new Date(orderData.expectedDate)
            : null,
          notes: orderData.notes,
          createdBy: userId,
          items: {
            create: finalItemsData,
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, description: true },
              },
            },
          },
        },
      });

      // 8. Create audit log
      await tx.purchaseAuditLog.create({
        data: {
          tenantId,
          purchaseOrderId: purchaseOrder.id,
          action: 'CREATED',
          details: JSON.stringify({ itemCount: items.length }),
          createdBy: userId,
        },
      });

      return purchaseOrder;
    });
  }

  /**
   * Receive purchase order (partial or full)
   * Updates inventory and calculates weighted average cost
   */
  async receive(
    purchaseOrderId: string,
    receiveDto: ReceivePurchaseOrderDto,
    tenantId: string,
    userId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch Purchase Order
      const purchaseOrder = await tx.purchaseOrder.findFirst({
        where: { id: purchaseOrderId, tenantId },
        include: { items: true },
      });

      if (!purchaseOrder) {
        throw new NotFoundException(
          `Purchase Order ${purchaseOrderId} not found`,
        );
      }

      if (purchaseOrder.status === 'RECEIVED') {
        throw new BadRequestException('Purchase Order already fully received');
      }

      // 2. Process each received item
      // Check if all items are fully received to determine status update
      const allItemsFullyReceived = true;

      for (const receivedItem of receiveDto.items) {
        const orderItem = purchaseOrder.items.find(
          (item) => item.productId === receivedItem.productId,
        );

        if (!orderItem) {
          throw new BadRequestException(
            `Product ${receivedItem.productId} not found in purchase order`,
          );
        }

        const remainingQty = new Prisma.Decimal(orderItem.quantity).minus(
          new Prisma.Decimal(orderItem.receivedQuantity),
        );
        // Convert received quantity to Decimal for comparison
        const receivedQtyDecimal = new Prisma.Decimal(receivedItem.quantity);

        if (receivedQtyDecimal.gt(remainingQty)) {
          throw new BadRequestException(
            `Cannot receive ${receivedItem.quantity} units. Only ${remainingQty} remaining for product ${receivedItem.productId}`,
          );
        }

        // Update PO Item received quantity
        await tx.purchaseOrderItem.update({
          where: { id: orderItem.id },
          data: {
            receivedQuantity: { increment: receivedQtyDecimal.toNumber() },
          },
        });

        // --- INVENTORY & COSTING LOGIC ---

        // Get current product state for costing
        const product = await tx.product.findUnique({
          where: { id: receivedItem.productId },
        });

        if (!product)
          throw new NotFoundException(
            `Product ${receivedItem.productId} not found`,
          );

        // Get current total inventory count across ALL branches (Global Weighted Average)
        // Or per branch? Typically Weighted Average is per SKU globally or per branch.
        // Evolution doc implies unified inventory, so let's check global stock for costing.
        // However, inventory records are per branch.
        // Let's sum up all inventory for this product in this tenant to get 'Old Qty'.

        const inventoryAgg = await tx.inventory.aggregate({
          where: { tenantId, productId: receivedItem.productId },
          _sum: { quantity: true },
        });

        const currentTotalQty =
          inventoryAgg._sum.quantity ?? new Prisma.Decimal(0);

        // Calculate New Weighted Average Cost
        // Formula: ((OldQty * OldWeightedCost) + (ReceivedQty * NewUnitCIF)) / (OldQty + ReceivedQty)

        const oldTotalValue = new Prisma.Decimal(currentTotalQty).mul(
          product.weightedAvgCost || 0,
        );
        const newReceivedValue = receivedQtyDecimal.mul(orderItem.unitCifValue);
        const newTotalQty = new Prisma.Decimal(currentTotalQty).add(
          receivedQtyDecimal,
        );

        const newWeightedAvgCost = oldTotalValue
          .add(newReceivedValue)
          .div(newTotalQty);

        // Update Product Costs
        await tx.product.update({
          where: { id: receivedItem.productId },
          data: {
            weightedAvgCost: newWeightedAvgCost,
            lastFobCost: orderItem.unitFobValue,
            lastCifCost: orderItem.unitCifValue,
            // Note: We don't update sell prices automatically here,
            // as per requirements this might trigger a review or strictly follow margin rules.
          },
        });

        // Update Inventory (Per Branch)
        // First check if inventory record exists
        const existingInventory = await tx.inventory.findUnique({
          where: {
            tenantId_branchId_productId: {
              tenantId,
              branchId: purchaseOrder.branchId,
              productId: receivedItem.productId,
            },
          },
        });

        if (existingInventory) {
          await tx.inventory.update({
            where: {
              tenantId_branchId_productId: {
                tenantId,
                branchId: purchaseOrder.branchId,
                productId: receivedItem.productId,
              },
            },
            data: {
              quantity: { increment: receivedQtyDecimal.toNumber() },
            },
          });
        } else {
          await tx.inventory.create({
            data: {
              tenantId,
              branchId: purchaseOrder.branchId,
              productId: receivedItem.productId,
              quantity: receivedItem.quantity, // Initialize
              minStock: 0,
              maxStock: 0,
              reorderPoint: 0,
            },
          });
        }

        // Create Inventory Movement (IN)
        await tx.inventoryMovement.create({
          data: {
            tenantId,
            branchId: purchaseOrder.branchId,
            productId: receivedItem.productId,
            type: 'IN', // Using string literal matching enum
            quantity: receivedItem.quantity,
            reason: `Purchase Order ${purchaseOrder.invoiceNumber || purchaseOrder.id}`,
            referenceId: purchaseOrderId,
            createdBy: userId,
          },
        });
      }

      // 3. Re-Check if Purchase Order is fully fulfilled
      // We need to fetch items again to see the *new* received quantities,
      // OR checks logic above. The simple way is to check if we just filled the last gap.
      // Let's refetch items to be sure.
      const updatedItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId },
      });

      const allReceived = updatedItems.every((item) =>
        new Prisma.Decimal(item.receivedQuantity).greaterThanOrEqualTo(
          new Prisma.Decimal(item.quantity),
        ),
      );

      const newStatus = allReceived ? 'RECEIVED' : 'PARTIAL';

      // 4. Update Purchase Order status
      const updated = await tx.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: {
          status: newStatus as any, // Cast to enum
          receivedDate: allReceived
            ? receiveDto.receivedDate
              ? new Date(receiveDto.receivedDate)
              : new Date()
            : undefined,
        },
        include: {
          items: true,
        },
      });

      // 5. Create audit log
      await tx.purchaseAuditLog.create({
        data: {
          tenantId,
          purchaseOrderId,
          action: allReceived ? 'RECEIVED_FULL' : 'RECEIVED_PARTIAL',
          details: JSON.stringify({
            receivedItems: receiveDto.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
            })),
          }),
          createdBy: userId,
        },
      });

      return updated;
    });
  }

  /**
   * List purchase orders with filters
   */
  async findAll(
    query: {
      page: number;
      limit: number;
      supplierName?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    },
    tenantId: string,
  ) {
    const { page, limit, supplierName, status, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PurchaseOrderWhereInput = {
      tenantId,
      ...(supplierName
        ? { supplierName: { contains: supplierName, mode: 'insensitive' } }
        : {}),
      ...(status ? { status: status as any } : {}),
      ...(startDate || endDate
        ? {
            orderDate: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { orderDate: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, description: true },
              },
            },
          },
        },
      }),
      this.prisma.purchaseOrder.count({ where }),
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

  /**
   * Get single purchase order by ID
   */
  async findOne(id: string, tenantId: string) {
    const purchaseOrder = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                description: true,
                lastFobCost: true,
                weightedAvgCost: true,
              },
            },
          },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!purchaseOrder) {
      throw new NotFoundException(`Purchase Order ${id} not found`);
    }

    return purchaseOrder;
  }

  /**
   * Get purchase history for a product
   */
  async getPurchaseHistory(productId: string, tenantId: string) {
    const history = await this.prisma.purchaseOrderItem.findMany({
      where: {
        productId,
        tenantId,
      },
      include: {
        purchaseOrder: {
          select: {
            id: true,
            supplierName: true,
            invoiceNumber: true,
            orderDate: true,
            receivedDate: true,
            status: true,
          },
        },
      },
      orderBy: {
        purchaseOrder: {
          orderDate: 'desc',
        },
      },
    });

    return history;
  }
}
