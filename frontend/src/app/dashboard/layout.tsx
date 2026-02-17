'use client';

import React, { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { registerPushNotifications } from '@/lib/push-notifications';

import { SidebarProvider } from '@/components/layout/SidebarContext';

export default function DashboardLayout({
    children,
}: {
    children: ReactNode;
}) {
    useEffect(() => {
        // Register push notifications on mount
        registerPushNotifications();
    }, []);
    return (
        <SidebarProvider>
            <div className="flex h-screen overflow-hidden" suppressHydrationWarning>
                {/* Sidebar */}
                <Sidebar />

                {/* Main Content Area */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Topbar */}
                    <Topbar />

                    {/* Page Content */}
                    <main className="flex-1 overflow-auto bg-bg-base p-6 pt-4">
                        <div className="mx-auto max-w-7xl space-y-4">
                            <Breadcrumb />
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
