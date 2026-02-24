import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private getStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'week':
        return new Date(now.setDate(now.getDate() - 7));
      case 'quarter':
        return new Date(now.setMonth(now.getMonth() - 3));
      case 'year':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      case 'month':
      default:
        return new Date(now.setMonth(now.getMonth() - 1));
    }
  }

  async getStats(tenantId: string, period: string) {
    const startDate = this.getStartDate(period);

    // Total Sales in current period
    const sales = await this.prisma.sale.aggregate({
      where: {
        tenantId,
        createdAt: { gte: startDate },
        status: { not: 'QUOTE' as any },
      },
      _sum: { total: true },
      _count: { id: true },
    });

    // Sales in previous period for growth calculation
    const prevStartDate = new Date(startDate);
    const diff = new Date().getTime() - startDate.getTime();
    prevStartDate.setTime(startDate.getTime() - diff);

    const prevSales = await this.prisma.sale.aggregate({
      where: {
        tenantId,
        createdAt: { gte: prevStartDate, lt: startDate },
        status: { not: 'QUOTE' as any },
      },
      _sum: { total: true },
    });

    const currentTotal = Number(sales._sum.total || 0);
    const prevTotal = Number(prevSales._sum.total || 0);
    const salesGrowth =
      prevTotal === 0 ? 0 : ((currentTotal - prevTotal) / prevTotal) * 100;

    // Inventory Value (Cost * Quantity)
    const inventoryItems = await this.prisma.inventory.findMany({
      where: { tenantId },
      include: { product: true },
    });
    const inventoryValue = inventoryItems.reduce((sum, item) => {
      const cost =
        Number(item.product.weightedAvgCost) ||
        Number(item.product.lastCifCost) ||
        0;
      return sum + cost * item.quantity;
    }, 0);

    // Accounts Receivable (Sales with paymentStatus NOT PAID? Need to check field)
    // Looking at schema, I don't see a paymentStatus on Sale, but there's a paymentMethod.
    // Usually B2B sales with paymentMethod 'CREDIT' are receivables if not paid.
    // Let's check PaymentRecord table or similar.
    // For now, let's sum all 'CREDIT' sales that don't have enough payments.
    const creditSales = await this.prisma.sale.findMany({
      where: {
        tenantId,
        paymentMethod: 'CREDIT',
        status: { in: ['COMPLETED', 'PARTIAL'] as any },
      },
      include: { payments: true },
    });

    const accountsReceivable = creditSales.reduce((sum, sale) => {
      const paid = sale.payments.reduce(
        (pSum, p) => pSum + Number(p.amount),
        0,
      );
      return sum + (Number(sale.total) - paid);
    }, 0);

    return {
      totalSales: currentTotal,
      totalOrders: sales._count.id,
      salesGrowth,
      inventoryValue,
      accountsReceivable,
    };
  }

  async getTopProducts(tenantId: string, period: string, limit: number) {
    const startDate = this.getStartDate(period);

    const saleItems = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        tenantId,
        sale: {
          createdAt: { gte: startDate },
          status: { not: 'QUOTE' as any },
        },
      },
      _sum: {
        quantity: true,
        total: true,
      },
      orderBy: {
        _sum: { total: 'desc' },
      },
      take: limit,
    });

    const products = await this.prisma.product.findMany({
      where: { id: { in: saleItems.map((i) => i.productId) } },
    });

    return saleItems.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      const totalRevenue = Number(item._sum.total || 0);
      const totalQuantity = Number(item._sum.quantity || 0);

      // Calculate Margin if Costs are available
      const cost =
        Number(product?.weightedAvgCost) || Number(product?.lastCifCost) || 0;
      const totalCost = cost * totalQuantity;
      const margin =
        totalRevenue === 0
          ? 0
          : ((totalRevenue - totalCost) / totalRevenue) * 100;

      return {
        productId: item.productId,
        description: product?.description || 'Unknown',
        totalQuantity,
        totalRevenue,
        margin,
      };
    });
  }

  async getTopCustomers(tenantId: string, period: string, limit: number) {
    const startDate = this.getStartDate(period);

    const customerSales = await this.prisma.sale.groupBy({
      by: ['customerId'],
      where: {
        tenantId,
        customerId: { not: null },
        createdAt: { gte: startDate },
        status: { not: 'QUOTE' as any },
      },
      _sum: { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: 'desc' } },
      take: limit,
    });

    const customers = await this.prisma.customer.findMany({
      where: { id: { in: customerSales.map((c) => c.customerId as string) } },
    });

    return customerSales.map((item) => {
      const customer = customers.find((c) => c.id === item.customerId);
      const totalPurchased = Number(item._sum.total || 0);
      const totalOrders = item._count.id;

      return {
        customerId: item.customerId,
        name: customer?.name || 'Unknown',
        totalOrders,
        totalPurchased,
        averageOrder: totalOrders === 0 ? 0 : totalPurchased / totalOrders,
      };
    });
  }

  async getLowStock(tenantId: string, threshold: number) {
    return this.prisma.inventory.findMany({
      where: {
        tenantId,
        quantity: { lt: threshold },
      },
      include: {
        product: { select: { description: true } },
        branch: { select: { name: true } },
      },
      orderBy: { quantity: 'asc' },
      take: 20,
    });
  }

  async getOverdueInvoices(tenantId: string) {
    // Sales on CREDIT, not fully paid, past due date
    const overdue = await this.prisma.sale.findMany({
      where: {
        tenantId,
        paymentMethod: 'CREDIT',
        status: { in: ['COMPLETED', 'PARTIAL'] as any },
        dueDate: { lt: new Date() },
      },
      include: {
        customer: { select: { name: true } },
        payments: true,
      },
      orderBy: { dueDate: 'asc' },
      take: 20,
    });

    return overdue
      .map((sale) => {
        const paid = sale.payments.reduce(
          (sum, p) => sum + Number(p.amount),
          0,
        );
        const balance = Number(sale.total) - paid;
        return {
          id: sale.id,
          customer: sale.customer,
          total: balance,
          dueDate: sale.dueDate,
        };
      })
      .filter((s) => s.total > 0);
  }

  async getSalesTrend(tenantId: string, period: string) {
    const startDate = this.getStartDate(period);

    // This is a simplified version. For a real chart, we'd group by day.
    // Prisma doesn't have a great "group by day" for PostgreSQL without raw query or post-processing.
    const sales = await this.prisma.sale.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate },
        status: { not: 'QUOTE' as any },
      },
      select: {
        createdAt: true,
        total: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Post-process to group by day
    const trendMap = new Map<string, number>();
    sales.forEach((sale) => {
      const date = sale.createdAt.toISOString().split('T')[0];
      trendMap.set(date, (trendMap.get(date) || 0) + Number(sale.total));
    });

    return Array.from(trendMap.entries()).map(([date, total]) => ({
      date,
      total,
    }));
  }
}
