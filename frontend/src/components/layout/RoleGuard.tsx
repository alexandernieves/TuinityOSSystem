'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';
import { canAccessNav, NAV_ACCESS } from '@/lib/rbac';
import { ShieldX } from 'lucide-react';

/** Wraps any dashboard page. Redirects if the user's role is not allowed. */
export function RoleGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [status, setStatus] = useState<'loading' | 'allowed' | 'denied'>('loading');

    useEffect(() => {
        const check = async () => {
            const session = loadSession();
            if (!session?.accessToken) {
                router.push('/login');
                return;
            }
            try {
                const profile = await api<{ role: string }>('/auth/me');
                const role = profile.role;

                // Find the most specific matching nav path (longest match wins)
                const routeKey = Object.keys(NAV_ACCESS)
                    .filter((k) => pathname.startsWith(k))
                    .sort((a, b) => b.length - a.length)[0];

                if (!routeKey || canAccessNav(role, routeKey)) {
                    setStatus('allowed');
                } else {
                    setStatus('denied');
                }
            } catch {
                router.push('/login');
            }
        };
        check();
    }, [pathname]);

    if (status === 'loading') {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2563EB] border-t-transparent" />
            </div>
        );
    }

    if (status === 'denied') {
        return (
            <div className="flex flex-col items-center justify-center h-full py-24 text-center gap-5">
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                    <ShieldX className="w-10 h-10 text-red-500" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-[#0F172A]">Acceso Denegado</h2>
                    <p className="text-sm text-[#475569] mt-2 max-w-sm">
                        Tu rol no tiene permisos para acceder a esta sección. Contacta con el administrador si crees que es un error.
                    </p>
                </div>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="px-5 py-2.5 text-sm bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors"
                >
                    Volver al Dashboard
                </button>
            </div>
        );
    }

    return <>{children}</>;
}

