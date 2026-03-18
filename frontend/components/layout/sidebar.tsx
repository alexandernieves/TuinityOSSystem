'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  Briefcase,
  Store,
  Ship,
  Users,
  CreditCard,
  Calculator,
  History,
  BarChart3,
  Settings,
  ChevronRight as ChevronRightIcon,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import {
  Badge
} from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from '@/lib/contexts/auth-context';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils/cn';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  permission?: string;
  badge?: number;
  subitems?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: 'Productos',
    href: '/productos',
    icon: <Package className="h-5 w-5" />,
  },
  {
    label: 'Compras',
    href: '/compras',
    icon: <ShoppingCart className="h-5 w-5" />,
    permission: 'canAccessCompras',
  },
  {
    label: 'Inventario',
    href: '/inventario',
    icon: <Warehouse className="h-5 w-5" />,
    permission: 'canAccessInventory',
    subitems: [
      {
        label: 'Inventario',
        href: '/inventario',
        icon: <Warehouse className="h-4 w-4" />,
        permission: 'canAccessInventory',
      },
      {
        label: 'Lotes / FEFO',
        href: '/inventario/lotes',
        icon: <Package className="h-4 w-4" />,
        permission: 'canAccessInventory',
      },
      {
        label: 'Kardex / Movs',
        href: '/inventario/movimientos',
        icon: <History className="h-4 w-4" />,
        permission: 'canAccessInventory',
      },
    ],
  },
  {
    label: 'Proveedores',
    href: '/proveedores',
    icon: <Briefcase className="h-5 w-5" />,
    permission: 'canAccessCompras',
    subitems: [
      {
        label: 'Todos los Proveedores',
        href: '/proveedores',
        icon: <Briefcase className="h-4 w-4" />,
      },
      {
        label: 'CxP',
        href: '/proveedores/cxp',
        icon: <CreditCard className="h-4 w-4" />,
      },
    ],
  },
  {
    label: 'Ventas B2B',
    href: '/ventas',
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    label: 'Ventas ERP',
    href: '/erp/ventas',
    icon: <ShoppingCart className="h-5 w-5" />,
  },
  {
    label: 'Punto de Venta',
    href: '/ventas/pos',
    icon: <Store className="h-5 w-5" />,
    permission: 'canAccessPOS',
  },
  {
    label: 'Tráfico',
    href: '/trafico',
    icon: <Ship className="h-5 w-5" />,
    permission: 'canAccessTrafico',
  },
  {
    label: 'Clientes',
    href: '/clientes',
    icon: <Users className="h-5 w-5" />,
    subitems: [
      {
        label: 'Todos los Clientes',
        href: '/clientes',
        icon: <Users className="h-4 w-4" />,
      },
      {
        label: 'CxC',
        href: '/clientes/cxc',
        icon: <CreditCard className="h-4 w-4" />,
      },
    ],
  },
  {
    label: 'Contabilidad',
    href: '/contabilidad',
    icon: <Calculator className="h-5 w-5" />,
    permission: 'canAccessContabilidad',
  },
  {
    label: 'Historial',
    href: '/historial',
    icon: <History className="h-5 w-5" />,
    permission: 'canViewHistorial',
  },
  {
    label: 'Reportes',
    href: '/reportes',
    icon: <BarChart3 className="h-5 w-5" />,
    permission: 'canViewReports',
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, checkPermission } = useAuth();
  const { state } = useSidebar();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['Inventario']);
  const isCollapsed = state === 'collapsed';

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const isExpanded = (label: string) => {
    return expandedItems.includes(label);
  };

  const filteredNavItems = NAV_ITEMS.filter(
    (item) => !item.permission || checkPermission(item.permission as any)
  );

  const handleNavClick = () => {
    // Navigation handling is now managed by shadcn sidebar
  };

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
    setIsLogoutModalOpen(false);

    try {
      await logout();
      toast.success('Sesión cerrada con éxito');
    } catch {
      toast.error('Error al cerrar sesión');
    }
  };

  const logoutModal = (
    <AlertDialog open={isLogoutModalOpen} onOpenChange={setIsLogoutModalOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <LogOut className="h-5 w-5" />
            </div>
            <div>
              <AlertDialogTitle>Cerrar Sesión</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro que deseas salir? No recibirás más notificaciones hasta que vuelvas a entrar.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmLogout}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Sí, cerrar sesión
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredNavItems.map((item) => {
                  const active = item.href ? isActive(item.href) : false;
                  const hasSubitems = item.subitems && item.subitems.length > 0;
                  const expanded = isExpanded(item.label);
                  
                  if (hasSubitems && !isCollapsed) {
                    return (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                          isActive={active}
                          tooltip={item.label}
                          onClick={() => toggleExpanded(item.label)}
                        >
                          {item.label === 'Dashboard' ? <LayoutDashboard size={17} strokeWidth={1.5} /> :
                            item.label === 'Productos' ? <Package size={17} strokeWidth={1.5} /> :
                              item.label === 'Compras' ? <ShoppingCart size={17} strokeWidth={1.5} /> :
                                item.label === 'Inventario' ? <Warehouse size={17} strokeWidth={1.5} /> :
                                  item.label === 'Proveedores' ? <Briefcase size={17} strokeWidth={1.5} /> :
                                    item.label === 'Ventas B2B' ? <Briefcase size={17} strokeWidth={1.5} /> :
                                      item.label === 'Punto de Venta' ? <Store size={17} strokeWidth={1.5} /> :
                                        item.label === 'Tráfico' ? <Ship size={17} strokeWidth={1.5} /> :
                                          item.label === 'Clientes' ? <Users size={17} strokeWidth={1.5} /> :
                                            item.label === 'Contabilidad' ? <Calculator size={17} strokeWidth={1.5} /> :
                                              item.label === 'Historial' ? <History size={17} strokeWidth={1.5} /> :
                                                item.label === 'Reportes' ? <BarChart3 size={17} strokeWidth={1.5} /> :
                                                  item.icon}
                          <span>{item.label}</span>
                          {item.badge && (
                            <Badge className="ml-auto flex h-5 w-5 items-center justify-center p-0 text-[10px]" variant="success">
                              {item.badge}
                            </Badge>
                          )}
                          <ChevronDown className={cn(
                            "ml-auto h-4 w-4 transition-transform",
                            expanded && "rotate-180"
                          )} />
                        </SidebarMenuButton>
                        <AnimatePresence>
                          {expanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="ml-4 mt-1 space-y-1">
                                {item.subitems?.filter(subitem => 
                                  !subitem.permission || checkPermission(subitem.permission as any)
                                ).map((subitem) => {
                                  const subActive = subitem.href ? isActive(subitem.href) : false;
                                  return (
                                    <div key={subitem.href} className="group/menu-item relative">
                                      <SidebarMenuButton
                                        asChild
                                        isActive={subActive}
                                        tooltip={subitem.label}
                                      >
                                        <Link href={subitem.href || '#'} className="pl-4">
                                          {subitem.icon}
                                          <span className="text-sm">{subitem.label}</span>
                                        </Link>
                                      </SidebarMenuButton>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </SidebarMenuItem>
                    );
                  }
                  
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.label}
                      >
                        <Link href={item.href || '#'}>
                          {item.label === 'Dashboard' ? <LayoutDashboard size={17} strokeWidth={1.5} /> :
                            item.label === 'Productos' ? <Package size={17} strokeWidth={1.5} /> :
                              item.label === 'Compras' ? <ShoppingCart size={17} strokeWidth={1.5} /> :
                                item.label === 'Inventario' ? <Warehouse size={17} strokeWidth={1.5} /> :
                                  item.label === 'Proveedores' ? <Briefcase size={17} strokeWidth={1.5} /> :
                                    item.label === 'Ventas B2B' ? <Briefcase size={17} strokeWidth={1.5} /> :
                                      item.label === 'Punto de Venta' ? <Store size={17} strokeWidth={1.5} /> :
                                        item.label === 'Tráfico' ? <Ship size={17} strokeWidth={1.5} /> :
                                          item.label === 'Clientes' ? <Users size={17} strokeWidth={1.5} /> :
                                            item.label === 'Contabilidad' ? <Calculator size={17} strokeWidth={1.5} /> :
                                              item.label === 'Historial' ? <History size={17} strokeWidth={1.5} /> :
                                                item.label === 'Reportes' ? <BarChart3 size={17} strokeWidth={1.5} /> :
                                                  item.icon}
                          <span>{item.label}</span>
                          {item.badge && (
                            <Badge className="ml-auto flex h-5 w-5 items-center justify-center p-0 text-[10px]" variant="success">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            {checkPermission('canAccessConfiguracion') && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/configuracion')}>
                  <Link href="/configuracion">
                    <Settings size={18} strokeWidth={1.5} />
                    <span>Configuración</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogoutClick}>
                <LogOut size={17} strokeWidth={1.5} />
                <span>Cerrar sesión</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      {logoutModal}
    </>
  );

}
