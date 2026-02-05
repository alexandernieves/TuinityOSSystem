'use client';

// Imports React y Hooks básicos
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

// Librerías de utilidad
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// API y Auth
import { api } from '@/lib/api';
import { clearSession, loadSession } from '@/lib/auth-storage';

// Iconos
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Bell,
  Search,
  TrendingUp,
  Activity,
  DollarSign,
  UserPlus,
  BarChart3,
  Package,
  Sun,
  Moon,
  ShoppingCart,
  Receipt,
  FileText,
  CreditCard,
  RotateCcw,
  BadgeDollarSign,
  Tags,
  Calculator,
  Percent,
  ChevronRight,
  ArrowLeft,
  LifeBuoy,
  Puzzle,
} from 'lucide-react';

// Componentes UI
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { useAppModal } from '@/components/ui/app-modal-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

// Tremor Charts
import { AreaChart, BarChart, DonutChart, LineChart } from '@tremor/react';

// Config y Componentes Custom
import { subMenus, MenuItem } from '@/config/dashboard-menu';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';

// --- Tipos ---
type MeResponse = {
  userId?: string;
  tenantId?: string;
  email?: string;
  name?: string;
};

type Branch = {
  id: string;
  name: string;
  code: string;
};

type InvoiceLineDraft = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxable: boolean;
};

type IconEl = React.ReactElement<{ className?: string }>;

type CreatedInvoiceLine = {
  id: string;
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  lineTotal: string | number;
};

type CreatedInvoice = {
  id: string;
  invoiceNumber: string;
  issuedAt: string;
  customerName: string;
  customerTaxId?: string | null;
  customerPhone?: string | null;
  subtotal: string | number;
  taxTotal: string | number;
  total: string | number;
  branch?: { id: string; name: string; code: string };
  lines?: CreatedInvoiceLine[];
};

type InvoiceListItem = {
  id: string;
  invoiceNumber: string;
  status: string;
  issuedAt: string;
  customerName: string;
  currency: string;
  subtotal: string | number;
  taxTotal: string | number;
  total: string | number;
  branch?: { id: string; name: string; code: string };
};

type InvoiceListResponse = {
  total: number;
  items: InvoiceListItem[];
};

type Section = 'dashboard' | 'pos' | 'inventory' | 'customers' | 'accounting' | 'settings' | 'sales' | 'support' | 'integrations';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [activeSubCategory, setActiveSubCategory] = useState<MenuItem | null>(null);
  const { setTheme, theme } = useTheme();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [invoiceCustomerName, setInvoiceCustomerName] = useState<string>('Cliente Contado');
  const [invoiceCustomerTaxId, setInvoiceCustomerTaxId] = useState<string>('');
  const [invoiceCustomerPhone, setInvoiceCustomerPhone] = useState<string>('');
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLineDraft[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, taxable: true },
  ]);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<CreatedInvoice | null>(null);

  const [invoiceSearch, setInvoiceSearch] = useState<string>('');
  const [invoiceListBranchId, setInvoiceListBranchId] = useState<string>('');
  const [invoiceListLoading, setInvoiceListLoading] = useState(false);
  const [invoiceList, setInvoiceList] = useState<InvoiceListItem[]>([]);
  const [invoiceListTotal, setInvoiceListTotal] = useState<number>(0);
  const [invoiceListSkip, setInvoiceListSkip] = useState<number>(0);
  const [invoiceDetailLoading, setInvoiceDetailLoading] = useState(false);
  const { openModal, closeModal } = useAppModal();

  // Reset drill-down when changing main sections
  useEffect(() => {
    setActiveSubCategory(null);
  }, [activeSection]);

  useEffect(() => {
    if (activeSection !== 'pos') return;

    const session = loadSession();
    if (!session?.accessToken) return;

    api<Branch[]>('/branches', {
      method: 'GET',
      accessToken: session.accessToken,
    })
      .then((data) => {
        setBranches(data);
        if (!selectedBranchId && data?.[0]?.id) {
          setSelectedBranchId(data[0].id);
        }
      })
      .catch(() => {
        // ignore
      });
  }, [activeSection, selectedBranchId]);

  useEffect(() => {
    if (activeSection !== 'pos') return;
    if (activeSubCategory?.label !== 'Consulta de Facturas') return;

    const session = loadSession();
    if (!session?.accessToken) return;

    setInvoiceListLoading(true);
    api<InvoiceListResponse>(
      `/pos/invoices?take=25&skip=${invoiceListSkip}` +
        (invoiceListBranchId ? `&branchId=${encodeURIComponent(invoiceListBranchId)}` : '') +
        (invoiceSearch.trim() ? `&q=${encodeURIComponent(invoiceSearch.trim())}` : ''),
      {
        method: 'GET',
        accessToken: session.accessToken,
      },
    )
      .then((data) => {
        setInvoiceList(data.items ?? []);
        setInvoiceListTotal(typeof data.total === 'number' ? data.total : 0);
      })
      .catch((e: unknown) => {
        const message = e instanceof Error ? e.message : 'Error cargando facturas';
        toast.error(message);
      })
      .finally(() => setInvoiceListLoading(false));
  }, [activeSection, activeSubCategory?.label, invoiceListSkip, invoiceListBranchId, invoiceSearch]);

  useEffect(() => {
    const session = loadSession();
    if (!session) {
      router.replace('/login');
      return;
    }

    api<MeResponse>('/auth/me', {
      method: 'GET',
      accessToken: session.accessToken,
    })
      .then((data) => setMe(data))
      .catch((e) => {
        console.error('Error al conectar con el backend:', e);
        router.replace('/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    const session = loadSession();
    const toastId = toast.loading('Cerrando sesión...');

    if (session?.refreshToken) {
      try {
        await api('/auth/logout', {
          method: 'POST',
          body: { refreshToken: session.refreshToken },
          tenantSlug: session.tenantSlug
        });
      } catch (e) {
        console.error(e);
      }
    }
    clearSession();
    toast.success('Sesión cerrada correctamente', { id: toastId });
    router.push('/login');
  };

  const links = [
    {
      label: 'Inicio',
      href: '#',
      icon: <LayoutDashboard className="text-foreground h-5 w-5 flex-shrink-0" />,
      id: 'dashboard' as Section,
    },
    {
      label: 'Punto de Venta',
      href: '#',
      icon: <ShoppingCart className="text-foreground h-5 w-5 flex-shrink-0" />,
      id: 'pos' as Section,
    },
    {
      label: 'Inventario',
      href: '#',
      icon: <Package className="text-foreground h-5 w-5 flex-shrink-0" />,
      id: 'inventory' as Section,
    },
    {
      label: 'Clientes',
      href: '#',
      icon: <Users className="text-foreground h-5 w-5 flex-shrink-0" />,
      id: 'customers' as Section,
    },
    {
      label: 'Contabilidad',
      href: '#',
      icon: <BadgeDollarSign className="text-foreground h-5 w-5 flex-shrink-0" />,
      id: 'accounting' as Section,
    },
    {
      label: 'Configuración',
      href: '#',
      icon: <Settings className="text-foreground h-5 w-5 flex-shrink-0" />,
      id: 'settings' as Section,
    },
    {
      label: 'Ventas',
      href: '#',
      icon: <Percent className="text-foreground h-5 w-5 flex-shrink-0" />,
      id: 'sales' as Section,
    },
    {
      label: 'Ayuda / Soporte',
      href: '#',
      icon: <LifeBuoy className="text-foreground h-5 w-5 flex-shrink-0" />,
      id: 'support' as Section,
    },
    {
      label: 'Integraciones',
      href: '#',
      icon: <Puzzle className="text-foreground h-5 w-5 flex-shrink-0" />,
      id: 'integrations' as Section,
    },
  ];

  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    delay,
  }: {
    title: string;
    value: string;
    change: string;
    icon: React.ComponentType<{ className?: string }>;
    delay: string;
  }) => (
    <div className={`animate-element ${delay} group`}>
      <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100 flex flex-col gap-3">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-3xl font-extrabold text-slate-900">{value}</h3>
          </div>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <p className="text-emerald-500 text-sm font-bold">{change}</p>
      </div>
    </div>
  );

  const renderContent = () => {
    if (activeSection === 'dashboard') {
      return (
        <div className="space-y-8 animate-element max-w-[1600px] w-full mx-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Ingresos"
              value="$45,231"
              change="+20.1% vs mes anterior"
              icon={DollarSign}
              delay="animate-delay-100"
            />
            <StatCard
              title="Usuarios Activos"
              value="2,345"
              change="+10.5% vs mes anterior"
              icon={Users}
              delay="animate-delay-200"
            />
            <StatCard
              title="Nuevos Registros"
              value="892"
              change="+15.3% vs mes anterior"
              icon={UserPlus}
              delay="animate-delay-300"
            />
            <StatCard
              title="Tasa de Conversión"
              value="3.2%"
              change="+2.4% vs mes anterior"
              icon={TrendingUp}
              delay="animate-delay-400"
            />
          </div>

          {/* Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Revenue Trend - Area Chart */}
            <div className="animate-element animate-delay-500 lg:col-span-2">
              <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Tendencia de Ingresos</h3>
                <AreaChart
                  className="h-72"
                  data={[
                    { date: 'Ene', Ventas: 2890, Gastos: 2400 },
                    { date: 'Feb', Ventas: 3200, Gastos: 2100 },
                    { date: 'Mar', Ventas: 4100, Gastos: 2800 },
                    { date: 'Abr', Ventas: 3800, Gastos: 2600 },
                    { date: 'May', Ventas: 4500, Gastos: 2900 },
                    { date: 'Jun', Ventas: 5200, Gastos: 3100 },
                  ]}
                  index="date"
                  categories={['Ventas', 'Gastos']}
                  colors={['blue', 'red']}
                  valueFormatter={(value) => `$${value.toLocaleString()}`}
                  showLegend={true}
                  showGridLines={false}
                />
              </div>
            </div>

            {/* Top Products - Bar Chart */}
            <div className="animate-element animate-delay-600">
              <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Productos Más Vendidos</h3>
                <BarChart
                  className="h-72"
                  data={[
                    { producto: 'Laptop HP', ventas: 456 },
                    { producto: 'Mouse Logitech', ventas: 351 },
                    { producto: 'Teclado Mecánico', ventas: 271 },
                    { producto: 'Monitor Dell', ventas: 191 },
                    { producto: 'Webcam HD', ventas: 139 },
                  ]}
                  index="producto"
                  categories={['ventas']}
                  colors={['blue']}
                  valueFormatter={(value) => `${value} unidades`}
                  showLegend={false}
                  layout="vertical"
                />
              </div>
            </div>
          </div>

          {/* Second Row of Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales by Category - Donut Chart */}
            <div className="animate-element animate-delay-700">
              <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Ventas por Categoría</h3>
                <div className="flex items-center justify-center">
                  <DonutChart
                    className="h-64"
                    data={[
                      { name: 'Electrónica', value: 4567 },
                      { name: 'Ropa', value: 3456 },
                      { name: 'Alimentos', value: 2345 },
                      { name: 'Hogar', value: 1234 },
                      { name: 'Otros', value: 987 },
                    ]}
                    category="value"
                    index="name"
                    valueFormatter={(value) => `$${value.toLocaleString()}`}
                    colors={['blue', 'cyan', 'indigo', 'violet', 'purple']}
                    showLabel={true}
                  />
                </div>
              </div>
            </div>

            {/* Customer Growth - Line Chart */}
            <div className="lg:col-span-2 animate-element animate-delay-800">
              <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Crecimiento de Clientes</h3>
                <LineChart
                  className="h-64"
                  data={[
                    { mes: 'Ene', 'Nuevos Clientes': 45, 'Clientes Activos': 120 },
                    { mes: 'Feb', 'Nuevos Clientes': 52, 'Clientes Activos': 145 },
                    { mes: 'Mar', 'Nuevos Clientes': 68, 'Clientes Activos': 178 },
                    { mes: 'Abr', 'Nuevos Clientes': 71, 'Clientes Activos': 201 },
                    { mes: 'May', 'Nuevos Clientes': 89, 'Clientes Activos': 245 },
                    { mes: 'Jun', 'Nuevos Clientes': 103, 'Clientes Activos': 298 },
                  ]}
                  index="mes"
                  categories={['Nuevos Clientes', 'Clientes Activos']}
                  colors={['emerald', 'blue']}
                  valueFormatter={(value) => value.toString()}
                  showLegend={true}
                  showGridLines={true}
                  curveType="natural"
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'pos' && activeSubCategory?.label === 'Consulta de Facturas') {
      const onOpenInvoice = async (invoiceId: string) => {
        const session = loadSession();
        if (!session?.accessToken) {
          toast.error('Sesión inválida, por favor inicia sesión de nuevo');
          router.replace('/login');
          return;
        }

        setInvoiceDetailLoading(true);
        try {
          const detail = await api<CreatedInvoice>(`/pos/invoices/${invoiceId}`, {
            method: 'GET',
            accessToken: session.accessToken,
          });

          const onPrint = () => {
            const html = document.getElementById('invoice-detail-print')?.outerHTML;
            if (!html) return;

            const w = window.open('', '_blank', 'width=900,height=700');
            if (!w) return;

            w.document.open();
            w.document.write(`<!doctype html><html><head><meta charset="utf-8" />
<title>Factura</title>
<style>
  body{font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; padding:24px; color:#0f172a;}
  .muted{color:#64748b;}
  .row{display:flex; justify-content:space-between; gap:12px;}
  table{width:100%; border-collapse:collapse; margin-top:16px;}
  th,td{border-bottom:1px solid #e2e8f0; padding:10px 6px; text-align:left; font-size:12px;}
  th{color:#334155; font-weight:600;}
  .totals{margin-top:16px; width:320px; margin-left:auto;}
  .totals .row{padding:6px 0;}
  .totals .row strong{font-size:14px;}
</style>
</head><body>${html}</body></html>`);
            w.document.close();
            w.focus();
            w.print();
          };

          openModal({
            subtitle: 'Detalle',
            title: detail?.invoiceNumber ?? 'Factura',
            actions: (
              <>
                <button
                  onClick={onPrint}
                  disabled={invoiceDetailLoading}
                  className={cn(
                    'px-3 py-2 rounded-xl text-sm font-medium',
                    invoiceDetailLoading ? 'bg-blue-600/60 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white',
                  )}
                >
                  {invoiceDetailLoading ? 'Cargando...' : 'Imprimir / Guardar PDF'}
                </button>
                <button
                  onClick={closeModal}
                  className="px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-medium"
                >
                  Cerrar
                </button>
              </>
            ),
            children: (
              <div id="invoice-detail-print" className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-500 text-sm font-medium mb-1">Factura</p>
                    <h3 className="text-lg font-bold text-slate-900">{detail.invoiceNumber}</h3>
                    <p className="text-slate-500 text-xs mt-1">
                      Sucursal: {detail.branch?.name} ({detail.branch?.code})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-500 text-xs">Total</p>
                    <p className="text-slate-900 font-bold text-lg">${Number(detail.total ?? 0).toFixed(2)}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-slate-500 text-xs">Cliente</p>
                    <p className="text-slate-900 text-sm font-medium">{detail.customerName}</p>
                    {(detail.customerTaxId || detail.customerPhone) && (
                      <p className="text-slate-500 text-xs mt-1">
                        {[detail.customerTaxId, detail.customerPhone].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </div>
                  <div className="sm:text-right">
                    <p className="text-slate-500 text-xs">Fecha</p>
                    <p className="text-slate-900 text-sm font-medium">
                      {detail.issuedAt ? new Date(detail.issuedAt).toLocaleString() : ''}
                    </p>
                  </div>
                </div>

                <table className="w-full mt-4">
                  <thead>
                    <tr>
                      <th className="text-left text-slate-600 text-xs font-semibold py-2">Descripción</th>
                      <th className="text-left text-slate-600 text-xs font-semibold py-2">Cant.</th>
                      <th className="text-left text-slate-600 text-xs font-semibold py-2">Precio</th>
                      <th className="text-left text-slate-600 text-xs font-semibold py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.lines?.map((l: CreatedInvoiceLine) => (
                      <tr key={l.id}>
                        <td className="text-slate-900 text-xs py-2 border-t border-slate-200">{l.description}</td>
                        <td className="text-slate-900 text-xs py-2 border-t border-slate-200">{Number(l.quantity ?? 0).toFixed(2)}</td>
                        <td className="text-slate-900 text-xs py-2 border-t border-slate-200">${Number(l.unitPrice ?? 0).toFixed(2)}</td>
                        <td className="text-slate-900 text-xs py-2 border-t border-slate-200">${Number(l.lineTotal ?? 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4 w-full max-w-sm ml-auto">
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="text-slate-900">${Number(detail.subtotal ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-slate-500">ITBMS</span>
                    <span className="text-slate-900">${Number(detail.taxTotal ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm py-2 border-t border-slate-200 mt-2">
                    <span className="text-slate-900 font-semibold">Total</span>
                    <span className="text-slate-900 font-bold">${Number(detail.total ?? 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ),
          });
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : 'Error cargando detalle';
          toast.error(message);
        } finally {
          setInvoiceDetailLoading(false);
        }
      };

      const canPrev = invoiceListSkip > 0;
      const canNext = invoiceListSkip + 25 < invoiceListTotal;

      return (
        <div className="space-y-6 animate-element">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-foreground">Consulta de Facturas</h2>
            <p className="text-muted-foreground">Listado y reimpresión de facturas por sucursal</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Sucursal</label>
                <select
                  value={invoiceListBranchId}
                  onChange={(e) => {
                    setInvoiceListSkip(0);
                    setInvoiceListBranchId(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Todas</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Buscar</label>
                <input
                  value={invoiceSearch}
                  onChange={(e) => {
                    setInvoiceListSkip(0);
                    setInvoiceSearch(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Número, cliente, RUC..."
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {invoiceListLoading ? 'Cargando...' : `Total: ${invoiceListTotal}`}
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={!canPrev || invoiceListLoading}
                  onClick={() => setInvoiceListSkip((s) => Math.max(0, s - 25))}
                  className={cn(
                    'px-3 py-2 rounded-xl text-sm font-medium border',
                    !canPrev || invoiceListLoading
                      ? 'bg-secondary/20 text-muted-foreground border-border'
                      : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border-border',
                  )}
                >
                  Anterior
                </button>
                <button
                  disabled={!canNext || invoiceListLoading}
                  onClick={() => setInvoiceListSkip((s) => s + 25)}
                  className={cn(
                    'px-3 py-2 rounded-xl text-sm font-medium border',
                    !canNext || invoiceListLoading
                      ? 'bg-secondary/20 text-muted-foreground border-border'
                      : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border-border',
                  )}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="text-left font-medium py-2 pr-3">Factura</th>
                  <th className="text-left font-medium py-2 pr-3">Fecha</th>
                  <th className="text-left font-medium py-2 pr-3">Cliente</th>
                  <th className="text-left font-medium py-2 pr-3">Sucursal</th>
                  <th className="text-right font-medium py-2 pr-3">Total</th>
                  <th className="text-right font-medium py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {invoiceList.map((inv) => (
                  <tr key={inv.id} className="border-t border-border/60">
                    <td className="py-2 pr-3 font-medium text-foreground">{inv.invoiceNumber}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{inv.issuedAt ? new Date(inv.issuedAt).toLocaleString() : ''}</td>
                    <td className="py-2 pr-3 text-foreground">{inv.customerName}</td>
                    <td className="py-2 pr-3 text-muted-foreground">
                      {inv.branch?.name} {inv.branch?.code ? `(${inv.branch.code})` : ''}
                    </td>
                    <td className="py-2 pr-3 text-right font-semibold text-foreground">${Number(inv.total ?? 0).toFixed(2)}</td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => onOpenInvoice(inv.id)}
                        className="px-3 py-2 rounded-xl text-xs font-medium bg-[#DBEAFE] text-blue-700 border border-blue-200 hover:bg-blue-200/60"
                      >
                        Ver / Imprimir
                      </button>
                    </td>
                  </tr>
                ))}

                {!invoiceListLoading && invoiceList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      No hay facturas para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      );
    }

    // --- Módulos POS Mock (resto) ---
    if (activeSection === 'pos' && activeSubCategory?.label === 'Consulta de Utilidad por Factura') {
      return (
        <div className="space-y-6 animate-element">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-foreground">Consulta de Utilidad por Factura</h2>
            <p className="text-muted-foreground">Margen de ganancia por cada factura emitida</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input placeholder="Desde" type="date" className="px-3 py-2 text-sm bg-background border border-input rounded-xl" />
              <input placeholder="Hasta" type="date" className="px-3 py-2 text-sm bg-background border border-input rounded-xl" />
              <select className="px-3 py-2 text-sm bg-background border border-input rounded-xl">
                <option>Todas las sucursales</option>
                {branches.map((b) => <option key={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium">Factura</th>
                    <th className="text-left py-2 px-3 font-medium">Fecha</th>
                    <th className="text-right py-2 px-3 font-medium">Venta</th>
                    <th className="text-right py-2 px-3 font-medium">Costo</th>
                    <th className="text-right py-2 px-3 font-medium">Utilidad</th>
                    <th className="text-right py-2 px-3 font-medium">%</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <tr key={i} className="border-t border-border/60">
                      <td className="py-2 px-3">FAC-00{i + 101}</td>
                      <td className="py-2 px-3">2025-07-0{i + 1}</td>
                      <td className="py-2 px-3 text-right">${(Math.random() * 500 + 100).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">${(Math.random() * 300 + 50).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-semibold">${(Math.random() * 200 + 20).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">{(Math.random() * 30 + 10).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'pos' && activeSubCategory?.label === 'Consulta de Cobros por Factura') {
      return (
        <div className="space-y-6 animate-element">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-foreground">Consulta de Cobros por Factura</h2>
            <p className="text-muted-foreground">Pagos recibidos por cada factura</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input placeholder="Buscar factura..." className="px-3 py-2 text-sm bg-background border border-input rounded-xl" />
              <select className="px-3 py-2 text-sm bg-background border border-input rounded-xl">
                <option>Todos los métodos</option>
                <option>Efectivo</option>
                <option>Tarjeta</option>
                <option>Transferencia</option>
              </select>
              <select className="px-3 py-2 text-sm bg-background border border-input rounded-xl">
                <option>Todas las sucursales</option>
                {branches.map((b) => <option key={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium">Factura</th>
                    <th className="text-left py-2 px-3 font-medium">Cliente</th>
                    <th className="text-left py-2 px-3 font-medium">Método</th>
                    <th className="text-right py-2 px-3 font-medium">Monto</th>
                    <th className="text-left py-2 px-3 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-t border-border/60">
                      <td className="py-2 px-3">FAC-00{i + 201}</td>
                      <td className="py-2 px-3">Cliente {i + 1}</td>
                      <td className="py-2 px-3">{['Efectivo', 'Tarjeta', 'Transferencia'][i % 3]}</td>
                      <td className="py-2 px-3 text-right">${(Math.random() * 800 + 100).toFixed(2)}</td>
                      <td className="py-2 px-3">2025-07-0{i + 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'pos' && activeSubCategory?.label === 'Consulta de Cobros por Tarjetas') {
      return (
        <div className="space-y-6 animate-element">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-foreground">Consulta de Cobros por Tarjetas</h2>
            <p className="text-muted-foreground">Conciliación de pagos con tarjetas de crédito/débito</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input placeholder="Desde" type="date" className="px-3 py-2 text-sm bg-background border border-input rounded-xl" />
              <input placeholder="Hasta" type="date" className="px-3 py-2 text-sm bg-background border border-input rounded-xl" />
              <select className="px-3 py-2 text-sm bg-background border border-input rounded-xl">
                <option>Visa</option>
                <option>Mastercard</option>
                <option>American Express</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium">Autorización</th>
                    <th className="text-left py-2 px-3 font-medium">Tarjeta</th>
                    <th className="text-left py-2 px-3 font-medium">Banco</th>
                    <th className="text-right py-2 px-3 font-medium">Monto</th>
                    <th className="text-left py-2 px-3 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-border/60">
                      <td className="py-2 px-3 font-mono text-xs">A{i + 1000}B{i + 2000}</td>
                      <td className="py-2 px-3">**** **** **** {Math.floor(Math.random() * 9000) + 1000}</td>
                      <td className="py-2 px-3">{['Banco A', 'Banco B', 'Banco C'][i % 3]}</td>
                      <td className="py-2 px-3 text-right">${(Math.random() * 1200 + 100).toFixed(2)}</td>
                      <td className="py-2 px-3">2025-07-0{i + 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'pos' && activeSubCategory?.label === 'Consulta de Devoluciones') {
      return (
        <div className="space-y-6 animate-element">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-foreground">Consulta de Devoluciones</h2>
            <p className="text-muted-foreground">Notas de crédito y productos devueltos</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input placeholder="Buscar cliente o factura..." className="px-3 py-2 text-sm bg-background border border-input rounded-xl" />
              <select className="px-3 py-2 text-sm bg-background border border-input rounded-xl">
                <option>Todas las sucursales</option>
                {branches.map((b) => <option key={b.id}>{b.name}</option>)}
              </select>
              <input placeholder="Desde" type="date" className="px-3 py-2 text-sm bg-background border border-input rounded-xl" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium">NC</th>
                    <th className="text-left py-2 px-3 font-medium">Factura</th>
                    <th className="text-left py-2 px-3 font-medium">Cliente</th>
                    <th className="text-right py-2 px-3 font-medium">Monto</th>
                    <th className="text-left py-2 px-3 font-medium">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-t border-border/60">
                      <td className="py-2 px-3">NC-00{i + 301}</td>
                      <td className="py-2 px-3">FAC-00{i + 101}</td>
                      <td className="py-2 px-3">Cliente {i + 1}</td>
                      <td className="py-2 px-3 text-right">${(Math.random() * 600 + 50).toFixed(2)}</td>
                      <td className="py-2 px-3">{['Defectuoso', 'Devolución', 'Cambio', 'Error'][i]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'pos' && activeSubCategory?.label === 'Gestión de Ventas') {
      return (
        <div className="space-y-6 animate-element">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-foreground">Gestión de Ventas</h2>
            <p className="text-muted-foreground">Configuraciones avanzadas del proceso comercial</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Configuración General</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Permitir descuentos en factura</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Requerir cliente obligatorio</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Bloquear ventas con saldo negativo</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Imprimir factura automática</span>
                </label>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Límites y Controles</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Monto máximo de descuento (%)</label>
                  <input type="number" defaultValue={15} className="w-full mt-1 px-3 py-2 text-sm bg-background border border-input rounded-xl" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Límite de crédito por cliente</label>
                  <input type="number" defaultValue={5000} className="w-full mt-1 px-3 py-2 text-sm bg-background border border-input rounded-xl" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Tope de artículos por factura</label>
                  <input type="number" defaultValue={100} className="w-full mt-1 px-3 py-2 text-sm bg-background border border-input rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'pos' && activeSubCategory?.label === 'Consulta de Cierre de Caja') {
      return (
        <div className="space-y-6 animate-element">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-foreground">Consulta de Cierre de Caja</h2>
            <p className="text-muted-foreground">Arqueo y cierre diario de operaciones</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Ventas del día</h3>
              <p className="text-2xl font-bold text-foreground">$12,543.00</p>
              <p className="text-xs text-green-600">+8.2% vs ayer</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Efectivo</h3>
              <p className="text-2xl font-bold text-foreground">$8,210.00</p>
              <p className="text-xs text-muted-foreground">65% del total</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Tarjetas</h3>
              <p className="text-2xl font-bold text-foreground">$4,333.00</p>
              <p className="text-xs text-muted-foreground">35% del total</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium">Cajero</th>
                    <th className="text-left py-2 px-3 font-medium">Sucursal</th>
                    <th className="text-right py-2 px-3 font-medium">Ventas</th>
                    <th className="text-right py-2 px-3 font-medium">Efectivo</th>
                    <th className="text-right py-2 px-3 font-medium">Tarjeta</th>
                    <th className="text-left py-2 px-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-t border-border/60">
                      <td className="py-2 px-3">Cajero {i + 1}</td>
                      <td className="py-2 px-3">{branches[i]?.name || 'Sucursal'}</td>
                      <td className="py-2 px-3 text-right">${(Math.random() * 5000 + 1000).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">${(Math.random() * 3000 + 500).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">${(Math.random() * 2000 + 200).toFixed(2)}</td>
                      <td className="py-2 px-3"><span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Cerrado</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'pos' && activeSubCategory?.label === 'Análisis de Ventas') {
      return (
        <div className="space-y-6 animate-element">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-foreground">Análisis de Ventas</h2>
            <p className="text-muted-foreground">Insights y métricas comerciales</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Ventas mes</h3>
              <p className="text-2xl font-bold text-foreground">$284,390</p>
              <p className="text-xs text-green-600">+12.5% vs mes anterior</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Ticket promedio</h3>
              <p className="text-2xl font-bold text-foreground">$87.30</p>
              <p className="text-xs text-red-600">-2.1% vs mes anterior</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Unidades vendidas</h3>
              <p className="text-2xl font-bold text-foreground">3,258</p>
              <p className="text-xs text-green-600">+5.8% vs mes anterior</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Top 5 productos más vendidos</h3>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Producto {i + 1}</p>
                      <p className="text-xs text-muted-foreground">SKU-{1000 + i}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{Math.floor(Math.random() * 500 + 100)} unid.</p>
                    <p className="text-xs text-muted-foreground">${(Math.random() * 20000 + 2000).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'pos' && activeSubCategory?.label === 'Consulta de Cobros por Caja') {
      return (
        <div className="space-y-6 animate-element">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-foreground">Consulta de Cobros por Caja</h2>
            <p className="text-muted-foreground">Resumen de ingresos por estación de caja</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select className="px-3 py-2 text-sm bg-background border border-input rounded-xl">
                <option>Todas las cajas</option>
                <option>Caja 01</option>
                <option>Caja 02</option>
                <option>Caja 03</option>
              </select>
              <input placeholder="Desde" type="date" className="px-3 py-2 text-sm bg-background border border-input rounded-xl" />
              <input placeholder="Hasta" type="date" className="px-3 py-2 text-sm bg-background border border-input rounded-xl" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium">Caja</th>
                    <th className="text-left py-2 px-3 font-medium">Fecha</th>
                    <th className="text-right py-2 px-3 font-medium">Efectivo</th>
                    <th className="text-right py-2 px-3 font-medium">Tarjeta</th>
                    <th className="text-right py-2 px-3 font-medium">Transferencia</th>
                    <th className="text-right py-2 px-3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-t border-border/60">
                      <td className="py-2 px-3">Caja 0{i % 3 + 1}</td>
                      <td className="py-2 px-3">2025-07-0{i + 1}</td>
                      <td className="py-2 px-3 text-right">${(Math.random() * 3000 + 500).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">${(Math.random() * 2000 + 200).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">${(Math.random() * 1500 + 100).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-semibold">${(Math.random() * 6000 + 1000).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'pos' && activeSubCategory?.label === 'Consulta de Artículos Vendidos') {
      return (
        <div className="space-y-6 animate-element">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-foreground">Consulta de Artículos Vendidos</h2>
            <p className="text-muted-foreground">Productos con mayor rotación comercial</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input placeholder="Buscar producto..." className="px-3 py-2 text-sm bg-background border border-input rounded-xl" />
              <select className="px-3 py-2 text-sm bg-background border border-input rounded-xl">
                <option>Todas las categorías</option>
                <option>Electrónica</option>
                <option>Ropa</option>
                <option>Alimentos</option>
              </select>
              <select className="px-3 py-2 text-sm bg-background border border-input rounded-xl">
                <option>Últimos 30 días</option>
                <option>Últimos 7 días</option>
                <option>Último año</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium">SKU</th>
                    <th className="text-left py-2 px-3 font-medium">Producto</th>
                    <th className="text-left py-2 px-3 font-medium">Categoría</th>
                    <th className="text-right py-2 px-3 font-medium">Unidades</th>
                    <th className="text-right py-2 px-3 font-medium">Ingresos</th>
                    <th className="text-right py-2 px-3 font-medium">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-t border-border/60">
                      <td className="py-2 px-3 font-mono text-xs">SKU-{1000 + i}</td>
                      <td className="py-2 px-3">Producto {i + 1}</td>
                      <td className="py-2 px-3">{['Electrónica', 'Ropa', 'Alimentos'][i % 3]}</td>
                      <td className="py-2 px-3 text-right">{Math.floor(Math.random() * 300 + 20)}</td>
                      <td className="py-2 px-3 text-right">${(Math.random() * 15000 + 1000).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">{Math.floor(Math.random() * 100 + 5)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'pos' && activeSubCategory?.label === 'Reportes de Punto de Venta') {
      return (
        <div className="space-y-6 animate-element">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-foreground">Reportes de Punto de Venta</h2>
            <p className="text-muted-foreground">Generación de informes para toma de decisiones</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Ventas diarias', desc: 'Resumen de ventas por día', icon: BarChart3 },
              { title: 'Productos más vendidos', desc: 'Top productos del período', icon: TrendingUp },
              { title: 'Cierres de caja', desc: 'Reporte de cierres diarios', icon: DollarSign },
              { title: 'Comisiones por vendedor', desc: 'Desempeño del equipo', icon: Users },
              { title: 'Devoluciones', desc: 'Reporte de devoluciones', icon: RotateCcw },
              { title: 'Facturación mensual', desc: 'Resumen mensual', icon: FileText },
            ].map((r, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <r.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">{r.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{r.desc}</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                  Generar
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeSection === 'pos' && activeSubCategory?.label === 'Detalle de Artículos Vendidos') {
      return (
        <div className="space-y-6 animate-element">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-foreground">Detalle de Artículos Vendidos</h2>
            <p className="text-muted-foreground">Exploración técnica de productos y categorías</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input placeholder="SKU o nombre..." className="px-3 py-2 text-sm bg-background border border-input rounded-xl" />
              <select className="px-3 py-2 text-sm bg-background border border-input rounded-xl">
                <option>Todas las categorías</option>
                <option>Electrónica</option>
                <option>Ropa</option>
                <option>Alimentos</option>
              </select>
              <input placeholder="Desde" type="date" className="px-3 py-2 text-sm bg-background border border-input rounded-xl" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium">SKU</th>
                    <th className="text-left py-2 px-3 font-medium">Nombre</th>
                    <th className="text-left py-2 px-3 font-medium">Categoría</th>
                    <th className="text-right py-2 px-3 font-medium">Cantidad</th>
                    <th className="text-right py-2 px-3 font-medium">Precio</th>
                    <th className="text-right py-2 px-3 font-medium">Total</th>
                    <th className="text-left py-2 px-3 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <tr key={i} className="border-t border-border/60">
                      <td className="py-2 px-3 font-mono text-xs">SKU-{2000 + i}</td>
                      <td className="py-2 px-3">Detalle Producto {i + 1}</td>
                      <td className="py-2 px-3">{['Electrónica', 'Ropa', 'Alimentos'][i % 3]}</td>
                      <td className="py-2 px-3 text-right">{Math.floor(Math.random() * 10 + 1)}</td>
                      <td className="py-2 px-3 text-right">${(Math.random() * 200 + 10).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-semibold">${(Math.random() * 1500 + 50).toFixed(2)}</td>
                      <td className="py-2 px-3">2025-07-0{i + 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // Renderizado genérico para las secciones de Dynamo POS
    const currentMenu = subMenus[activeSection as keyof typeof subMenus];

    if (activeSection === 'pos' && activeSubCategory?.label === 'Crear Factura') {
      const taxRate = 0.07;

      const computed = invoiceLines.reduce(
        (acc, line) => {
          const quantity = Number.isFinite(line.quantity) ? line.quantity : 0;
          const unitPrice = Number.isFinite(line.unitPrice) ? line.unitPrice : 0;
          const lineSubtotal = quantity * unitPrice;
          const lineTax = line.taxable ? lineSubtotal * taxRate : 0;
          acc.subtotal += lineSubtotal;
          acc.tax += lineTax;
          return acc;
        },
        { subtotal: 0, tax: 0 }
      );

      const total = computed.subtotal + computed.tax;

      const onSave = async () => {
        const session = loadSession();
        if (!session?.accessToken) {
          toast.error('Sesión inválida, por favor inicia sesión de nuevo');
          router.replace('/login');
          return;
        }

        if (!selectedBranchId) {
          toast.error('Selecciona una sucursal');
          return;
        }

        const cleanedLines = invoiceLines
          .map((l) => ({
            description: l.description.trim(),
            quantity: Number(l.quantity),
            unitPrice: Number(l.unitPrice),
            taxable: l.taxable,
          }))
          .filter((l) => l.description && Number.isFinite(l.quantity) && l.quantity > 0);

        if (cleanedLines.length === 0) {
          toast.error('Agrega al menos una línea válida');
          return;
        }

        setSavingInvoice(true);
        try {
          const created = await api<CreatedInvoice>('/pos/invoices', {
            method: 'POST',
            accessToken: session.accessToken,
            body: {
              branchId: selectedBranchId,
              customerName: invoiceCustomerName.trim() || 'Cliente',
              customerTaxId: invoiceCustomerTaxId.trim() || undefined,
              customerPhone: invoiceCustomerPhone.trim() || undefined,
              currency: 'USD',
              lines: cleanedLines.map((l) => ({
                description: l.description,
                quantity: l.quantity,
                unitPrice: l.unitPrice,
                taxable: l.taxable,
                taxRate,
              })),
            },
          });

          setCreatedInvoice(created);
          toast.success(`Factura creada: ${created?.invoiceNumber ?? ''}`);
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : 'Error creando factura';
          toast.error(message);
        } finally {
          setSavingInvoice(false);
        }
      };

      const onPrint = () => {
        if (!createdInvoice) return;

        const html = document.getElementById('invoice-print')?.outerHTML;
        if (!html) return;

        const w = window.open('', '_blank', 'width=900,height=700');
        if (!w) return;

        w.document.open();
        w.document.write(`<!doctype html><html><head><meta charset="utf-8" />
<title>Factura</title>
<style>
  body{font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; padding:24px; color:#0f172a;}
  .muted{color:#64748b;}
  .row{display:flex; justify-content:space-between; gap:12px;}
  table{width:100%; border-collapse:collapse; margin-top:16px;}
  th,td{border-bottom:1px solid #e2e8f0; padding:10px 6px; text-align:left; font-size:12px;}
  th{color:#334155; font-weight:600;}
  .totals{margin-top:16px; width:320px; margin-left:auto;}
  .totals .row{padding:6px 0;}
  .totals .row strong{font-size:14px;}
</style>
</head><body>${html}</body></html>`);
        w.document.close();
        w.focus();
        w.print();
      };

      return (
        <div className="space-y-6 animate-element">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-foreground">Crear Factura</h2>
            <p className="text-muted-foreground">Facturación por sucursal (ITBMS 7% por defecto)</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Sucursal</label>
                    <select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="">Selecciona una sucursal</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Cliente</label>
                    <input
                      value={invoiceCustomerName}
                      onChange={(e) => setInvoiceCustomerName(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Nombre del cliente"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">RUC/Cédula (opcional)</label>
                    <input
                      value={invoiceCustomerTaxId}
                      onChange={(e) => setInvoiceCustomerTaxId(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Documento"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Teléfono (opcional)</label>
                    <input
                      value={invoiceCustomerPhone}
                      onChange={(e) => setInvoiceCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Teléfono"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Líneas</h3>
                  <button
                    onClick={() =>
                      setInvoiceLines((prev) => [
                        ...prev,
                        { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, taxable: true },
                      ])
                    }
                    className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
                  >
                    Agregar Línea
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-muted-foreground">
                        <th className="text-left font-medium py-2 pr-2">Descripción</th>
                        <th className="text-left font-medium py-2 pr-2 w-28">Cantidad</th>
                        <th className="text-left font-medium py-2 pr-2 w-36">Precio</th>
                        <th className="text-left font-medium py-2 pr-2 w-24">ITBMS</th>
                        <th className="text-left font-medium py-2 w-16"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceLines.map((line) => (
                        <tr key={line.id} className="border-t border-border/60">
                          <td className="py-2 pr-2">
                            <input
                              value={line.description}
                              onChange={(e) =>
                                setInvoiceLines((prev) =>
                                  prev.map((p) => (p.id === line.id ? { ...p, description: e.target.value } : p)),
                                )
                              }
                              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              placeholder="Producto / Servicio"
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <input
                              type="number"
                              value={line.quantity}
                              onChange={(e) =>
                                setInvoiceLines((prev) =>
                                  prev.map((p) =>
                                    p.id === line.id ? { ...p, quantity: Number(e.target.value) } : p,
                                  ),
                                )
                              }
                              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              min={0}
                              step={1}
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <input
                              type="number"
                              value={line.unitPrice}
                              onChange={(e) =>
                                setInvoiceLines((prev) =>
                                  prev.map((p) =>
                                    p.id === line.id ? { ...p, unitPrice: Number(e.target.value) } : p,
                                  ),
                                )
                              }
                              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              min={0}
                              step={0.01}
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <button
                              onClick={() =>
                                setInvoiceLines((prev) =>
                                  prev.map((p) => (p.id === line.id ? { ...p, taxable: !p.taxable } : p)),
                                )
                              }
                              className={cn(
                                'px-3 py-2 rounded-xl text-xs font-medium border',
                                line.taxable
                                  ? 'bg-[#DBEAFE] text-blue-700 border-blue-200'
                                  : 'bg-secondary/40 text-muted-foreground border-border',
                              )}
                            >
                              {line.taxable ? 'Sí' : 'No'}
                            </button>
                          </td>
                          <td className="py-2 text-right">
                            <button
                              onClick={() => setInvoiceLines((prev) => prev.filter((p) => p.id !== line.id))}
                              className="px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              Quitar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground font-medium">${computed.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">ITBMS (7%)</span>
                  <span className="text-foreground font-medium">${computed.tax.toFixed(2)}</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-semibold">Total</span>
                  <span className="text-foreground font-bold text-xl">${total.toFixed(2)}</span>
                </div>

                <button
                  onClick={onSave}
                  disabled={savingInvoice}
                  className={cn(
                    'w-full mt-3 px-4 py-3 rounded-xl text-white font-medium transition-colors',
                    savingInvoice ? 'bg-blue-600/60' : 'bg-blue-600 hover:bg-blue-700',
                  )}
                >
                  {savingInvoice ? 'Guardando...' : 'Guardar Factura'}
                </button>

                {createdInvoice && (
                  <button
                    onClick={onPrint}
                    className="w-full mt-2 px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium"
                  >
                    Imprimir / Guardar PDF
                  </button>
                )}
              </div>

              {createdInvoice && (
                <div id="invoice-print" className="bg-white border border-slate-200 rounded-2xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-slate-900 font-bold text-lg">Factura</div>
                      <div className="text-slate-500 text-sm">{createdInvoice.invoiceNumber}</div>
                      <div className="text-slate-500 text-xs mt-1">
                        Sucursal: {createdInvoice.branch?.name} ({createdInvoice.branch?.code})
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-500 text-xs">Total</div>
                      <div className="text-slate-900 font-bold text-xl">${Number(createdInvoice.total ?? 0).toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="text-slate-500 text-xs">Cliente</div>
                      <div className="text-slate-900 text-sm font-medium">{createdInvoice.customerName}</div>
                      {(createdInvoice.customerTaxId || createdInvoice.customerPhone) && (
                        <div className="text-slate-500 text-xs mt-1">
                          {[createdInvoice.customerTaxId, createdInvoice.customerPhone].filter(Boolean).join(' • ')}
                        </div>
                      )}
                    </div>
                    <div className="sm:text-right">
                      <div className="text-slate-500 text-xs">Fecha</div>
                      <div className="text-slate-900 text-sm font-medium">
                        {createdInvoice.issuedAt ? new Date(createdInvoice.issuedAt).toLocaleString() : ''}
                      </div>
                    </div>
                  </div>

                  <table className="w-full mt-4">
                    <thead>
                      <tr>
                        <th className="text-left text-slate-600 text-xs font-semibold py-2">Descripción</th>
                        <th className="text-left text-slate-600 text-xs font-semibold py-2">Cant.</th>
                        <th className="text-left text-slate-600 text-xs font-semibold py-2">Precio</th>
                        <th className="text-left text-slate-600 text-xs font-semibold py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {createdInvoice.lines?.map((l: CreatedInvoiceLine) => (
                        <tr key={l.id}>
                          <td className="text-slate-900 text-xs py-2 border-t border-slate-200">{l.description}</td>
                          <td className="text-slate-900 text-xs py-2 border-t border-slate-200">{Number(l.quantity ?? 0).toFixed(2)}</td>
                          <td className="text-slate-900 text-xs py-2 border-t border-slate-200">${Number(l.unitPrice ?? 0).toFixed(2)}</td>
                          <td className="text-slate-900 text-xs py-2 border-t border-slate-200">${Number(l.lineTotal ?? 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-4 w-full max-w-sm ml-auto">
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="text-slate-900">${Number(createdInvoice.subtotal ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-slate-500">ITBMS</span>
                      <span className="text-slate-900">${Number(createdInvoice.taxTotal ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-t border-slate-200 mt-2">
                      <span className="text-slate-900 font-semibold">Total</span>
                      <span className="text-slate-900 font-bold">${Number(createdInvoice.total ?? 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // --- Módulos POS Mock (resto) ---
    if (activeSection === 'pos' && activeSubCategory?.label === 'Consulta de Utilidad por Factura') {
      return (
        <div className="space-y-6 animate-element">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-foreground">Consulta de Utilidad por Factura</h2>
            <p className="text-muted-foreground">Margen de ganancia por cada factura emitida</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input placeholder="Desde" type="date" className="px-3 py-2 text-sm bg-background border border-input rounded-xl" />
              <input placeholder="Hasta" type="date" className="px-3 py-2 text-sm bg-background border border-input rounded-xl" />
              <select className="px-3 py-2 text-sm bg-background border border-input rounded-xl">
                <option>Todas las sucursales</option>
                {branches.map((b) => <option key={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium">Factura</th>
                    <th className="text-left py-2 px-3 font-medium">Fecha</th>
                    <th className="text-right py-2 px-3 font-medium">Venta</th>
                    <th className="text-right py-2 px-3 font-medium">Costo</th>
                    <th className="text-right py-2 px-3 font-medium">Utilidad</th>
                    <th className="text-right py-2 px-3 font-medium">%</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <tr key={i} className="border-t border-border/60">
                      <td className="py-2 px-3">FAC-00{i + 101}</td>
                      <td className="py-2 px-3">2025-07-0{i + 1}</td>
                      <td className="py-2 px-3 text-right">${(Math.random() * 500 + 100).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">${(Math.random() * 300 + 50).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-semibold">${(Math.random() * 200 + 20).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">{(Math.random() * 30 + 10).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'pos' && activeSubCategory?.label === 'Consulta de Cobros por Factura') {
      return (
        <div className="space-y-6 animate-element">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-foreground">Consulta de Cobros por Factura</h2>
            <p className="text-muted-foreground">Pagos recibidos por cada factura</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input placeholder="Buscar factura..." className="px-3 py-2 text-sm bg-background border border-input rounded-xl" />
              <select className="px-3 py-2 text-sm bg-background border border-input rounded-xl">
                <option>Todos los métodos</option>
                <option>Efectivo</option>
                <option>Tarjeta</option>
                <option>Transferencia</option>
              </select>
              <select className="px-3 py-2 text-sm bg-background border border-input rounded-xl">
                <option>Todas las sucursales</option>
                {branches.map((b) => <option key={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium">Factura</th>
                    <th className="text-left py-2 px-3 font-medium">Cliente</th>
                    <th className="text-left py-2 px-3 font-medium">Método</th>
                    <th className="text-right py-2 px-3 font-medium">Monto</th>
                    <th className="text-left py-2 px-3 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-t border-border/60">
                      <td className="py-2 px-3">FAC-00{i + 201}</td>
                      <td className="py-2 px-3">Cliente {i + 1}</td>
                      <td className="py-2 px-3">{['Efectivo', 'Tarjeta', 'Transferencia'][i % 3]}</td>
                      <td className="py-2 px-3 text-right">${(Math.random() * 800 + 100).toFixed(2)}</td>
                      <td className="py-2 px-3">2025-07-0{i + 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'pos' && activeSubCategory?.label === 'Consulta de Cobros por Tarjetas') {
      return (
        <div className="space-y-6 animate-element">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-foreground">Consulta de Cobros por Tarjetas</h2>
            <p className="text-muted-foreground">Conciliación de pagos con tarjetas de crédito/débito</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input placeholder="Desde" type="date" className="px-3 py-2 text-sm bg-background border border-input rounded-xl" />
              <input placeholder="Hasta" type="date" className="px-3 py-2 text-sm bg-background border border-input rounded-xl" />
              <select className="px-3 py-2 text-sm bg-background border border-input rounded-xl">
                <option>Visa</option>
                <option>Mastercard</option>
                <option>American Express</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium">Autorización</th>
                    <th className="text-left py-2 px-3 font-medium">Tarjeta</th>
                    <th className="text-left py-2 px-3 font-medium">Banco</th>
                    <th className="text-right py-2 px-3 font-medium">Monto</th>
                    <th className="text-left py-2 px-3 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-border/60">
                      <td className="py-2 px-3 font-mono text-xs">A{i + 1000}B{i + 2000}</td>
                      <td className="py-2 px-3">**** **** **** {Math.floor(Math.random() * 9000) + 1000}</td>
                      <td className="py-2 px-3">{['Banco A', 'Banco B', 'Banco C'][i % 3]}</td>
                      <td className="py-2 px-3 text-right">${(Math.random() * 1200 + 100).toFixed(2)}</td>
                      <td className="py-2 px-3">2025-07-0{i + 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'pos' && activeSubCategory?.label === 'Consulta de Devoluciones') {
      return (
        <div className="space-y-6 animate-element">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-foreground">Consulta de Devoluciones</h2>
            <p className="text-muted-foreground">Notas de crédito y productos devueltos</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input placeholder="Buscar cliente o factura..." className="px-3 py-2 text-sm bg-background border border-input rounded-xl" />
              <select className="px-3 py-2 text-sm bg-background border border-input rounded-xl">
                <option>Todas las sucursales</option>
                {branches.map((b) => <option key={b.id}>{b.name}</option>)}
              </select>
              <input placeholder="Desde" type="date" className="px-3 py-2 text-sm bg-background border border-input rounded-xl" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium">NC</th>
                    <th className="text-left py-2 px-3 font-medium">Factura</th>
                    <th className="text-left py-2 px-3 font-medium">Cliente</th>
                    <th className="text-right py-2 px-3 font-medium">Monto</th>
                    <th className="text-left py-2 px-3 font-medium">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-t border-border/60">
                      <td className="py-2 px-3">NC-00{i + 301}</td>
                      <td className="py-2 px-3">FAC-00{i + 101}</td>
                      <td className="py-2 px-3">Cliente {i + 1}</td>
                      <td className="py-2 px-3 text-right">${(Math.random() * 600 + 50).toFixed(2)}</td>
                      <td className="py-2 px-3">{['Defectuoso', 'Devolución', 'Cambio', 'Error'][i]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'pos' && activeSubCategory?.label === 'Gestión de Ventas') {
      return (
        <div className="space-y-6 animate-element">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-foreground">Gestión de Ventas</h2>
            <p className="text-muted-foreground">Configuraciones avanzadas del proceso comercial</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Configuración General</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Permitir descuentos en factura</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Requerir cliente obligatorio</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Bloquear ventas con saldo negativo</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Imprimir factura automática</span>
                </label>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Límites y Controles</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Monto máximo de descuento (%)</label>
                  <input type="number" defaultValue={15} className="w-full mt-1 px-3 py-2 text-sm bg-background border border-input rounded-xl" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Límite de crédito por cliente</label>
                  <input type="number" defaultValue={5000} className="w-full mt-1 px-3 py-2 text-sm bg-background border border-input rounded-xl" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Tope de artículos por factura</label>
                  <input type="number" defaultValue={100} className="w-full mt-1 px-3 py-2 text-sm bg-background border border-input rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'pos' && activeSubCategory?.label === 'Consulta de Cierre de Caja') {
      return (
        <div className="space-y-6 animate-element">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-foreground">Consulta de Cierre de Caja</h2>
            <p className="text-muted-foreground">Arqueo y cierre diario de operaciones</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Ventas del día</h3>
              <p className="text-2xl font-bold text-foreground">$12,543.00</p>
              <p className="text-xs text-green-600">+8.2% vs ayer</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Efectivo</h3>
              <p className="text-2xl font-bold text-foreground">$8,210.00</p>
              <p className="text-xs text-muted-foreground">65% del total</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Tarjetas</h3>
              <p className="text-2xl font-bold text-foreground">$4,333.00</p>
              <p className="text-xs text-muted-foreground">35% del total</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium">Cajero</th>
                    <th className="text-left py-2 px-3 font-medium">Sucursal</th>
                    <th className="text-right py-2 px-3 font-medium">Ventas</th>
                    <th className="text-right py-2 px-3 font-medium">Efectivo</th>
                    <th className="text-right py-2 px-3 font-medium">Tarjeta</th>
                    <th className="text-left py-2 px-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-t border-border/60">
                      <td className="py-2 px-3">Cajero {i + 1}</td>
                      <td className="py-2 px-3">{branches[i]?.name || 'Sucursal'}</td>
                      <td className="py-2 px-3 text-right">${(Math.random() * 5000 + 1000).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">${(Math.random() * 3000 + 500).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">${(Math.random() * 2000 + 200).toFixed(2)}</td>
                      <td className="py-2 px-3"><span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Cerrado</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'pos' && activeSubCategory?.label === 'Análisis de Ventas') {
      return (
        <div className="space-y-6 animate-element">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-foreground">Análisis de Ventas</h2>
            <p className="text-muted-foreground">Insights y métricas comerciales</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Ventas mes</h3>
              <p className="text-2xl font-bold text-foreground">$284,390</p>
              <p className="text-xs text-green-600">+12.5% vs mes anterior</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Ticket promedio</h3>
              <p className="text-2xl font-bold text-foreground">$87.30</p>
              <p className="text-xs text-red-600">-2.1% vs mes anterior</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Unidades vendidas</h3>
              <p className="text-2xl font-bold text-foreground">3,258</p>
              <p className="text-xs text-green-600">+5.8% vs mes anterior</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Top 5 productos más vendidos</h3>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Producto {i + 1}</p>
                      <p className="text-xs text-muted-foreground">SKU-{1000 + i}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{Math.floor(Math.random() * 500 + 100)} unid.</p>
                    <p className="text-xs text-muted-foreground">${(Math.random() * 20000 + 2000).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'pos' && activeSubCategory?.label === 'Consulta de Cobros por Caja') {
      return (
        <div className="space-y-6 animate-element">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-foreground">Consulta de Cobros por Caja</h2>
            <p className="text-muted-foreground">Resumen de ingresos por estación de caja</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select className="px-3 py-2 text-sm bg-background border border-input rounded-xl">
                <option>Todas las cajas</option>
                <option>Caja 01</option>
                <option>Caja 02</option>
                <option>Caja 03</option>
              </select>
              <input placeholder="Desde" type="date" className="px-3 py-2 text-sm bg-background border border-input rounded-xl" />
              <input placeholder="Hasta" type="date" className="px-3 py-2 text-sm bg-background border border-input rounded-xl" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium">Caja</th>
                    <th className="text-left py-2 px-3 font-medium">Fecha</th>
                    <th className="text-right py-2 px-3 font-medium">Efectivo</th>
                    <th className="text-right py-2 px-3 font-medium">Tarjeta</th>
                    <th className="text-right py-2 px-3 font-medium">Transferencia</th>
                    <th className="text-right py-2 px-3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-t border-border/60">
                      <td className="py-2 px-3">Caja 0{i % 3 + 1}</td>
                      <td className="py-2 px-3">2025-07-0{i + 1}</td>
                      <td className="py-2 px-3 text-right">${(Math.random() * 3000 + 500).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">${(Math.random() * 2000 + 200).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">${(Math.random() * 1500 + 100).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-semibold">${(Math.random() * 6000 + 1000).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'pos' && activeSubCategory?.label === 'Consulta de Artículos Vendidos') {
      return (
        <div className="space-y-6 animate-element">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-foreground">Consulta de Artículos Vendidos</h2>
            <p className="text-muted-foreground">Productos con mayor rotación comercial</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input placeholder="Buscar producto..." className="px-3 py-2 text-sm bg-background border border-input rounded-xl" />
              <select className="px-3 py-2 text-sm bg-background border border-input rounded-xl">
                <option>Todas las categorías</option>
                <option>Electrónica</option>
                <option>Ropa</option>
                <option>Alimentos</option>
              </select>
              <select className="px-3 py-2 text-sm bg-background border border-input rounded-xl">
                <option>Últimos 30 días</option>
                <option>Últimos 7 días</option>
                <option>Último año</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium">SKU</th>
                    <th className="text-left py-2 px-3 font-medium">Producto</th>
                    <th className="text-left py-2 px-3 font-medium">Categoría</th>
                    <th className="text-right py-2 px-3 font-medium">Unidades</th>
                    <th className="text-right py-2 px-3 font-medium">Ingresos</th>
                    <th className="text-right py-2 px-3 font-medium">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-t border-border/60">
                      <td className="py-2 px-3 font-mono text-xs">SKU-{1000 + i}</td>
                      <td className="py-2 px-3">Producto {i + 1}</td>
                      <td className="py-2 px-3">{['Electrónica', 'Ropa', 'Alimentos'][i % 3]}</td>
                      <td className="py-2 px-3 text-right">{Math.floor(Math.random() * 300 + 20)}</td>
                      <td className="py-2 px-3 text-right">${(Math.random() * 15000 + 1000).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">{Math.floor(Math.random() * 100 + 5)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'pos' && activeSubCategory?.label === 'Reportes de Punto de Venta') {
      return (
        <div className="space-y-6 animate-element">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-foreground">Reportes de Punto de Venta</h2>
            <p className="text-muted-foreground">Generación de informes para toma de decisiones</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Ventas diarias', desc: 'Resumen de ventas por día', icon: BarChart3 },
              { title: 'Productos más vendidos', desc: 'Top productos del período', icon: TrendingUp },
              { title: 'Cierres de caja', desc: 'Reporte de cierres diarios', icon: DollarSign },
              { title: 'Comisiones por vendedor', desc: 'Desempeño del equipo', icon: Users },
              { title: 'Devoluciones', desc: 'Reporte de devoluciones', icon: RotateCcw },
              { title: 'Facturación mensual', desc: 'Resumen mensual', icon: FileText },
            ].map((r, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <r.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">{r.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{r.desc}</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                  Generar
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeSection === 'pos' && activeSubCategory?.label === 'Detalle de Artículos Vendidos') {
      return (
        <div className="space-y-6 animate-element">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-foreground">Detalle de Artículos Vendidos</h2>
            <p className="text-muted-foreground">Exploración técnica de productos y categorías</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input placeholder="SKU o nombre..." className="px-3 py-2 text-sm bg-background border border-input rounded-xl" />
              <select className="px-3 py-2 text-sm bg-background border border-input rounded-xl">
                <option>Todas las categorías</option>
                <option>Electrónica</option>
                <option>Ropa</option>
                <option>Alimentos</option>
              </select>
              <input placeholder="Desde" type="date" className="px-3 py-2 text-sm bg-background border border-input rounded-xl" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium">SKU</th>
                    <th className="text-left py-2 px-3 font-medium">Nombre</th>
                    <th className="text-left py-2 px-3 font-medium">Categoría</th>
                    <th className="text-right py-2 px-3 font-medium">Cantidad</th>
                    <th className="text-right py-2 px-3 font-medium">Precio</th>
                    <th className="text-right py-2 px-3 font-medium">Total</th>
                    <th className="text-left py-2 px-3 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <tr key={i} className="border-t border-border/60">
                      <td className="py-2 px-3 font-mono text-xs">SKU-{2000 + i}</td>
                      <td className="py-2 px-3">Detalle Producto {i + 1}</td>
                      <td className="py-2 px-3">{['Electrónica', 'Ropa', 'Alimentos'][i % 3]}</td>
                      <td className="py-2 px-3 text-right">{Math.floor(Math.random() * 10 + 1)}</td>
                      <td className="py-2 px-3 text-right">${(Math.random() * 200 + 10).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-semibold">${(Math.random() * 1500 + 50).toFixed(2)}</td>
                      <td className="py-2 px-3">2025-07-0{i + 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // DRILL-DOWN: Si hay una subcategoría activa, mostramos sus items
    if (activeSubCategory && activeSubCategory.subItems) {
      return (
        <div className="space-y-6 animate-element">
          <button
            onClick={() => setActiveSubCategory(null)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 group"
          >
            <div className="p-1 rounded-lg bg-secondary group-hover:bg-secondary/80">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Volver a {currentMenu.title}
          </button>

          <div className="flex flex-col gap-2 mb-6">
            <h2 className="text-2xl font-bold text-foreground">{activeSubCategory.label}</h2>
            <p className="text-muted-foreground">Seleccione una opción disponible</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeSubCategory.subItems.map((item, idx) => (
              <div
                key={idx}
                className="group flex flex-col items-start p-5 rounded-2xl border border-border/50 bg-card hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 cursor-pointer"
              >
                <div className="p-3 mb-4 rounded-xl bg-secondary group-hover:bg-blue-500 group-hover:text-white transition-colors text-foreground">
                  {React.isValidElement(item.icon) && React.cloneElement(item.icon as IconEl, { className: "w-6 h-6" })}
                </div>
                <h3 className="font-semibold text-foreground text-sm group-hover:text-blue-500 transition-colors">{item.label}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">Acceder a {item.label.toLowerCase()}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeSection === 'settings') {
      return (
        <div className="max-w-4xl mx-auto space-y-8 animate-element p-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Configuración del Sistema</h2>
            <p className="text-muted-foreground">Administre las opciones generales y preferencias de su organización.</p>
          </div>

          <div className="flex flex-col gap-3">
            {subMenus.settings.items.map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  if (item.subItems) setActiveSubCategory(item);
                }}
                className="group flex items-center justify-between p-4 rounded-xl hover:bg-secondary/50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-lg bg-secondary text-foreground group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    {React.isValidElement(item.icon) && React.cloneElement(item.icon as IconEl, { className: "w-5 h-5" })}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground text-base">{item.label}</h3>
                    <p className="text-sm text-muted-foreground">Gestionar {item.label.toLowerCase()}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </div>
            ))}

            {/* Custom Danger Zone Item in the List */}
            <div
              onClick={() => setActiveSubCategory({
                label: 'Configuración de Cuenta',
                icon: <Settings />
              })}
              className="group flex items-center justify-between p-4 rounded-xl hover:bg-red-50/50 transition-all cursor-pointer mt-4"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-red-100/50 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-red-600 text-base">Eliminar Cuenta / Empresa</h3>
                  <p className="text-sm text-red-600/70">Zona de peligro, acciones irreversibles</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-red-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      );
    }

    if (currentMenu && currentMenu.items && currentMenu.items.length > 0) {
      const posDescriptions: Record<string, string> = {
        'Crear Factura': 'Emitir nuevos comprobantes de venta de forma rápida.',
        'Consulta de Facturas': 'Visualice y gestione el historial de ventas realizadas.',
        'Consulta de Utilidad por Factura': 'Analice el margen de ganancia por cada venta individual.',
        'Consulta de Cobros por Factura': 'Seguimiento detallado de los pagos recibidos.',
        'Consulta de Cobros por Tarjetas': 'Conciliación de pagos electrónicos y transacciones.',
        'Consulta de Devoluciones': 'Gestione notas de crédito y retornos de productos.',
        'Gestión de Ventas': 'Configuraciones avanzadas del proceso comercial.',
        'Consulta de Cierre de Caja': 'Realice el arqueo y cierre diario de operaciones.',
        'Análisis de Ventas': 'Insights profundos sobre el rendimiento comercial.',
        'Consulta de Cobros por Caja': 'Resumen de ingresos segmentado por estación.',
        'Consulta de Artículos Vendidos': 'Detalle de productos con mayor rotación comercial.',
        'Reportes de Punto de Venta': 'Generación de informes para toma de decisiones.',
        'Detalle de Artículos Vendidos': 'Exploración técnica de productos y categorías.',
      };

      return (
        <div className="space-y-6 animate-element">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {subMenus[activeSection]?.items?.map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  if (item.subItems) {
                    setActiveSubCategory(item);
                  } else if (activeSection === 'pos') {
                    // Todos los ítems de POS sin subItems deben activarse como subcategoría para mostrar su contenido
                    setActiveSubCategory(item);
                  }
                }}
                className={cn(
                  "group relative bg-white p-6 rounded-2xl border shadow-sm cursor-pointer transition-all duration-300 hover:-translate-y-1",
                  activeSection === 'pos' && item.label === 'Crear Factura'
                    ? "border-2 border-blue-500 hover:shadow-xl"
                    : "border-slate-200 hover:shadow-lg hover:border-slate-300"
                )}
              >
                {activeSection === 'pos' && item.label === 'Crear Factura' && (
                  <div className="absolute top-4 right-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                )}

                <div
                  className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center mb-5 transition-transform",
                    activeSection === 'pos' && item.label === 'Crear Factura'
                      ? "bg-blue-100 text-blue-600 group-hover:scale-110"
                      : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                  )}
                >
                  {React.isValidElement(item.icon) && React.cloneElement(item.icon as IconEl, { className: "w-6 h-6" })}
                </div>

                <h3
                  className={cn(
                    "text-lg font-semibold text-slate-900 transition-colors",
                    activeSection === 'pos' && item.label === 'Crear Factura' && "group-hover:text-blue-600",
                  )}
                >
                  {item.label}
                </h3>
                <p className="text-sm text-slate-500 mt-2">
                  {activeSection === 'pos' ? posDescriptions[item.label] ?? 'Acceda a este módulo.' : `Acceder a ${item.label.toLowerCase()}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeSubCategory?.label === 'Configuración de Cuenta') {
      return (
        <div className="animate-element space-y-8 max-w-5xl mx-auto pb-10">
          <div className="flex flex-col gap-2 mb-6">
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Configuración de Cuenta</h2>
            <p className="text-muted-foreground">Administre su perfil y las preferencias de su organización.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Settings Panel */}
            <div className="md:col-span-2 space-y-6">

              {/* Profile Card */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Información de Perfil</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                    <div className="p-3 bg-secondary/50 rounded-lg text-sm text-foreground">{me?.name || 'Cargando...'}</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <div className="p-3 bg-secondary/50 rounded-lg text-sm text-foreground">{me?.email || 'Cargando...'}</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Role</label>
                    <div className="p-3 bg-secondary/50 rounded-lg text-sm text-foreground">Administrador</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Tenant ID</label>
                    <div className="p-3 bg-secondary/50 rounded-lg text-sm font-mono text-foreground truncate">{me?.tenantId || '...'}</div>
                  </div>
                </div>
              </div>

              {/* Preferences Card */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Preferencias</h3>
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-background">
                  <div>
                    <p className="font-medium text-foreground">Idioma</p>
                    <p className="text-xs text-muted-foreground">Seleccione el idioma de la interfaz.</p>
                  </div>
                  <select className="bg-transparent text-sm border-none focus:ring-0 text-foreground font-medium cursor-pointer">
                    <option>Español</option>
                    <option>English (Coming Soon)</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              {/* Danger Zone */}
              <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 space-y-4">
                <div className="flex items-center gap-3 text-red-600 mb-2">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg">Zona de Peligro</h3>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  Si desea eliminar permanentemente su organización y todos los datos asociados, puede iniciar el proceso aquí.
                </p>

                <button
                  onClick={() => setActiveSubCategory({
                    label: 'Eliminación de Cuenta / Empresa',
                    icon: <LogOut />
                  })}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-lg shadow-red-600/10 transition-all hover:scale-[1.02]"
                >
                  Eliminar Organización
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeSubCategory?.label === 'Eliminación de Cuenta / Empresa') {
      return (
        <div className="animate-element space-y-8 max-w-5xl mx-auto pb-10">

          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setActiveSubCategory(null)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <div className="p-1 rounded-lg bg-secondary group-hover:bg-secondary/80">
                <ArrowLeft className="w-4 h-4" />
              </div>
              Volver a Configuración
            </button>
          </div>

          {/* Header / Warning */}
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 flex flex-col md:flex-row gap-6 items-start">
            <div className="p-4 bg-red-500/10 rounded-2xl flex items-center justify-center shrink-0">
              <LogOut className="w-8 h-8 text-red-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-red-600 tracking-tight">Zona de Peligro: Eliminación de Empresa</h2>
              <p className="text-muted-foreground mt-2 max-w-2xl text-base leading-relaxed">
                Esta acción iniciará el proceso de cierre de su sucursal digital en TuinityOS.
                Una vez completado el proceso y el periodo de gracia, todos los datos asociados serán eliminados permanentemente.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Acción Irreversible
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Auditoría Activada
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              {/* Step 1: Export Data */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">1</div>
                  <h3 className="text-lg font-semibold text-foreground">Respaldo de Información</h3>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 hover:shadow-sm transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-foreground">Exportar base de datos completa</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Descargue un archivo comprimido con clientes, inventario, facturas y registros contables.
                      </p>
                    </div>
                    <button className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
                      <FileText className="w-4 h-4" />
                      Descargar Backup
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 2: Confirmation & Grace Period */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">2</div>
                  <h3 className="text-lg font-semibold text-foreground">Configuración de Cierre</h3>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Periodo de Gracia</label>
                      <div className="relative">
                        <select className="w-full pl-3 pr-10 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none">
                          <option value="30">30 Días (Recomendado)</option>
                          <option value="7">7 Días</option>
                          <option value="0">Inmediato (No recomendado)</option>
                        </select>
                        <ChevronRight className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 rotate-90" />
                      </div>
                      <p className="text-xs text-muted-foreground">Tiempo para recuperar la cuenta antes del borrado definitivo.</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Contraseña de Administrador</label>
                      <input
                        type="password"
                        placeholder="Ingrese su contraseña"
                        className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Aviso Legal y Consecuencias
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-2 pl-1">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                        <span>Al finalizar el periodo de gracia, los datos serán irrecuperables por ningún medio.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                        <span>La eliminación de la empresa no exime de responsabilidades fiscales pendientes o deudas activas.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <span>Se generará un certificado de cierre digital y se enviará a todos los administradores registrados.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-lg shadow-red-600/20 transition-all hover:scale-[1.02]">
                  <LogOut className="w-4 h-4" />
                  Programar Eliminación
                </button>
              </div>
            </div>

            {/* Sidebar / History */}
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Historial de Solicitudes</h3>

                <div className="relative pl-4 border-l-2 border-border space-y-6">
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-gray-300 ring-4 ring-card" />
                    <p className="text-sm text-muted-foreground italic">No hay registros de eliminación previos.</p>
                    <p className="text-xs text-muted-foreground/50 mt-1">El historial aparecerá aquí cuando se inicie un proceso.</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">¿Necesitas ayuda?</h3>
                <p className="text-sm text-blue-600/80 mb-4">
                  Si tienes dudas sobre el proceso de cierre o necesitas exportar datos específicos, contacta a soporte.
                </p>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                  Contactar Soporte Enterprise &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-3xl bg-secondary/20">
        <Package className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium text-foreground">Sección en Construcción</h3>
        <p className="text-sm text-muted-foreground mt-1">Estamos trabajando en este módulo.</p>
      </div>
    );
  };


  // --- RENDER PRINCIPAL ---
  return (
    <div className={cn('flex flex-col md:flex-row bg-background w-full h-screen overflow-hidden')}>
      {/* SIDEBAR - Izquierda */}
      <div className="h-full border-r border-slate-200 bg-white">
        <Sidebar open={open || dropdownOpen} setOpen={setOpen}>
          <SidebarBody className="justify-between gap-10">
            <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
              {(open || dropdownOpen) ? <Logo /> : <LogoIcon />}
              <div className="mt-8 flex flex-col gap-2">
                {links.map((link, idx) => (
                  <div key={idx} onClick={() => setActiveSection(link.id)}>
                    <SidebarLink link={link} active={activeSection === link.id} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <DropdownMenu onOpenChange={setDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <div className="cursor-pointer">
                    <SidebarLink
                      link={{
                        label: me?.name || 'Demo Admin',
                        href: '#',
                        icon: (
                          <div className="h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                            {me?.name?.[0] || 'D'}
                          </div>
                        ),
                      }}
                    />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top" sideOffset={12} className="w-56 border-border/50 shadow-xl">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1 px-2 py-1.5">
                      <p className="text-sm font-semibold text-foreground">{me?.name || 'Demo Admin'}</p>
                      <p className="text-xs text-muted-foreground">{me?.email || 'demo@dynamotech.com'}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                    Apariencia
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Claro</span>
                    {theme === 'light' && <div className="ml-auto h-2 w-2 rounded-full bg-blue-500" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Oscuro</span>
                    {theme === 'dark' && <div className="ml-auto h-2 w-2 rounded-full bg-blue-500" />}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setActiveSection('settings');
                      setActiveSubCategory({
                        label: 'Configuración de Cuenta',
                        icon: <Settings />
                      });
                      setDropdownOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configuración</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 focus:text-red-600 focus:bg-red-500/10 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SidebarBody>
        </Sidebar>
      </div>

      {/* CONTENIDO PRINCIPAL - Derecha (Column Flex) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* HEADER - Fijo Arriba */}
        <DashboardHeader
          activeSection={activeSection}
          activeSubCategory={activeSubCategory}
          setActiveSubCategory={setActiveSubCategory}
        />

        {/* CONTENIDO SCROLLEABLE - Abajo */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {loading ? (
            <div className="space-y-8">
              {/* Header Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-32" />
                      </div>
                      <Skeleton className="h-10 w-10 rounded-xl" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            renderContent()
          )}
        </main>
      </div>
    </div>
  );
}

const Logo = () => {
  return (
    <div className="font-normal flex space-x-2 items-center text-sm text-foreground py-1 relative z-20">
      <div className="h-5 w-6 bg-gradient-to-tr from-blue-600 to-blue-500 rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-foreground whitespace-pre">
        DYNAMOSS
      </motion.span>
    </div>
  );
};

const LogoIcon = () => {
  return (
    <div className="font-normal flex space-x-2 items-center text-sm text-foreground py-1 relative z-20">
      <div className="h-5 w-6 bg-gradient-to-tr from-blue-600 to-blue-500 rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
    </div>
  );
};
