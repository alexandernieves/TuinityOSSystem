'use client';

import React, { useState, useEffect } from 'react';
import { Search, Bell, User, PanelLeft, LogOut } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { useSidebar } from '@/components/layout/SidebarContext';
import { Button } from '@/components/ui/Button';
import { loadSession } from '@/lib/auth-storage';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { clearSession } from '@/lib/auth-storage';

export const Topbar: React.FC = () => {
    const { toggleSidebar } = useSidebar();
    const router = useRouter();
    const [user, setUser] = useState<{ name: string; role?: string; avatarUrl?: string } | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const session = loadSession();
            if (session?.accessToken) {
                try {
                    const profile = await api<{ name: string; role?: string; avatarUrl?: string }>('/auth/me');
                    setUser(profile);
                } catch (e) {
                    console.error("Failed to load user profile in topbar", e);
                }
            }
        };
        fetchUser();
    }, []);

    const name = user?.name || 'Usuario';
    const role = user?.role || 'User';
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    return (
        <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border-subtle bg-surface px-4 md:px-6 gap-4">
            <Button
                variant="ghost"
                onClick={toggleSidebar}
                className="hidden md:flex text-text-secondary hover:text-text-primary h-12 w-12 p-0 !border-none !outline-none !ring-0 !ring-offset-0 focus:!ring-0 focus:!ring-offset-0 focus-visible:!ring-0 focus-visible:!outline-none shadow-none !bg-transparent"
                aria-label="Toggle Sidebar"
            >
                <PanelLeft className="h-7 w-7" />
            </Button>

            {/* Search Bar - Hidden on mobile, visible on md+ */}
            <div className="hidden md:flex flex-1 max-w-xl">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
                    <input
                        type="text"
                        placeholder="Buscar productos, clientes, ventas..."
                        className="w-full h-10 rounded-lg border border-border-subtle bg-bg-base pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary transition-all focus:border-brand-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                </div>
            </div>

            {/* Mobile Search Trigger */}
            <button className="md:hidden p-2 text-text-secondary hover:text-text-primary">
                <Search className="h-5 w-5" />
            </button>

            {/* Right Actions */}
            <div className="flex items-center gap-3 md:gap-4 ml-auto">
                <NotificationCenter />

                <div className="h-8 w-[1px] bg-border-subtle hidden md:block"></div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-3 pl-2 outline-none hover:bg-surface-hover p-1 rounded-lg transition-colors cursor-pointer text-left">
                            <div className="hidden md:flex flex-col items-end">
                                <span className="text-sm font-semibold text-text-primary">{name}</span>
                                <span className="text-[10px] text-text-secondary uppercase tracking-wider">{role}</span>
                            </div>
                            {user?.avatarUrl ? (
                                <div className="h-9 w-9 overflow-hidden rounded-full ring-2 ring-white shadow-sm shrink-0">
                                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="h-9 w-9 overflow-hidden rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-sm ring-2 ring-white shadow-sm shrink-0">
                                    <span>{initials}</span>
                                </div>
                            )}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 mt-2">
                        <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/dashboard/perfil')} className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" />
                            <span>Configuración de Perfil</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => {
                                clearSession();
                                router.push('/login');
                            }}
                            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Cerrar Sesión</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
};
