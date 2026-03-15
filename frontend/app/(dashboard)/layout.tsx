'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { KeyboardShortcuts } from '@/components/ui/keyboard-shortcuts';
import { useAuth } from '@/lib/contexts/auth-context';
import { SidebarProvider, useSidebar } from '@/lib/contexts/sidebar-context';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

import { LoadingScreen } from '@/components/ui/loading-screen';

function DashboardContent({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { sidebarWidth } = useSidebar();

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

  // Don't render dashboard if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#1a1a1a] overflow-hidden">
      {/* TopBar */}
      <Header />

      <div className="flex flex-1 relative overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main
          className="flex-1 h-full overflow-y-auto bg-[#1a1a1a] relative"
          style={{ borderTopRightRadius: '16px' }}
        >
          <div
            className="relative bg-[#f1f1f1] min-h-full"
            style={{ zIndex: 1, borderTopRightRadius: '16px' }}
          >
            <div className="p-5 max-w-[920px] mx-auto min-h-screen">
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
      </div>

      {/* Keyboard Shortcuts & Global Widgets */}
      <KeyboardShortcuts />
    </div>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}
