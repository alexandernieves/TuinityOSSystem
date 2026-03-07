'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
    badge: 5,
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
  const { logout, checkPermission } = useAuth();
  const { isCollapsed, setIsCollapsed, sidebarWidth, isMobile, isMobileOpen, setIsMobileOpen, toggleMobileOpen } = useSidebar();

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

  // On mobile, show sidebar as overlay when isMobileOpen
  // On desktop, show normally with animated width
  const showExpanded = isMobile ? true : !isCollapsed;

  const sidebarContent = (
    <aside
      className={cn(
        'flex h-screen flex-col bg-white dark:bg-[#0a0a0a]',
        isMobile ? 'w-[260px]' : undefined
      )}
      style={!isMobile ? { width: sidebarWidth } : undefined}
    >
      {/* Header - Same color and height as navbar */}
      <div
        className={cn(
          "flex h-12 items-center px-4 transition-all duration-200",
          !isMobile && isCollapsed ? "justify-center" : "justify-between"
        )}
        style={{ backgroundColor: '#1a1a1a' }}
      >
        <AnimatePresence mode="wait">
          {!isCollapsed || isMobile ? (
            <motion.div
              key="full-logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center"
            >
              <img
                src="https://res.cloudinary.com/db3espoei/image/upload/v1771993730/Logo_Evolution_ZL__1_-1_wgd1hg.svg"
                alt="Evolution"
                className="h-7 w-auto invert"
              />
            </motion.div>
          ) : (
            <motion.div
              key="cropped-logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center"
            >
              <img
                src="https://res.cloudinary.com/db3espoei/image/upload/v1771993730/Logo_Evolution_ZL__1_-cropped_onzamv.svg"
                alt="Evolution"
                className="h-7 w-auto invert"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {isMobile && (
          <button
            onClick={toggleMobileOpen}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-[#2a2a2a] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto border-r border-gray-200 dark:border-[#2a2a2a] px-3 py-2">
        <ul className="space-y-0.5">
          {filteredNavItems.map((item) => {
            const active = isActive(item.href);
            const linkContent = (
              <Link
                href={item.href}
                onClick={handleNavClick}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                  active
                    ? 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-[#888888] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] hover:text-gray-900 dark:hover:text-white'
                )}
              >
                <span
                  className={cn(
                    'shrink-0 transition-colors',
                    active ? 'text-brand-600 dark:text-[#00D1B2]' : 'text-gray-400 dark:text-[#666666] group-hover:text-gray-600 dark:group-hover:text-white'
                  )}
                >
                  {item.icon}
                </span>
                <AnimatePresence mode="wait">
                  {showExpanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex-1 whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {showExpanded && item.badge && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-medium text-white">
                    {item.badge}
                  </span>
                )}
                {showExpanded && (
                  <ChevronRight className={cn(
                    'h-4 w-4 text-gray-300 dark:text-[#444444] opacity-0 transition-all group-hover:opacity-100',
                    active && 'opacity-100 text-gray-400 dark:text-[#666666]'
                  )} />
                )}
              </Link>
            );

            return (
              <li key={item.href} className="relative">
                {!isMobile && isCollapsed ? (
                  <Tooltip
                    content={item.label}
                    placement="right"
                    classNames={{
                      content: 'bg-gray-900 text-white text-sm px-3 py-1.5',
                    }}
                  >
                    {linkContent}
                  </Tooltip>
                ) : (
                  linkContent
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Section - Pill (horizontal when expanded, vertical when collapsed) */}
      <div className={cn(
        "flex border-r border-gray-200 dark:border-[#2a2a2a] px-3 py-4",
        !isMobile && isCollapsed ? "flex-col items-center" : "items-center justify-center"
      )}>
        {/* Pill with Settings & Logout */}
        <div className={cn(
          "flex items-center gap-0.5 rounded-full border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#141414] p-1",
          !isMobile && isCollapsed && "flex-col"
        )}>
          <Tooltip content="Configuración" placement={!isMobile && isCollapsed ? "right" : "top"}>
            <Link
              href="/configuracion"
              onClick={handleNavClick}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                isActive('/configuracion')
                  ? 'bg-white dark:bg-[#1a1a1a] text-brand-600 dark:text-[#00D1B2] shadow-sm'
                  : 'text-gray-400 dark:text-[#666666] hover:bg-white dark:hover:bg-[#1a1a1a] hover:text-gray-600 dark:hover:text-white hover:shadow-sm'
              )}
            >
              <Settings className="h-4 w-4" />
            </Link>
          </Tooltip>

          <div className={cn(
            "bg-gray-200 dark:bg-[#2a2a2a]",
            !isMobile && isCollapsed ? "h-px w-5" : "h-5 w-px"
          )} />

          <Tooltip content="Cerrar sesión" placement={!isMobile && isCollapsed ? "right" : "top"}>
            <button
              onClick={logout}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 dark:text-[#666666] transition-colors hover:bg-white dark:hover:bg-[#1a1a1a] hover:text-gray-600 dark:hover:text-white hover:shadow-sm"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>

      </div>
    </aside>
  );

  // Mobile: show as overlay with backdrop
  if (isMobile) {
    return (
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
              className="fixed left-0 top-0 z-50"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop: fixed sidebar with animated width
  return (
    <motion.div
      initial={false}
      animate={{ width: sidebarWidth }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="fixed left-0 top-0 z-40"
    >
      {sidebarContent}
    </motion.div>
  );
}
