'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, Select, SelectItem, Textarea } from '@heroui/react';
import { ArrowLeft, CircleDollarSign, Save } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/services/api';
import { SkeletonDashboard } from '@/components/ui/skeleton-dashboard';

function fmt(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export default function NewCollectionPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const prefilledClientId = searchParams.get('clientId') || '';
    const prefilledClientName = searchParams.get('clientName') || '';

    const [clients, setClients] = useState<any[]>([]);
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        api.getClients().then(data => {
            const withBalance = data.filter((c: any) => c.currentBalance > 0);
            setClients(withBalance);
            if (prefilledClientId) {
                const found = withBalance.find((c: any) => c.id === prefilledClientId);
                if (found) setSelectedClient(found);
            }
        }).catch(console.error).finally(() => setIsFetching(false));
    }, [prefilledClientId]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedClient) return toast.error('Selecciona un cliente');

        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        const amount = parseFloat(formData.get('amount') as string);

        if (amount <= 0) {
            toast.error('El monto debe ser mayor a 0');
            setIsLoading(false);
            return;
        }

        try {
            await api.createPayment({
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
            toast.success(`Cobro de ${fmt(amount)} registrado para ${selectedClient.name}`);
            router.push('/clientes/cxc');
        } catch (err: any) {
            toast.error(err.message || 'Error al registrar cobro');
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return <SkeletonDashboard />;
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Button isIconOnly variant="light" onPress={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Registrar Cobro (CXC)</h1>
                    <p className="text-sm text-gray-500">Registra un abono o pago total de un cliente.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] shadow-sm p-6 space-y-5">
                    {/* Cliente */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cliente *</label>
                        <select
                            required
                            value={selectedClient?.id || ''}
                            onChange={e => setSelectedClient(clients.find(c => c.id === e.target.value) || null)}
                            className="w-full h-12 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] px-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="">-- Selecciona un cliente --</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.name} — Debe: {fmt(c.currentBalance)}</option>
                            ))}
                        </select>
                    </div>

                    {selectedClient && (
                        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 flex items-center justify-between">
                            <span className="text-sm text-amber-800 dark:text-amber-300">Saldo pendiente actual:</span>
                            <span className="font-bold text-amber-700 dark:text-amber-300">{fmt(selectedClient.currentBalance)}</span>
                        </div>
                    )}

                    <Input
                        label="Monto Recibido ($)"
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={selectedClient?.currentBalance}
                        placeholder="0.00"
                        isRequired
                        startContent={<span className="text-gray-400 text-sm">$</span>}
                    />

                    <Select label="Método de Pago" name="paymentMethod" defaultSelectedKeys={['transferencia']} isRequired>
                        <SelectItem key="efectivo">Efectivo</SelectItem>
                        <SelectItem key="transferencia">Transferencia Bancaria</SelectItem>
                        <SelectItem key="cheque">Cheque</SelectItem>
                        <SelectItem key="tarjeta">Tarjeta</SelectItem>
                        <SelectItem key="otro">Otro</SelectItem>
                    </Select>

                    <Input
                        label="Referencia / # Cheque / # Transacción"
                        name="referenceNumber"
                        placeholder="Opcional"
                    />

                    <Textarea label="Notas" name="notes" placeholder="Nota interna opcional..." />
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <Button variant="light" onPress={() => router.back()} type="button">Cancelar</Button>
                    <Button
                        color="success"
                        type="submit"
                        isLoading={isLoading}
                        startContent={!isLoading && <CircleDollarSign className="h-4 w-4" />}
                        className="font-medium shadow-sm shadow-emerald-600/20"
                    >
                        Registrar Cobro
                    </Button>
                </div>
            </form>
        </div>
    );
}
