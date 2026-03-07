'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Input, Select, SelectItem, Textarea } from '@heroui/react';
import { ArrowLeft, Save, Trash2, Building2, User, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/services/api';

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const data = await api.getClientById(clientId);
        setClient(data);
      } catch (error) {
        toast.error('Error al cargar datos del cliente');
        router.push('/clientes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClient();
  }, [clientId, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      reference: formData.get('reference') as string,
      name: formData.get('name') as string,
      documentId: formData.get('documentId') as string,
      type: formData.get('type') as string,
      contactName: formData.get('contactName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      country: formData.get('country') as string,
      city: formData.get('city') as string,
      paymentTerms: parseInt(formData.get('paymentTerms') as string) || 0,
      creditLimit: parseFloat(formData.get('creditLimit') as string) || 0,
      notes: formData.get('notes') as string,
      status: formData.get('status') as string,
    };

    try {
      await api.updateClient(clientId, data);
      toast.success('Cliente actualizado correctamente');
      router.push('/clientes');
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar cliente');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente?')) return;

    setIsSaving(true);
    try {
      await api.deleteClient(clientId);
      toast.success('Cliente eliminado');
      router.push('/clientes');
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar cliente');
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex items-center gap-2 text-emerald-600">
          <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500"></span>
          <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 delay-75"></span>
          <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 delay-150"></span>
        </div>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            variant="light"
            onPress={() => router.back()}
            className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Editar Cliente</h1>
            <p className="text-sm text-gray-500">Cód: {client.reference} | Saldo: ${client.currentBalance.toFixed(2)}</p>
          </div>
        </div>
        <Button
          color="danger"
          variant="flat"
          onPress={handleDelete}
          isDisabled={client.currentBalance > 0}
          startContent={<Trash2 className="h-4 w-4" />}
        >
          Eliminar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] shadow-sm p-6 space-y-8">
          {/* Información Principal */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#222] pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  {client.type === 'b2b' ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Información Principal</h2>
              </div>

              <div className="w-32">
                <Select
                  name="status"
                  defaultSelectedKeys={[client.status]}
                  className="w-full"
                  size="sm"
                >
                  <SelectItem key="active" value="active" className="text-emerald-600">Activo</SelectItem>
                  <SelectItem key="inactive" value="inactive" className="text-red-600">Inactivo</SelectItem>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Tipo de Cliente"
                name="type"
                defaultSelectedKeys={[client.type]}
                isRequired
                className="w-full"
              >
                <SelectItem key="b2b" value="b2b">B2B (Empresa / Mayorista)</SelectItem>
                <SelectItem key="b2c" value="b2c">B2C (Consumidor Final)</SelectItem>
              </Select>

              <Input
                label="Código / Referencia"
                name="reference"
                defaultValue={client.reference}
                isRequired
                className="w-full"
                isReadOnly
              />

              <Input
                label={client.type === 'b2b' ? 'Razón Social' : 'Nombre Completo'}
                name="name"
                defaultValue={client.name}
                isRequired
                className="w-full md:col-span-2"
              />

              <Input
                label="NIT / RUC / Doc. Identidad"
                name="documentId"
                defaultValue={client.documentId}
                isRequired
                className="w-full"
              />

              <Input
                label="Nombre del Contacto"
                name="contactName"
                defaultValue={client.contactName}
                className="w-full"
              />
            </div>
          </div>

          {/* Contacto & Ubicación */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-[#222] pb-2">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Contacto y Ubicación</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Correo Electrónico" name="email" type="email" defaultValue={client.email} className="w-full" />
              <Input label="Teléfono" name="phone" defaultValue={client.phone} className="w-full" />

              <Input label="País" name="country" defaultValue={client.country} className="w-full" />
              <Input label="Ciudad" name="city" defaultValue={client.city} className="w-full" />

              <Textarea
                label="Dirección Completa"
                name="address"
                defaultValue={client.address}
                className="w-full md:col-span-2"
              />
            </div>
          </div>

          {/* Finanzas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-[#222] pb-2">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Crédito y Finanzas</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Días de Crédito"
                name="paymentTerms"
                type="number"
                defaultValue={client.paymentTerms?.toString() || "0"}
                min="0"
                className="w-full"
                description="0 = Pago de Contado"
              />
              <Input
                label="Límite de Crédito ($)"
                name="creditLimit"
                type="number"
                step="0.01"
                defaultValue={client.creditLimit?.toString() || "0.00"}
                min="0"
                className="w-full"
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-4">
            <Textarea
              label="Notas Internas"
              name="notes"
              defaultValue={client.notes}
              placeholder="Información adicional sobre el cliente..."
              className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pb-8">
          <Button variant="light" onPress={() => router.back()} type="button">Cancelar</Button>
          <Button
            color="success"
            type="submit"
            className="font-medium shadow-sm shadow-emerald-600/20"
            isLoading={isSaving}
            startContent={!isSaving && <Save className="h-4 w-4" />}
          >
            Guardar Cambios
          </Button>
        </div>
      </form>
    </div>
  );
}
