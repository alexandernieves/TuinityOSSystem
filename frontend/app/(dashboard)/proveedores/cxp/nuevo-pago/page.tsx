'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, Select, SelectItem, Textarea } from '@heroui/react';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/services/api';
import { SkeletonDashboard } from '@/components/ui/skeleton-dashboard';

function fmt(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export default function NewPaymentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const prefilledSupplierId = searchParams.get('supplierId') || '';

    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        api.getSuppliers().then(data => {
            const withBalance = data.filter((s: any) => (s.currentBalance || 0) > 0);
            setSuppliers(withBalance);
            if (prefilledSupplierId) {
                const found = withBalance.find((s: any) => s.id === prefilledSupplierId);
                if (found) setSelectedSupplier(found);
            }
        }).catch(console.error).finally(() => setIsFetching(false));
    }, [prefilledSupplierId]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedSupplier) return toast.error('Selecciona un proveedor');

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
                type: 'outbound',
                entityType: 'supplier',
                entityId: selectedSupplier.id,
                entityName: selectedSupplier.name,
                amount,
                paymentMethod: formData.get('paymentMethod') as string,
                referenceNumber: formData.get('referenceNumber') as string,
                notes: formData.get('notes') as string,
                date: new Date().toISOString(),
            });
            toast.success(`Pago de ${fmt(amount)} registrado para ${selectedSupplier.name}`);
            router.push('/proveedores/cxp');
        } catch (err: any) {
            toast.error(err.message || 'Error al registrar pago');
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
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Registrar Pago (CXP)</h1>
                    <p className="text-sm text-gray-500">Registra un pago o abono a un proveedor.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] shadow-sm p-6 space-y-5">
                    {/* Proveedor */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Proveedor *</label>
                        <select
                            required
                            value={selectedSupplier?.id || ''}
                            onChange={e => setSelectedSupplier(suppliers.find(s => s.id === e.target.value) || null)}
                            className="w-full h-12 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] px-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="">-- Selecciona un proveedor --</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name} — Deuda: {fmt(s.currentBalance || 0)}</option>
                            ))}
                        </select>
                    </div>

                    {selectedSupplier && (
                        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 flex items-center justify-between">
                            <span className="text-sm text-red-800 dark:text-red-300">Deuda pendiente actual:</span>
                            <span className="font-bold text-red-700 dark:text-red-300">{fmt(selectedSupplier.currentBalance || 0)}</span>
                        </div>
                    )}

                    <Input
                        label="Monto a Pagar ($)"
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
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

                    <Input label="Referencia / # Cheque / # Transacción" name="referenceNumber" placeholder="Opcional" />
                    <Textarea label="Notas" name="notes" placeholder="Nota interna opcional..." />
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <Button variant="light" onPress={() => router.back()} type="button">Cancelar</Button>
                    <Button
                        color="primary"
                        type="submit"
                        isLoading={isLoading}
                        startContent={!isLoading && <CreditCard className="h-4 w-4" />}
                        className="font-medium"
                    >
                        Registrar Pago
                    </Button>
                </div>
            </form>
        </div>
    );
}
