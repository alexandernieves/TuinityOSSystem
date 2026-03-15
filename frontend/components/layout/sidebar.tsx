'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  Briefcase,
  Store,
  Ship,
  Users,
  Calculator,
  History,
  BarChart3,
  Settings,
  ChevronRight,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Tooltip } from '@heroui/react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { cn } from '@/lib/utils/cn';
import { CustomModal, CustomModalHeader, CustomModalBody, CustomModalFooter } from '@/components/ui/custom-modal';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  permission?: string;
  badge?: number;
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
  },
  {
    label: 'Proveedores',
    href: '/proveedores',
    icon: <Briefcase className="h-5 w-5" />,
    permission: 'canAccessCompras',
  },
  {
    label: 'Ventas B2B',
    href: '/ventas',
    icon: <Briefcase className="h-5 w-5" />,
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

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, checkPermission } = useAuth();
  const { isCollapsed, setIsCollapsed, sidebarWidth, isMobile, isMobileOpen, setIsMobileOpen, toggleMobileOpen } = useSidebar();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const filteredNavItems = NAV_ITEMS.filter(
    (item) => !item.permission || checkPermission(item.permission as any)
  );

  const handleNavClick = () => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  const confirmLogout = async () => {
    setIsLogoutModalOpen(false);

    toast.promise(logout(), {
      loading: 'Cerrando sesión...',
      success: 'Sesión cerrada con éxito',
      error: 'Error al cerrar sesión',
    });
  };

  // On mobile, show sidebar as overlay when isMobileOpen
  // On desktop, show normally with animated width
  const showExpanded = isMobile ? true : !isCollapsed;

  const sidebarContent = (
    <aside
      className="w-[260px] min-w-[260px] bg-[#ebebeb] text-[#303030] flex flex-col h-full select-none relative"
      style={{ borderTopLeftRadius: '16px', overflow: 'hidden' }}
    >
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto pl-6 pr-6 pt-6 pb-2 relative">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-[13px] font-medium transition-colors',
                    active
                      ? 'bg-[#f7f7f7] text-[#1a1a1a]'
                      : 'text-[#303030] hover:bg-[#e0e0e0]'
                  )}
                >
                  <span className={cn(
                    "shrink-0 transition-opacity",
                    active ? "opacity-100" : "opacity-70"
                  )}>
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
                  </span>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.badge && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#008060] px-1 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-[#dcdcdc]">
        <Link
          href="/configuracion"
          onClick={handleNavClick}
          className={cn(
            'flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-[13px] font-medium transition-colors',
            isActive('/configuracion') ? 'bg-[#f7f7f7] text-[#1a1a1a]' : 'text-[#303030] hover:bg-[#e0e0e0]'
          )}
        >
          <Settings size={17} strokeWidth={1.5} className="opacity-70" />
          <span>Configuración</span>
        </Link>
        <button
          onClick={handleLogoutClick}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-[13px] font-medium transition-colors text-[#303030] hover:bg-[#e0e0e0] mt-1"
        >
          <LogOut size={17} strokeWidth={1.5} className="opacity-70" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );

  const logoutModal = (
    <CustomModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)}>
      <CustomModalHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10 text-danger">
            <LogOut className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Cerrar Sesión</h3>
            <p className="text-sm text-text-muted">¿Estás seguro que deseas salir?</p>
          </div>
        </div>
      </CustomModalHeader>
      <CustomModalBody>
        <p className="text-sm text-text-secondary py-2">
          No recibirás más notificaciones en el sistema hasta que vuelvas a iniciar sesión.
        </p>
      </CustomModalBody>
      <CustomModalFooter>
        <Button
          variant="ghost"
          onClick={() => setIsLogoutModalOpen(false)}
          className="h-10 px-6 font-semibold"
        >
          Cancelar
        </Button>
        <Button
          onClick={confirmLogout}
          className="h-10 px-6 font-semibold bg-danger hover:bg-danger/90 text-white shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_1px_0_rgba(0,0,0,0.08),inset_0_-1px_0_rgba(0,0,0,0.3)]"
        >
          Sí, cerrar sesión
        </Button>
      </CustomModalFooter>
    </CustomModal>
  );

  // Mobile: show as overlay with backdrop
  if (isMobile) {
    return (
      <>
        <AnimatePresence>
          {isMobileOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                onClick={() => setIsMobileOpen(false)}
              />
              {/* Sidebar panel */}
              <motion.div
                initial={{ x: -260 }}
                animate={{ x: 0 }}
                exit={{ x: -260 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="fixed left-0 top-0 z-50 h-full"
              >
                {sidebarContent}
              </motion.div>
            </>
          )}
        </AnimatePresence>
        {logoutModal}
      </>
    );
  }

  // Desktop: sidebar is a flex item in layout.tsx
  return (
    <>
      {sidebarContent}
      {logoutModal}
    </>
  );
}
