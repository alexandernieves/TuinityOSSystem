'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, User, ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/services/api';
import { cn } from '@/lib/utils/cn';

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

  const inputClass = "w-full px-3 py-[7px] rounded-[8px] border border-[#c9cccf] bg-white text-[13px] text-[#1a1a1a] placeholder:text-[#8c9196] hover:border-[#8c9196] focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-[#008060] transition-all";
  const labelClass = "block text-[13px] font-semibold text-[#1a1a1a] mb-1.5";
  const buttonPrimaryClass = "flex items-center justify-center gap-2 px-6 py-2 rounded-[10px] bg-[#253D6B] text-white font-semibold text-[13px] shadow-[0_0_0_1px_rgba(0,0,0,0.05)_inset,0_1px_0_rgba(0,0,0,0.08),inset_0_-2.5px_0_rgba(0,0,0,0.2)] hover:bg-[#1e3156] active:translate-y-[1px] active:shadow-[inset_0_1px_0_rgba(0,0,0,0.1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  const buttonSecondaryClass = "px-4 py-2 rounded-lg text-[13px] font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors disabled:opacity-50";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 border border-transparent hover:border-gray-200 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Nuevo Cliente</h1>
          <p className="text-sm text-gray-500">Registra un nuevo contacto comercial en el CRM.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6 space-y-8">
          {/* Información Principal */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-[#222] pb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                {type === 'b2b' ? <Building2 className="h-4 w-4 text-[#008060]" /> : <User className="h-4 w-4 text-[#008060]" />}
              </div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Información Principal</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Tipo de Cliente</label>
                <select
                  name="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
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
                  placeholder="Ej: CLI-001"
                  required
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>
                  {type === 'b2b' ? 'Razón Social' : 'Nombre Completo'}
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder={type === 'b2b' ? 'Empresa S.A.' : 'Juan Pérez'}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>NIT / RUC / Doc. Identidad</label>
                <input
                  type="text"
                  name="documentId"
                  placeholder="..."
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Nombre del Contacto</label>
                <input
                  type="text"
                  name="contactName"
                  placeholder="Persona a cargo..."
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
                  placeholder="correo@empresa.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Teléfono</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="+507 ..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>País</label>
                <input
                  type="text"
                  name="country"
                  placeholder="Ej: Panamá"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Ciudad</label>
                <input
                  type="text"
                  name="city"
                  placeholder="Ej: Ciudad de Panamá"
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Dirección Completa</label>
                <textarea
                  name="address"
                  placeholder="Avenida, Calle, Edificio..."
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
                  defaultValue="0"
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
                  defaultValue="0.00"
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
              placeholder="Información adicional sobre el cliente..."
              rows={3}
              className={cn(inputClass, "h-24 py-2 resize-none")}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isLoading}
            className={buttonSecondaryClass}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={buttonPrimaryClass}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar Cliente
          </button>
        </div>
      </form>
    </div>
  );
}
