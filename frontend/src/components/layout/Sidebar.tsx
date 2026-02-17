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
    ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { loadSession, clearSession } from '@/lib/auth-storage';
import { api } from '@/lib/api';
import { useSidebar } from '@/components/layout/SidebarContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip } from '@heroui/react';

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

export const Sidebar: React.FC = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { isCollapsed } = useSidebar();
    const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const session = loadSession();
            if (session?.accessToken) {
                try {
                    const profile = await api<{ name: string; email: string; role?: string }>('/auth/me');
                    setUser(profile);
                } catch (e) {
                    console.error("Failed to load user profile in sidebar", e);
                }
            }
        };
        fetchUser();
    }, []);

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

    const NavItemContent = ({ item, active }: { item: NavItem, active: boolean }) => (
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
                <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="truncate"
                >
                    {item.label}
                </motion.span>
            )}
        </div>
    );

    return (
        <motion.div
            className="flex h-screen flex-col bg-brand-primary shadow-lg text-white border-r border-white/10 relative z-50 transition-all"
            initial={false}
            animate={{ width: isCollapsed ? 80 : 256 }}
            transition={{ duration: 0.1, ease: "easeInOut" }}
        >
            {/* Header */}
            <div className={clsx("flex h-16 flex-col justify-center border-b border-white/10 transition-all", isCollapsed ? "items-center px-0" : "px-6")}>
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 shrink-0">
                        <span className="font-bold text-lg">E</span>
                    </div>
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="overflow-hidden whitespace-nowrap"
                        >
                            <h1 className="text-base font-semibold leading-none tracking-tight">Evolution</h1>
                            <p className="text-[10px] text-white/60 uppercase tracking-wider mt-1">ZONA LIBRE</p>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-6 scrollbar-hide">
                {navigation.map((item) => {
                    const active = isActive(item.href);

                    if (isCollapsed) {
                        return (
                            <Tooltip key={item.href} content={item.label} placement="right" color="primary">
                                <Link href={item.href} className="block mb-1">
                                    <NavItemContent item={item} active={active} />
                                </Link>
                            </Tooltip>
                        );
                    }

                    return (
                        <Link key={item.href} href={item.href} className="block mb-1">
                            <NavItemContent item={item} active={active} />
                        </Link>
                    );
                })}

                {/* Settings Separator */}
                <div className="mt-8 border-t border-white/10 pt-4">
                    {settingsNav.map((item) => {
                        const active = isActive(item.href);
                        if (isCollapsed) {
                            return (
                                <Tooltip key={item.href} content={item.label} placement="right" color="primary">
                                    <Link href={item.href} className="block mb-1">
                                        <NavItemContent item={item} active={active} />
                                    </Link>
                                </Tooltip>
                            );
                        }
                        return (
                            <Link key={item.href} href={item.href} className="block mb-1">
                                <NavItemContent item={item} active={active} />
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* User Profile Footer */}
            <div className="border-t border-white/10 p-4 overflow-hidden">
                <div className={clsx("flex items-center gap-3 group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors", isCollapsed && "justify-center")}>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-gold text-sm font-bold text-brand-primary uppercase shrink-0">
                        {user?.name?.substring(0, 2) || 'AD'}
                    </div>
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="flex-1 min-w-0 flex items-center justify-between"
                        >
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
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
