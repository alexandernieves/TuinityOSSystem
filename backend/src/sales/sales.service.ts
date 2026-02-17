import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createSaleDto: CreateSaleDto, tenantId: string, userId: string) {
    const {
      branchId,
      customerId,
      items,
      paymentMethod,
      status,
      notes,
      authorizedBy,
    } = createSaleDto;

    const initialStatus = status || 'COMPLETED'; // Default to COMPLETED for POS compatibility

    // PaymentMethod is required unless it's a QUOTE
    if (initialStatus !== 'QUOTE' && !paymentMethod) {
      throw new BadRequestException(
        'Payment method is required for non-quote sales',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Validate Branch
      const branch = await tx.branch.findFirst({
        where: { id: branchId, tenantId },
      });
      if (!branch) throw new NotFoundException(`Branch ${branchId} not found`);

      // 2. Validate Customer if provided
      let customer: any = null; // Using any to avoid importing Customer type for now, or could import
      if (customerId) {
        customer = await tx.customer.findFirst({
          where: { id: customerId, tenantId, deletedAt: null },
        });
        if (!customer)
          throw new NotFoundException(`Customer ${customerId} not found`);

        if (customer.isBlocked && initialStatus !== 'QUOTE') {
          throw new BadRequestException(
            `Customer is blocked: ${customer.blockedReason}`,
          );
        }

        if (
          paymentMethod === 'CREDIT' &&
          !customer.isApproved &&
          initialStatus !== 'QUOTE'
        ) {
          throw new BadRequestException(
            'Credit sale not allowed for unapproved customer',
          );
        }

        // Delinquency Check: Block if has overdue sales
        if (paymentMethod === 'CREDIT' && initialStatus !== 'QUOTE') {
          const overdueSales = await tx.sale.findFirst({
            where: {
              customerId: customer.id,
              tenantId,
              status: { in: ['COMPLETED', 'PARTIAL'] as any },
              paymentMethod: 'CREDIT',
              dueDate: { lt: new Date() },
            },
          });

          if (overdueSales) {
            throw new BadRequestException(
              `Customer has overdue invoices. Cannot process new credit orders. ` +
                `Oldest overdue: ${overdueSales.orderNumber || overdueSales.id.substring(0, 8)}`,
            );
          }
        }
      } else if (paymentMethod === 'CREDIT') {
        throw new BadRequestException('Customer is required for credit sales');
      }

      // Calculate Due Date if Credit
      let dueDate: Date | null = null;
      if (
        paymentMethod === 'CREDIT' &&
        customer &&
        customer.paymentTermDays > 0
      ) {
        dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + Number(customer.paymentTermDays));
      }

      // 3. Pre-calculate totals and validate stock (First Pass)
      let subtotal = new Prisma.Decimal(0);
      let totalTax = new Prisma.Decimal(0);
      let totalDiscount = new Prisma.Decimal(0);
      const itemsToProcess: any[] = [];

      for (const item of items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, tenantId, deletedAt: null },
        });

        if (!product)
          throw new BadRequestException(`Product ${item.productId} not found`);

        // Check Stock ONLY if not QUOTE
        if (initialStatus !== 'QUOTE') {
          const inventory = await tx.inventory.findUnique({
            where: {
              tenantId_branchId_productId: {
                tenantId,
                branchId,
                productId: item.productId,
              },
            },
          });

          const quantity = inventory?.quantity || 0;
          const reserved = inventory?.reserved || 0;
          const available = quantity - reserved;

          if (available < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for ${product.description}. Available: ${available} (Physical: ${quantity}, Reserved: ${reserved})`,
            );
          }
        }

        // Price Level Logic
        let unitPrice: Prisma.Decimal;
        if (item.unitPrice !== undefined) {
          unitPrice = new Prisma.Decimal(item.unitPrice);
        } else {
          // Use customer price level if available, default to A
          const level = customer?.priceLevel || 'A';
          switch (level) {
            case 'A':
              unitPrice = product.price_a;
              break;
            case 'B':
              unitPrice = product.price_b;
              break;
            case 'C':
              unitPrice = product.price_c;
              break;
            case 'D':
              unitPrice = product.price_d;
              break;
            case 'E':
              unitPrice = product.price_e;
              break;
            default:
              unitPrice = product.price_a;
          }
        }

        const quantityDec = new Prisma.Decimal(item.quantity);
        const discountDec = new Prisma.Decimal(item.discount || 0);
        const taxAmount = new Prisma.Decimal(0); // Assuming 0 for now or configurable later
        const lineTotal = unitPrice.mul(quantityDec).minus(discountDec);

        subtotal = subtotal.add(unitPrice.mul(quantityDec));
        totalDiscount = totalDiscount.add(discountDec);
        totalTax = totalTax.add(taxAmount);

        itemsToProcess.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          taxAmount,
          discountAmount: discountDec,
          totalLine: lineTotal,
        });
      }

      const total = subtotal.minus(totalDiscount).add(totalTax);

      // 4. Validate Credit Limit (Skip for QUOTE)
      if (initialStatus !== 'QUOTE' && paymentMethod === 'CREDIT' && customer) {
        const newBalance = customer.currentBalance.add(total);
        if (newBalance.gt(customer.creditLimit)) {
          throw new BadRequestException(
            `Credit limit exceeded. Available: ${customer.creditLimit.minus(customer.currentBalance)}`,
          );
        }

        // Update Customer Balance
        await tx.customer.update({
          where: { id: customerId },
          data: { currentBalance: { increment: total } },
        });
      }

      // 5. Create Sale
      const sale = await tx.sale.create({
        data: {
          tenantId,
          branchId,
          customerId,
          subtotal,
          tax: totalTax,
          discount: totalDiscount,
          total,
          paymentMethod: paymentMethod || 'CASH', // Default for Quote in DB if nullable not allowed, but we made it optional?
          // Wait, DB schema says paymentMethod String. It is NOT optional in schema.
          // So we must provide a dummy or allow null in schema.
          // For now, let's put 'CASH' or 'PENDING' if quote.
          status: initialStatus as any,
          dueDate,
          notes,
          authorizedBy,
          authorizedAt: authorizedBy ? new Date() : undefined,
          createdBy: userId,
          items: {
            create: itemsToProcess.map((i) => ({
              ...i,
              tenantId,
            })),
          },
        },
        include: { items: true },
      });

      // 6. Finalize Inventory (Second Pass)
      if (initialStatus !== 'QUOTE') {
        for (const item of itemsToProcess) {
          if (initialStatus === 'COMPLETED') {
            // Direct Sale (POS): Decrement Quantity
            await tx.inventory.update({
              where: {
                tenantId_branchId_productId: {
                  tenantId,
                  branchId,
                  productId: item.productId,
                },
              },
              data: { quantity: { decrement: item.quantity } },
            });

            await tx.inventoryMovement.create({
              data: {
                tenantId,
                branchId,
                productId: item.productId,
                type: 'OUT',
                quantity: -item.quantity,
                reason: `Sale ${sale.id}`,
                referenceId: sale.id,
                createdBy: userId,
              },
            });
          } else if (
            initialStatus === 'PENDING' ||
            initialStatus === 'APPROVED_ORDER' ||
            initialStatus === 'PACKING'
          ) {
            // Order: Increase Reserved
            await tx.inventory.update({
              where: {
                tenantId_branchId_productId: {
                  tenantId,
                  branchId,
                  productId: item.productId,
                },
              },
              data: { reserved: { increment: item.quantity } },
            });
            // No movement for reservation, or maybe internal log?
          }
        }
      }

      return sale;
    });
  }

  async findById(id: string, tenantId: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, tenantId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        branch: true,
      },
    });

    if (!sale) throw new NotFoundException(`Sale ${id} not found`);
    return sale;
  }

  async generateQuotePdf(id: string, tenantId: string): Promise<Buffer> {
    const quote: any = await this.findById(id, tenantId);

    const PdfPrinter = require('pdfmake');
    const fonts = {
      Roboto: {
        normal: 'node_modules/pdfmake/build/vfs_fonts.js',
        bold: 'node_modules/pdfmake/build/vfs_fonts.js',
      },
    };

    const printer = new PdfPrinter(fonts);

    const docDefinition: any = {
      content: [
        {
          columns: [
            { text: 'COTIZACIÓN / QUOTE', style: 'header' },
            {
              text: `No: ${quote.orderNumber || quote.id.substring(0, 8)}`,
              alignment: 'right',
              style: 'subheader',
            },
          ],
        },
        { text: '\n' },
        {
          columns: [
            {
              width: '*',
              text: [
                { text: 'Customer:\n', bold: true },
                { text: quote.customer?.name || 'Walk-in Customer' },
                { text: `\nTax ID: ${quote.customer?.taxId || 'N/A'}` },
                { text: `\nEmail: ${quote.customer?.email || 'N/A'}` },
              ],
            },
            {
              width: 'auto',
              text: [
                { text: 'Date:\n', bold: true },
                { text: quote.createdAt.toLocaleDateString() },
                { text: '\nBranch:\n', bold: true },
                { text: quote.branch?.name },
              ],
              alignment: 'right',
            },
          ],
        },
        { text: '\n\n' },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'Description', style: 'tableHeader' },
                { text: 'Qty', style: 'tableHeader', alignment: 'center' },
                {
                  text: 'Unit Price',
                  style: 'tableHeader',
                  alignment: 'right',
                },
                { text: 'Total', style: 'tableHeader', alignment: 'right' },
              ],
              ...quote.items.map((item: any) => [
                item.product.description,
                { text: item.quantity.toString(), alignment: 'center' },
                {
                  text: `$${Number(item.unitPrice).toFixed(2)}`,
                  alignment: 'right',
                },
                {
                  text: `$${Number(item.totalLine).toFixed(2)}`,
                  alignment: 'right',
                },
              ]),
            ],
          },
          layout: 'lightHorizontalLines',
        },
        { text: '\n' },
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 'auto',
              table: {
                body: [
                  [
                    'Subtotal:',
                    {
                      text: `$${Number(quote.subtotal).toFixed(2)}`,
                      alignment: 'right',
                    },
                  ],
                  [
                    'Discount:',
                    {
                      text: `$${Number(quote.totalDiscount).toFixed(2)}`,
                      alignment: 'right',
                    },
                  ],
                  [
                    'Tax:',
                    {
                      text: `$${Number(quote.totalTax).toFixed(2)}`,
                      alignment: 'right',
                    },
                  ],
                  [
                    { text: 'TOTAL:', bold: true },
                    {
                      text: `$${Number(quote.total).toFixed(2)}`,
                      alignment: 'right',
                      bold: true,
                    },
                  ],
                ],
              },
              layout: 'noBorders',
            },
          ],
        },
        { text: '\n\nNotes:', style: 'subheader' },
        { text: quote.notes || 'This quote is valid for 15 days.' },
      ],
      styles: {
        header: { fontSize: 20, bold: true, color: '#2c3e50' },
        subheader: { fontSize: 14, bold: true, margin: [0, 5, 0, 5] },
        tableHeader: {
          bold: true,
          fontSize: 12,
          color: 'black',
          fillColor: '#eeeeee',
        },
      },
      defaultStyle: {
        fontSize: 10,
      },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }

  async update(
    id: string,
    updateDto: UpdateSaleDto,
    tenantId: string,
    userId: string,
  ) {
    const { items, notes, authorizedBy, paymentMethod, customerId } = updateDto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Get existing sale with items
      const existingSale = await tx.sale.findFirst({
        where: { id, tenantId },
        include: { items: true, customer: true },
      });

      if (!existingSale) throw new NotFoundException(`Sale ${id} not found`);

      // Check if status allows editing
      const forbiddenStatuses = ['COMPLETED', 'VOID', 'REFUNDED'];
      if (forbiddenStatuses.includes(existingSale.status)) {
        throw new BadRequestException(
          `Cannot edit sale in status ${existingSale.status}`,
        );
      }

      const needsInventoryLogic = [
        'PENDING',
        'APPROVED_ORDER',
        'PACKING',
        'PARTIAL',
      ].includes(existingSale.status);

      // 2. Prepare items for processing
      let newSubtotal = 0;
      const itemsToProcess: any[] = [];

      for (const itemDto of items) {
        const product = await tx.product.findFirst({
          where: { id: itemDto.productId, tenantId, deletedAt: null },
        });

        if (!product)
          throw new NotFoundException(`Product ${itemDto.productId} not found`);

        const unitPrice =
          itemDto.unitPrice !== undefined
            ? new Prisma.Decimal(itemDto.unitPrice)
            : product.price_a;
        const discount = new Prisma.Decimal(itemDto.discount);
        const quantity = new Prisma.Decimal(itemDto.quantity);
        const totalLine = quantity.mul(unitPrice).sub(discount);

        newSubtotal += Number(totalLine);

        itemsToProcess.push({
          productId: itemDto.productId,
          quantity,
          unitPrice,
          discountAmount: discount,
          taxAmount: new Prisma.Decimal(0), // Tax logic placeholder
          total: totalLine,
        });
      }

      const newTotalTax = 0; // Placeholder
      const newTotalDiscount = itemsToProcess.reduce(
        (sum, i) => sum + Number(i.discountAmount),
        0,
      );
      const newTotal = newSubtotal + newTotalTax;

      // 3. Credit Validation (if total changed)
      if (existingSale.paymentMethod === 'CREDIT' && existingSale.customerId) {
        const customer = existingSale.customer;
        if (customer) {
          const balanceDiff = newTotal - Number(existingSale.total);
          if (balanceDiff > 0) {
            const newBalance = Number(customer.currentBalance) + balanceDiff;
            if (newBalance > Number(customer.creditLimit)) {
              throw new BadRequestException(
                'Modification exceeds credit limit',
              );
            }
          }
        }
      }

      // 4. Inventory Adjustments
      if (needsInventoryLogic) {
        // Existing items Map
        const existingItemsMap = new Map(
          existingSale.items.map((i) => [i.productId, i]),
        );
        const newItemsMap = new Map(
          itemsToProcess.map((i) => [i.productId, i]),
        );

        // Removed or Decreased quantity
        for (const oldItem of existingSale.items) {
          const newItem = newItemsMap.get(oldItem.productId);
          const oldQty = Number(oldItem.quantity);
          const newQty = newItem ? Number(newItem.quantity) : 0;

          if (newQty < oldQty) {
            const diff = oldQty - newQty;
            // Release reserved stock
            await tx.inventory.update({
              where: {
                tenantId_branchId_productId: {
                  tenantId,
                  branchId: existingSale.branchId,
                  productId: oldItem.productId,
                },
              },
              data: { reserved: { decrement: diff } },
            });
          }
        }

        // Added or Increased quantity
        for (const newItem of itemsToProcess) {
          const oldItem = existingItemsMap.get(newItem.productId);
          const oldQty = oldItem ? Number(oldItem.quantity) : 0;
          const newQty = Number(newItem.quantity);

          if (newQty > oldQty) {
            const diff = newQty - oldQty;

            // Check availability
            const inventory = await tx.inventory.findUnique({
              where: {
                tenantId_branchId_productId: {
                  tenantId,
                  branchId: existingSale.branchId,
                  productId: newItem.productId,
                },
              },
            });
            const available =
              (inventory?.quantity || 0) - (inventory?.reserved || 0);
            if (available < diff) {
              throw new BadRequestException(
                `Insufficient stock for product ${newItem.productId}`,
              );
            }

            // Reserve stock
            await tx.inventory.update({
              where: {
                tenantId_branchId_productId: {
                  tenantId,
                  branchId: existingSale.branchId,
                  productId: newItem.productId,
                },
              },
              data: { reserved: { increment: diff } },
            });
          }
        }
      }

      // 5. Update Sale record and Recreate Items
      // Simpler to delete and recreate items in a transaction for amendments
      await tx.saleItem.deleteMany({ where: { saleId: id } });

      return tx.sale.update({
        where: { id },
        data: {
          customerId: customerId || existingSale.customerId,
          subtotal: new Prisma.Decimal(newSubtotal),
          tax: new Prisma.Decimal(newTotalTax),
          discount: new Prisma.Decimal(newTotalDiscount),
          total: new Prisma.Decimal(newTotal),
          paymentMethod: paymentMethod || existingSale.paymentMethod,
          notes: notes || existingSale.notes,
          authorizedBy: authorizedBy || existingSale.authorizedBy,
          authorizedAt: authorizedBy ? new Date() : existingSale.authorizedAt,
          updatedAt: new Date(),
          items: {
            create: itemsToProcess.map((i) => ({
              ...i,
              tenantId,
            })),
          },
        },
        include: { items: true },
      });
    });
  }

  async updateStatus(
    id: string,
    updateDto: any,
    tenantId: string,
    userId: string,
  ) {
    const { status: newStatus, authorizedBy, notes } = updateDto;
    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: { id, tenantId },
        include: {
          items: { include: { product: true } },
          customer: true,
        },
      });

      if (!sale) throw new NotFoundException(`Sale ${id} not found`);

      const currentStatus = sale.status;
      if (currentStatus === newStatus) return sale;

      // 0. Credit Validation
      if (
        ['PENDING', 'APPROVED_ORDER'].includes(newStatus) &&
        !['PENDING', 'APPROVED_ORDER', 'PACKING', 'COMPLETED'].includes(
          currentStatus,
        )
      ) {
        if (
          sale.customerId &&
          sale.paymentMethod === 'CREDIT' &&
          (sale as any).customer
        ) {
          const customer = (sale as any).customer;
          const newBalance =
            Number(customer.currentBalance) + Number(sale.total);
          if (newBalance > Number(customer.creditLimit)) {
            throw new BadRequestException(
              `Credit limit exceeded. Current Balance: ${customer.currentBalance}, ` +
                `Order Total: ${sale.total}, Limit: ${customer.creditLimit}`,
            );
          }

          // Delinquency Check: Block if has overdue sales
          const overdueSales = await tx.sale.findFirst({
            where: {
              customerId: customer.id,
              tenantId,
              status: { in: ['COMPLETED', 'PARTIAL'] as any },
              paymentMethod: 'CREDIT',
              dueDate: { lt: new Date() },
            },
          });

          if (overdueSales) {
            throw new BadRequestException(
              `Customer has overdue invoices. Cannot approve new credit orders. ` +
                `Oldest overdue invoice: ${overdueSales.orderNumber || overdueSales.id.substring(0, 8)}`,
            );
          }
        }
      }

      // Quote -> Pending (Reserve Stock)
      if (currentStatus === 'QUOTE' && newStatus === 'PENDING') {
        for (const item of sale.items) {
          const inventory = await tx.inventory.findUnique({
            where: {
              tenantId_branchId_productId: {
                tenantId,
                branchId: sale.branchId,
                productId: item.productId,
              },
            },
          });

          const quantity = inventory?.quantity || 0;
          const reserved = inventory?.reserved || 0;
          // Available = Physical Quantity - Previously Reserved
          const available = quantity - reserved;
          const itemQty = Number(item.quantity);

          if (available < itemQty) {
            throw new BadRequestException(
              `Insufficient stock for ${item.product.description} to approve order. Available: ${available}`,
            );
          }

          // Reserve Stock
          await tx.inventory.update({
            where: {
              tenantId_branchId_productId: {
                tenantId,
                branchId: sale.branchId,
                productId: item.productId,
              },
            },
            data: { reserved: { increment: itemQty } },
          });
        }
      }

      // Logic for completing from pending or canceling pending handled similarly...
      // Pending/Packing -> Completed (Ship It!)
      if (
        ['PENDING', 'APPROVED_ORDER', 'PACKING'].includes(currentStatus) &&
        newStatus === 'COMPLETED'
      ) {
        for (const item of sale.items) {
          const itemQty = Number(item.quantity);

          // Decrement Quantity (Physical Out) AND Decrement Reserved (Release Reservation)
          await tx.inventory.update({
            where: {
              tenantId_branchId_productId: {
                tenantId,
                branchId: sale.branchId,
                productId: item.productId,
              },
            },
            data: {
              quantity: { decrement: itemQty },
              reserved: { decrement: itemQty },
            },
          });

          // Record OUT Movement
          await tx.inventoryMovement.create({
            data: {
              tenantId,
              branchId: sale.branchId,
              productId: item.productId,
              type: 'OUT',
              quantity: -itemQty,
              reason: `Sale Completed ${sale.id}`,
              referenceId: sale.id,
              createdBy: userId,
            },
          });
        }
      }

      // Pending -> Void (Release Reservation)
      if (
        ['PENDING', 'APPROVED_ORDER', 'PACKING'].includes(currentStatus) &&
        newStatus === 'VOID'
      ) {
        for (const item of sale.items) {
          const itemQty = Number(item.quantity);
          await tx.inventory.update({
            where: {
              tenantId_branchId_productId: {
                tenantId,
                branchId: sale.branchId,
                productId: item.productId,
              },
            },
            data: { reserved: { decrement: itemQty } },
          });
        }
      }

      return tx.sale.update({
        where: { id },
        data: {
          status: newStatus,
          authorizedBy: authorizedBy || undefined,
          authorizedAt: authorizedBy ? new Date() : undefined,
          notes: notes || undefined,
        },
      });
    });
  }

  async findByBranch(
    branchId: string,
    query: {
      page: number;
      limit: number;
      startDate?: string;
      endDate?: string;
    },
    tenantId: string,
  ) {
    const { page, limit, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SaleWhereInput = {
      tenantId,
      branchId,
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      this.prisma.sale.count({ where }),
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

  async voidSale(saleId: string, tenantId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch Sale
      const sale = await tx.sale.findFirst({
        where: { id: saleId, tenantId },
        include: { items: true },
      });

      if (!sale) throw new NotFoundException(`Sale ${saleId} not found`);
      if (sale.status !== 'COMPLETED') {
        throw new BadRequestException(
          `Cannot void sale with status ${sale.status}`,
        );
      }

      // 2. Reverse inventory for each item
      for (const item of sale.items) {
        // Increment inventory
        await tx.inventory.update({
          where: {
            tenantId_branchId_productId: {
              tenantId,
              branchId: sale.branchId,
              productId: item.productId,
            },
          },
          data: {
            quantity: { increment: Number(item.quantity) },
          },
        });

        // Record IN movement
        await tx.inventoryMovement.create({
          data: {
            tenantId,
            branchId: sale.branchId,
            productId: item.productId,
            type: 'IN',
            quantity: Number(item.quantity),
            reason: `Void Sale ${saleId}`,
            referenceId: saleId,
            createdBy: userId,
          },
        });
      }

      // 3. Update Sale status
      return tx.sale.update({
        where: { id: saleId },
        data: { status: 'VOID' },
        include: { items: true },
      });
    });
  }

  async refundSale(
    saleId: string,
    refundDto: { items: Array<{ productId: string; quantity: number }> },
    tenantId: string,
    userId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch Sale
      const sale = await tx.sale.findFirst({
        where: { id: saleId, tenantId },
        include: { items: true },
      });

      if (!sale) throw new NotFoundException(`Sale ${saleId} not found`);
      if (sale.status === 'VOID') {
        throw new BadRequestException('Cannot refund a voided sale');
      }

      // 2. Validate refund items
      let totalRefundAmount = new Prisma.Decimal(0);

      for (const refundItem of refundDto.items) {
        const saleItem = sale.items.find(
          (item) => item.productId === refundItem.productId,
        );

        if (!saleItem) {
          throw new BadRequestException(
            `Product ${refundItem.productId} not found in sale`,
          );
        }

        if (Number(refundItem.quantity) > Number(saleItem.quantity)) {
          throw new BadRequestException(
            `Refund quantity (${refundItem.quantity}) exceeds sold quantity (${saleItem.quantity}) for product ${refundItem.productId}`,
          );
        }

        // Calculate refund amount for this item (proportional)
        const itemRefundAmount = saleItem.unitPrice
          .mul(new Prisma.Decimal(refundItem.quantity))
          .minus(
            saleItem.discountAmount
              .mul(new Prisma.Decimal(refundItem.quantity))
              .div(new Prisma.Decimal(saleItem.quantity)),
          );

        totalRefundAmount = totalRefundAmount.add(itemRefundAmount);

        // Increment inventory
        await tx.inventory.update({
          where: {
            tenantId_branchId_productId: {
              tenantId,
              branchId: sale.branchId,
              productId: refundItem.productId,
            },
          },
          data: {
            quantity: { increment: refundItem.quantity },
          },
        });

        // Record IN movement
        await tx.inventoryMovement.create({
          data: {
            tenantId,
            branchId: sale.branchId,
            productId: refundItem.productId,
            type: 'IN',
            quantity: refundItem.quantity,
            reason: `Refund Sale ${saleId}`,
            referenceId: saleId,
            createdBy: userId,
          },
        });
      }

      // 3. Determine if full or partial refund
      const newRefundAmount = sale.refundAmount.add(totalRefundAmount);
      const isFullRefund = newRefundAmount.gte(sale.total);

      // 4. Update Sale
      return tx.sale.update({
        where: { id: saleId },
        data: {
          status: isFullRefund ? 'REFUNDED' : sale.status,
          refundAmount: newRefundAmount,
        },
        include: { items: true },
      });
    });
  }

  async getLastPrice(customerId: string, productId: string, tenantId: string) {
    const lastSale = await this.prisma.saleItem.findFirst({
      where: {
        productId,
        sale: {
          customerId,
          tenantId,
          status: { in: ['COMPLETED', 'PARTIAL', 'APPROVED_ORDER'] },
        },
      },
      orderBy: {
        sale: {
          createdAt: 'desc',
        },
      },
      select: {
        unitPrice: true,
        discountAmount: true,
        quantity: true,
        sale: {
          select: {
            createdAt: true,
            orderNumber: true,
          },
        },
        product: {
          select: {
            description: true,
          },
        },
      },
    });

    if (!lastSale) {
      return {
        found: false,
        message: 'No previous sales found for this customer and product',
      };
    }

    return {
      found: true,
      unitPrice: lastSale.unitPrice,
      discountAmount: lastSale.discountAmount,
      quantity: lastSale.quantity,
      saleDate: lastSale.sale.createdAt,
      orderNumber: lastSale.sale.orderNumber,
      productDescription: lastSale.product.description,
    };
  }

  async getDashboardStats(tenantId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      pendingOrders,
      lowStock,
      productsCount,
      customersCount,
      currentMonthSalesRaw,
      lastMonthSalesRaw,
      topProductsRaw,
      recentSales,
    ] = await Promise.all([
      // 1. Pending Orders
      this.prisma.sale.count({
        where: {
          tenantId,
          status: { in: ['PENDING', 'APPROVED_ORDER', 'PACKING'] },
        },
      }),
      // 2. Low Stock (Global check)
      this.prisma.inventory.count({
        where: {
          tenantId,
          minStock: { gt: 0 },
          quantity: { lte: this.prisma.inventory.fields.minStock },
        },
      }),
      // 3. Products with Stock (Active SKUs)
      this.prisma.inventory
        .groupBy({
          by: ['productId'],
          where: { tenantId, quantity: { gt: 0 } },
        })
        .then((res) => res.length),
      // 4. Active Customers
      this.prisma.customer.count({ where: { tenantId } }),
      // 5. Current Month Revenue
      this.prisma.sale.aggregate({
        where: {
          tenantId,
          createdAt: { gte: startOfMonth },
          status: { in: ['COMPLETED', 'PARTIAL'] },
        },
        _sum: { total: true },
      }),
      // 6. Last Month Revenue
      this.prisma.sale.aggregate({
        where: {
          tenantId,
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          status: { in: ['COMPLETED', 'PARTIAL'] },
        },
        _sum: { total: true },
      }),
      // 7. Top Products
      this.prisma.saleItem.groupBy({
        by: ['productId'],
        where: { sale: { tenantId, status: { in: ['COMPLETED', 'PARTIAL'] } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      // 8. Recent Sales (Graph)
      this.prisma.sale.findMany({
        where: {
          tenantId,
          createdAt: { gte: new Date(now.setDate(now.getDate() - 30)) }, // Last 30 days
          status: { in: ['COMPLETED', 'PARTIAL', 'APPROVED_ORDER'] },
        },
        select: { total: true, createdAt: true },
      }),
    ]);

    // Process Products
    const productIds = topProductsRaw.map((p) => p.productId);
    const productDetails = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, description: true },
    });

    const topProducts = topProductsRaw.map((p) => ({
      productId: p.productId,
      name:
        productDetails.find((prod) => prod.id === p.productId)?.description ||
        'Unknown',
      quantity: Number(p._sum.quantity || 0),
    }));

    // Calculate Growth
    const currentRevenue = Number(currentMonthSalesRaw._sum.total || 0);
    const lastRevenue = Number(lastMonthSalesRaw._sum.total || 0);
    const growth =
      lastRevenue === 0
        ? 100
        : Math.round(((currentRevenue - lastRevenue) / lastRevenue) * 100);

    return {
      kpi: {
        totalRevenue: currentRevenue,
        revenueGrowth: growth,
        pendingOrders,
        productsInStock: productsCount,
        lowStockCount: lowStock,
        activeCustomers: customersCount,
        customersGrowth: 0, // Placeholder
      },
      topProducts,
      salesHistory: recentSales,
    };
  }

  async findAll(query: any, tenantId: string) {
    const { page = 1, limit = 20, status, q } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SaleWhereInput = {
      tenantId,
    };

    if (status) {
      const statusList = status.split(',');
      where.status = { in: statusList };
    }

    if (q) {
      where.OR = [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { quoteNumber: { contains: q, mode: 'insensitive' } },
        { customer: { name: { contains: q, mode: 'insensitive' } } },
        { customerName: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, taxId: true } },
          user: { select: { name: true } },
          branch: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.sale.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, tenantId: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, tenantId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            taxId: true,
            creditLimit: true,
            currentBalance: true,
          },
        },
        user: { select: { name: true } },
        branch: { select: { name: true } },
        items: {
          include: {
            product: { select: { description: true, brand: true } },
          },
        },
      },
    });

    if (!sale) throw new NotFoundException(`Sale ${id} not found`);
    return sale;
  }
}
