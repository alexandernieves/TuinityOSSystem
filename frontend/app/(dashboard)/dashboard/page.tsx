'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { api } from '@/lib/services/api';
import { Divider, Progress, Avatar, Button as HeroButton, Chip } from '@heroui/react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  DollarSign,
  Users,
  Truck,
  FileText,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  ClipboardList,
  Calendar,
  BarChart3,
  Target,
  Boxes,
  ChevronRight,
  Sparkles,
  Award,
  AlertCircle,
  Ship,
  Building2,
  TrendingDown,
  Percent,
  RotateCcw,
  Landmark,
  Receipt,
  CircleDollarSign,
  CreditCard,
  Settings2,
  LayoutGrid,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { SEED_PRODUCTS } from '@/lib/mock-data/products';
import { getUpcomingExpiryAlerts, getExpiryStats } from '@/lib/mock-data/expiry-batches';
import { EXPIRY_ALERT_CONFIG } from '@/lib/types/expiry';
import { SkeletonDashboard } from '@/components/ui/skeleton-dashboard';
import { CustomModal, CustomModalHeader, CustomModalBody, CustomModalFooter } from '@/components/ui/custom-modal';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

// ============================================
// MOCK DATA - Business Intelligence
// ============================================

// F1: Reorder point alerts computed from SEED_PRODUCTS (SSR-safe)
const REORDER_POINT_ALERTS = SEED_PRODUCTS
  .filter((p) => p.reorderPoint != null && p.stock.available <= p.reorderPoint)
  .map((p) => ({
    id: p.id,
    product: p.description,
    reference: p.reference,
    current: p.stock.available,
    reorderPoint: p.reorderPoint!,
    severity: p.stock.available === 0 ? 'critical' as const : p.stock.available <= Math.floor(p.reorderPoint! * 0.5) ? 'warning' as const : 'medium' as const,
  }))
  .sort((a, b) => a.current - b.current);

const REORDER_POINT_COUNT = REORDER_POINT_ALERTS.length;

const STATS = [
  {
    label: 'Total Productos',
    value: '1,247',
    change: '+12',
    changeType: 'positive' as const,
    icon: Package,
    color: 'brand',
    href: '/productos',
  },
  {
    label: 'Órdenes Pendientes',
    value: '23',
    change: '5 urgentes',
    changeType: 'warning' as const,
    icon: ShoppingCart,
    color: 'warning',
    href: '/compras',
  },
  {
    label: 'Ventas del Mes',
    value: '$847,320',
    change: '+18.2%',
    changeType: 'positive' as const,
    icon: TrendingUp,
    color: 'success',
    href: '/ventas',
  },
  {
    label: 'Bajo Punto Reorden',
    value: String(REORDER_POINT_COUNT),
    change: `${SEED_PRODUCTS.filter(p => p.stock.available === 0).length} sin stock`,
    changeType: 'negative' as const,
    icon: AlertTriangle,
    color: 'danger',
    href: '/inventario?filter=below_reorder',
  },
];

const KPIS = [
  { label: 'Meta Mensual', current: 847320, target: 1000000, unit: '$', icon: Target, color: 'brand' },
  { label: 'Órdenes Procesadas', current: 156, target: 200, unit: '', icon: ShoppingCart, color: 'info' },
  { label: 'Rotación Inventario', current: 4.2, target: 5.0, unit: 'x', icon: RotateCcw, color: 'success' },
  { label: 'Margen Promedio', current: 21, target: 25, unit: '%', icon: Percent, color: 'warning' },
];

const WEEKLY_SALES = [
  { day: 'Lun', value: 45000, target: 50000 },
  { day: 'Mar', value: 52000, target: 50000 },
  { day: 'Mié', value: 48000, target: 50000 },
  { day: 'Jue', value: 61000, target: 50000 },
  { day: 'Vie', value: 55000, target: 50000 },
  { day: 'Sáb', value: 42000, target: 40000 },
  { day: 'Dom', value: 25000, target: 30000 },
];

const MONTHLY_REVENUE = [
  { month: 'Sep', revenue: 720000, profit: 144000 },
  { month: 'Oct', revenue: 680000, profit: 136000 },
  { month: 'Nov', revenue: 750000, profit: 157500 },
  { month: 'Dic', revenue: 920000, profit: 193200 },
  { month: 'Ene', revenue: 810000, profit: 170100 },
  { month: 'Feb', revenue: 847320, profit: 177937 },
];

const TOP_PRODUCTS = [
  { id: 1, name: 'WHISKY JOHNNIE WALKER BLACK 12YRS', reference: 'EVL-00003', sold: 245, revenue: 48755, trend: 'up', percentChange: 12 },
  { id: 2, name: 'TEQUILA DON JULIO 1942', reference: 'EVL-00004', sold: 89, revenue: 54040, trend: 'up', percentChange: 8 },
  { id: 3, name: 'VODKA GREY GOOSE ORIGINAL', reference: 'EVL-00008', sold: 178, revenue: 21360, trend: 'down', percentChange: -3 },
  { id: 4, name: 'WHISKY CHIVAS REGAL 12YRS', reference: 'EVL-00009', sold: 156, revenue: 22412, trend: 'up', percentChange: 15 },
  { id: 5, name: 'RON DIPLOMÁTICO RESERVA', reference: 'EVL-00010', sold: 134, revenue: 16080, trend: 'up', percentChange: 5 },
];

const TOP_CUSTOMERS = [
  { id: 1, name: 'BRAND DISTRIBUIDOR CURACAO', country: 'Curazao', purchases: 125400, orders: 12, avatar: 'BD' },
  { id: 2, name: 'TRIPLE DOUBLE TRADING', country: 'Panamá', purchases: 98750, orders: 8, avatar: 'TD' },
  { id: 3, name: 'CARIBBEAN SPIRITS LLC', country: 'Puerto Rico', purchases: 87200, orders: 15, avatar: 'CS' },
  { id: 4, name: 'DUTY FREE AMERICAS', country: 'USA', purchases: 76500, orders: 6, avatar: 'DF' },
  { id: 5, name: 'ISLAND BEVERAGES CO', country: 'Bahamas', purchases: 65800, orders: 9, avatar: 'IB' },
];

const PENDING_APPROVALS = [
  { id: 'AJ-00001', type: 'adjustment', title: 'Ajuste de Inventario', description: 'Rotura - 5 unidades', createdBy: 'Ariel (Tráfico)', createdAt: '2026-02-20', value: 339.25, status: 'pendiente' },
  { id: 'AJ-00005', type: 'adjustment', title: 'Ajuste de Inventario', description: 'Merma - 1 unidad', createdBy: 'Ariel (Tráfico)', createdAt: '2026-02-22', value: 59.80, status: 'pendiente' },
  { id: 'TR-00001', type: 'transfer', title: 'Transferencia B2B→B2C', description: 'Bodega ZL → Tienda PTY', createdBy: 'Celly (Compras)', createdAt: '2026-02-21', value: 599.15, status: 'enviada' },
];

const UPCOMING_SHIPMENTS = [
  { id: 'OC-03568', supplier: 'DIAGEO PANAMA', items: 450, eta: '2026-02-28', status: 'in_transit', vessel: 'MSC CAROLINA' },
  { id: 'OC-03569', supplier: 'PERNOD RICARD', items: 280, eta: '2026-03-02', status: 'confirmed', vessel: 'MAERSK DENVER' },
  { id: 'OC-03570', supplier: 'BACARDI GLOBAL', items: 320, eta: '2026-03-05', status: 'processing', vessel: 'Pendiente' },
  { id: 'OC-03571', supplier: 'BEAM SUNTORY', items: 185, eta: '2026-03-08', status: 'processing', vessel: 'Pendiente' },
];

const INVENTORY_ALERTS = [
  { id: 1, product: 'WHISKY BLACK & WHITE 24X375ML', reference: 'EVL-00001', type: 'out_of_stock', current: 0, minimum: 20, severity: 'critical' },
  { id: 2, product: 'VODKA ABSOLUT FIVE MINI 18X5X50ML', reference: 'EVL-00012', type: 'stagnant', monthsWithoutSale: 58, severity: 'warning' },
  { id: 3, product: 'WHISKY CROWN ROYAL CORCHO', reference: 'EVL-00011', type: 'low_stock', current: 2, minimum: 20, severity: 'warning' },
  { id: 4, product: 'TEQUILA CLASE AZUL REPOSADO', reference: 'EVL-00005', type: 'low_stock', current: 7, minimum: 15, severity: 'medium' },
];

const RECENT_ACTIVITY = [
  { id: 1, action: 'Nueva orden de compra', description: 'OC-03567 creada para TRIPLE DOUBLE TRADING', time: 'Hace 5 min', type: 'purchase' },
  { id: 2, action: 'Entrada de mercancía', description: 'OC-03566 recibida - 355 cajas', time: 'Hace 1 hora', type: 'inventory' },
  { id: 3, action: 'Nueva cotización', description: 'COT-2024-0892 para BRAND DISTRIBUIDOR CURACAO', time: 'Hace 2 horas', type: 'sale' },
  { id: 4, action: 'Producto bajo mínimo', description: 'WHISKY JOHNNIE WALKER BLACK - Stock: 30 cajas', time: 'Hace 3 horas', type: 'alert' },
  { id: 5, action: 'Transferencia confirmada', description: 'TR-00002 recibida en Tienda PTY', time: 'Hace 4 horas', type: 'transfer' },
  { id: 6, action: 'Ajuste aprobado', description: 'AJ-00002 aprobado por Javier', time: 'Hace 5 horas', type: 'adjustment' },
];

// CxC & Finance Quick View
const CXC_SUMMARY = {
  totalPending: 285400,
  current: 142700,
  overdue30: 68200,
  overdue60: 42500,
  overdue90: 32000,
  collectedThisMonth: 124800,
  collectionTarget: 200000,
};

const BANK_BALANCES = [
  { name: 'Banesco', balance: 245800, color: 'bg-blue-500' },
  { name: 'Banco General', balance: 189200, color: 'bg-emerald-500' },
  { name: 'BAC', balance: 156700, color: 'bg-red-500' },
  { name: 'Banistmo', balance: 98400, color: 'bg-violet-500' },
];

const OVERDUE_CLIENTS = [
  { name: 'LICORES DEL ISTMO PA', amount: 8750, days: 95 },
  { name: 'DISTRIBUIDORA EL SOL HN', amount: 6200, days: 67 },
  { name: 'IMPORT EXPORT CARIBE', amount: 4800, days: 45 },
];

const CALENDAR_EVENTS = [
  { id: 1, title: 'Llegada contenedor DIAGEO', date: '2026-02-28', type: 'shipment' },
  { id: 2, title: 'Reunión con Pernod Ricard', date: '2026-03-01', type: 'meeting' },
  { id: 3, title: 'Conteo físico Zona A', date: '2026-03-03', type: 'inventory' },
  { id: 4, title: 'Vencimiento crédito BACARDI', date: '2026-03-05', type: 'payment' },
  { id: 5, title: 'Auditoría trimestral', date: '2026-03-10', type: 'audit' },
];

const WIDGETS_CONFIG = [
  { id: 'summary', name: 'Resumen General', icon: Landmark, description: 'Balances globales principales' },
  { id: 'kpis', name: 'Indicadores Clave', icon: Target, description: 'Cumplimiento de metas y KPIs' },
  { id: 'weeklySales', name: 'Ventas Semanales', icon: BarChart3, description: 'Desempeño diario vs meta' },
  { id: 'monthlyTrend', name: 'Tendencia Mensual', icon: TrendingUp, description: 'Ingresos vs Utilidad histórica' },
  { id: 'inventoryAlerts', name: 'Alertas Inventario', icon: AlertTriangle, description: 'Stocks bajos y faltantes' },
  { id: 'expiryAlerts', name: 'Próximos a Vencer', icon: AlertCircle, description: 'Lotes próximos a expirar' },
  { id: 'activity', name: 'Actividad Reciente', icon: Clock, description: 'Últimos eventos en la plataforma' },
  { id: 'quickActions', name: 'Acciones Rápidas', icon: Sparkles, description: 'Accesos directos operativos' },
  { id: 'customers', name: 'Ranking Clientes', icon: Users, description: 'Top clientes por facturación' },
  { id: 'products', name: 'Ranking Productos', icon: Package, description: 'Artículos de mayor rotación' },
];

// ============================================
// COMPONENT
// ============================================

export default function DashboardPage() {
  const { user, checkPermission } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isWidgetsModalOpen, setIsWidgetsModalOpen] = useState(false);
  const [widgetPrefs, setWidgetPrefs] = useState<Record<string, boolean>>({});
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  const canViewCosts = checkPermission('canViewCosts');
  const canApproveAdjustments = checkPermission('canApproveAdjustments');
  const canViewInventoryAlerts = checkPermission('canViewInventoryAlerts');
  const canViewExpiryAlerts = checkPermission('canViewExpiryAlerts');

  useEffect(() => {
    api.getDashboardAnalytics()
      .then(data => setAnalytics(data))
      .catch(err => console.error('Error fetching dashboard analytics:', err))
      .finally(() => setIsDataLoading(false));

    // Initialize widget preferences from localStorage (keyed by user email)
    const storageKey = user?.email ? `widget_prefs_${user.email}` : 'widget_prefs_default';
    const stored = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Record<string, boolean>;
        // Merge: ensure all widgets have a value
        const prefs = { ...parsed };
        WIDGETS_CONFIG.forEach(w => {
          if (prefs[w.id] === undefined) prefs[w.id] = true;
        });
        setWidgetPrefs(prefs);
        return;
      } catch {
        // fallback to defaults below
      }
    }
    // No stored prefs: default all to true
    const defaultPrefs: Record<string, boolean> = {};
    WIDGETS_CONFIG.forEach(w => defaultPrefs[w.id] = true);
    setWidgetPrefs(defaultPrefs);
  }, [user]);

  const handleToggleWidget = (id: string, value: boolean) => {
    setWidgetPrefs(prev => ({ ...prev, [id]: value }));
    const widgetName = WIDGETS_CONFIG.find(w => w.id === id)?.name;
    if (widgetName) {
      toast.success(`${widgetName} ${value ? 'activado' : 'desactivado'}`, {
        description: 'Recuerda guardar los cambios.'
      });
    }
  };

  const handleSavePreferences = async () => {
    setIsSavingPrefs(true);
    try {
      // Save to localStorage using email as key (works for both mock and real users)
      const storageKey = user?.email ? `widget_prefs_${user.email}` : 'widget_prefs_default';
      localStorage.setItem(storageKey, JSON.stringify(widgetPrefs));

      // Also attempt backend save if user has a real _id or id (non-blocking)
      const userId = (user as any)?._id || user?.id;
      if (userId && userId !== 'mock-dev-token') {
        api.updateUser(userId, { dashboardPreferences: widgetPrefs }).catch(() => {
          // silently ignore backend failures; prefs are already saved locally
        });
      }

      toast.success('Preferencias guardadas', {
        description: 'El dashboard se ha actualizado correctamente.'
      });
      setIsWidgetsModalOpen(false);
    } catch (error: any) {
      toast.error('Error al guardar preferencias', {
        description: error.message
      });
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const isVisible = (id: string) => widgetPrefs[id] !== false;

  // F4: Expiry data
  const expiryStats = canViewExpiryAlerts ? getExpiryStats() : null;
  const upcomingExpiryAlerts = canViewExpiryAlerts ? getUpcomingExpiryAlerts().slice(0, 5) : [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  const realStats = analytics ? [
    {
      label: 'Total Productos',
      value: String(analytics.summary.totalProducts),
      change: 'Catálogo',
      changeType: 'positive' as const,
      icon: Package,
      color: 'brand',
      href: '/productos',
    },
    {
      label: 'Ventas del Mes',
      value: formatCurrency(analytics.summary.monthRevenue),
      change: 'Facturado',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'success',
      href: '/ventas',
    },
    {
      label: 'Cuentas x Cobrar',
      value: formatCurrency(analytics.summary.totalCXC),
      change: `${analytics.topClientsWithBalance.length} clientes`,
      changeType: 'warning' as const,
      icon: CircleDollarSign,
      color: 'warning',
      href: '/clientes/cxc',
    },
    {
      label: 'Cuentas x Pagar',
      value: formatCurrency(analytics.summary.totalCXP),
      change: 'Pendiente',
      changeType: 'negative' as const,
      icon: CreditCard,
      color: 'danger',
      href: '/proveedores/cxp',
    },
  ] : STATS;

  const realActivity = analytics ? analytics.recentSales.map((s: any) => ({
    id: s.id,
    action: `Venta B2B ${s.reference}`,
    description: `Facturada a ${s.clientName} por ${formatCurrency(s.total)}`,
    time: new Date(s.createdAt).toLocaleDateString(),
    type: 'sale',
    status: s.status
  })) : RECENT_ACTIVITY;

  const realTopCustomers = analytics ? analytics.topClientsWithBalance.map((c: any) => ({
    id: c.id,
    name: c.name,
    country: c.reference,
    purchases: c.balance,
    orders: 0,
    avatar: c.name.substring(0, 2).toUpperCase()
  })) : TOP_CUSTOMERS;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };



  const displayWeeklySales = analytics?.weeklySales || WEEKLY_SALES;
  const displayMonthlyRevenue = analytics?.monthlyRevenue || MONTHLY_REVENUE;

  const maxWeeklySale = Math.max(...displayWeeklySales.map((d: any) => d.value));
  const totalWeeklySales = displayWeeklySales.reduce((sum: number, d: any) => sum + d.value, 0);
  const weeklyTarget = displayWeeklySales.reduce((sum: number, d: any) => sum + (d.target || 50000), 0);

  if (isDataLoading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Bienvenido, {user?.name}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Aquí está el resumen de tu actividad comercial • {new Date().toLocaleDateString('es-PA', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setIsWidgetsModalOpen(true)}
          >
            <LayoutGrid className="h-4 w-4 mr-1.5" />
            Widgets
          </Button>
          <Button
            variant="secondary"
          >
            <Calendar className="h-4 w-4 mr-1.5" />
            Febrero 2026
          </Button>
        </div>
      </motion.div>

      {/* Section: Resumen */}
      {isVisible('summary') && (
        <>
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Resumen General</p>

          {/* Stats Grid - Main 4, unified */}
          <Card className="p-0 overflow-hidden divide-y divide-border-default h-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
              {realStats.map((stat, index) => {
                const Icon = stat.icon;
                const colorClasses = {
                  brand: 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400',
                  success: 'bg-success-bg text-success',
                  warning: 'bg-warning-bg text-warning',
                  danger: 'bg-danger-bg text-danger',
                };

                return (
                  <motion.div
                    key={stat.label}
                    variants={itemVariants}
                    onClick={() => router.push(stat.href)}
                    className={cn(
                      'cursor-pointer p-4 transition-colors hover:bg-surface-secondary',
                      index < 2 && 'sm:border-b sm:border-border-default lg:border-b-0'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-secondary">{stat.label}</p>
                        <p className="mt-2 text-2xl font-semibold text-text-primary">{stat.value}</p>
                        <div className="mt-2 flex items-center gap-1">
                          {stat.changeType === 'positive' && <ArrowUpRight className="h-4 w-4 text-success" />}
                          {stat.changeType === 'negative' && <ArrowDownRight className="h-4 w-4 text-danger" />}
                          <span className={cn('text-xs font-medium', stat.changeType === 'positive' ? 'text-success' : stat.changeType === 'negative' ? 'text-danger' : 'text-warning')}>
                            {stat.change}
                          </span>
                        </div>
                      </div>
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', colorClasses[stat.color as keyof typeof colorClasses])}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </>
      )}

      {/* Section: KPIs */}
      {isVisible('kpis') && (
        <>
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Indicadores Clave</p>

          {/* KPIs Row - All together, touching */}
          <Card className="p-0 overflow-hidden divide-y divide-border-default h-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
              {KPIS.map((kpi, index) => {
                const Icon = kpi.icon;
                const progress = (kpi.current / kpi.target) * 100;
                const isOnTrack = progress >= 80;

                const colorClasses = {
                  brand: 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400',
                  info: 'bg-info-bg text-info',
                  success: 'bg-success-bg text-success',
                  warning: 'bg-warning-bg text-warning',
                };

                return (
                  <motion.div
                    key={kpi.label}
                    variants={itemVariants}
                    className={cn(
                      'p-4',
                      index < 2 && 'sm:border-b sm:border-border-default lg:border-b-0'
                    )}
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', colorClasses[kpi.color as keyof typeof colorClasses])}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-secondary">{kpi.label}</p>
                        <p className={cn('text-xl font-bold', isOnTrack ? 'text-success' : 'text-warning')}>
                          {kpi.unit === '$' ? formatCurrency(kpi.current) : `${kpi.current}${kpi.unit}`}
                        </p>
                      </div>
                    </div>
                    <Progress
                      value={Math.min(progress, 100)}
                      color={isOnTrack ? 'success' : 'warning'}
                      size="sm"
                      className="h-2"
                    />
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-text-muted">
                        Meta: {kpi.unit === '$' ? formatCurrency(kpi.target) : `${kpi.target}${kpi.unit}`}
                      </span>
                      <span className={cn('font-semibold', isOnTrack ? 'text-success' : 'text-warning')}>
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </>
      )}

      {/* Section: Análisis */}
      <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Análisis de Datos</p>

      {/* Charts Row - Sales + Monthly */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Weekly Sales Chart */}
        {isVisible('weeklySales') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn("lg:col-span-3", !isVisible('monthlyTrend') && "lg:col-span-5")}
          >
            <Card className="p-0">
              <CardHeader className="flex flex-row items-center justify-between p-4 mb-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/30">
                    <BarChart3 className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-text-primary">Ventas de la Semana</h3>
                    <p className="text-xs text-text-muted">Comparativa con meta diaria</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                    <span className="text-text-secondary">Ventas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2.5 w-2.5 rounded-full bg-text-muted/30" />
                    <span className="text-text-secondary">Meta</span>
                  </div>
                </div>
              </CardHeader>
              <Divider />
              <CardContent className="p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-text-primary">{formatCurrency(totalWeeklySales)}</p>
                    <p className="text-sm text-text-secondary">
                      {totalWeeklySales >= weeklyTarget ? (
                        <span className="text-success">+{((totalWeeklySales / weeklyTarget - 1) * 100).toFixed(1)}% sobre meta</span>
                      ) : (
                        <span className="text-danger">{((totalWeeklySales / weeklyTarget - 1) * 100).toFixed(1)}% bajo meta</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex h-48 items-end justify-between gap-3">
                  {displayWeeklySales.map((day: any, index: number) => {
                    const heightPercent = (day.value / maxWeeklySale) * 100;
                    const targetPercent = ((day.target || 50000) / maxWeeklySale) * 100;
                    const isAboveTarget = day.value >= (day.target || 50000);

                    return (
                      <div key={day.day} className="group relative flex flex-1 flex-col items-center">
                        <div className="relative flex h-40 w-full flex-col justify-end">
                          {/* Target line */}
                          <div
                            className="absolute left-0 right-0 border-t-2 border-dashed border-text-muted/30"
                            style={{ bottom: `${targetPercent}%` }}
                          />
                          {/* Bar */}
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPercent}%` }}
                            transition={{ delay: 0.3 + index * 0.05, duration: 0.4 }}
                            className={cn(
                              'w-full rounded-t-md transition-colors',
                              isAboveTarget
                                ? 'bg-brand-500 group-hover:bg-brand-600 dark:bg-brand-600 dark:group-hover:bg-brand-500'
                                : 'bg-warning group-hover:bg-warning/80'
                            )}
                          />
                        </div>
                        <p className="mt-2 text-xs font-medium text-text-secondary">{day.day}</p>
                        {/* Tooltip */}
                        <div className="pointer-events-none absolute -top-12 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-surface-secondary px-3 py-2 text-xs text-text-primary opacity-0 shadow-lg ring-1 ring-border-default transition-opacity group-hover:opacity-100 dark:bg-surface-tertiary">
                          <p className="font-semibold">{formatCurrency(day.value)}</p>
                          <p className="text-text-muted">Meta: {formatCurrency(day.target)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Monthly Revenue */}
        {isVisible('monthlyTrend') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className={cn("lg:col-span-2", !isVisible('weeklySales') && "lg:col-span-5")}
          >
            <Card className="p-0">
              <CardHeader className="flex flex-row items-center gap-3 p-4 mb-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-bg">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-text-primary">Tendencia Mensual</h3>
                  <p className="text-xs text-text-muted">Últimos 6 meses</p>
                </div>
              </CardHeader>
              <Divider />
              <CardContent className="p-4">
                <div className="space-y-3">
                  {displayMonthlyRevenue.map((month: any, index: number) => {
                    const maxRevenue = Math.max(...displayMonthlyRevenue.map((m: any) => m.revenue));
                    const widthPercent = (month.revenue / maxRevenue) * 100;
                    const isCurrentMonth = index === displayMonthlyRevenue.length - 1;

                    return (
                      <div key={month.month} className="flex items-center gap-3">
                        <span className={cn('w-8 text-xs font-medium', isCurrentMonth ? 'text-brand-600 dark:text-brand-400' : 'text-text-muted')}>
                          {month.month}
                        </span>
                        <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-surface-secondary">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${widthPercent}%` }}
                            transition={{ delay: 0.3 + index * 0.05, duration: 0.4 }}
                            className={cn(
                              'absolute inset-y-0 left-0 rounded-md',
                              isCurrentMonth
                                ? 'bg-brand-500 dark:bg-brand-600'
                                : 'bg-brand-200 dark:bg-brand-800'
                            )}
                          />
                        </div>
                        {canViewCosts && (
                          <span className={cn('w-20 text-right text-xs font-semibold', isCurrentMonth ? 'text-text-primary' : 'text-text-secondary')}>
                            {formatCurrency(month.revenue)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Pending Approvals + Inventory Alerts */}
      {canApproveAdjustments && (
        <>
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Gestión Operativa</p>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Pending Approvals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card className="p-0">
                <CardHeader className="flex flex-row items-center justify-between p-4 mb-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-bg">
                      <ClipboardList className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-text-primary">Pendientes de Aprobación</h3>
                      <p className="text-xs text-text-muted">{PENDING_APPROVALS.length} items requieren acción</p>
                    </div>
                  </div>
                  <Chip color="warning" variant="flat" size="sm">
                    {PENDING_APPROVALS.length}
                  </Chip>
                </CardHeader>
                <Divider />
                <CardContent className="p-0">
                  <ul className="divide-y divide-border-default">
                    {PENDING_APPROVALS.map((item) => (
                      <li
                        key={item.id}
                        className="cursor-pointer px-4 py-4 transition-colors hover:bg-surface-secondary"
                        onClick={() => router.push(item.type === 'adjustment' ? `/inventario/ajustes/${item.id}` : `/inventario/transferencias/${item.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-full',
                              item.type === 'adjustment' ? 'bg-info-bg text-info' : 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400'
                            )}>
                              {item.type === 'adjustment' ? <FileText className="h-4 w-4" /> : <ArrowRightLeft className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-text-primary">{item.id}</p>
                              <p className="text-xs text-text-secondary">{item.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {canViewCosts && (
                              <p className="text-sm font-semibold text-text-primary">{formatCurrency(item.value)}</p>
                            )}
                            <p className="text-xs text-text-muted">{item.createdBy}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Inventory Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-0">
                <CardHeader className="flex flex-row items-center justify-between p-4 mb-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger-bg">
                      <AlertCircle className="h-5 w-5 text-danger" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-text-primary">Alertas de Inventario</h3>
                      <p className="text-xs text-text-muted">Productos que requieren atención</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => router.push('/inventario?filter=low_stock')}
                  >
                    Ver todos
                  </Button>
                </CardHeader>
                <Divider />
                {/* F1: Reorder Point Summary */}
                {canViewInventoryAlerts && REORDER_POINT_COUNT > 0 && (
                  <div className="mx-4 mt-4 mb-2 flex items-center justify-between rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                        {REORDER_POINT_COUNT} producto{REORDER_POINT_COUNT !== 1 ? 's' : ''} bajo punto de reorden
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => router.push('/inventario?filter=below_reorder')}
                    >
                      Ver Inventario
                    </Button>
                  </div>
                )}
                <CardContent className="p-0">
                  <ul className="divide-y divide-border-default">
                    {INVENTORY_ALERTS.map((alert) => (
                      <li key={alert.id} className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-full',
                              alert.severity === 'critical' ? 'bg-danger-bg text-danger' :
                                alert.severity === 'warning' ? 'bg-warning-bg text-warning' :
                                  'bg-warning-bg/50 text-warning'
                            )}>
                              <AlertTriangle className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-text-primary line-clamp-1">{alert.product}</p>
                              <p className="text-xs text-text-muted">{alert.reference}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {alert.type === 'out_of_stock' && (
                              <Chip color="danger" variant="flat" size="sm">Sin Stock</Chip>
                            )}
                            {alert.type === 'low_stock' && (
                              <Chip color="warning" variant="flat" size="sm">{alert.current}/{alert.minimum}</Chip>
                            )}
                            {alert.type === 'stagnant' && (
                              <Chip color="secondary" variant="flat" size="sm">{alert.monthsWithoutSale} meses</Chip>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                    {canViewInventoryAlerts && REORDER_POINT_ALERTS.slice(0, 5).map((alert) => (
                      <li key={`rp-${alert.id}`} className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-full',
                              alert.severity === 'critical' ? 'bg-danger-bg text-danger' :
                                alert.severity === 'warning' ? 'bg-warning-bg text-warning' :
                                  'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                            )}>
                              <Package className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-text-primary line-clamp-1">{alert.product}</p>
                              <p className="text-xs text-text-muted">{alert.reference}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Chip
                              color={alert.severity === 'critical' ? 'danger' : 'warning'}
                              variant="flat"
                              size="sm"
                            >
                              {alert.current}/{alert.reorderPoint}
                            </Chip>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}


      {/* F4: Expiry Alerts Widget */}
      {
        canViewExpiryAlerts && expiryStats && (expiryStats.expired > 0 || expiryStats.critical > 0 || expiryStats.warning > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42 }}
          >
            <Card className="p-0">
              <CardHeader className="flex flex-row items-center justify-between p-4 mb-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10">
                    <Clock className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-text-primary">Próximos a Vencer</h3>
                    <p className="text-xs text-text-muted">Lotes con fecha de vencimiento cercana</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => router.push('/inventario')}
                >
                  Ver inventario
                </Button>
              </CardHeader>
              <Divider />
              {/* Stats row */}
              <div className="grid grid-cols-3 divide-x divide-border-default border-b border-border-default">
                <div className="px-5 py-3 text-center">
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">{expiryStats.expired}</p>
                  <p className="text-xs text-text-muted">Vencidos</p>
                </div>
                <div className="px-5 py-3 text-center">
                  <p className="text-xl font-bold text-red-500">{expiryStats.critical}</p>
                  <p className="text-xs text-text-muted">Críticos (&lt;30d)</p>
                </div>
                <div className="px-5 py-3 text-center">
                  <p className="text-xl font-bold text-amber-500">{expiryStats.warning}</p>
                  <p className="text-xs text-text-muted">Advertencia (30-60d)</p>
                </div>
              </div>
              <CardContent className="p-4">
                <ul className="divide-y divide-border-default">
                  {upcomingExpiryAlerts.map((alert) => {
                    const config = EXPIRY_ALERT_CONFIG[alert.alertLevel];
                    return (
                      <li key={alert.batch.id} className="px-5 py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', config.bg)}>
                              <Clock className={cn('h-4 w-4', config.text)} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-text-primary line-clamp-1">{alert.batch.productDescription}</p>
                              <p className="text-xs text-text-muted">Lote: {alert.batch.batchNumber} &middot; {alert.batch.quantity} uds</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium', config.bg, config.text)}>
                              {alert.label}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )
      }

      {/* Section: Finanzas */}
      {
        checkPermission('canAccessCxC') && (
          <>
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Finanzas y Cobranzas</p>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* CxC Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42 }}
                className="lg:col-span-2"
              >
                <Card className="p-0">
                  <CardHeader className="flex flex-row items-center justify-between p-4 mb-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-bg">
                        <Receipt className="h-5 w-5 text-warning" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-text-primary">Cuentas por Cobrar</h3>
                        <p className="text-xs text-text-muted">Resumen de cartera</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => router.push('/clientes/cxc')}
                    >
                      Ver CxC
                    </Button>
                  </CardHeader>
                  <Divider />
                  <CardContent className="p-5">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <p className="text-xs text-text-muted">Total Pendiente</p>
                        <p className="mt-1 text-xl font-bold text-text-primary">{formatCurrency(CXC_SUMMARY.totalPending)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Corriente</p>
                        <p className="mt-1 text-xl font-bold text-success">{formatCurrency(CXC_SUMMARY.current)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Vencido 30-60</p>
                        <p className="mt-1 text-xl font-bold text-warning">{formatCurrency(CXC_SUMMARY.overdue30)}</p>
                      </div>
                      <div>
                        <p className="mt-1 text-xl font-bold text-danger">{formatCurrency(CXC_SUMMARY.overdue60 + CXC_SUMMARY.overdue90)}</p>
                      </div>
                    </div>
                    {/* Aging bar */}
                    <div className="mt-4 flex h-3 overflow-hidden rounded-full">
                      <div className="bg-success" style={{ width: `${(CXC_SUMMARY.current / CXC_SUMMARY.totalPending) * 100}%` }} />
                      <div className="bg-warning" style={{ width: `${(CXC_SUMMARY.overdue30 / CXC_SUMMARY.totalPending) * 100}%` }} />
                      <div className="bg-orange-500" style={{ width: `${(CXC_SUMMARY.overdue60 / CXC_SUMMARY.totalPending) * 100}%` }} />
                      <div className="bg-danger" style={{ width: `${(CXC_SUMMARY.overdue90 / CXC_SUMMARY.totalPending) * 100}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" />Corriente</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" />30d</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500" />60d</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-danger" />90+d</span>
                      </div>
                    </div>
                    {/* Cobros del mes progress */}
                    <div className="mt-4 rounded-lg bg-surface-secondary p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Cobros del mes</span>
                        <span className="font-semibold text-text-primary">{formatCurrency(CXC_SUMMARY.collectedThisMonth)} / {formatCurrency(CXC_SUMMARY.collectionTarget)}</span>
                      </div>
                      <Progress
                        value={(CXC_SUMMARY.collectedThisMonth / CXC_SUMMARY.collectionTarget) * 100}
                        color="success"
                        size="sm"
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Bank Balances + Overdue Alerts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.47 }}
                className="space-y-6"
              >
                {/* Bank Balances */}
                {checkPermission('canViewBankBalances') && (
                  <Card className="p-0">
                    <CardHeader className="flex flex-row items-center justify-between p-4 mb-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info-bg">
                          <Landmark className="h-5 w-5 text-info" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-text-primary">Saldos Bancarios</h3>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => router.push('/contabilidad/tesoreria')}
                      >
                        Ver
                      </Button>
                    </CardHeader>
                    <Divider />
                    <CardContent className="p-0">
                      <ul className="divide-y divide-border-default">
                        {BANK_BALANCES.map((bank) => (
                          <li key={bank.name} className="flex items-center justify-between px-5 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className={cn('h-2.5 w-2.5 rounded-full', bank.color)} />
                              <span className="text-sm text-text-secondary">{bank.name}</span>
                            </div>
                            <span className="text-sm font-semibold text-text-primary">{formatCurrency(bank.balance)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="border-t border-border-default bg-surface-secondary px-5 py-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-text-secondary">Total</span>
                          <span className="text-sm font-bold text-text-primary">{formatCurrency(BANK_BALANCES.reduce((s, b) => s + b.balance, 0))}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Overdue Alerts */}
                <Card className="p-0">
                  <CardHeader className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-danger" />
                      <h3 className="text-sm font-semibold text-text-primary">Alertas de Morosidad</h3>
                    </div>
                  </CardHeader>
                  <Divider />
                  <CardContent className="p-0">
                    <ul className="divide-y divide-border-default">
                      {OVERDUE_CLIENTS.map((client) => (
                        <li key={client.name} className="px-5 py-2.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-text-primary line-clamp-1">{client.name}</p>
                              <p className="text-xs text-danger">{client.days} días vencido</p>
                            </div>
                            <span className="text-sm font-semibold text-danger">{formatCurrency(client.amount)}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </>
        )
      }

      {/* Section: Logística */}
      <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Logística y Productos</p>

      {/* Upcoming Shipments + Top Products */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Shipments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between p-4 mb-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info-bg">
                  <Ship className="h-5 w-5 text-info" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-text-primary">Próximos Embarques</h3>
                  <p className="text-xs text-text-muted">Mercancía en tránsito</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => router.push('/trafico')}
              >
                Ver todos
              </Button>
            </CardHeader>
            <Divider />
            <CardContent className="p-0">
              <ul className="divide-y divide-border-default">
                {UPCOMING_SHIPMENTS.map((shipment) => (
                  <li key={shipment.id} className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg',
                          shipment.status === 'in_transit' ? 'bg-success-bg' :
                            shipment.status === 'confirmed' ? 'bg-info-bg' : 'bg-surface-secondary'
                        )}>
                          <Truck className={cn(
                            'h-5 w-5',
                            shipment.status === 'in_transit' ? 'text-success' :
                              shipment.status === 'confirmed' ? 'text-info' : 'text-text-muted'
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-text-primary">{shipment.id}</p>
                            {shipment.status === 'in_transit' && (
                              <Chip color="success" variant="dot" size="sm">En tránsito</Chip>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary">{shipment.supplier}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-text-primary">{shipment.items} cajas</p>
                        <p className="text-xs text-text-muted">ETA: {new Date(shipment.eta).toLocaleDateString('es-PA', { day: '2-digit', month: 'short' })}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between p-4 mb-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/30">
                  <Award className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-text-primary">Top Productos</h3>
                  <p className="text-xs text-text-muted">Más vendidos este mes</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => router.push('/reportes')}
              >
                Ver reporte
              </Button>
            </CardHeader>
            <Divider />
            <CardContent className="p-0">
              <ul className="divide-y divide-border-default">
                {TOP_PRODUCTS.slice(0, 4).map((product, index) => (
                  <li key={product.id} className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                          index === 0 ? 'bg-warning-bg text-warning' :
                            index === 1 ? 'bg-surface-tertiary text-text-secondary' :
                              index === 2 ? 'bg-warning-bg/50 text-warning' : 'bg-surface-secondary text-text-muted'
                        )}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary line-clamp-1">{product.name}</p>
                          <p className="text-xs text-text-muted">{product.sold} unidades</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {canViewCosts && (
                          <p className="text-sm font-semibold text-text-primary">{formatCurrency(product.revenue)}</p>
                        )}
                        <span className={cn(
                          'flex items-center text-xs font-medium',
                          product.trend === 'up' ? 'text-success' : 'text-danger'
                        )}>
                          {product.trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {Math.abs(product.percentChange)}%
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Section: Clientes y Agenda */}
      <p className="text-xs font-medium uppercase tracking-wider text-text-muted"> Clientes y Agenda</p>

      {/* Top Customers + Calendar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Top Customers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="lg:col-span-2"
        >
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between p-4 mb-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info-bg">
                  <Users className="h-5 w-5 text-info" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-text-primary">Principales Clientes</h3>
                  <p className="text-xs text-text-muted">Por volumen de compras este mes</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => router.push('/clientes')}
              >
                Ver todos
              </Button>
            </CardHeader>
            <Divider />
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-default bg-surface-secondary">
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Cliente</th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">País</th>
                      <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Órdenes</th>
                      {canViewCosts && (
                        <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Compras</th>
                      )}
                      <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {realTopCustomers.map((customer: any) => (
                      <tr key={customer.id} className="hover:bg-surface-secondary">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={customer.avatar}
                              size="sm"
                              classNames={{ base: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400' }}
                            />
                            <span className="text-sm font-medium text-text-primary">{customer.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-sm text-text-secondary">{customer.country}</span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="text-sm text-text-primary">{customer.orders}</span>
                        </td>
                        {canViewCosts && (
                          <td className="px-5 py-3 text-right">
                            <span className="text-sm font-semibold text-text-primary">{formatCurrency(customer.purchases)}</span>
                          </td>
                        )}
                        <td className="px-5 py-3 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/clientes/${customer.id}`)}
                            className="p-2 h-8 w-8 min-w-0"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Calendar / Upcoming Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center gap-3 p-4 mb-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger-bg">
                <Calendar className="h-5 w-5 text-danger" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-text-primary">Próximos Eventos</h3>
                <p className="text-xs text-text-muted">Actividades programadas</p>
              </div>
            </CardHeader>
            <Divider />
            <CardContent className="p-0">
              <ul className="divide-y divide-border-default">
                {CALENDAR_EVENTS.map((event) => {
                  const eventDate = new Date(event.date);
                  const isToday = eventDate.toDateString() === new Date().toDateString();
                  const isSoon = eventDate <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

                  return (
                    <li key={event.id} className="px-5 py-3">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'flex h-10 w-10 flex-col items-center justify-center rounded-lg',
                          isToday ? 'bg-brand-500 text-white' : isSoon ? 'bg-brand-100 dark:bg-brand-900/30' : 'bg-surface-secondary'
                        )}>
                          <span className={cn('text-xs font-medium', isToday ? 'text-white' : 'text-text-muted')}>
                            {eventDate.toLocaleDateString('es-PA', { month: 'short' }).toUpperCase()}
                          </span>
                          <span className={cn('text-sm font-bold', isToday ? 'text-white' : 'text-text-primary')}>
                            {eventDate.getDate()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-text-primary">{event.title}</p>
                          <div className="mt-1 flex items-center gap-2">
                            {event.type === 'shipment' && <Chip color="success" variant="flat" size="sm">Embarque</Chip>}
                            {event.type === 'meeting' && <Chip color="primary" variant="flat" size="sm">Reunión</Chip>}
                            {event.type === 'inventory' && <Chip color="secondary" variant="flat" size="sm">Inventario</Chip>}
                            {event.type === 'payment' && <Chip color="warning" variant="flat" size="sm">Pago</Chip>}
                            {event.type === 'audit' && <Chip color="danger" variant="flat" size="sm">Auditoría</Chip>}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Section: Actividad */}
      <p className="text-xs font-medium uppercase tracking-wider text-text-muted"> Actividad y Acciones</p>

      {/* Recent Activity + Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="lg:col-span-2"
        >
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between p-4 mb-0">
              <h3 className="text-base font-semibold text-text-primary">Actividad Reciente</h3>
              <Button
                size="sm"
                onClick={() => router.push('/historial')}
              >
                Ver todo
              </Button>
            </CardHeader>
            <Divider />
            <CardContent className="p-0">
              <ul className="divide-y divide-border-default">
                {realActivity.map((activity: any) => (
                  <li key={activity.id} className="px-5 py-4">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                        activity.type === 'purchase' ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400' :
                          activity.type === 'inventory' ? 'bg-success-bg text-success' :
                            activity.type === 'sale' ? 'bg-info-bg text-info' :
                              activity.type === 'transfer' ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400' :
                                activity.type === 'adjustment' ? 'bg-info-bg text-info' :
                                  'bg-warning-bg text-warning'
                      )}>
                        {activity.type === 'purchase' && <ShoppingCart className="h-4 w-4" />}
                        {activity.type === 'inventory' && <Package className="h-4 w-4" />}
                        {activity.type === 'sale' && <TrendingUp className="h-4 w-4" />}
                        {activity.type === 'transfer' && <ArrowRightLeft className="h-4 w-4" />}
                        {activity.type === 'adjustment' && <FileText className="h-4 w-4" />}
                        {activity.type === 'alert' && <AlertTriangle className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-primary">{activity.action}</p>
                        <p className="mt-0.5 text-sm text-text-secondary">{activity.description}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-text-muted">
                        <Clock className="h-3 w-3" />
                        {activity.time}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-0">
            <CardHeader className="px-5 py-4">
              <h3 className="text-base font-semibold text-text-primary">Acciones Rápidas</h3>
            </CardHeader>
            <Divider />
            <CardContent className="space-y-3 p-4">
              <Button
                onClick={() => router.push('/compras?action=new')}
                className="w-full justify-start py-6"
              >
                <ShoppingCart className="h-4 w-4" />
                Nueva Orden de Compra
              </Button>
              <Button
                onClick={() => router.push('/productos?action=new')}
                variant="secondary"
                className="w-full justify-start py-6"
              >
                <Package className="h-4 w-4" />
                Nuevo Producto
              </Button>
              <Button
                onClick={() => router.push('/ventas?action=new')}
                variant="secondary"
                className="w-full justify-start py-6"
              >
                <TrendingUp className="h-4 w-4" />
                Nueva Cotización
              </Button>
              <Button
                onClick={() => router.push('/inventario?tab=transferencias&action=new')}
                variant="secondary"
                className="w-full justify-start py-6"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Nueva Transferencia
              </Button>
              <Button
                onClick={() => router.push('/inventario?tab=conteo&action=new')}
                variant="secondary"
                className="w-full justify-start py-6"
              >
                <ClipboardList className="h-4 w-4" />
                Conteo Físico
              </Button>
              <Button
                onClick={() => router.push('/clientes/cxc/cobro')}
                variant="secondary"
                className="w-full justify-start py-6"
              >
                <CircleDollarSign className="h-4 w-4" />
                Registrar Cobro
              </Button>
              <Button
                onClick={() => router.push('/clientes/nuevo')}
                variant="secondary"
                className="w-full justify-start py-6"
              >
                <Users className="h-4 w-4" />
                Nuevo Cliente
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <CustomModal isOpen={isWidgetsModalOpen} onClose={() => !isSavingPrefs && setIsWidgetsModalOpen(false)}>
        <CustomModalHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Configurar Widgets</h3>
              <p className="text-sm text-text-muted">Personaliza la información de tu dashboard</p>
            </div>
          </div>
        </CustomModalHeader>
        <CustomModalBody className="p-0">
          <div className="max-h-[60vh] overflow-y-auto w-full">
            <div className="divide-y divide-border-default">
              {WIDGETS_CONFIG.map((widget) => (
                <div key={widget.id} className="flex items-center justify-between p-5 hover:bg-surface-secondary transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-tertiary">
                      <widget.icon className="h-4 w-4 text-text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{widget.name}</p>
                      <p className="text-xs text-text-muted mt-0.5 max-w-[200px]">{widget.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={widgetPrefs[widget.id] ?? true}
                    onCheckedChange={(checked) => handleToggleWidget(widget.id, checked)}
                    disabled={isSavingPrefs}
                  />
                </div>
              ))}
            </div>
          </div>
        </CustomModalBody>
        <CustomModalFooter>
          <Button
            variant="ghost"
            onClick={() => setIsWidgetsModalOpen(false)}
            disabled={isSavingPrefs}
            className="h-10 px-6 font-semibold"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSavePreferences}
            isLoading={isSavingPrefs}
            className="h-10 px-6 font-semibold shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_1px_0_rgba(0,0,0,0.08),inset_0_-1px_0_rgba(0,0,0,0.3)] bg-[#1a1a1a] text-white hover:bg-[#333333]"
          >
            Guardar Cambios
          </Button>
        </CustomModalFooter>
      </CustomModal>
    </div>
  );
}
