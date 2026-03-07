'use client';

import { HeroUIProvider } from '@heroui/react';
import { ThemeProvider, useTheme } from 'next-themes';
import { AuthProvider } from '@/lib/contexts/auth-context';
import { Toaster } from 'sonner';
import type { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

function ToasterWithTheme() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      toastOptions={{
        style: {
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
        },
      }}
    />
  );
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
      <HeroUIProvider>
        <AuthProvider>
          {children}
          <ToasterWithTheme />
        </AuthProvider>
      </HeroUIProvider>
    </ThemeProvider>
  );
}
