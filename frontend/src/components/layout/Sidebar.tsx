'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingCart,
    Tag,
    Users,
    DollarSign,
    Package,
    Settings,
    LogOut,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { loadSession, clearSession } from '@/lib/auth-storage';
import { api } from '@/lib/api';
import { useSidebar } from '@/components/layout/SidebarContext';
import { motion } from 'framer-motion';
import { Tooltip } from '@heroui/react';
import { canAccessNav } from '@/lib/rbac';

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

const navigation: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Punto de Venta', href: '/dashboard/pos', icon: <ShoppingCart className="w-5 h-5" /> },
    { label: 'Inventario', href: '/dashboard/inventario', icon: <Tag className="w-5 h-5" /> },
    { label: 'Clientes', href: '/dashboard/clientes', icon: <Users className="w-5 h-5" /> },
    { label: 'Contabilidad', href: '/dashboard/contabilidad', icon: <DollarSign className="w-5 h-5" /> },
    { label: 'Ventas', href: '/dashboard/ventas', icon: <Package className="w-5 h-5" /> },
];

const settingsNav: NavItem[] = [
    { label: 'Configuración', href: '/dashboard/configuracion', icon: <Settings className="w-5 h-5" /> },
];


// ─── NavItemContent defined OUTSIDE Sidebar to avoid recreation on every render ───
interface NavItemContentProps {
    item: NavItem;
    active: boolean;
    isCollapsed: boolean;
}

const NavItemContent = React.memo(({ item, active, isCollapsed }: NavItemContentProps) => (
    <div
        className={clsx(
            'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] transition-all duration-200 relative',
            active
                ? 'bg-white/10 text-white'
                : 'text-white/70 hover:bg-white/5 hover:text-white',
            isCollapsed && 'justify-center px-2'
        )}
    >
        {active && !isCollapsed && (
            <motion.div
                layoutId="active-indicator"
                className="absolute left-0 top-0 bottom-0 w-1 bg-brand-accent rounded-r-full"
            />
        )}

        <span className={clsx("transition-transform duration-200", active ? "scale-105" : "group-hover:scale-110")}>
            {item.icon}
        </span>

        {!isCollapsed && (
            <span className="truncate transition-all duration-200">
                {item.label}
            </span>
        )}
    </div>
));
NavItemContent.displayName = 'NavItemContent';

export const Sidebar: React.FC = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { isCollapsed } = useSidebar();
    const [user, setUser] = useState<{ name: string; email: string; role?: string; avatarUrl?: string } | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const session = loadSession();
            if (session?.accessToken) {
                try {
                    const profile = await api<{ name: string; email: string; role?: string; avatarUrl?: string }>('/auth/me');
                    setUser(profile);
                    // Also get tenant info
                    const sessionData = loadSession();
                    if (sessionData?.tenantSlug) {
                        setTenantName(sessionData.tenantSlug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '));
                    }
                } catch (e) {
                    console.error("Failed to load user profile in sidebar", e);
                }
            }
        };
        fetchUser();
    }, []);

    const [tenantName, setTenantName] = useState('Evolution');

    const handleLogout = () => {
        clearSession();
        router.push('/login');
    };

    const isActive = (href: string) => {
        if (href === '/dashboard') {
            return pathname === '/dashboard';
        }
        return pathname.startsWith(href);
    };

    return (
        <motion.div
            className="flex h-screen flex-col bg-brand-primary shadow-lg text-white border-r border-white/10 relative z-50 transition-all"
            initial={false}
            animate={{ width: isCollapsed ? 80 : 256 }}
            transition={{ duration: 0.1, ease: "easeInOut" }}
        >
            {/* Header */}
            <div
                suppressHydrationWarning
                className={clsx("flex items-center justify-center border-b border-white/10 transition-all duration-300", isCollapsed ? "h-20 px-2" : "h-20 px-6")}
            >
                <div
                    suppressHydrationWarning
                    className={clsx(
                        "flex items-center justify-center transition-all duration-300",
                        isCollapsed ? "h-10 w-10" : "h-12 w-full"
                    )}
                >
                    <img
                        src="/logozonaside.png"
                        alt="Logo"
                        className="w-full h-full object-contain brightness-0 invert"
                    />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-6 scrollbar-hide">
                {navigation
                    .filter((item) => canAccessNav(user?.role, item.href))
                    .map((item) => {
                        const active = isActive(item.href);

                        if (isCollapsed) {
                            return (
                                <Tooltip key={item.href} content={item.label} placement="right" color="primary">
                                    <Link href={item.href} className="block mb-1">
                                        <NavItemContent item={item} active={active} isCollapsed={isCollapsed} />
                                    </Link>
                                </Tooltip>
                            );
                        }

                        return (
                            <Link key={item.href} href={item.href} className="block mb-1">
                                <NavItemContent item={item} active={active} isCollapsed={isCollapsed} />
                            </Link>
                        );
                    })}

                {/* Settings Separator */}
                <div className="mt-8 border-t border-white/10 pt-4">
                    {settingsNav
                        .filter((item) => canAccessNav(user?.role, item.href))
                        .map((item) => {
                            const active = isActive(item.href);
                            if (isCollapsed) {
                                return (
                                    <Tooltip key={item.href} content={item.label} placement="right" color="primary">
                                        <Link href={item.href} className="block mb-1">
                                            <NavItemContent item={item} active={active} isCollapsed={isCollapsed} />
                                        </Link>
                                    </Tooltip>
                                );
                            }
                            return (
                                <Link key={item.href} href={item.href} className="block mb-1">
                                    <NavItemContent item={item} active={active} isCollapsed={isCollapsed} />
                                </Link>
                            );
                        })}
                </div>
            </nav>

            <div className="border-t border-white/10 p-4 overflow-hidden">
                <div className={clsx("flex items-center gap-3 group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors", isCollapsed && "justify-center")} onClick={() => router.push('/dashboard/perfil')}>
                    {user?.avatarUrl ? (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full overflow-hidden shrink-0 border border-white/20">
                            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-gold text-sm font-bold text-brand-primary uppercase shrink-0">
                            {user?.name?.substring(0, 2) || 'AD'}
                        </div>
                    )}
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0 flex items-center justify-between overflow-hidden transition-all duration-200">
                            <div className="overflow-hidden">
                                <p className="text-sm font-semibold text-white truncate">{user?.name || 'Admin'}</p>
                                <p className="text-xs text-white/60 truncate">{user?.role || 'Owner'}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="text-white/50 hover:text-white transition-colors p-1"
                                title="Cerrar Sesión"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
