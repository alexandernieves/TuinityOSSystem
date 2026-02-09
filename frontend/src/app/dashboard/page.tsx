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
  role?: string;
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

  // Users management state
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

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
      }
    )
      .then((data) => {
        setInvoiceList(data.items);
        setInvoiceListTotal(data.total);
      })
      .catch((err) => {
        if (err.status !== 401) {
          console.error('Error fetching invoices:', err);
        }
      })
      .finally(() => {
        setInvoiceListLoading(false);
      });
  }, [invoiceListSkip, invoiceSearch, invoiceListBranchId]);


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
      .then((data) => {
        console.log('User identified:', data);
        setMe(data);
      })
      .catch((e) => {
        if (e.status !== 401) {
          console.error('Error al conectar con el backend:', e);
        }
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
      } catch (e: any) {
        if (e.status !== 401) {
          console.error(e);
        }
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
    {
      label: 'Configuraciones',
      href: '#',
      icon: <Settings className="text-foreground h-5 w-5 flex-shrink-0" />,
      id: 'settings' as Section,
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
    // -------------------------------------------------------------------------
    // 1. SPECIFIC SUB-CATEGORY VIEWS
    // -------------------------------------------------------------------------

    // Users and Permissions
    if (activeSubCategory?.label === 'Usuarios y Permisos') {
      return (
        <div className="animate-element space-y-6 max-w-7xl mx-auto pb-10 px-4">
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

          <div className="flex flex-col gap-2 mb-6">
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Usuarios y Permisos</h2>
            <p className="text-muted-foreground">Gestione los usuarios registrados y sus roles de acceso.</p>
          </div>

          {usersLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Usuario</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Rol</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {users.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No hay usuarios registrados</td></tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold">
                                {(user.name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{user.name || (user.email ? user.email.split('@')[0] : 'Sin nombre')}</p>
                                <p className="text-sm text-slate-500">{user.id.substring(0, 8)}...</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">{user.email}</td>
                          <td className="px-6 py-4">
                            <select
                              value={user.role}
                              disabled={user.email === 'qwerty@gmail.com'}
                              onChange={async (e) => {
                                const newRole = e.target.value;
                                const session = loadSession();
                                if (!session) return;
                                try {
                                  await api(`/users/${user.id}/role`, {
                                    method: 'PATCH',
                                    accessToken: session.accessToken,
                                    body: { role: newRole },
                                  });
                                  setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
                                  toast.success('Rol actualizado');
                                } catch (e: any) {
                                  if (e.status === 401) router.replace('/login');
                                  else toast.error('Error al actualizar rol');
                                }
                              }}
                              className={cn(
                                "px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                                user.email === 'qwerty@gmail.com' && "bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200"
                              )}
                            >
                              <option value="CLIENT">CLIENT</option>
                              <option value="MEMBER">MEMBER</option>
                              <option value="ADMIN">ADMIN</option>
                              <option value="OWNER">OWNER</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", user.status === 'ACTIVE' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                              {user.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              disabled={user.email === 'qwerty@gmail.com'}
                              onClick={async () => {
                                if (!confirm('¿Eliminar usuario?')) return;
                                const session = loadSession();
                                if (!session) return;
                                try {
                                  await api(`/users/${user.id}`, { method: 'DELETE', accessToken: session.accessToken });
                                  setUsers(users.filter(u => u.id !== user.id));
                                  toast.success('Eliminado');
                                } catch (e: any) {
                                  if (e.status === 401) router.replace('/login');
                                  else toast.error('Error al eliminar');
                                }
                              }}
                              className={cn(
                                "text-red-600 hover:text-red-800 font-medium text-sm transition-colors",
                                user.email === 'qwerty@gmail.com' && "text-slate-300 cursor-not-allowed hover:text-slate-300"
                              )}
                            >Eliminar</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Account Settings
    if (activeSubCategory?.label === 'Configuración de Cuenta') {
      return (
        <div className="animate-element space-y-8 max-w-5xl mx-auto pb-10 px-4">
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

          <div className="flex flex-col gap-2 mb-6">
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Configuración de Cuenta</h2>
            <p className="text-muted-foreground">Administre su perfil y las preferencias de su organización.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Información de Perfil</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500">Nombre</label>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-900">
                      {me?.name || (me?.email ? me.email.split('@')[0] : 'Sin nombre')}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500">Email</label>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-900">{me?.email}</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500">Role</label>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-900 uppercase font-bold">
                      {me?.role || 'CLIENT'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500">Tenant ID</label>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm font-mono text-slate-900 truncate">{me?.tenantId}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Preferencias</h3>
                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div>
                    <p className="font-medium text-slate-900">Idioma</p>
                    <p className="text-xs text-slate-500">Seleccione el idioma de la interfaz.</p>
                  </div>
                  <select className="bg-transparent text-sm border-none focus:ring-0 text-slate-900 font-medium cursor-pointer">
                    <option>Español</option>
                  </select>
                </div>
              </div>
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-3 text-red-600 mb-2">
                  <div className="p-2 bg-red-100 rounded-lg"><LogOut className="w-5 h-5" /></div>
                  <h3 className="font-bold text-lg">Zona de Peligro</h3>
                </div>
                <p className="text-sm text-red-600/70 leading-relaxed">Si desea eliminar permanentemente su organización, puede iniciar el proceso aquí.</p>
                <button
                  onClick={() => setActiveSubCategory({ label: 'Eliminación de Cuenta / Empresa', icon: <LogOut /> })}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-lg shadow-red-600/10 transition-all hover:scale-[1.02]"
                >Eliminar Organización</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Dashboard Stats
    if (activeSection === 'dashboard') {
      return (
        <div className="space-y-8 animate-element max-w-[1600px] w-full mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Ingresos" value="$45,231" change="+20.1% vs mes anterior" icon={DollarSign} delay="animate-delay-100" />
            <StatCard title="Usuarios Activos" value="2,345" change="+10.5% vs mes anterior" icon={Users} delay="animate-delay-200" />
            <StatCard title="Nuevos Registros" value="892" change="+15.3% vs mes anterior" icon={UserPlus} delay="animate-delay-300" />
            <StatCard title="Tasa de Conversión" value="3.2%" change="+2.4% vs mes anterior" icon={TrendingUp} delay="animate-delay-400" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-soft border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Tendencia de Ingresos</h3>
              <AreaChart className="h-72" data={[{ date: 'Ene', Ventas: 2890, Gastos: 2400 }, { date: 'Feb', Ventas: 3200, Gastos: 2100 }, { date: 'Mar', Ventas: 4100, Gastos: 2800 }]} index="date" categories={['Ventas', 'Gastos']} colors={['blue', 'red']} valueFormatter={(v) => `$${v.toLocaleString()}`} />
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Productos Más Vendidos</h3>
              <BarChart className="h-72" data={[{ producto: 'Laptop', ventas: 456 }, { producto: 'Mouse', ventas: 351 }]} index="producto" categories={['ventas']} colors={['blue']} layout="vertical" />
            </div>
          </div>
        </div>
      );
    }

    // POS Creating Invoice
    if (activeSection === 'pos' && activeSubCategory?.label === 'Crear Factura') {
      const taxRate = 0.07;
      const computed = invoiceLines.reduce((acc, line) => {
        const q = Number(line.quantity) || 0;
        const p = Number(line.unitPrice) || 0;
        const sub = q * p;
        acc.subtotal += sub;
        if (line.taxable) acc.tax += sub * taxRate;
        return acc;
      }, { subtotal: 0, tax: 0 });
      const total = computed.subtotal + computed.tax;

      const onSave = async () => {
        const session = loadSession();
        if (!session) return;
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
              lines: invoiceLines.map(l => ({ description: l.description, quantity: Number(l.quantity), unitPrice: Number(l.unitPrice), taxable: l.taxable, taxRate }))
            }
          });
          setCreatedInvoice(created);
          toast.success(`Factura creada: ${created.invoiceNumber}`);
        } catch (e: any) {
          if (e.status === 401) router.replace('/login');
          else toast.error('Error al crear factura');
        } finally { setSavingInvoice(false); }
      };

      return (
        <div className="space-y-6 animate-element">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-foreground">Crear Factura</h2>
            <p className="text-muted-foreground">Facturación por sucursal</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)} className="w-full p-2 border rounded-xl">
                  <option value="">Sucursal</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <input value={invoiceCustomerName} onChange={(e) => setInvoiceCustomerName(e.target.value)} placeholder="Cliente" className="w-full p-2 border rounded-xl" />
              </div>
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Líneas</h3>
                  <button onClick={() => setInvoiceLines([...invoiceLines, { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, taxable: true }])} className="px-3 py-1 bg-blue-600 text-white rounded-lg">Agregar</button>
                </div>
                <table className="w-full">
                  <tbody>
                    {invoiceLines.map(line => (
                      <tr key={line.id}>
                        <td><input value={line.description} onChange={(e) => setInvoiceLines(invoiceLines.map(l => l.id === line.id ? { ...l, description: e.target.value } : l))} placeholder="Desc" className="w-full p-1 border rounded" /></td>
                        <td><input type="number" value={line.quantity} onChange={(e) => setInvoiceLines(invoiceLines.map(l => l.id === line.id ? { ...l, quantity: Number(e.target.value) } : l))} className="w-20 p-1 border rounded" /></td>
                        <td><input type="number" value={line.unitPrice} onChange={(e) => setInvoiceLines(invoiceLines.map(l => l.id === line.id ? { ...l, unitPrice: Number(e.target.value) } : l))} className="w-24 p-1 border rounded" /></td>
                        <td><button onClick={() => setInvoiceLines(invoiceLines.map(l => l.id === line.id ? { ...l, taxable: !l.taxable } : l))} className={cn("p-1 rounded", line.taxable ? "bg-blue-100" : "bg-gray-100")}>{line.taxable ? "Tax" : "No"}</button></td>
                        <td><button onClick={() => setInvoiceLines(invoiceLines.filter(l => l.id !== line.id))} className="text-red-500">X</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="flex justify-between"><span>Subtotal</span><span>${computed.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>ITBMS (7%)</span><span>${computed.tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-xl"><span>Total</span><span>${total.toFixed(2)}</span></div>
              <button onClick={onSave} disabled={savingInvoice} className="w-full py-3 bg-blue-600 text-white rounded-xl">{savingInvoice ? "Guardando..." : "Guardar"}</button>
            </div>
          </div>
        </div>
      );
    }

    // POS Inquiry
    if (activeSection === 'pos' && activeSubCategory?.label === 'Consulta de Facturas') {
      return (
        <div className="space-y-6 animate-element">
          <h2 className="text-2xl font-bold">Consulta de Facturas</h2>
          <div className="bg-card border border-border rounded-2xl p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr><th>Factura</th><th>Fecha</th><th>Cliente</th><th className="text-right">Total</th></tr></thead>
              <tbody>
                {invoiceList.map(inv => (
                  <tr key={inv.id} className="border-t">
                    <td className="py-2">{inv.invoiceNumber}</td>
                    <td>{new Date(inv.issuedAt).toLocaleString()}</td>
                    <td>{inv.customerName}</td>
                    <td className="text-right font-bold">${Number(inv.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // Settings General View
    if (activeSection === 'settings' && !activeSubCategory) {
      return (
        <div className="max-w-4xl mx-auto space-y-8 animate-element p-4">
          <h2 className="text-3xl font-bold">Configuración</h2>
          <div className="flex flex-col gap-3">
            {subMenus.settings.items.map((item, idx) => (
              <div key={idx} onClick={async () => {
                if (item.label === 'Usuarios y Permisos') {
                  setUsersLoading(true);
                  const session = loadSession();
                  if (session) {
                    try {
                      const data = await api<any[]>('/users', { method: 'GET', accessToken: session.accessToken });
                      setUsers(data);
                      setActiveSubCategory(item);
                    } catch (err: any) {
                      if (err.status === 401) router.replace('/login');
                      else toast.error('Error al cargar usuarios');
                    } finally { setUsersLoading(false); }
                  }
                } else { setActiveSubCategory(item); }
              }} className="flex items-center justify-between p-4 rounded-xl hover:bg-secondary cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-secondary rounded-lg">{item.icon}</div>
                  <div><h3 className="font-medium">{item.label}</h3></div>
                </div>
                <ChevronRight className="w-5 h-5" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Drill-down fallback
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
            Volver
          </button>

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

    // Default Section Menu
    const currentMenu = subMenus[activeSection as keyof typeof subMenus];
    if (currentMenu && currentMenu.items.length > 0) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-element">
          {currentMenu.items.map((item, idx) => (
            <div
              key={idx}
              onClick={() => setActiveSubCategory(item)}
              className="group relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300"
            >
              {item.subItems && (
                <div className="absolute top-4 right-4 flex items-center gap-1">
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                    {item.subItems.length}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              )}

              <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-5 transition-transform bg-slate-100 text-slate-600 group-hover:bg-slate-200">
                {React.isValidElement(item.icon) && React.cloneElement(item.icon as IconEl, { className: "w-6 h-6" })}
              </div>

              <h3 className="text-lg font-semibold text-slate-900 transition-colors">
                {item.label}
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                Acceder a {item.label.toLowerCase()}
              </p>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-3xl bg-secondary/20">
        <Package className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium">Sección en Construcción</h3>
        <p className="text-sm text-muted-foreground">Estamos trabajando en este módulo.</p>
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
                  <div key={idx} onClick={() => {
                    setActiveSection(link.id);
                    setActiveSubCategory(null); // Reset subcategory when navigating
                  }}>
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
                        label: me?.name || me?.email?.split('@')[0] || 'Usuario',
                        href: '#',
                        icon: (
                          <div className="h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                            {(me?.name?.[0] || me?.email?.[0] || 'U').toUpperCase()}
                          </div>
                        ),
                      }}
                    />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top" sideOffset={12} className="w-56 border-border/50 shadow-xl">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1 px-2 py-1.5">
                      <p className="text-sm font-semibold text-foreground">{me?.name || me?.email?.split('@')[0] || 'Usuario'}</p>
                      <p className="text-xs text-muted-foreground">{me?.email || 'Cargando...'}</p>
                      <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-wider">{me?.role || 'CLIENT'}</p>
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
