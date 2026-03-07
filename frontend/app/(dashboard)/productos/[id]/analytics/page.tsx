'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  Clock,
  DollarSign,
} from 'lucide-react';
import { SEED_PRODUCTS, PRODUCT_GROUPS } from '@/lib/mock-data/products';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/contexts/auth-context';

// ============================================================================
// HELPERS
// ============================================================================

/** Deterministic pseudo-random from a seed string */
function seededRandom(seed: string, index: number): number {
  let hash = 0;
  const str = `${seed}-${index}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash % 1000) / 1000;
}

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const MOVEMENT_TYPES = ['Venta', 'Compra', 'Ajuste', 'Transferencia'] as const;

const CLIENT_NAMES = [
  'BRAND DISTRIBUIDOR CURACAO',
  'TRIPLE DOUBLE TRADING',
  'CARIBBEAN SPIRITS LLC',
  'DUTY FREE AMERICAS',
  'ISLAND BEVERAGES CO',
  'LICORES DEL ISTMO PA',
  'DISTRIBUIDORA EL SOL HN',
  'IMPORT EXPORT CARIBE',
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

function generateStockMovements(productId: string, baseStock: number) {
  return MONTH_LABELS.map((month, i) => {
    const r = seededRandom(productId, i);
    const entries = Math.round(baseStock * 0.3 + r * baseStock * 0.5);
    const exits = Math.round(baseStock * 0.2 + seededRandom(productId, i + 100) * baseStock * 0.4);
    return { month, entries, exits };
  });
}

function generateCostEvolution(productId: string, costFOB: number, costCIF: number, costAvg: number) {
  const months = MONTH_LABELS.slice(MONTH_LABELS.length - 6);
  return months.map((month, i) => {
    const variation = (seededRandom(productId, i + 200) - 0.5) * 0.08;
    const fob = +(costFOB * (1 + variation)).toFixed(2);
    const cif = +(costCIF * (1 + variation * 1.1)).toFixed(2);
    const avg = +(costAvg * (1 + variation * 0.9)).toFixed(2);
    return { month, fob, cif, avg };
  });
}

function generateMovements(productId: string, stock: number) {
  const movements = [];
  let balance = stock;
  for (let i = 0; i < 15; i++) {
    const r = seededRandom(productId, i + 300);
    const typeIdx = Math.floor(r * 4);
    const type = MOVEMENT_TYPES[typeIdx];
    const isEntry = type === 'Compra' || (type === 'Ajuste' && r > 0.7) || (type === 'Transferencia' && r > 0.6);
    const qty = Math.round(1 + seededRandom(productId, i + 400) * 20);
    const signedQty = isEntry ? qty : -qty;
    balance += signedQty;
    if (balance < 0) balance = qty;

    const day = Math.max(1, Math.min(28, Math.round(28 - i * 1.8)));
    const month = i < 5 ? 2 : i < 10 ? 1 : 12;
    const year = month === 12 ? 2025 : 2026;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const refPrefixes: Record<string, string> = {
      Venta: 'VTA',
      Compra: 'OC',
      Ajuste: 'AJ',
      Transferencia: 'TR',
    };
    const refNum = String(3500 + i).padStart(5, '0');
    const counterparts: Record<string, string> = {
      Venta: CLIENT_NAMES[Math.floor(seededRandom(productId, i + 500) * CLIENT_NAMES.length)],
      Compra: 'Proveedor',
      Ajuste: 'Inventario',
      Transferencia: seededRandom(productId, i + 600) > 0.5 ? 'Bodega ZL → Tienda PTY' : 'Tienda PTY → Bodega ZL',
    };

    movements.push({
      date: dateStr,
      type,
      reference: `${refPrefixes[type]}-${refNum}`,
      counterpart: counterparts[type],
      quantity: signedQty,
      balance,
    });
  }
  return movements;
}

function generateTopClients(productId: string, priceA: number) {
  const clients = [];
  for (let i = 0; i < 5; i++) {
    const r = seededRandom(productId, i + 700);
    const orders = Math.round(3 + r * 15);
    const totalQty = Math.round(orders * (5 + seededRandom(productId, i + 800) * 25));
    const totalUSD = +(totalQty * priceA * (0.85 + seededRandom(productId, i + 900) * 0.15)).toFixed(2);
    clients.push({
      name: CLIENT_NAMES[i],
      orders,
      totalQty,
      totalUSD,
    });
  }
  clients.sort((a, b) => b.totalUSD - a.totalUSD);
  const grandTotal = clients.reduce((sum, c) => sum + c.totalUSD, 0);
  return clients.map((c) => ({
    ...c,
    percent: +((c.totalUSD / grandTotal) * 100).toFixed(1),
  }));
}

function getLeadTimeByCountry(country: string): string {
  const map: Record<string, string> = {
    ESCOCIA: '45 días',
    MEXICO: '25 días',
    ITALIA: '40 días',
    'ESTADOS UNIDOS': '20 días',
    JAMAICA: '18 días',
    VENEZUELA: '15 días',
  };
  return map[country] || '30 días';
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ProductAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const { checkPermission } = useAuth();
  const canView = checkPermission('canViewProductAnalytics');

  const productId = params.id as string;
  const product = SEED_PRODUCTS.find((p) => p.id === productId);
  const groupLabel = product
    ? PRODUCT_GROUPS.find((g) => g.id === product.group)?.label || product.group
    : '';

  // ── Permission gate ──
  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="mb-2 text-lg font-medium text-foreground">Acceso Restringido</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          No tienes permisos para ver analytics de productos.
        </p>
        <button
          onClick={() => router.back()}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          Volver
        </button>
      </div>
    );
  }

  // ── Product not found ──
  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Package className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="mb-2 text-lg font-medium text-foreground">Producto no encontrado</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          El producto {productId} no existe o fue eliminado.
        </p>
        <button
          onClick={() => router.push('/productos')}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          Volver a Productos
        </button>
      </div>
    );
  }

  // ── Derived data ──
  const margin = ((product.prices.A - product.costCIF) / product.prices.A) * 100;
  const unitsSoldMonth = Math.round(product.stock.existence * 0.6 + seededRandom(productId, 999) * 40);
  const rotationDays = Math.round(30 + seededRandom(productId, 998) * 60);
  const daysWithoutMovement = Math.round(seededRandom(productId, 997) * 15);
  const purchaseFrequency = Math.round(20 + seededRandom(productId, 996) * 40);
  const leadTime = getLeadTimeByCountry(product.country);

  const stockMovements = generateStockMovements(productId, product.stock.existence || 30);
  const costEvolution = generateCostEvolution(productId, product.costFOB, product.costCIF, product.costAvgWeighted);
  const movements = generateMovements(productId, product.stock.available);
  const topClients = generateTopClients(productId, product.prices.A);

  const maxBar = Math.max(...stockMovements.flatMap((m) => [m.entries, m.exits]));

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/productos/${productId}`)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">{product.description}</h1>
              <span className="inline-flex items-center rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-500">
                {groupLabel}
              </span>
            </div>
            <p className="mt-1 flex items-center gap-2 font-mono text-sm text-muted-foreground">
              {product.reference}
              <span className="text-muted-foreground/50">|</span>
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push(`/productos/${productId}`)}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Producto
        </button>
      </motion.div>

      {/* ── Stat Cards ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {[
          {
            label: 'Unidades Vendidas (Mes)',
            value: formatNumber(unitsSoldMonth),
            icon: Package,
            color: 'brand',
          },
          {
            label: 'Rotación',
            value: `${rotationDays} días`,
            icon: Clock,
            color: 'info',
          },
          {
            label: 'Margen Promedio',
            value: `${margin.toFixed(1)}%`,
            icon: TrendingUp,
            color: 'success',
          },
          {
            label: 'Último Costo CIF',
            value: formatCurrency(product.costCIF),
            icon: DollarSign,
            color: 'warning',
          },
        ].map((stat) => {
          const Icon = stat.icon;
          const colorMap: Record<string, string> = {
            brand: 'bg-brand-500/10 text-brand-500',
            info: 'bg-sky-500/10 text-sky-500',
            success: 'bg-emerald-500/10 text-emerald-500',
            warning: 'bg-amber-500/10 text-amber-500',
          };
          return (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              className="rounded-xl border border-border bg-card p-5 dark:border-[#2a2a2a] dark:bg-[#141414]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground dark:text-[#888888]">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{stat.value}</p>
                </div>
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', colorMap[stat.color])}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Stock Movements Chart (CSS bar chart) ── */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="rounded-xl border border-border bg-card p-5 dark:border-[#2a2a2a] dark:bg-[#141414]"
      >
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Movimientos de Stock</h3>
          <span className="ml-auto text-xs text-muted-foreground dark:text-[#888888]">Últimos 12 meses</span>
        </div>

        {/* Legend */}
        <div className="mb-4 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Entradas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-red-500" />
            <span className="text-xs text-muted-foreground">Salidas</span>
          </div>
        </div>

        {/* Chart */}
        <div className="flex items-end gap-2" style={{ height: 180 }}>
          {stockMovements.map((m) => (
            <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full items-end justify-center gap-0.5" style={{ height: 150 }}>
                {/* Entries bar */}
                <div
                  className="w-[45%] rounded-t bg-emerald-500/80 transition-all hover:bg-emerald-500"
                  style={{ height: `${maxBar > 0 ? (m.entries / maxBar) * 100 : 0}%` }}
                  title={`Entradas: ${m.entries}`}
                />
                {/* Exits bar */}
                <div
                  className="w-[45%] rounded-t bg-red-500/80 transition-all hover:bg-red-500"
                  style={{ height: `${maxBar > 0 ? (m.exits / maxBar) * 100 : 0}%` }}
                  title={`Salidas: ${m.exits}`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground dark:text-[#888888]">{m.month}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Cost Evolution Table ── */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="rounded-xl border border-border bg-card p-5 dark:border-[#2a2a2a] dark:bg-[#141414]"
      >
        <div className="mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Evolución de Costos</h3>
          <span className="ml-auto text-xs text-muted-foreground dark:text-[#888888]">Últimos 6 meses</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border dark:border-[#2a2a2a]">
                <th className="pb-3 pr-4 text-left text-xs font-medium text-muted-foreground dark:text-[#888888]">Mes</th>
                <th className="pb-3 pr-4 text-right text-xs font-medium text-muted-foreground dark:text-[#888888]">Costo FOB</th>
                <th className="pb-3 pr-4 text-right text-xs font-medium text-muted-foreground dark:text-[#888888]">Costo CIF</th>
                <th className="pb-3 text-right text-xs font-medium text-muted-foreground dark:text-[#888888]">Costo Prom.</th>
              </tr>
            </thead>
            <tbody>
              {costEvolution.map((row, i) => {
                const prevFob = i > 0 ? costEvolution[i - 1].fob : row.fob;
                const prevCif = i > 0 ? costEvolution[i - 1].cif : row.cif;
                const prevAvg = i > 0 ? costEvolution[i - 1].avg : row.avg;
                return (
                  <tr key={row.month} className="border-b border-border/50 last:border-0 dark:border-[#2a2a2a]/50">
                    <td className="py-2.5 pr-4 font-medium text-foreground">{row.month}</td>
                    <td className={cn('py-2.5 pr-4 text-right font-mono', row.fob > prevFob ? 'text-red-500' : row.fob < prevFob ? 'text-emerald-500' : 'text-foreground')}>
                      {formatCurrency(row.fob)}
                      {row.fob > prevFob && <TrendingUp className="ml-1 inline h-3 w-3" />}
                      {row.fob < prevFob && <TrendingDown className="ml-1 inline h-3 w-3" />}
                    </td>
                    <td className={cn('py-2.5 pr-4 text-right font-mono', row.cif > prevCif ? 'text-red-500' : row.cif < prevCif ? 'text-emerald-500' : 'text-foreground')}>
                      {formatCurrency(row.cif)}
                      {row.cif > prevCif && <TrendingUp className="ml-1 inline h-3 w-3" />}
                      {row.cif < prevCif && <TrendingDown className="ml-1 inline h-3 w-3" />}
                    </td>
                    <td className={cn('py-2.5 text-right font-mono', row.avg > prevAvg ? 'text-red-500' : row.avg < prevAvg ? 'text-emerald-500' : 'text-foreground')}>
                      {formatCurrency(row.avg)}
                      {row.avg > prevAvg && <TrendingUp className="ml-1 inline h-3 w-3" />}
                      {row.avg < prevAvg && <TrendingDown className="ml-1 inline h-3 w-3" />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Latest Movements Table ── */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="rounded-xl border border-border bg-card p-5 dark:border-[#2a2a2a] dark:bg-[#141414]"
      >
        <div className="mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Últimos Movimientos</h3>
          <span className="ml-auto text-xs text-muted-foreground dark:text-[#888888]">15 más recientes</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border dark:border-[#2a2a2a]">
                <th className="pb-3 pr-4 text-left text-xs font-medium text-muted-foreground dark:text-[#888888]">Fecha</th>
                <th className="pb-3 pr-4 text-left text-xs font-medium text-muted-foreground dark:text-[#888888]">Tipo</th>
                <th className="pb-3 pr-4 text-left text-xs font-medium text-muted-foreground dark:text-[#888888]">Referencia</th>
                <th className="pb-3 pr-4 text-left text-xs font-medium text-muted-foreground dark:text-[#888888]">Contraparte</th>
                <th className="pb-3 pr-4 text-right text-xs font-medium text-muted-foreground dark:text-[#888888]">Cantidad</th>
                <th className="pb-3 text-right text-xs font-medium text-muted-foreground dark:text-[#888888]">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((mov, i) => (
                <tr
                  key={`${mov.reference}-${i}`}
                  className="border-b border-border/50 last:border-0 dark:border-[#2a2a2a]/50"
                >
                  <td className="py-2.5 pr-4 font-mono text-xs text-foreground">{mov.date}</td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                        mov.type === 'Venta'
                          ? 'bg-sky-500/10 text-sky-500'
                          : mov.type === 'Compra'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : mov.type === 'Ajuste'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-violet-500/10 text-violet-500'
                      )}
                    >
                      {mov.type}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-foreground">{mov.reference}</td>
                  <td className="py-2.5 pr-4 text-xs text-muted-foreground">{mov.counterpart}</td>
                  <td
                    className={cn(
                      'py-2.5 pr-4 text-right font-mono text-xs font-medium',
                      mov.quantity > 0 ? 'text-emerald-500' : 'text-red-500'
                    )}
                  >
                    {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                  </td>
                  <td className="py-2.5 text-right font-mono text-xs text-foreground">{mov.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Two-column: Top 5 Clients + Additional Indicators ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Top 5 Clients */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="rounded-xl border border-border bg-card p-5 lg:col-span-2 dark:border-[#2a2a2a] dark:bg-[#141414]"
        >
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Top 5 Clientes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-[#2a2a2a]">
                  <th className="pb-3 pr-4 text-left text-xs font-medium text-muted-foreground dark:text-[#888888]">Cliente</th>
                  <th className="pb-3 pr-4 text-right text-xs font-medium text-muted-foreground dark:text-[#888888]">Órdenes</th>
                  <th className="pb-3 pr-4 text-right text-xs font-medium text-muted-foreground dark:text-[#888888]">Cantidad</th>
                  <th className="pb-3 pr-4 text-right text-xs font-medium text-muted-foreground dark:text-[#888888]">Total USD</th>
                  <th className="pb-3 text-right text-xs font-medium text-muted-foreground dark:text-[#888888]">% Ventas</th>
                </tr>
              </thead>
              <tbody>
                {topClients.map((client, i) => (
                  <tr
                    key={client.name}
                    className="border-b border-border/50 last:border-0 dark:border-[#2a2a2a]/50"
                  >
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/10 text-[10px] font-bold text-brand-500">
                          {i + 1}
                        </span>
                        <span className="text-xs font-medium text-foreground">{client.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-xs text-foreground">{client.orders}</td>
                    <td className="py-2.5 pr-4 text-right font-mono text-xs text-foreground">{formatNumber(client.totalQty)}</td>
                    <td className="py-2.5 pr-4 text-right font-mono text-xs font-medium text-foreground">{formatCurrency(client.totalUSD)}</td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-brand-500"
                            style={{ width: `${client.percent}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-muted-foreground dark:text-[#888888]">{client.percent}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Additional Indicators */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          <h3 className="text-sm font-semibold text-foreground">Indicadores Adicionales</h3>
          {[
            {
              label: 'Días sin movimiento',
              value: `${daysWithoutMovement} días`,
              icon: Clock,
              color: daysWithoutMovement > 10 ? 'text-amber-500' : 'text-emerald-500',
              bg: daysWithoutMovement > 10 ? 'bg-amber-500/10' : 'bg-emerald-500/10',
            },
            {
              label: 'Frecuencia de compra',
              value: `Cada ${purchaseFrequency} días`,
              icon: BarChart3,
              color: 'text-sky-500',
              bg: 'bg-sky-500/10',
            },
            {
              label: 'Lead time promedio',
              value: leadTime,
              icon: Clock,
              color: 'text-violet-500',
              bg: 'bg-violet-500/10',
            },
          ].map((indicator) => {
            const Icon = indicator.icon;
            return (
              <motion.div
                key={indicator.label}
                variants={itemVariants}
                className="rounded-xl border border-border bg-card p-4 dark:border-[#2a2a2a] dark:bg-[#141414]"
              >
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', indicator.bg)}>
                    <Icon className={cn('h-4.5 w-4.5', indicator.color)} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground dark:text-[#888888]">{indicator.label}</p>
                    <p className="text-sm font-semibold text-foreground">{indicator.value}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
