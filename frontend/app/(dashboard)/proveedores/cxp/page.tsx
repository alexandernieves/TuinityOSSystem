'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@heroui/react';
import { Search, CreditCard, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/services/api';

function fmt(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export default function CXPPage() {
    const router = useRouter();
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        api.getSuppliers().then((data) => {
            setSuppliers(data.filter((s: any) => (s.currentBalance || 0) > 0));
        }).catch(console.error).finally(() => setIsLoading(false));
    }, []);

    const filtered = suppliers.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.code || '').toLowerCase().includes(search.toLowerCase())
    );

    const totalCXP = suppliers.reduce((sum, s) => sum + (s.currentBalance || 0), 0);

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="flex gap-1">{[0, 1, 2].map(i => <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-emerald-500" style={{ animationDelay: `${i * 75}ms` }} />)}</div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Cuentas por Pagar</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Proveedores a los que la empresa les debe dinero.</p>
                </div>
                <Button
                    color="primary"
                    className="font-medium shadow-sm"
                    startContent={<CreditCard className="h-4 w-4" />}
                    onPress={() => router.push('/proveedores/cxp/nuevo-pago')}
                >
                    Registrar Pago
                </Button>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-5 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Total CXP</p>
                    <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">{fmt(totalCXP)}</p>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-5 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Proveedores con Deuda</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{suppliers.length}</p>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-5 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Promedio por Proveedor</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{fmt(suppliers.length > 0 ? totalCXP / suppliers.length : 0)}</p>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-[#222]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="text" placeholder="Buscar proveedor..." value={search} onChange={e => setSearch(e.target.value)} className="h-10 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-900 dark:text-white placeholder:text-gray-400" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50 dark:bg-[#1a1a1a]/50 text-xs text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3 font-medium">Proveedor</th>
                                <th className="px-6 py-3 font-medium">País</th>
                                <th className="px-6 py-3 font-medium text-right">Deuda Pendiente</th>
                                <th className="px-6 py-3 font-medium text-right">Pagar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-gray-400">
                                        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400 mb-2" />
                                        <p>No hay cuentas pendientes de pago.</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(s => (
                                    <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 dark:text-white">{s.name}</div>
                                            <div className="text-xs text-gray-500">{s.code}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{s.country || '—'}</td>
                                        <td className="px-6 py-4 text-right font-semibold text-red-600 dark:text-red-400">{fmt(s.currentBalance || 0)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <Button size="sm" color="primary" variant="flat" endContent={<ArrowRight className="h-3 w-3" />}
                                                onPress={() => router.push(`/proveedores/cxp/nuevo-pago?supplierId=${s.id}&supplierName=${encodeURIComponent(s.name)}`)}>
                                                Pagar
                                            </Button>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
