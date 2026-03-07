import { Injectable } from '@nestjs/common';
import { SalesService } from '../sales/sales.service';
import { ProductsService } from '../products/products.service';
import { ClientsService } from '../clients/clients.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { PurchaseOrdersService } from '../purchase-orders/purchase-orders.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class AnalyticsService {
    constructor(
        private salesService: SalesService,
        private productsService: ProductsService,
        private clientsService: ClientsService,
        private suppliersService: SuppliersService,
        private purchaseOrdersService: PurchaseOrdersService,
        private paymentsService: PaymentsService,
    ) { }

    async getDashboardSummary() {
        const [sales, products, clients, suppliers, purchaseOrders, payments] = await Promise.all([
            this.salesService.findAll({}),
            this.productsService.findAll(),
            this.clientsService.findAll({}),
            this.suppliersService.findAll(),
            this.purchaseOrdersService.findAll({}),
            this.paymentsService.findAll({}),
        ]);

        // Sales KPIs
        const invoicedSales = sales.filter((s: any) => s.status === 'facturada' || s.status === 'despachada');
        const pendingSales = sales.filter((s: any) => s.status === 'borrador' || s.status === 'confirmada' || s.status === 'preparacion');
        const totalSalesRevenue = invoicedSales.reduce((sum: number, s: any) => sum + (s.total || 0), 0);

        // Current month sales
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthSales = invoicedSales.filter((s: any) => new Date(s.createdAt) >= startOfMonth);
        const monthRevenue = monthSales.reduce((sum: number, s: any) => sum + (s.total || 0), 0);

        // CXC (outstanding client balances)
        const clientsWithBalance = clients.filter((c: any) => (c.currentBalance || 0) > 0);
        const totalCXC = clientsWithBalance.reduce((sum: number, c: any) => sum + (c.currentBalance || 0), 0);

        // CXP (outstanding supplier balances)
        const suppliersWithBalance = suppliers.filter((s: any) => (s.currentBalance || 0) > 0);
        const totalCXP = suppliersWithBalance.reduce((sum: number, s: any) => sum + (s.currentBalance || 0), 0);

        // Purchase Orders
        const pendingPOs = purchaseOrders.filter((po: any) => po.status === 'pendiente' || po.status === 'confirmada');
        const totalPurchased = purchaseOrders.filter((po: any) => po.status === 'recibida').reduce((sum: number, po: any) => sum + (po.totalCIF || 0), 0);

        // Payments
        const inboundPayments = payments.filter((p: any) => p.type === 'inbound');
        const totalCollected = inboundPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

        // Products
        const activeProducts = products.filter((p: any) => p.status === 'active');

        // Top clients by balance
        const topClientsWithBalance = [...clientsWithBalance]
            .sort((a: any, b: any) => b.currentBalance - a.currentBalance)
            .slice(0, 5)
            .map((c: any) => ({
                id: c._id,
                name: c.name,
                balance: c.currentBalance,
                reference: c.reference,
            }));

        // Recent sales
        const recentSales = [...sales]
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
            .map((s: any) => ({
                id: s._id,
                reference: s.reference,
                clientName: s.clientName || 'Cliente',
                total: s.total,
                status: s.status,
                createdAt: s.createdAt,
            }));

        // TRENDS: Weekly Sales (last 7 days)
        const weeklySales: any[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            const nextDay = new Date(d);
            nextDay.setDate(nextDay.getDate() + 1);

            const daySales = invoicedSales.filter((s: any) => {
                const date = new Date(s.createdAt);
                return date >= d && date < nextDay;
            });

            weeklySales.push({
                day: d.toLocaleDateString('es-PA', { weekday: 'short' }),
                value: daySales.reduce((sum, s) => sum + (s.total || 0), 0),
                target: 50000 // Mock target for now
            });
        }

        // TRENDS: Monthly Revenue (last 6 months)
        const monthlyRevenue: any[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const month = d.getMonth();
            const year = d.getFullYear();

            const mSales = invoicedSales.filter((s: any) => {
                const date = new Date(s.createdAt);
                return date.getMonth() === month && date.getFullYear() === year;
            });

            monthlyRevenue.push({
                month: d.toLocaleDateString('es-PA', { month: 'short' }),
                revenue: mSales.reduce((sum, s) => sum + (s.total || 0), 0),
            });
        }

        return {
            summary: {
                totalProducts: activeProducts.length,
                totalClients: clients.length,
                totalSales: sales.length,
                pendingSales: pendingSales.length,
                pendingPurchaseOrders: pendingPOs.length,
                monthRevenue,
                totalSalesRevenue,
                totalCXC,
                totalCXP,
                totalCollected,
                totalPurchased,
            },
            topClientsWithBalance,
            recentSales,
            weeklySales,
            monthlyRevenue
        };
    }
}
