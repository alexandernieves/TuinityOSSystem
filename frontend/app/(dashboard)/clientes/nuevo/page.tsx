'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, SelectItem, Textarea } from '@heroui/react';
import { Building2, User, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/services/api';

export default function NewClientPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [type, setType] = useState('b2b');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

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
      status: 'active',
      currentBalance: 0,
    };

    try {
      await api.createClient(data);
      toast.success('Cliente creado exitosamente');
      router.push('/clientes');
    } catch (error: any) {
      toast.error(error.message || 'Error al crear cliente');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Nuevo Cliente</h1>
          <p className="text-sm text-gray-500">Registra un nuevo contacto comercial en el CRM.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] shadow-sm p-6 space-y-8">
          {/* Información Principal */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-[#222] pb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                {type === 'b2b' ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Información Principal</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Tipo de Cliente"
                name="type"
                selectedKeys={[type]}
                onChange={(e) => setType(e.target.value)}
                isRequired
                className="w-full"
              >
                <SelectItem key="b2b">B2B (Empresa / Mayorista)</SelectItem>
                <SelectItem key="b2c">B2C (Consumidor Final)</SelectItem>
              </Select>

              <Input
                label="Código / Referencia"
                name="reference"
                placeholder="Ej: CLI-001"
                isRequired
                className="w-full"
              />

              <Input
                label={type === 'b2b' ? 'Razón Social' : 'Nombre Completo'}
                name="name"
                placeholder={type === 'b2b' ? 'Empresa S.A.' : 'Juan Pérez'}
                isRequired
                className="w-full md:col-span-2"
              />

              <Input
                label="NIT / RUC / Doc. Identidad"
                name="documentId"
                placeholder="..."
                isRequired
                className="w-full"
              />

              <Input
                label="Nombre del Contacto"
                name="contactName"
                placeholder="Persona a cargo..."
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
              <Input label="Correo Electrónico" name="email" type="email" placeholder="correo@empresa.com" className="w-full" />
              <Input label="Teléfono" name="phone" placeholder="+507 ..." className="w-full" />

              <Input label="País" name="country" placeholder="Ej: Panamá" className="w-full" />
              <Input label="Ciudad" name="city" placeholder="Ej: Ciudad de Panamá" className="w-full" />

              <Textarea
                label="Dirección Completa"
                name="address"
                placeholder="Avenida, Calle, Edificio..."
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
                defaultValue="0"
                min="0"
                className="w-full"
                description="0 = Pago de Contado"
              />
              <Input
                label="Límite de Crédito ($)"
                name="creditLimit"
                type="number"
                step="0.01"
                defaultValue="0.00"
                min="0"
                className="w-full"
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-4">
            <Textarea label="Notas Internas" name="notes" placeholder="Información adicional sobre el cliente..." className="w-full" />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="light" onPress={() => router.back()} type="button">Cancelar</Button>
          <Button
            color="success"
            type="submit"
            className="font-medium shadow-sm shadow-emerald-600/20"
            isLoading={isLoading}
            startContent={!isLoading && <Save className="h-4 w-4" />}
          >
            Guardar Cliente
          </Button>
        </div>
      </form>
    </div>
  );
}
