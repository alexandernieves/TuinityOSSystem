'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardBody, Input, Button, Select, SelectItem, Textarea, Autocomplete, AutocompleteItem } from '@heroui/react';
import { Save, ArrowLeft, FileText, Banknote, CalendarDays, Hash } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// Based on backend DTO createCustomerTransactionSchema
const transactionSchema = z.object({
    customerId: z.string().min(1, 'Debe seleccionar un cliente'),
    type: z.enum(['INVOICE', 'PAYMENT', 'CREDIT_NOTE', 'DEBIT_NOTE', 'ADJUSTMENT']),
    description: z.string().min(1, 'Descripción requerida'),
    amount: z.coerce.number().min(0.01, 'El monto debe ser mayor a 0'),
    notes: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface Customer {
    id: string;
    name: string;
}

export default function RegisterTransactionPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);

    const { control, handleSubmit, formState: { errors } } = useForm<any>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            customerId: '',
            type: 'PAYMENT',
            description: '',
            amount: 0,
        }
    });

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await api<{ items: Customer[] }>('/customers?customerType=CREDIT&limit=200');
                setCustomers(response.items || []);
            } catch (error) {
                toast.error('Error al cargar clientes');
            }
        };
        fetchCustomers();
    }, []);

    const onSubmit = async (data: TransactionFormData) => {
        setLoading(true);
        try {
            const payload: any = {
                customerId: data.customerId,
                type: data.type,
                description: data.description,
                amount: data.amount,
                ...(data.notes && { notes: data.notes }),
            };

            await api('/customers/transactions', {
                method: 'POST',
                body: payload,
            });

            toast.success('Transacción registrada exitosamente');
            router.push('/dashboard/clientes');
        } catch (error: any) {
            console.error('Error saving transaction:', error);
            toast.error(error.message || 'Error al guardar la transacción');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 bg-bg-base min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary tracking-tight">
                        Registro de Transacción Cuentas por Cobrar
                    </h1>
                    <p className="text-text-secondary mt-1 font-light">
                        Aplica un pago, nota de crédito, cargo o ajuste a la cuenta de crédito de un cliente.
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
                        <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
                            <FileText className="text-brand-primary w-5 h-5" />
                            <h3 className="font-semibold text-text-primary text-lg">Detalle Operativo</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Controller
                                name="customerId"
                                control={control}
                                render={({ field }) => (
                                    <Autocomplete
                                        label="Cliente (Solo de Crédito)"
                                        placeholder="Seleccione el cliente"
                                        variant="bordered"
                                        labelPlacement="outside"
                                        selectedKey={field.value}
                                        onSelectionChange={(key) => field.onChange(key as string)}
                                        isInvalid={!!errors.customerId}
                                        errorMessage={errors.customerId?.message as string}
                                        classNames={{
                                            base: "bg-bg-base",
                                            popoverContent: "bg-surface border border-border-subtle",
                                        }}
                                    >
                                        {customers.map((c) => (
                                            <AutocompleteItem key={c.id}>
                                                {c.name}
                                            </AutocompleteItem>
                                        ))}
                                    </Autocomplete>
                                )}
                            />

                            <Controller
                                name="type"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        label="Tipo de Movimiento"
                                        placeholder="Seleccione el concepto"
                                        variant="bordered"
                                        labelPlacement="outside"
                                        selectedKeys={[field.value]}
                                        onChange={(e) => field.onChange(e.target.value)}
                                        isInvalid={!!errors.type}
                                        errorMessage={errors.type?.message as string}
                                    >
                                        <SelectItem key="PAYMENT">Pago / Abono</SelectItem>
                                        <SelectItem key="CREDIT_NOTE">Nota de Crédito</SelectItem>
                                        <SelectItem key="DEBIT_NOTE">Nota de Débito (Cargo)</SelectItem>
                                        <SelectItem key="INVOICE">Factura Extratemporánea</SelectItem>
                                        <SelectItem key="ADJUSTMENT">Ajuste Contable</SelectItem>
                                    </Select>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Controller
                                name="amount"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        value={field.value?.toString() || ''}
                                        type="number"
                                        step="0.01"
                                        label="Monto Aplicado"
                                        placeholder="0.00"
                                        variant="bordered"
                                        labelPlacement="outside"
                                        startContent={<Banknote className="text-success w-4 h-4" />}
                                        isInvalid={!!errors.amount}
                                        errorMessage={errors.amount?.message as string}
                                    />
                                )}
                            />
                        </div>

                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    label="Descripción del Movimiento"
                                    placeholder="Ej. Abono a factura 123 via Zelle"
                                    variant="bordered"
                                    labelPlacement="outside"
                                    isInvalid={!!errors.description}
                                    errorMessage={errors.description?.message as string}
                                />
                            )}
                        />

                        <div className="pt-4 flex justify-end gap-3">
                            <Button
                                variant="bordered"
                                onPress={() => router.back()}
                                isDisabled={loading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                color="primary"
                                type="submit"
                                isLoading={loading}
                                startContent={!loading && <Save size={18} />}
                            >
                                Registrar Movimiento
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </form>
        </div>
    );
}
