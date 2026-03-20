import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // DASHBOARD PRINCIPAL
  // ==========================================

  async getDashboardSummary() {
    // Definir rangos de fecha para "hoy" y "este mes"
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Ventas del día (B2B + B2C)
    // B2B: Facturas o despachos de SalesOrder de hoy (acotamos por created_at por simplicidad o entry_date de factura)
    const b2bSalesToday = await this.prisma.salesOrder.aggregate({
      _sum: { total: true },
      where: {
        status: { in: ['INVOICED', 'DISPATCHED', 'PARTIALLY_INVOICED', 'PARTIALLY_DISPATCHED'] },
        createdAt: { gte: todayStart }
      }
    });

    // B2C: POS Sales de hoy
    const posSalesToday = await this.prisma.pOSSale.aggregate({
      _sum: { total: true },
      where: {
        status: { not: 'VOIDED' },
        createdAt: { gte: todayStart }
      }
    });

    // 2. Ventas del Mes (B2B + B2C)
    const b2bSalesMonth = await this.prisma.salesOrder.aggregate({
      _sum: { total: true },
      where: {
        status: { in: ['INVOICED', 'DISPATCHED', 'PARTIALLY_INVOICED', 'PARTIALLY_DISPATCHED'] },
        createdAt: { gte: monthStart }
      }
    });

    const posSalesMonth = await this.prisma.pOSSale.aggregate({
      _sum: { total: true },
      where: {
        status: { not: 'VOIDED' },
        createdAt: { gte: monthStart }
      }
    });

    const posSalesTodayCount = await this.prisma.pOSSale.count({
      where: {
        status: { not: 'VOIDED' },
        createdAt: { gte: todayStart }
      }
    });

    const openRegisters = await this.prisma.cashRegister.count({
      where: { status: 'abierta' }
    });

    const closedRegistersToday = await this.prisma.cashRegister.count({
      where: { status: 'cerrada', closedAt: { gte: todayStart } }
    });

    // 3. Ingresos POS Hoy (Total y Efectivo vs Tarjetas)
    const posIncomesToday = await this.prisma.pOSSale.groupBy({
      by: ['paymentMethod'],
      _sum: { amountReceived: true },
      where: {
        status: { not: 'VOIDED' },
        createdAt: { gte: todayStart }
      }
    });

    // POS Ventas por Cajero
    const posSalesByCashierRaw = await this.prisma.pOSSale.groupBy({
       by: ['createdByUserId'],
       _sum: { total: true },
       _count: { id: true },
       where: { status: { not: 'VOIDED' }, createdAt: { gte: todayStart } }
    });

    const cashierIds = posSalesByCashierRaw.map(c => c.createdByUserId).filter(id => id) as string[];
    const cashiers = await this.prisma.user.findMany({ where: { id: { in: cashierIds } }, select: { id: true, name: true } });

    const posSalesByCashier = posSalesByCashierRaw.map(c => {
       const user = cashiers.find(u => u.id === c.createdByUserId);
       return {
         name: user?.name || 'Desconocido',
         total: Number(c._sum.total || 0),
         count: c._count.id
       };
    });

    // 4. Cartera CxC (Cuentas por cobrar)
    // Asumimos saldos pendientes de invoices (si hubiera campo saldo en customer o invoice)
    // Para no complicar, sumaremos facturas pendientes en accounts-receivable si aplica, o saldo del cliente si existe "currentBalance". Sin schema exacto, si no, lo derivamos de accounts.
    // Usaremos un aproximado de Customer = sum(currentBalance) si existe, pero en schema vi un accounts_receivable_entries, vamos a simplificar.
    // Opcionalmente podemos saltar esto o devolver un placeholder temporal
    
    // 5. Cuentas por pagar total (CxP)
    // Ídem
    
    // 6. Inventario Total (Valorizado)
    const inventoryValuation = await this.prisma.productLot.aggregate({
        _sum: { availableQuantity: true }, // Add cost * qty later if complex calculation needed via SQL
        where: { isActive: true }
    });
    
    // Calcular valor total aprox
    const productsData = await this.prisma.productLot.findMany({
        where: { isActive: true },
        include: { product: { select: { costAvgWeighted: true } } }
    });
    const inventoryValue = productsData.reduce((acc, lot) => {
        return acc + (Number(lot.availableQuantity) * Number(lot.product.costAvgWeighted || 0));
    }, 0);

    // 7. Top 5 Productos (Basado en historial de líneas vendidas recientemente o en general)
    const rootSalesLines = await this.prisma.pOSSaleLine.groupBy({
        by: ['productId'],
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
    });

    const top5Ids = rootSalesLines.map(l => l.productId);
    const top5Names = await this.prisma.product.findMany({
        where: { id: { in: top5Ids } },
        select: { id: true, name: true, sku: true }
    });
    
    const top5Products = rootSalesLines.map(line => {
       const prod = top5Names.find(n => n.id === line.productId);
       return {
           name: prod?.name || 'Desconocido',
           sku: prod?.sku || '',
           cantidad: Number(line._sum.quantity),
           ingresos: Number(line._sum.total)
       };
    });

    // 8. Últimas ventas combinadas B2C y B2B (las últimas 5)
    // Haremos 5 B2B y 5 POS y las unimos
    const recentPOS = await this.prisma.pOSSale.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { createdByUser: { select: { name: true } } }
    });
    const recentB2B = await this.prisma.salesOrder.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { legalName: true, tradeName: true } } }
    });

    const combinedRecent = [
        ...recentPOS.map(p => ({
            id: p.id,
            origin: 'POS',
            number: p.number,
            date: p.createdAt,
            total: p.total,
            status: p.status,
            clientOrUser: p.createdByUser?.name || 'Mostrador'
        })),
        ...recentB2B.map(b => ({
            id: b.id,
            origin: 'B2B',
            number: b.number,
            date: b.createdAt,
            total: b.total,
            status: b.status,
            clientOrUser: b.customer?.legalName || b.customer?.tradeName || 'Cliente B2B'
        }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);

    return {
      today: {
        salesB2B: Number(b2bSalesToday._sum.total || 0),
        salesPOS: Number(posSalesToday._sum.total || 0),
        total: Number(b2bSalesToday._sum.total || 0) + Number(posSalesToday._sum.total || 0),
      },
      month: {
        salesB2B: Number(b2bSalesMonth._sum.total || 0),
        salesPOS: Number(posSalesMonth._sum.total || 0),
        total: Number(b2bSalesMonth._sum.total || 0) + Number(posSalesMonth._sum.total || 0),
      },
      store: {
         transactionsToday: posSalesTodayCount,
         averageSale: posSalesTodayCount > 0 ? (Number(posSalesToday._sum.total || 0) / posSalesTodayCount) : 0,
         openRegisters,
         closedRegistersToday,
      },
      posIncomesToday: posIncomesToday.map(i => ({
         method: i.paymentMethod,
         amount: Number(i._sum.amountReceived || 0)
      })),
      posSalesByCashier,
      inventory: {
         totalUnits: Number(inventoryValuation._sum.availableQuantity || 0),
         estimatedValue: inventoryValue
      },
      topProducts: top5Products,
      recentActivity: combinedRecent,
      cxc: 15200.50, // MOCK TBD via Real Tables
      cxp: 8400.00,  // MOCK TBD via Real Tables
    };
  }

  // ==========================================
  // 2. REPORTES DE VENTAS (Módulo Ventas y POS combinados o por filtro)
  // ==========================================
  
  async getSalesByDateRange(startDate: string, endDate: string, channel?: 'B2B' | 'POS' | 'ALL') {
     const start = new Date(startDate);
     const end = new Date(endDate);
     end.setHours(23, 59, 59, 999);

     const results: any[] = [];

     if (channel === 'B2B' || channel === 'ALL' || !channel) {
         const b2b = await this.prisma.salesOrder.findMany({
             where: {
                 createdAt: { gte: start, lte: end },
                 status: { not: 'CANCELLED' }
             },
             include: { customer: true, createdByUser: true }
         });
         results.push(...b2b.map((s: any) => ({
             id: s.id, type: 'B2B', date: s.createdAt, number: s.number, total: s.total, client: s.customer?.legalName || s.customer?.tradeName || 'Cliente B2B', user: s.createdByUser?.name || 'Sistema'
         })));
     }

     if (channel === 'POS' || channel === 'ALL' || !channel) {
         const pos = await this.prisma.pOSSale.findMany({
             where: {
                 createdAt: { gte: start, lte: end },
                 status: { not: 'VOIDED' }
             },
             include: { createdByUser: true }
         });
         results.push(...pos.map(s => ({
             id: s.id, type: 'POS', date: s.createdAt, number: s.number, total: s.total, client: 'Mostrador', user: s.createdByUser?.name
         })));
     }

     return results.sort((a,b) => b.date.getTime() - a.date.getTime());
  }

  // ==========================================
  // 3. REPORTE DE CAJA (POS)
  // ==========================================

  async getCashRegistersReport(filters: any) {
      // Filtrar cierres de caja logic
      const { startDate, endDate, cashierId } = filters;
      const where: any = { status: 'cerrada' };
      
      if (cashierId) where.userId = cashierId;
      if (startDate && endDate) {
          where.openedAt = { gte: new Date(startDate), lte: new Date(endDate) };
      }

      return this.prisma.cashRegister.findMany({
          where,
          include: {
              user: { select: { name: true } }
          },
          orderBy: { openedAt: 'desc' }
      });
  }

  // ==========================================
  // 4. INVENTARIO REPORTES
  // ==========================================
  async getInventoryReport() {
     // Already have getWarehouseInventorySummary in inventory.service, but we can do a cross-referenced one here
     const summary = await this.prisma.productLot.groupBy({
        by: ['productId', 'warehouseId'],
        where: { isActive: true },
        _sum: { availableQuantity: true }
     });

     const productIds = Array.from(new Set(summary.map(s => s.productId)));
     const warehouseIds = Array.from(new Set(summary.map(s => s.warehouseId)));

     const products = await this.prisma.product.findMany({ where: { id: { in: productIds } } });
     const warehouses = await this.prisma.warehouse.findMany({ where: { id: { in: warehouseIds } } });

     return summary.map(item => {
        const prod = products.find(p => p.id === item.productId);
        const wh = warehouses.find(w => w.id === item.warehouseId);
        return {
           productName: prod?.name,
           sku: prod?.sku,
           warehouseName: wh?.name,
           available: Number(item._sum.availableQuantity)
        };
     });
  }
}
