'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Package,
    Users,
    AlertTriangle,
    ShoppingCart,
    BarChart3,
    Calendar,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import {
    Card,
    CardBody,
    Chip,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Select,
    SelectItem
} from '@heroui/react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';

export default function AnalyticsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('month');
    const [stats, setStats] = useState<any>(null);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [topCustomers, setTopCustomers] = useState<any[]>([]);
    const [lowStock, setLowStock] = useState<any[]>([]);
    const [overdueInvoices, setOverdueInvoices] = useState<any[]>([]);
    const [salesTrend, setSalesTrend] = useState<any[]>([]);

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        const session = loadSession();
        if (!session) {
            router.push('/login');
            return;
        }

        try {
            // Fetch all analytics data in parallel
            const [
                statsData,
                topProductsData,
                topCustomersData,
                lowStockData,
                overdueData,
                trendData
            ] = await Promise.all([
                api(`/analytics/stats?period=${period}`, { accessToken: session.accessToken }).catch(() => null),
                api(`/analytics/top-products?period=${period}&limit=10`, { accessToken: session.accessToken }).catch(() => []),
                api(`/analytics/top-customers?period=${period}&limit=10`, { accessToken: session.accessToken }).catch(() => []),
                api('/analytics/low-stock?threshold=10', { accessToken: session.accessToken }).catch(() => []),
                api('/analytics/overdue-invoices', { accessToken: session.accessToken }).catch(() => []),
                api(`/analytics/sales-trend?period=${period}`, { accessToken: session.accessToken }).catch(() => [])
            ]);

            setStats(statsData as any);
            setTopProducts(topProductsData as any);
            setTopCustomers(topCustomersData as any);
            setLowStock(lowStockData as any);
            setOverdueInvoices(overdueData as any);
            setSalesTrend(trendData as any);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar analíticas');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-blue-500 animate-pulse mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Cargando analíticas...</p>
                </div>
            </div>
        );
    }

    const formatCurrency = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                                <BarChart3 className="w-7 h-7 text-blue-600" />
                                Reportes y Analítica
                            </h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                Dashboard Ejecutivo
                            </p>
                        </div>
                        <Select
                            label="Período"
                            selectedKeys={[period]}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="max-w-xs"
                        >
                            <SelectItem key="week">Última Semana</SelectItem>
                            <SelectItem key="month">Último Mes</SelectItem>
                            <SelectItem key="quarter">Último Trimestre</SelectItem>
                            <SelectItem key="year">Último Año</SelectItem>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
                {/* KPIs */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="border-none shadow-sm">
                            <CardBody className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                                        <DollarSign className="w-6 h-6" />
                                    </div>
                                    {stats.salesGrowth !== undefined && (
                                        <Chip
                                            size="sm"
                                            variant="flat"
                                            color={stats.salesGrowth >= 0 ? 'success' : 'danger'}
                                            startContent={stats.salesGrowth >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                        >
                                            {formatPercent(stats.salesGrowth)}
                                        </Chip>
                                    )}
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Ventas Totales</p>
                                <p className="text-3xl font-black text-slate-900">{formatCurrency(stats.totalSales || 0)}</p>
                            </CardBody>
                        </Card>

                        <Card className="border-none shadow-sm">
                            <CardBody className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                                        <Package className="w-6 h-6" />
                                    </div>
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Valor Inventario</p>
                                <p className="text-3xl font-black text-slate-900">{formatCurrency(stats.inventoryValue || 0)}</p>
                            </CardBody>
                        </Card>

                        <Card className="border-none shadow-sm">
                            <CardBody className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                                        <Users className="w-6 h-6" />
                                    </div>
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Cuentas por Cobrar</p>
                                <p className="text-3xl font-black text-slate-900">{formatCurrency(stats.accountsReceivable || 0)}</p>
                            </CardBody>
                        </Card>

                        <Card className="border-none shadow-sm">
                            <CardBody className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                                        <ShoppingCart className="w-6 h-6" />
                                    </div>
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Órdenes Procesadas</p>
                                <p className="text-3xl font-black text-slate-900">{stats.totalOrders || 0}</p>
                            </CardBody>
                        </Card>
                    </div>
                )}

                {/* Alerts Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Low Stock Alert */}
                    <Card className="border-none shadow-sm">
                        <CardBody className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-red-50 text-red-600">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 uppercase text-sm">Productos con Bajo Stock</h3>
                                    <p className="text-xs text-slate-400">Menos de 10 unidades</p>
                                </div>
                            </div>
                            {lowStock.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-4">No hay productos con bajo stock</p>
                            ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {lowStock.slice(0, 5).map((item: any) => (
                                        <div key={item.productId} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-900 text-sm">{item.product?.description}</p>
                                                <p className="text-xs text-slate-400">{item.branch?.name}</p>
                                            </div>
                                            <Chip size="sm" color="danger" variant="flat" className="font-bold">
                                                {item.quantity} un.
                                            </Chip>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* Overdue Invoices Alert */}
                    <Card className="border-none shadow-sm">
                        <CardBody className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 uppercase text-sm">Facturas Vencidas</h3>
                                    <p className="text-xs text-slate-400">Requieren atención</p>
                                </div>
                            </div>
                            {overdueInvoices.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-4">No hay facturas vencidas</p>
                            ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {overdueInvoices.slice(0, 5).map((invoice: any) => (
                                        <div key={invoice.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-900 text-sm">{invoice.customer?.name}</p>
                                                <p className="text-xs text-slate-400">
                                                    Vence: {new Date(invoice.dueDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Chip size="sm" color="warning" variant="flat" className="font-bold">
                                                {formatCurrency(invoice.total)}
                                            </Chip>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* Top Products */}
                <Card className="border-none shadow-sm">
                    <CardBody className="p-6">
                        <h3 className="font-black text-slate-900 uppercase text-sm mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            Productos Más Vendidos
                        </h3>
                        {topProducts.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-8">No hay datos disponibles</p>
                        ) : (
                            <Table aria-label="Top products" removeWrapper>
                                <TableHeader>
                                    <TableColumn>PRODUCTO</TableColumn>
                                    <TableColumn>CANTIDAD VENDIDA</TableColumn>
                                    <TableColumn>INGRESOS</TableColumn>
                                    <TableColumn>MARGEN</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    {topProducts.map((product: any, idx: number) => (
                                        <TableRow key={idx}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm">
                                                        {idx + 1}
                                                    </div>
                                                    <span className="font-bold text-slate-900">{product.description}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium text-slate-700">{product.totalQuantity} un.</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-bold text-emerald-600">{formatCurrency(product.totalRevenue)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Chip size="sm" color="success" variant="flat">
                                                    {product.margin ? `${product.margin.toFixed(1)}%` : 'N/A'}
                                                </Chip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardBody>
                </Card>

                {/* Top Customers */}
                <Card className="border-none shadow-sm">
                    <CardBody className="p-6">
                        <h3 className="font-black text-slate-900 uppercase text-sm mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-purple-600" />
                            Mejores Clientes
                        </h3>
                        {topCustomers.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-8">No hay datos disponibles</p>
                        ) : (
                            <Table aria-label="Top customers" removeWrapper>
                                <TableHeader>
                                    <TableColumn>CLIENTE</TableColumn>
                                    <TableColumn>ÓRDENES</TableColumn>
                                    <TableColumn>TOTAL COMPRADO</TableColumn>
                                    <TableColumn>PROMEDIO</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    {topCustomers.map((customer: any, idx: number) => (
                                        <TableRow key={idx}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-black text-sm">
                                                        {idx + 1}
                                                    </div>
                                                    <span className="font-bold text-slate-900">{customer.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium text-slate-700">{customer.totalOrders}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-bold text-purple-600">{formatCurrency(customer.totalPurchased)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-slate-600">{formatCurrency(customer.averageOrder)}</span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
