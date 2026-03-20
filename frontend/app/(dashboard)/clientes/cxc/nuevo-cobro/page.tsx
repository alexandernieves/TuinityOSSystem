'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CircleDollarSign, Save, CheckCircle2 } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { api } from '@/lib/services/api';
import { SkeletonDashboard } from '@/components/ui/skeleton-dashboard';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

export default function NewCollectionPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const prefilledClientId = searchParams.get('clientId') || '';

    const [clients, setClients] = useState<any[]>([]);
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [amount, setAmount] = useState<number>(0);
    const [applications, setApplications] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        api.getClients().then(data => {
            const activeClients = data.filter((c: any) => c.status === 'active');
            setClients(activeClients);
            if (prefilledClientId) {
                const found = activeClients.find((c: any) => c.id === prefilledClientId);
                if (found) setSelectedClient(found);
            }
        }).catch(console.error).finally(() => setIsFetching(false));
    }, [prefilledClientId]);

    useEffect(() => {
        if (selectedClient) {
            api.getSales({ clientId: selectedClient.id, status: 'facturado' })
               .then(data => {
                   const pending = data.filter((d: any) => d.documentType === 'factura' && d.status !== 'pagado');
                   setInvoices(pending.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
               });
        } else {
            setInvoices([]);
        }
    }, [selectedClient]);

    // Auto-apply FIFO
    useEffect(() => {
        let remaining = amount;
        const newApps: Record<string, number> = {};
        
        for (const inv of invoices) {
            if (remaining <= 0) break;
            const toApply = Math.min(remaining, Number(inv.total));
            newApps[inv.id] = toApply;
            remaining -= toApply;
        }
        setApplications(newApps);
    }, [amount, invoices]);

    const handleManualApply = (invId: string, val: number) => {
       const newApps = { ...applications, [invId]: val };
       setApplications(newApps);
       const total = Object.values(newApps).reduce((a, b) => a + b, 0);
       setAmount(total);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedClient) return toast.error('Selecciona un cliente');
        if (amount <= 0) return toast.error('El monto debe ser mayor a 0');

        setIsLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            // 1. Create Receipt
            const receipt = await api.createPayment({
                type: 'inbound',
                entityType: 'client',
                entityId: selectedClient.id,
                entityName: selectedClient.name,
                amount,
                paymentMethod: formData.get('paymentMethod') as string,
                referenceNumber: formData.get('referenceNumber') as string,
                notes: formData.get('notes') as string,
                date: new Date().toISOString(),
            });

            // 2. Apply to Invoices
            const applicationsList = Object.entries(applications).filter(([_, val]) => val > 0);
            for (const [invId, val] of applicationsList) {
                await api.applyReceipt(receipt.id, invId, val);
            }

            toast.success(`Cobro de ${formatCurrency(amount)} registrado y aplicado correctamente`);
            router.push(`/clientes/${selectedClient.id}?tab=cxc`);
        } catch (err: any) {
            toast.error(err.message || 'Error al registrar cobro');
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) return <SkeletonDashboard />;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Registrar Cobro (CXC)</h1>
                    <p className="text-sm text-gray-500">Registra un pago y aplícalo a facturas pendientes.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] shadow-sm p-6 space-y-5">
                        <div className="space-y-4">
                            <div>
                                <Label className="text-[13px] font-semibold">Cliente *</Label>
                                <Select
                                    required
                                    value={selectedClient?.id || ''}
                                    onValueChange={value => setSelectedClient(clients.find(c => c.id === value) || null)}
                                >
                                    <SelectTrigger className="h-11 rounded-xl mt-1.5 focus:ring-0">
                                        <SelectValue placeholder="Busca un cliente..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map(c => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name} ({c.reference})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-[13px] font-semibold">Monto Total Recibido ($)</Label>
                                    <div className="relative mt-1.5">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={amount}
                                            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                                            className="h-11 pl-7 rounded-xl"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-[13px] font-semibold">Método de Pago</Label>
                                    <Select name="paymentMethod" defaultValue="transferencia">
                                        <SelectTrigger className="h-11 rounded-xl mt-1.5">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="efectivo">Efectivo</SelectItem>
                                            <SelectItem value="transferencia">Transferencia</SelectItem>
                                            <SelectItem value="cheque">Cheque</SelectItem>
                                            <SelectItem value="tarjeta">Tarjeta</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-[#222] bg-gray-50/50">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Distribución a Facturas</h3>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-[#222]">
                            {invoices.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-sm">
                                    No hay facturas pendientes para este cliente.
                                </div>
                            ) : (
                                invoices.map(inv => (
                                    <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{inv.orderNumber}</p>
                                            <p className="text-xs text-gray-500">Fecha: {new Date(inv.createdAt).toLocaleDateString()} | Saldo: {formatCurrency(inv.total)}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-32">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">$</span>
                                                <input
                                                    type="number"
                                                    value={applications[inv.id] || 0}
                                                    onChange={(e) => handleManualApply(inv.id, parseFloat(e.target.value) || 0)}
                                                    className="w-full pl-5 pr-2 py-1.5 text-right text-xs font-bold rounded-lg border border-gray-200 bg-white"
                                                />
                                            </div>
                                            {(applications[inv.id] || 0) >= Number(inv.total) && (
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] shadow-sm p-6 space-y-4">
                        <Label className="text-[13px] font-semibold">Detalles del Pago</Label>
                        <div className="space-y-4">
                            <div>
                                <Label className="text-xs text-gray-500">Referencia / Observaciones</Label>
                                <Input name="referenceNumber" placeholder="# de transacción..." className="mt-1" />
                            </div>
                            <div>
                                <Label className="text-xs text-gray-500">Notas Internas</Label>
                                <Textarea name="notes" rows={4} className="mt-1 resize-none" />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-[#222]">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-500">Total a Aplicar:</span>
                                <span className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(amount)}</span>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading || amount === 0}
                            className="w-full bg-[#253D6B] hover:bg-[#1e3156] text-white py-6 rounded-xl text-lg transition-transform active:scale-95"
                        >
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirmar Cobro'}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}

function Loader2({ className }: { className?: string }) {
    return <div className={cn("h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin", className)} />;
}

