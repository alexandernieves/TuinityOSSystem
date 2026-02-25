'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    FileText, Banknote, Save, Info,
    User, ChevronDown, Search, Receipt,
    CreditCard, TrendingDown, TrendingUp, SlidersHorizontal, Minus,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const transactionSchema = z.object({
    customerId: z.string().min(1, 'Debe seleccionar un cliente'),
    type: z.enum(['INVOICE', 'PAYMENT', 'CREDIT_NOTE', 'DEBIT_NOTE', 'ADJUSTMENT']),
    description: z.string().min(1, 'Descripción requerida'),
    amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
    notes: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface Customer {
    id: string;
    name: string;
    taxId?: string | null;
    currentBalance?: string;
    creditLimit?: string;
}

const TRANSACTION_TYPES = [
    { key: 'PAYMENT', label: 'Pago / Abono', icon: TrendingDown, color: 'text-[#16A34A]', bg: 'bg-[#16A34A]/10', desc: 'Reduce el saldo del cliente' },
    { key: 'CREDIT_NOTE', label: 'Nota de Crédito', icon: Minus, color: 'text-[#2563EB]', bg: 'bg-[#2563EB]/10', desc: 'Descuento o devolución' },
    { key: 'DEBIT_NOTE', label: 'Nota de Débito (Cargo)', icon: TrendingUp, color: 'text-[#DC2626]', bg: 'bg-[#DC2626]/10', desc: 'Cargo adicional al cliente' },
    { key: 'INVOICE', label: 'Factura Extratemporánea', icon: Receipt, color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', desc: 'Factura fuera de ciclo' },
    { key: 'ADJUSTMENT', label: 'Ajuste Contable', icon: SlidersHorizontal, color: 'text-[#475569]', bg: 'bg-[#475569]/10', desc: 'Corrección manual de saldo' },
];

function FormLabel({ label, required, icon: Icon, error }: {
    label: string; required?: boolean; icon?: React.ElementType; error?: string;
}) {
    return (
        <div className="mb-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-[#0F172A]">
                {Icon && <Icon className="w-3.5 h-3.5 text-[#94A3B8]" />}
                {label}
                {required && <span className="text-[#DC2626]">*</span>}
            </label>
            {error && (
                <p className="mt-1 text-xs text-[#DC2626] flex items-center gap-1">
                    <Info className="w-3 h-3" />{error}
                </p>
            )}
        </div>
    );
}

const inputClass = (hasError?: boolean) =>
    `w-full px-3 py-2.5 rounded-lg border text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 transition-all placeholder:text-[#94A3B8] ${hasError
        ? 'border-[#DC2626] focus:ring-[#DC2626]/20'
        : 'border-[#E2E8F0] focus:ring-[#2563EB]/20 focus:border-[#2563EB]'
    }`;

export default function RegisterTransactionPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerList, setShowCustomerList] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    const { control, handleSubmit, watch, setValue, formState: { errors, isDirty } } = useForm<TransactionFormData>({
        resolver: zodResolver(transactionSchema) as any,
        defaultValues: { customerId: '', type: 'PAYMENT', description: '', amount: 0, notes: '' },
        mode: 'onChange',
    });

    const watchedType = watch('type');
    const selectedTypeInfo = TRANSACTION_TYPES.find(t => t.key === watchedType);

    useEffect(() => {
        const fetch = async () => {
            try {
                const response = await api<{ items: Customer[] }>('/customers?customerType=CREDIT&limit=200');
                setCustomers(response.items || []);
            } catch {
                toast.error('Error al cargar clientes');
            }
        };
        fetch();
    }, []);

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.taxId || '').toLowerCase().includes(customerSearch.toLowerCase())
    );

    const onSubmit = async (data: TransactionFormData) => {
        setLoading(true);
        const tid = toast.loading('Registrando transacción...');
        try {
            await api('/customers/transactions', {
                method: 'POST',
                body: {
                    customerId: data.customerId,
                    type: data.type,
                    description: data.description,
                    amount: data.amount,
                    ...(data.notes && { notes: data.notes }),
                },
            });
            toast.success('Transacción registrada correctamente', { id: tid });
            router.push('/dashboard/clientes/transacciones');
        } catch (error: any) {
            toast.error(error.message || 'Error al guardar la transacción', { id: tid });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 max-w-3xl mx-auto pb-20 space-y-6">

            {/* ── HEADER ── */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-[#2563EB]" />
                </div>
                <div>
                    <h1 className="text-2xl font-semibold text-[#0F172A]">Registro de Transacción</h1>
                    <p className="text-sm text-[#475569] mt-0.5">Aplica un pago, nota, cargo o ajuste a la cuenta de crédito de un cliente.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                {/* ── CARD: CLIENTE ── */}
                <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm">
                    <div className="px-5 py-3 bg-[#F7F9FC] border-b border-[#E2E8F0] flex items-center gap-2">
                        <User className="w-4 h-4 text-[#2563EB]" />
                        <span className="text-sm font-semibold text-[#0F172A]">Datos del Cliente</span>
                    </div>
                    <div className="p-5">
                        <FormLabel label="Cliente (Solo Crédito)" required icon={CreditCard} error={(errors.customerId?.message as string)} />

                        {/* Custom autocomplete */}
                        <div className="relative">
                            <div
                                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm bg-white cursor-pointer transition-all ${errors.customerId ? 'border-[#DC2626]' : 'border-[#E2E8F0] focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/20'}`}
                                onClick={() => setShowCustomerList(v => !v)}
                            >
                                {selectedCustomer ? (
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className="w-7 h-7 rounded-full bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center font-bold text-xs shrink-0">
                                            {selectedCustomer.name.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-[#0F172A] truncate">{selectedCustomer.name}</p>
                                            {selectedCustomer.taxId && <p className="text-xs text-[#94A3B8]">{selectedCustomer.taxId}</p>}
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-[#94A3B8] flex-1">Buscar y seleccionar cliente...</span>
                                )}
                                <ChevronDown className="w-4 h-4 text-[#94A3B8] shrink-0" />
                            </div>

                            {showCustomerList && (
                                <div
                                    className="absolute z-50 mt-1 w-full bg-white border border-[#E2E8F0] rounded-lg shadow-xl overflow-hidden"
                                    style={{ animation: 'dropdownIn 0.15s ease-out' }}
                                >
                                    <div className="p-2 border-b border-[#E2E8F0]">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="Buscar por nombre o RIF..."
                                                value={customerSearch}
                                                onChange={e => setCustomerSearch(e.target.value)}
                                                onClick={e => e.stopPropagation()}
                                                className="w-full pl-8 pr-3 py-2 text-xs border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-52 overflow-y-auto">
                                        {filteredCustomers.length === 0 ? (
                                            <p className="text-xs text-[#94A3B8] text-center py-4">Sin resultados</p>
                                        ) : filteredCustomers.map(c => (
                                            <button
                                                type="button"
                                                key={c.id}
                                                className="w-full text-left flex items-center gap-3 px-3 py-2.5 hover:bg-[#F7F9FC] transition-colors"
                                                onClick={() => {
                                                    setSelectedCustomer(c);
                                                    setValue('customerId', c.id, { shouldValidate: true, shouldDirty: true });
                                                    setShowCustomerList(false);
                                                    setCustomerSearch('');
                                                }}
                                            >
                                                <div className="w-7 h-7 rounded-full bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center font-bold text-xs shrink-0">
                                                    {c.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-[#0F172A]">{c.name}</p>
                                                    {c.taxId && <p className="text-xs text-[#94A3B8]">{c.taxId}</p>}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Selected customer balance info */}
                        {selectedCustomer && (
                            <div className="mt-3 grid grid-cols-2 gap-3">
                                <div className="p-3 bg-[#F7F9FC] rounded-lg border border-[#E2E8F0]">
                                    <p className="text-xs text-[#475569]">Saldo Actual</p>
                                    <p className={`text-sm font-semibold mt-0.5 ${parseFloat(selectedCustomer.currentBalance || '0') > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                                        ${parseFloat(selectedCustomer.currentBalance || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="p-3 bg-[#F7F9FC] rounded-lg border border-[#E2E8F0]">
                                    <p className="text-xs text-[#475569]">Límite de Crédito</p>
                                    <p className="text-sm font-semibold text-[#0F172A] mt-0.5">
                                        ${parseFloat(selectedCustomer.creditLimit || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── CARD: TIPO DE MOVIMIENTO ── */}
                <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden">
                    <div className="px-5 py-3 bg-[#F7F9FC] border-b border-[#E2E8F0] flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-[#2563EB]" />
                        <span className="text-sm font-semibold text-[#0F172A]">Tipo de Movimiento</span>
                    </div>
                    <div className="p-5">
                        <Controller
                            name="type"
                            control={control}
                            render={({ field }) => (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {TRANSACTION_TYPES.map(t => {
                                        const TIcon = t.icon;
                                        const isSelected = field.value === t.key;
                                        return (
                                            <button
                                                type="button"
                                                key={t.key}
                                                onClick={() => field.onChange(t.key)}
                                                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${isSelected
                                                    ? 'border-[#2563EB] bg-[#2563EB]/5 ring-1 ring-[#2563EB]'
                                                    : 'border-[#E2E8F0] hover:bg-[#F7F9FC]'
                                                    }`}
                                            >
                                                <div className={`w-8 h-8 rounded-lg ${isSelected ? 'bg-[#2563EB]/10' : t.bg} flex items-center justify-center shrink-0`}>
                                                    <TIcon className={`w-4 h-4 ${isSelected ? 'text-[#2563EB]' : t.color}`} />
                                                </div>
                                                <div>
                                                    <p className={`text-xs font-semibold ${isSelected ? 'text-[#2563EB]' : 'text-[#0F172A]'}`}>{t.label}</p>
                                                    <p className="text-[10px] text-[#94A3B8] mt-0.5">{t.desc}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        />
                        {errors.type && (
                            <p className="text-xs text-[#DC2626] mt-2 flex items-center gap-1">
                                <Info className="w-3 h-3" />{errors.type.message as string}
                            </p>
                        )}
                    </div>
                </div>

                {/* ── CARD: DETALLE ── */}
                <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden">
                    <div className="px-5 py-3 bg-[#F7F9FC] border-b border-[#E2E8F0] flex items-center gap-2">
                        {selectedTypeInfo && (
                            <selectedTypeInfo.icon className={`w-4 h-4 ${selectedTypeInfo.color}`} />
                        )}
                        <span className="text-sm font-semibold text-[#0F172A]">Detalle del Movimiento</span>
                    </div>
                    <div className="p-5 space-y-4">
                        {/* Monto */}
                        <div>
                            <FormLabel label="Monto Aplicado" required icon={Banknote} error={errors.amount?.message as string} />
                            <Controller
                                name="amount"
                                control={control}
                                render={({ field }) => (
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#475569]">$</span>
                                        <input
                                            {...field}
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            placeholder="0.00"
                                            className={`${inputClass(!!errors.amount)} pl-7`}
                                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                )}
                            />
                        </div>

                        {/* Descripción */}
                        <div>
                            <FormLabel label="Descripción del Movimiento" required icon={FileText} error={errors.description?.message as string} />
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        type="text"
                                        placeholder="Ej. Abono a factura #123 vía Zelle"
                                        className={inputClass(!!errors.description)}
                                    />
                                )}
                            />
                        </div>

                        {/* Notas opcionales */}
                        <div>
                            <FormLabel label="Notas Adicionales (opcional)" icon={FileText} />
                            <Controller
                                name="notes"
                                control={control}
                                render={({ field }) => (
                                    <textarea
                                        {...field}
                                        rows={2}
                                        placeholder="Observaciones, número de referencia, banco..."
                                        className={`${inputClass()} resize-none`}
                                    />
                                )}
                            />
                        </div>
                    </div>

                    {/* Footer actions */}
                    <div className="px-5 py-4 bg-[#F7F9FC] border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            disabled={loading}
                            className="w-full sm:w-auto px-5 py-2.5 text-sm text-[#475569] border border-[#E2E8F0] bg-white rounded-lg hover:bg-[#F7F9FC] transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !isDirty}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors disabled:opacity-50 shadow-sm"
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Registrando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Registrar Movimiento
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
