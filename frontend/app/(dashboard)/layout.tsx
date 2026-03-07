'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { KeyboardShortcuts } from '@/components/ui/keyboard-shortcuts';
import { ChatWidget } from '@/components/chat';
import { useAuth } from '@/lib/contexts/auth-context';
import { SidebarProvider, useSidebar } from '@/lib/contexts/sidebar-context';
import { Spinner } from '@heroui/react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

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
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" color="primary" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <motion.main
        initial={false}
        animate={{ paddingLeft: sidebarWidth }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="min-h-screen min-w-0 overflow-x-hidden pt-12"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={typeof window !== 'undefined' ? window.location.pathname : ''}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="min-w-0 p-4 sm:p-6"
          >
            <Breadcrumbs />
            {children}
          </motion.div>
        </AnimatePresence>
      </motion.main>

      {/* Keyboard Shortcuts (global listener + help modal) */}
      <KeyboardShortcuts />

      {/* Chat Widget */}
      <ChatWidget />
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
