'use client';

import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/lib/contexts/auth-context';
import { AlertProvider } from '@/components/providers/alert-provider';
import { Toaster } from '@/components/ui/sonner';
import type { ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      storageKey="evolution-theme"
      enableSystem={false}
      disableTransitionOnChange
    >
      <TooltipProvider>
        <AuthProvider>
          <AlertProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </AlertProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
