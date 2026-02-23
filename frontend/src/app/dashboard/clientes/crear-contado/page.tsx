'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardBody, Input, Button, Textarea } from '@heroui/react';
import { Save, ArrowLeft, User, Phone, Mail, Hash, Rocket } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// Simplified Schema for Cash Customers
const cashCustomerSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    taxId: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    customerType: z.literal('CASH'),
});

type CashCustomerFormData = z.infer<typeof cashCustomerSchema>;

export default function CreateCashCustomerPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const { control, handleSubmit, formState: { errors } } = useForm<CashCustomerFormData>({
        resolver: zodResolver(cashCustomerSchema),
        defaultValues: {
            name: '',
            taxId: '',
            email: '',
            phone: '',
            address: '',
            customerType: 'CASH',
        }
    });

    const onSubmit = async (data: CashCustomerFormData) => {
        setLoading(true);
        try {
            await api('/customers', {
                method: 'POST',
                body: data,
            });
            toast.success('Cliente de contado registrado exitosamente');
            router.push('/dashboard/clientes');
        } catch (error: any) {
            console.error('Error saving customer:', error);
            toast.error(error.message || 'Error al guardar cliente');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6 bg-bg-base min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-2">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-brand-accent uppercase tracking-widest mb-2">
                        <Rocket className="w-4 h-4" />
                        <span>Creación Rápida</span>
                    </div>
                    <h1 className="text-3xl font-bold text-text-primary tracking-tight">
                        Nuevo Cliente Contado
                    </h1>
                    <p className="text-text-secondary mt-1 font-light">
                        Registro ágil para compras INMEDIATAS. No requiere validación de crédito.
                    </p>
                </div>
                <Button
                    variant="light"
                    startContent={<ArrowLeft size={18} />}
                    onPress={() => router.back()}
                    className="text-text-secondary hover:text-text-primary font-medium"
                >
                    Volver
                </Button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Card className="border border-border-subtle bg-surface shadow-sm" radius="lg">
                    <CardBody className="p-6 space-y-6">
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    label="Nombre o Razón Social"
                                    placeholder="Ej. Juan Pérez / Inversiones 123"
                                    variant="bordered"
                                    labelPlacement="outside"
                                    startContent={<User className="text-text-tertiary w-4 h-4" />}
                                    isInvalid={!!errors.name}
                                    errorMessage={errors.name?.message}
                                    classNames={{
                                        inputWrapper: "bg-bg-base border-border-subtle group-data-[focus=true]:border-brand-primary transition-all",
                                        label: "text-text-secondary font-medium"
                                    }}
                                    size="lg"
                                    autoFocus
                                />
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Controller
                                name="taxId"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        label="RIF / Identificación"
                                        placeholder="V-12345678"
                                        variant="bordered"
                                        labelPlacement="outside"
                                        startContent={<Hash className="text-text-tertiary w-4 h-4" />}
                                        classNames={{
                                            inputWrapper: "bg-bg-base border-border-subtle group-data-[focus=true]:border-brand-primary transition-all",
                                            label: "text-text-secondary font-medium"
                                        }}
                                    />
                                )}
                            />
                            <Controller
                                name="phone"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        label="Teléfono"
                                        placeholder="+58 412 1234567"
                                        variant="bordered"
                                        labelPlacement="outside"
                                        startContent={<Phone className="text-text-tertiary w-4 h-4" />}
                                        classNames={{
                                            inputWrapper: "bg-bg-base border-border-subtle group-data-[focus=true]:border-brand-primary transition-all",
                                            label: "text-text-secondary font-medium"
                                        }}
                                    />
                                )}
                            />
                        </div>

                        <Controller
                            name="email"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    label="Correo Electrónico"
                                    placeholder="cliente@correo.com"
                                    variant="bordered"
                                    labelPlacement="outside"
                                    startContent={<Mail className="text-text-tertiary w-4 h-4" />}
                                    isInvalid={!!errors.email}
                                    errorMessage={errors.email?.message}
                                    classNames={{
                                        inputWrapper: "bg-bg-base border-border-subtle group-data-[focus=true]:border-brand-primary transition-all",
                                        label: "text-text-secondary font-medium"
                                    }}
                                />
                            )}
                        />

                        <Controller
                            name="address"
                            control={control}
                            render={({ field }) => (
                                <Textarea
                                    {...field}
                                    label="Dirección Frecuente"
                                    placeholder="Ciudad, zona, edificio..."
                                    variant="bordered"
                                    labelPlacement="outside"
                                    minRows={2}
                                    classNames={{
                                        inputWrapper: "bg-bg-base border-border-subtle group-data-[focus=true]:border-brand-primary transition-all",
                                        label: "text-text-secondary font-medium"
                                    }}
                                />
                            )}
                        />

                        <div className="pt-4 flex flex-col sm:flex-row gap-3">
                            <Button
                                color="primary"
                                type="submit"
                                isLoading={loading}
                                size="lg"
                                startContent={!loading && <Save size={20} />}
                                className="bg-brand-primary font-semibold flex-1 shadow-md hover:shadow-lg transition-all"
                            >
                                Registrar Cliente Rapido
                            </Button>
                            <Button
                                variant="bordered"
                                size="lg"
                                onPress={() => router.back()}
                                isDisabled={loading}
                                className="border-border-subtle text-text-secondary hover:bg-bg-base hover:text-text-primary"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </form>
        </div>
    );
}
