import React from 'react';
import { Search, Bell, ChevronRight, Sun, Moon, LogOut } from 'lucide-react';
import { subMenus, MenuItem } from '@/config/dashboard-menu';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardHeaderProps {
    activeSection: string;
    activeSubCategory: MenuItem | null;
    setActiveSubCategory: (item: MenuItem | null) => void;
}

export function DashboardHeader({
    activeSection,
    activeSubCategory,
    setActiveSubCategory,
}: DashboardHeaderProps) {

    return (
        <header className="flex justify-between items-center z-20 bg-white px-6 md:px-8 py-5 border-b border-slate-200 sticky top-0 w-full">
            <div>
                {/* Breadcrumb Navigation */}
                <nav className="flex items-center text-sm md:text-base font-medium text-muted-foreground animate-element">
                    {/* 1. Root / Dashboard */}
                    {activeSection === 'dashboard' ? (
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Resumen General</h1>
                    ) : (
                        <div className="flex items-center gap-2">
                            {/* Level 1: Main Section */}
                            <span
                                onClick={() => setActiveSubCategory(null)}
                                className={cn(
                                    "cursor-pointer hover:text-foreground transition-colors",
                                    !activeSubCategory && "text-slate-900 font-bold text-2xl tracking-tight"
                                )}
                            >
                                {subMenus[activeSection as keyof typeof subMenus]?.title || 'Panel'}
                            </span>

                            {/* Level 2: Sub Category (if active) */}
                            {activeSubCategory && (
                                <>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
                                    <span className="text-slate-900 font-bold text-2xl tracking-tight">
                                        {activeSubCategory.label}
                                    </span>
                                </>
                            )}
                        </div>
                    )}
                </nav>
                <p className="text-sm text-slate-500 mt-0.5 hidden md:block">Gestione su negocio desde un solo lugar</p>
            </div>

            <div className="flex items-center gap-6">
                {/* Buscador */}
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                </div>
                <button className="md:hidden flex items-center justify-center rounded-full h-10 w-10 bg-slate-100 text-slate-600">
                    <Search className="w-5 h-5" />
                </button>

                {/* Notificaciones */}
                <button className="flex items-center justify-center rounded-full h-10 w-10 bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-background"></span>
                </button>
            </div>
        </header>
    );
}
