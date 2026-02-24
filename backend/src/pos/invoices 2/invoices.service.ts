import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, InvoiceLineDiscountType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestContext } from '../../common/request-context';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  private toDecimal(value: number | string) {
    return new Prisma.Decimal(value);
  }

  private clampDecimal(value: Prisma.Decimal, min: Prisma.Decimal, max: Prisma.Decimal) {
    if (value.lessThan(min)) return min;
    if (value.greaterThan(max)) return max;
    return value;
  }

  async listInvoices(params: {
    branchId?: string;
    q?: string;
    take?: number;
    skip?: number;
  }) {
    const store = RequestContext.getStore();
    const tenantId = store?.tenantId;

    if (!tenantId) {
      throw new Error('Missing tenantId in request context');
    }

    const take = Number.isFinite(params.take) ? Math.max(1, Math.min(100, params.take!)) : 25;
    const skip = Number.isFinite(params.skip) ? Math.max(0, params.skip!) : 0;
    const q = params.q?.trim();

    const where: Prisma.InvoiceWhereInput = {
      tenantId,
      ...(params.branchId ? { branchId: params.branchId } : {}),
      ...(q
        ? {
            OR: [
              { invoiceNumber: { contains: q, mode: 'insensitive' } },
              { customerName: { contains: q, mode: 'insensitive' } },
              { customerTaxId: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({
        where,
        orderBy: [{ issuedAt: 'desc' }],
        skip,
        take,
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          issuedAt: true,
          customerName: true,
          currency: true,
          subtotal: true,
          taxTotal: true,
          total: true,
          branch: { select: { id: true, name: true, code: true } },
        },
      }),
    ]);

    return { total, items };
  }

  async getInvoiceById(id: string) {
    const store = RequestContext.getStore();
    const tenantId = store?.tenantId;

    if (!tenantId) {
      throw new Error('Missing tenantId in request context');
    }

    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        lines: true,
        branch: { select: { id: true, name: true, code: true } },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async createInvoice(dto: CreateInvoiceDto) {
    const store = RequestContext.getStore();
    const tenantId = store?.tenantId;
    const userId = store?.userId;

    if (!tenantId) {
      throw new Error('Missing tenantId in request context');
    }

    const branch = await this.prisma.branch.findFirst({
      where: {
        id: dto.branchId,
        tenantId,
      },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });

    if (!branch) {
      throw new BadRequestException('Invalid branch');
    }

    const prefix = `FV-${branch.code}-`;

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.invoiceSequence.upsert({
        where: {
          tenantId_branchId: {
            tenantId,
            branchId: branch.id,
          },
        },
        update: {
          prefix,
        },
        create: {
          tenantId,
          branchId: branch.id,
          prefix,
          lastNumber: 0,
        },
      });

      const seq = await tx.invoiceSequence.update({
        where: {
          tenantId_branchId: {
            tenantId,
            branchId: branch.id,
          },
        },
        data: {
          lastNumber: { increment: 1 },
        },
        select: {
          lastNumber: true,
          prefix: true,
        },
      });

      const sequenceNumber = seq.lastNumber;
      const invoiceNumber = `${seq.prefix}${String(sequenceNumber).padStart(6, '0')}`;

      let subtotal = new Prisma.Decimal(0);
      let discountTotal = new Prisma.Decimal(0);
      let taxTotal = new Prisma.Decimal(0);
      let total = new Prisma.Decimal(0);

      const lines = dto.lines.map((line) => {
        const quantity = this.toDecimal(line.quantity);
        const unitPrice = this.toDecimal(line.unitPrice);

        const lineSubtotal = quantity.mul(unitPrice);

        let discount = new Prisma.Decimal(0);
        const discountType = (line.discountType ?? 'NONE') as InvoiceLineDiscountType;
        const discountValue = this.toDecimal(line.discountValue ?? 0);

        if (discountType === 'PERCENT') {
          discount = lineSubtotal.mul(discountValue).div(100);
        } else if (discountType === 'AMOUNT') {
          discount = discountValue;
        }

        discount = this.clampDecimal(discount, new Prisma.Decimal(0), lineSubtotal);

        const taxable = line.taxable ?? true;
        const taxRate = this.toDecimal(line.taxRate ?? 0.07);
        const taxableBase = lineSubtotal.sub(discount);
        const lineTax = taxable ? taxableBase.mul(taxRate) : new Prisma.Decimal(0);
        const lineTotal = taxableBase.add(lineTax);

        subtotal = subtotal.add(lineSubtotal);
        discountTotal = discountTotal.add(discount);
        taxTotal = taxTotal.add(lineTax);
        total = total.add(lineTotal);

        return {
          tenantId,
          description: line.description,
          quantity,
          unitPrice,
          discountType,
          discountValue,
          taxable,
          taxRate,
          lineSubtotal,
          lineDiscount: discount,
          lineTax,
          lineTotal,
        };
      });

      const created = await tx.invoice.create({
        data: {
          tenantId,
          branchId: branch.id,
          issuedByUserId: userId,
          invoiceNumber,
          sequenceNumber,
          currency: dto.currency ?? 'USD',
          customerName: dto.customerName,
          customerTaxId: dto.customerTaxId,
          customerPhone: dto.customerPhone,
          subtotal,
          discountTotal,
          taxTotal,
          total,
          lines: {
            create: lines,
          },
        },
        include: {
          lines: true,
          branch: { select: { id: true, code: true, name: true } },
        },
      });

      return created;
    });

    return result;
  }
}
