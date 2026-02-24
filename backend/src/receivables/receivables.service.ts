import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReceivablesService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(tenantId: string) {
    const now = new Date();

    // 1. Total Portfolio Value
    const customers = await this.prisma.customer.findMany({
      where: {
        tenantId,
        customerType: 'CREDIT',
        currentBalance: { gt: 0 },
      },
      include: {
        sales: {
          where: {
            paymentMethod: 'CREDIT',
            status: { in: ['COMPLETED', 'PARTIAL'] as any },
          },
          include: { payments: true },
        },
      },
    });

    let totalPortfolio = 0;
    let totalOverdue = 0;
    const aging = {
      current: 0,
      '1-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0,
    };

    const overdueByCustomer: any[] = [];

    for (const customer of customers) {
      let customerOverdueTotal = 0;

      for (const sale of customer.sales) {
        const paid = sale.payments.reduce(
          (sum, p) => sum + Number(p.amount),
          0,
        );
        const balance = Number(sale.total) - paid;

        if (balance <= 0) continue;

        totalPortfolio += balance;

        const dueDate = sale.dueDate || sale.createdAt;
        const diffDays = Math.floor(
          (now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24),
        );

        if (diffDays <= 0) {
          aging.current += balance;
        } else {
          totalOverdue += balance;
          customerOverdueTotal += balance;

          if (diffDays <= 30) aging['1-30'] += balance;
          else if (diffDays <= 60) aging['31-60'] += balance;
          else if (diffDays <= 90) aging['61-90'] += balance;
          else aging['90+'] += balance;
        }
      }

      if (customerOverdueTotal > 0) {
        overdueByCustomer.push({
          id: customer.id,
          name: customer.name,
          overdue: customerOverdueTotal,
          balance: Number(customer.currentBalance),
          creditLimit: Number(customer.creditLimit),
          status: customer.creditStatus,
        });
      }
    }

    return {
      totalPortfolio,
      totalOverdue,
      overduePercentage:
        totalPortfolio > 0 ? (totalOverdue / totalPortfolio) * 100 : 0,
      aging,
      topDebtors: overdueByCustomer
        .sort((a, b) => b.overdue - a.overdue)
        .slice(0, 10),
    };
  }

  async getAgingReport(tenantId: string) {
    // Detailed aging report per customer
    const customers = await this.prisma.customer.findMany({
      where: {
        tenantId,
        customerType: 'CREDIT',
        currentBalance: { gt: 0 },
      },
      include: {
        sales: {
          where: {
            paymentMethod: 'CREDIT',
            status: { in: ['COMPLETED', 'PARTIAL'] as any },
          },
          include: { payments: true },
        },
      },
    });

    const now = new Date();
    return customers
      .map((customer) => {
        const report = {
          customerId: customer.id,
          name: customer.name,
          total: 0,
          current: 0,
          '1-30': 0,
          '31-60': 0,
          '61-90': 0,
          '90+': 0,
        };

        for (const sale of customer.sales) {
          const paid = sale.payments.reduce(
            (sum, p) => sum + Number(p.amount),
            0,
          );
          const balance = Number(sale.total) - paid;

          if (balance <= 0) continue;

          report.total += balance;

          const dueDate = sale.dueDate || sale.createdAt;
          const diffDays = Math.floor(
            (now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24),
          );

          if (diffDays <= 0) report.current += balance;
          else if (diffDays <= 30) report['1-30'] += balance;
          else if (diffDays <= 60) report['31-60'] += balance;
          else if (diffDays <= 90) report['61-90'] += balance;
          else report['90+'] += balance;
        }

        return report;
      })
      .filter((r) => r.total > 0);
  }

  async recordInteraction(dto: any, tenantId: string, userId: string) {
    return (this.prisma as any).collectionInteraction.create({
      data: {
        ...dto,
        tenantId,
        createdBy: userId,
      },
    });
  }

  async getInteractions(customerId: string, tenantId: string) {
    return (this.prisma as any).collectionInteraction.findMany({
      where: { customerId, tenantId },
      orderBy: { date: 'desc' },
    });
  }

  async runAutomaticBlocking(tenantId: string) {
    // Logic to automatically block customers with high risk
    const customers = await this.prisma.customer.findMany({
      where: {
        tenantId,
        customerType: 'CREDIT',
        isBlocked: false,
      },
      include: {
        sales: {
          where: {
            paymentMethod: 'CREDIT',
            status: { in: ['COMPLETED', 'PARTIAL'] as any },
            dueDate: { lt: new Date() },
          },
          include: { payments: true },
        },
      },
    });

    const blockedCount = 0;
    // Logic: block if any invoice is more than 60 days overdue OR balance > limit
    for (const customer of customers) {
      let shouldBlock = false;
      let reason = '';

      if (Number(customer.currentBalance) > Number(customer.creditLimit)) {
        shouldBlock = true;
        reason = 'Límite de crédito excedido';
      } else {
        const now = new Date();
        for (const sale of customer.sales) {
          const paid = sale.payments.reduce(
            (sum, p) => sum + Number(p.amount),
            0,
          );
          const balance = Number(sale.total) - paid;
          if (balance <= 0) continue;

          const diffDays = Math.floor(
            (now.getTime() - sale.dueDate!.getTime()) / (1000 * 3600 * 24),
          );
          if (diffDays > 60) {
            shouldBlock = true;
            reason = `Factura vencida por más de 60 días: ${sale.id.substring(0, 8)}`;
            break;
          }
        }
      }

      if (shouldBlock) {
        await this.prisma.customer.update({
          where: { id: customer.id },
          data: {
            isBlocked: true,
            blockedReason: reason,
            creditStatus: 'BLOCKED',
          },
        });
      }
    }

    return { message: 'Proceso de bloqueo automático completado' };
  }
}
