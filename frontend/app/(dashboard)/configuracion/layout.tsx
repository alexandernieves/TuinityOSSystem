'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';

export default function ConfiguracionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { checkPermission, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !checkPermission('canAccessConfiguracion')) {
      router.replace('/dashboard');
    }
  }, [checkPermission, isLoading, router]);

  if (isLoading || !checkPermission('canAccessConfiguracion')) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return <>{children}</>;
}
