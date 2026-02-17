'use client';

import React from 'react';
import { Search, Bell, User } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';

export const Topbar: React.FC = () => {
    return (
        <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border-subtle bg-surface px-4 md:px-6">
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

                <div className="flex items-center gap-3 pl-2">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-sm font-semibold text-text-primary">Admin Usuario</span>
                        <span className="text-[10px] text-text-secondary uppercase tracking-wider">Owner</span>
                    </div>
                    <div className="h-9 w-9 overflow-hidden rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-sm ring-2 ring-white shadow-sm">
                        <span>AU</span>
                    </div>
                </div>
            </div>
        </header>
    );
};
