'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardBody, Input, Button, Select, SelectItem, Textarea, Spinner, Switch } from '@heroui/react';
import { Save, ArrowLeft, Loader2, User, CreditCard, FileText, MapPin, Mail, Phone, Hash } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// Validation Schema based on backend DTO
const customerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  taxId: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  customerType: z.enum(['CASH', 'CREDIT']),
  creditLimit: z.number().min(0).default(0),
  paymentTermDays: z.number().int().min(0).default(0),
  notes: z.string().optional(),
});

type CustomerFormData = {
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  customerType: 'CASH' | 'CREDIT';
  creditLimit: number;
  paymentTermDays: number;
  notes?: string;
};

export default function CustomerFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<any>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      taxId: '',
      email: '',
      phone: '',
      address: '',
      customerType: 'CASH',
      creditLimit: 0,
      paymentTermDays: 0,
      notes: '',
    }
  });

  const customerType = watch('customerType');

  useEffect(() => {
    if (isEditMode) {
      const fetchCustomer = async () => {
        try {
          const customer = await api<CustomerFormData>(`/customers/${id}`);
          if (customer) {
            // Populate form
            setValue('name', customer.name);
            setValue('taxId', customer.taxId || '');
            setValue('email', customer.email || '');
            setValue('phone', customer.phone || '');
            setValue('address', customer.address || '');
            setValue('customerType', customer.customerType as 'CASH' | 'CREDIT');
            setValue('creditLimit', customer.creditLimit || 0);
            setValue('paymentTermDays', customer.paymentTermDays || 0);
            setValue('notes', customer.notes || '');
          }
        } catch (error) {
          console.error('Error fetching customer:', error);
          toast.error('Error al cargar datos del cliente');
          router.push('/dashboard/clientes/administracion');
        } finally {
          setInitialLoading(false);
        }
      };
      fetchCustomer();
    }
  }, [isEditMode, id, setValue, router]);

  const onSubmit = async (data: CustomerFormData) => {
    setLoading(true);
    try {
      if (isEditMode) {
        await api(`/customers/${id}`, {
          method: 'PUT',
          body: data,
        });
        toast.success('Cliente actualizado correctamente');
      } else {
        await api('/customers', {
          method: 'POST',
          body: data,
        });
        toast.success('Cliente creado exitosamente');
      }
      router.push('/dashboard/clientes/administracion');
    } catch (error: any) {
      console.error('Error saving customer:', error);
      toast.error(error.message || 'Error al guardar cliente');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center bg-bg-base">
        <Spinner size="lg" color="primary" label="Cargando datos..." />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 bg-bg-base min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">
            {isEditMode ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h1>
          <p className="text-text-secondary mt-1 font-light">
            Complete la información para {isEditMode ? 'actualizar' : 'registrar'} un cliente en el sistema.
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Main Info Column */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="border border-border-subtle bg-surface shadow-sm" radius="lg">
              <CardBody className="p-6 space-y-5">
                <div className="flex items-center gap-2 mb-2 pb-3 border-b border-border-subtle">
                  <User className="text-brand-primary w-5 h-5" />
                  <h3 className="font-semibold text-text-primary text-lg">Información General</h3>
                </div>

                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Nombre / Razón Social"
                      placeholder="Ej. Distribuidora Los Andes"
                      variant="bordered"
                      labelPlacement="outside"
                      startContent={<User className="text-text-tertiary w-4 h-4" />}
                      isInvalid={!!errors.name}
                      errorMessage={errors.name?.message as string}
                      classNames={{
                        inputWrapper: "bg-bg-base border-border-subtle group-data-[focus=true]:border-brand-primary group-data-[focus=true]:ring-1 group-data-[focus=true]:ring-brand-primary/20 transition-all",
                        label: "text-text-secondary font-medium"
                      }}
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
                        label="RIF / NIT"
                        placeholder="J-12345678-9"
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
                      label="Email"
                      placeholder="contacto@empresa.com"
                      variant="bordered"
                      labelPlacement="outside"
                      startContent={<Mail className="text-text-tertiary w-4 h-4" />}
                      isInvalid={!!errors.email}
                      errorMessage={errors.email?.message as string}
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
                      label="Dirección Fiscal"
                      placeholder="Av. Principal, Edificio A, Piso 1..."
                      variant="bordered"
                      labelPlacement="outside"
                      minRows={3}
                      classNames={{
                        inputWrapper: "bg-bg-base border-border-subtle group-data-[focus=true]:border-brand-primary transition-all",
                        label: "text-text-secondary font-medium"
                      }}
                    />
                  )}
                />
              </CardBody>
            </Card>

            <Card className="border border-border-subtle bg-surface shadow-sm" radius="lg">
              <CardBody className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2 pb-3 border-border-subtle border-b">
                  <FileText className="text-warning w-5 h-5" />
                  <h3 className="font-semibold text-text-primary text-lg">Notas Adicionales</h3>
                </div>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      placeholder="Observaciones internas, preferencias de entrega, etc."
                      variant="bordered"
                      minRows={3}
                      classNames={{
                        inputWrapper: "bg-bg-base border-border-subtle group-data-[focus=true]:border-brand-primary transition-all"
                      }}
                    />
                  )}
                />
              </CardBody>
            </Card>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border border-border-subtle bg-surface shadow-sm" radius="lg">
              <CardBody className="p-6 space-y-5">
                <div className="flex items-center gap-2 mb-2 pb-3 border-b border-border-subtle">
                  <CreditCard className="text-success w-5 h-5" />
                  <h3 className="font-semibold text-text-primary text-lg">Finanzas</h3>
                </div>

                <Controller
                  name="customerType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Tipo de Cliente"
                      placeholder="Seleccione tipo"
                      variant="bordered"
                      labelPlacement="outside"
                      selectedKeys={field.value ? [field.value] : []}
                      onChange={(e) => field.onChange(e.target.value)}
                      classNames={{
                        trigger: "bg-bg-base border-border-subtle data-[open=true]:border-brand-primary transition-all",
                        label: "text-text-secondary font-medium"
                      }}
                    >
                      <SelectItem key="CASH" startContent={<div className="w-2 h-2 rounded-full bg-brand-accent" />}>
                        Contado
                      </SelectItem>
                      <SelectItem key="CREDIT" startContent={<div className="w-2 h-2 rounded-full bg-brand-secondary" />}>
                        Crédito
                      </SelectItem>
                    </Select>
                  )}
                />

                {customerType === 'CREDIT' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Controller
                      name="creditLimit"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          value={field.value?.toString() || ''}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          type="number"
                          label="Límite de Crédito"
                          placeholder="0.00"
                          variant="bordered"
                          labelPlacement="outside"
                          startContent={<span className="text-text-tertiary font-semibold">$</span>}
                          isInvalid={!!errors.creditLimit}
                          errorMessage={errors.creditLimit?.message as string}
                          classNames={{
                            inputWrapper: "bg-bg-base border-border-subtle group-data-[focus=true]:border-brand-primary transition-all",
                            label: "text-text-secondary font-medium"
                          }}
                        />
                      )}
                    />
                    <Controller
                      name="paymentTermDays"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          value={field.value?.toString() || ''}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                          type="number"
                          label="Días de Crédito"
                          placeholder="30"
                          variant="bordered"
                          labelPlacement="outside"
                          endContent={<span className="text-text-tertiary text-xs font-medium">días</span>}
                          classNames={{
                            inputWrapper: "bg-bg-base border-border-subtle group-data-[focus=true]:border-brand-primary transition-all",
                            label: "text-text-secondary font-medium"
                          }}
                        />
                      )}
                    />
                    <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                      <p className="text-xs text-warning font-medium">
                        <span className="font-bold">Nota:</span> Los clientes a crédito requieren aprobación del departamento de finanzas para límites superiores a $1,000.
                      </p>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            <div className="flex flex-col gap-3 pt-2">
              <Button
                color="primary"
                type="submit"
                isLoading={loading}
                size="lg"
                startContent={!loading && <Save size={20} />}
                className="bg-brand-primary font-semibold w-full shadow-md hover:shadow-lg transition-all"
              >
                {isEditMode ? 'Actualizar Cliente' : 'Guardar Cliente'}
              </Button>
              <Button
                variant="bordered"
                color="default"
                onPress={() => router.back()}
                isDisabled={loading}
                size="lg"
                className="w-full border-border-subtle text-text-secondary hover:bg-bg-base hover:text-text-primary"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
