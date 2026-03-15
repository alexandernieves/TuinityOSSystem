'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Trash2, Building2, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/services/api';
import { SkeletonDashboard } from '@/components/ui/skeleton-dashboard';
import { cn } from '@/lib/utils/cn';
import { CustomModal, CustomModalHeader, CustomModalBody, CustomModalFooter } from '@/components/ui/custom-modal';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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
    setIsDeleteModalOpen(false);
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

  const inputClass = "w-full px-3 py-[7px] rounded-[8px] border border-[#c9cccf] bg-white text-[13px] text-[#1a1a1a] placeholder:text-[#8c9196] hover:border-[#8c9196] focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-[#008060] transition-all";
  const labelClass = "block text-[13px] font-semibold text-[#1a1a1a] mb-1.5";
  const buttonPrimaryClass = "flex items-center justify-center gap-2 px-6 py-2 rounded-[10px] bg-[#253D6B] text-white font-semibold text-[13px] shadow-[0_0_0_1px_rgba(0,0,0,0.05)_inset,0_1px_0_rgba(0,0,0,0.08),inset_0_-2.5px_0_rgba(0,0,0,0.2)] hover:bg-[#1e3156] active:translate-y-[1px] active:shadow-[inset_0_1px_0_rgba(0,0,0,0.1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  const buttonSecondaryClass = "px-4 py-2 rounded-lg text-[13px] font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors disabled:opacity-50";

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  if (!client) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 border border-transparent hover:border-gray-200 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Editar Cliente</h1>
            <p className="text-sm text-gray-500">Cód: {client.reference} | Saldo: ${client.currentBalance.toFixed(2)}</p>
          </div>
        </div>
        <button
          onClick={() => setIsDeleteModalOpen(true)}
          disabled={client.currentBalance > 0 || isSaving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 font-medium hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <Trash2 className="h-4 w-4" />
          Eliminar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6 space-y-8">
          {/* Información Principal */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#222] pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  {client.type === 'b2b' ? <Building2 className="h-4 w-4 text-[#008060]" /> : <User className="h-4 w-4 text-[#008060]" />}
                </div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Información Principal</h2>
              </div>

              <div className="w-32">
                <label className={labelClass}>Estado</label>
                <select
                  name="status"
                  defaultValue={client.status}
                  className={inputClass}
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Tipo de Cliente</label>
                <select
                  name="type"
                  defaultValue={client.type}
                  className={inputClass}
                  required
                >
                  <option value="b2b">B2B (Empresa / Mayorista)</option>
                  <option value="b2c">B2C (Consumidor Final)</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Código / Referencia</label>
                <input
                  type="text"
                  name="reference"
                  defaultValue={client.reference}
                  required
                  readOnly
                  className={cn(inputClass, "bg-gray-50 cursor-not-allowed")}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>
                  {client.type === 'b2b' ? 'Razón Social' : 'Nombre Completo'}
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={client.name}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>NIT / RUC / Doc. Identidad</label>
                <input
                  type="text"
                  name="documentId"
                  defaultValue={client.documentId}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Nombre del Contacto</label>
                <input
                  type="text"
                  name="contactName"
                  defaultValue={client.contactName}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Contacto & Ubicación */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-[#222] pb-2 mt-8">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Contacto y Ubicación</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Correo Electrónico</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={client.email}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Teléfono</label>
                <input
                  type="text"
                  name="phone"
                  defaultValue={client.phone}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>País</label>
                <input
                  type="text"
                  name="country"
                  defaultValue={client.country}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Ciudad</label>
                <input
                  type="text"
                  name="city"
                  defaultValue={client.city}
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Dirección Completa</label>
                <textarea
                  name="address"
                  defaultValue={client.address}
                  rows={3}
                  className={cn(inputClass, "h-24 py-2 resize-none")}
                />
              </div>
            </div>
          </div>

          {/* Finanzas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-[#222] pb-2 mt-8">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Crédito y Finanzas</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Días de Crédito</label>
                <input
                  type="number"
                  name="paymentTerms"
                  defaultValue={client.paymentTerms?.toString() || "0"}
                  min="0"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-gray-500">0 = Pago de Contado</p>
              </div>
              <div>
                <label className={labelClass}>Límite de Crédito ($)</label>
                <input
                  type="number"
                  name="creditLimit"
                  step="0.01"
                  defaultValue={client.creditLimit?.toString() || "0.00"}
                  min="0"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-4 mt-8">
            <label className={labelClass}>Notas Internas</label>
            <textarea
              name="notes"
              defaultValue={client.notes}
              placeholder="Información adicional sobre el cliente..."
              rows={3}
              className={cn(inputClass, "h-24 py-2 resize-none")}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pb-8">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isSaving}
            className={buttonSecondaryClass}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className={buttonPrimaryClass}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar Cambios
          </button>
        </div>
      </form>

      {/* Modal de Confirmación de Eliminación */}
      <CustomModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <CustomModalHeader onClose={() => setIsDeleteModalOpen(false)}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Eliminar Cliente</h3>
              <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
            </div>
          </div>
        </CustomModalHeader>
        <CustomModalBody>
          <p className="text-sm text-gray-600 py-2">
            ¿Estás seguro de que deseas eliminar a <span className="font-semibold text-gray-900">{client.name}</span>?
            Se perderá toda la información de contacto asociada a este registro.
          </p>
        </CustomModalBody>
        <CustomModalFooter>
          <Button
            variant="ghost"
            onClick={() => setIsDeleteModalOpen(false)}
            className="h-10 px-6 font-semibold"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            className="h-10 px-6 font-semibold bg-red-600 hover:bg-red-700 text-white shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_1px_0_rgba(0,0,0,0.08),inset_0_-1px_0_rgba(0,0,0,0.3)]"
          >
            Sí, eliminar cliente
          </Button>
        </CustomModalFooter>
      </CustomModal>
    </div>
  );
}
