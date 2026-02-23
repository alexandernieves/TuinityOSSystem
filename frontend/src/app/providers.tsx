'use client';

import { HeroUIProvider } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { AppModalProvider } from '@/components/ui/app-modal-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={router.push}>
      <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
        <AppModalProvider>
          <Toaster richColors position="top-center" />
          {children}
        </AppModalProvider>
      </ThemeProvider>
    </HeroUIProvider>
  );
}
