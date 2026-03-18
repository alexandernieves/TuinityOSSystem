'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { KeyboardShortcuts } from '@/components/ui/keyboard-shortcuts';
import { useAuth } from '@/lib/contexts/auth-context';
import { SidebarProvider, SidebarInset, useSidebar } from '@/components/ui/sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

import { LoadingScreen } from '@/components/ui/loading-screen';

function DashboardContent({ children }: DashboardLayoutProps) {
  return (
    <SidebarInset>
      <div className="flex flex-col h-full">
        {/* TopBar */}
        <Header />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto relative">
          <div
            className="relative bg-muted/30 min-h-full"
            style={{ zIndex: 1 }}
          >
            <div className="py-5 px-4 lg:px-6 min-h-screen">
              <Breadcrumbs />
              <AnimatePresence mode="wait">
                <motion.div
                  key={typeof window !== 'undefined' ? window.location.pathname : ''}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>

        {/* Keyboard Shortcuts & Global Widgets */}
        <KeyboardShortcuts />
      </div>
    </SidebarInset>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return <LoadingScreen />;
  }

  // If not authenticated, don't show the dashboard layout at all
  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}
