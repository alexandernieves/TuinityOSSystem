import type { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { SidebarProvider } from '@/components/layout/SidebarContext';

export default function DashboardLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <SidebarProvider>
            <div className="flex h-screen w-full bg-[#F8F9FA] overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-8 lg:px-10 lg:py-10">
                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
