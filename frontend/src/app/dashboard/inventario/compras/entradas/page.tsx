'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Search, Filter, Calendar, Building, Package, Clock, ShieldCheck, ChevronLeft, ChevronRight, Inbox
} from 'lucide-react';
import { api } from '@/lib/api';
import { SharedProductImage } from '@/components/shared/SharedProductImage';

interface PurchaseEntry {
    id: string;
    productId: string;
    branchId: string;
    quantity: number;
    reason: string;
    referenceId: string;
    createdAt: string;
    product: {
        id: string;
        description: string;
        internalReference: string | null;
        mainImageUrl: string | null;
    };
    branch: {
        id: string;
        name: string;
    };
}

export default function ConsultaEntradasPage() {
    const router = useRouter();

    const [mounted, setMounted] = useState(false);
    const [entries, setEntries] = useState<PurchaseEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    const loadEntries = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api<{ items: PurchaseEntry[], meta: any }>(`/purchases/entries/history?page=${page}&limit=50`);
            setEntries(response.items);
            setTotalPages(response.meta.totalPages);
        } catch (e) {
            console.error('Error loading entries:', e);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        setMounted(true);
        loadEntries();
    }, [loadEntries]);

    const filteredEntries = entries.filter(entry =>
        entry.product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.product.internalReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.reason.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-[#F7F9FC]" suppressHydrationWarning>
            <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-500">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => router.push('/dashboard/inventario/compras')} className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#2563EB] hover:border-[#2563EB] transition-all shadow-sm">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-[#0F172A] tracking-tight uppercase">Historial de Entradas</h1>
                            <p className="text-xs font-medium text-[#64748B] mt-1">Registro de mercancía física recibida en almacenes.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                        <input
                            type="text"
                            placeholder="Buscar por producto, referencia o n° de orden..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] font-medium placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <div className="overflow-x-auto min-h-[400px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="w-8 h-8 border-4 border-[#E2E8F0] border-t-[#2563EB] rounded-full animate-spin"></div>
                                <p className="text-[#64748B] text-sm font-medium mt-4">Cargando historial logístico...</p>
                            </div>
                        ) : filteredEntries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                                <div className="w-16 h-16 bg-[#F1F5F9] rounded-full flex items-center justify-center mb-4">
                                    <Inbox className="w-8 h-8 text-[#94A3B8]" />
                                </div>
                                <h3 className="text-[#0F172A] font-black text-lg">No hay entradas registradas</h3>
                                <p className="text-[#64748B] text-sm max-w-sm mt-1">No se encontró historial físico de recepción de compras con ese término.</p>
                            </div>
                        ) : (
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                        <th className="px-5 py-4 text-left text-[9px] font-black text-[#64748B] uppercase tracking-widest">Fecha y Hora</th>
                                        <th className="px-5 py-4 text-left text-[9px] font-black text-[#64748B] uppercase tracking-widest">Artículo Físico</th>
                                        <th className="px-5 py-4 text-left text-[9px] font-black text-[#64748B] uppercase tracking-widest">Almacén Destino</th>
                                        <th className="px-5 py-4 text-left text-[9px] font-black text-[#64748B] uppercase tracking-widest">Doc. Ref</th>
                                        <th className="px-5 py-4 text-right text-[9px] font-black text-[#64748B] uppercase tracking-widest">Cant. Recibida</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E2E8F0] bg-white">
                                    {filteredEntries.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-black text-[#0F172A]">{new Date(entry.createdAt).toLocaleDateString()}</span>
                                                    <span className="text-[10px] text-[#64748B] font-mono flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 w-[40%]">
                                                <div className="flex items-center gap-3">
                                                    <SharedProductImage src={entry.product.mainImageUrl} size={10} className="border border-[#E2E8F0]" />
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-xs font-black text-[#0F172A] uppercase line-clamp-2">{entry.product.description}</span>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[9px] text-[#2563EB] font-mono px-1.5 py-0.5 bg-[#DBEAFE]/50 rounded-md border border-[#BFDBFE]">
                                                                REF: {entry.product.internalReference || 'S/REF'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Building className="w-4 h-4 text-[#94A3B8]" />
                                                    <span className="text-xs font-bold text-[#475569] uppercase">{entry.branch.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-[#64748B]">
                                                    <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                                                    <span className="uppercase">{entry.reason.replace('Purchase Order ', 'ORD-')}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-right whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#DCFCE7]/70 text-[#166534] border border-[#16A34A]/20 rounded-lg text-sm font-black shadow-sm">
                                                    <Package className="w-3.5 h-3.5" />
                                                    +{entry.quantity}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="px-5 py-3 border-t border-[#E2E8F0] bg-[#FBFCFE] flex items-center justify-between">
                        <span className="text-xs font-medium text-[#64748B]">
                            Página {page} de {totalPages}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-1.5 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-white hover:text-[#0F172A] hover:border-[#CBD5E1] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-1.5 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-white hover:text-[#0F172A] hover:border-[#CBD5E1] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
