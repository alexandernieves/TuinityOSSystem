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
    ChevronDown
} from 'lucide-react';
import { clsx } from 'clsx';
import { loadSession, clearSession } from '@/lib/auth-storage';
import { api } from '@/lib/api';

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

    return (
        <div className="flex h-screen w-64 flex-col bg-brand-primary shadow-lg text-white">
            {/* Header */}
            <div className="flex h-16 flex-col justify-center px-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                        <span className="font-bold text-lg">E</span>
                    </div>
                    <div>
                        <h1 className="text-base font-semibold leading-none tracking-tight">Evolution</h1>
                        <p className="text-[10px] text-white/60 uppercase tracking-wider mt-1">ZONA LIBRE</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
                {navigation.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] transition-all duration-200',
                                active
                                    ? 'bg-white/10 text-white border-l-2 border-brand-accent pl-[10px]'
                                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                            )}
                        >
                            <span className={clsx("transition-transform duration-200", active ? "scale-105" : "group-hover:scale-110")}>
                                {item.icon}
                            </span>
                            {item.label}
                        </Link>
                    );
                })}

                {/* Settings Separator */}
                <div className="mt-8 border-t border-white/10 pt-4">
                    {settingsNav.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={clsx(
                                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] transition-all duration-200',
                                    active
                                        ? 'bg-white/10 text-white border-l-2 border-brand-accent pl-[10px]'
                                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                                )}
                            >
                                <span className={clsx("transition-transform duration-200", active ? "scale-105" : "group-hover:scale-110")}>
                                    {item.icon}
                                </span>
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* User Profile Footer */}
            <div className="border-t border-white/10 p-4">
                <div className="flex items-center gap-3 group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-gold text-sm font-bold text-brand-primary uppercase">
                        {user?.name?.substring(0, 2) || 'AD'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{user?.name || 'Admin Usuario'}</p>
                        <p className="text-xs text-white/60 truncate">{user?.role || 'Gerente General'}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-white/50 hover:text-white transition-colors p-1"
                        title="Cerrar Sesión"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                    {/* Chevron for looks mostly, as logout is distinct button above */}
                    <ChevronDown className="h-4 w-4 text-white/50" />
                </div>
            </div>
        </div>
    );
};
