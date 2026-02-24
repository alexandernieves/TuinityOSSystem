'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    User, Phone, Mail, Hash, MapPin,
    Zap, Wallet, Save, Info,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const cashCustomerSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    taxId: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    customerType: z.literal('CASH'),
});

type CashCustomerFormData = z.infer<typeof cashCustomerSchema>;

function FormField({
    label, required, icon: Icon, error, children,
}: {
    label: string;
    required?: boolean;
    icon: React.ElementType;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-[#0F172A]">
                <Icon className="w-3.5 h-3.5 text-[#94A3B8]" />
                {label}
                {required && <span className="text-[#DC2626] ml-0.5">*</span>}
            </label>
            {children}
            {error && (
                <p className="text-xs text-[#DC2626] flex items-center gap-1">
                    <Info className="w-3 h-3" />{error}
                </p>
            )}
        </div>
    );
}

export default function CreateCashCustomerPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const { control, handleSubmit, formState: { errors, isValid, isDirty } } = useForm<CashCustomerFormData>({
        resolver: zodResolver(cashCustomerSchema),
        defaultValues: {
            name: '',
            taxId: '',
            email: '',
            phone: '',
            address: '',
            customerType: 'CASH',
        },
        mode: 'onChange',
    });

    const onSubmit = async (data: CashCustomerFormData) => {
        setLoading(true);
        const tid = toast.loading('Registrando cliente...');
        try {
            await api('/customers', { method: 'POST', body: data });
            toast.success('Cliente de contado registrado correctamente', { id: tid });
            router.push('/dashboard/clientes/administracion');
        } catch (error: any) {
            toast.error(error.message || 'Error al guardar cliente', { id: tid });
        } finally {
            setLoading(false);
        }
    };

    const inputClass = (hasError?: boolean) =>
        `w-full px-3 py-2.5 rounded-lg border text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 transition-all placeholder:text-[#94A3B8] ${hasError
            ? 'border-[#DC2626] focus:ring-[#DC2626]/20'
            : 'border-[#E2E8F0] focus:ring-[#2563EB]/20 focus:border-[#2563EB]'
        }`;

    return (
        <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-20 space-y-6">

            {/* ── HEADER ── */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#16A34A]/10 border border-[#16A34A]/20 flex items-center justify-center shrink-0">
                    <Wallet className="w-6 h-6 text-[#16A34A]" />
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] text-[11px] font-bold uppercase">
                            <Zap className="w-3 h-3" /> Creación Rápida
                        </span>
                    </div>
                    <h1 className="text-2xl font-semibold text-[#0F172A]">Nuevo Cliente Contado</h1>
                    <p className="text-sm text-[#475569] mt-0.5">Registro ágil para compras inmediatas. No requiere validación de crédito.</p>
                </div>
            </div>


            {/* ── FORM CARD ── */}
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden">

                    {/* Card header */}
                    <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F7F9FC]">
                        <h2 className="text-sm font-semibold text-[#0F172A]">Datos del Cliente</h2>
                        <p className="text-xs text-[#475569] mt-0.5">Los campos marcados con <span className="text-[#DC2626]">*</span> son obligatorios.</p>
                    </div>

                    {/* Card body */}
                    <div className="p-6 space-y-5">

                        {/* Nombre */}
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <FormField label="Nombre o Razón Social" required icon={User} error={errors.name?.message}>
                                    <input
                                        {...field}
                                        type="text"
                                        placeholder="Ej. Juan Pérez / Inversiones 123"
                                        autoFocus
                                        className={inputClass(!!errors.name)}
                                    />
                                </FormField>
                            )}
                        />

                        {/* RIF + Teléfono */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <Controller
                                name="taxId"
                                control={control}
                                render={({ field }) => (
                                    <FormField label="RIF / Identificación" icon={Hash} error={errors.taxId?.message}>
                                        <input
                                            {...field}
                                            type="text"
                                            placeholder="V-12345678"
                                            className={inputClass(!!errors.taxId)}
                                        />
                                    </FormField>
                                )}
                            />
                            <Controller
                                name="phone"
                                control={control}
                                render={({ field }) => (
                                    <FormField label="Teléfono" icon={Phone} error={errors.phone?.message}>
                                        <input
                                            {...field}
                                            type="tel"
                                            placeholder="+58 412 1234567"
                                            className={inputClass(!!errors.phone)}
                                        />
                                    </FormField>
                                )}
                            />
                        </div>

                        {/* Email */}
                        <Controller
                            name="email"
                            control={control}
                            render={({ field }) => (
                                <FormField label="Correo Electrónico" icon={Mail} error={errors.email?.message}>
                                    <input
                                        {...field}
                                        type="email"
                                        placeholder="cliente@correo.com"
                                        className={inputClass(!!errors.email)}
                                    />
                                </FormField>
                            )}
                        />

                        {/* Dirección */}
                        <Controller
                            name="address"
                            control={control}
                            render={({ field }) => (
                                <FormField label="Dirección Frecuente" icon={MapPin} error={errors.address?.message}>
                                    <textarea
                                        {...field}
                                        rows={2}
                                        placeholder="Ciudad, zona, edificio..."
                                        className={`${inputClass(!!errors.address)} resize-none`}
                                    />
                                </FormField>
                            )}
                        />
                    </div>

                    {/* Card footer / actions */}
                    <div className="px-6 py-4 border-t border-[#E2E8F0] bg-[#F7F9FC] flex flex-col sm:flex-row gap-3 items-center justify-end">
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
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold bg-[#16A34A] text-white rounded-lg hover:bg-[#15803D] transition-colors disabled:opacity-50 shadow-sm"
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Registrando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Registrar Cliente Rápido
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
