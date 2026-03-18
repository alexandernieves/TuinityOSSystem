'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Building2, User } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/services/api';
import { cn } from '@/lib/utils/cn';

export default function NuevoClientePage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [clientType, setClientType] = useState('b2b');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      reference: formData.get('reference') as string,
      name: formData.get('name') as string,
      documentId: formData.get('documentId') as string,
      type: clientType,
      contactName: formData.get('contactName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      mobile: formData.get('mobile') as string,
      address: formData.get('address') as string,
      paymentTerms: parseInt(formData.get('paymentTerms') as string) || 0,
      creditLimit: parseFloat(formData.get('creditLimit') as string) || 0,
    };

    try {
      await api.createClient(data);
      toast.success('Cliente creado correctamente');
      router.push('/clientes');
    } catch (error: any) {
      toast.error(error.message || 'Error al crear cliente');
      setIsSaving(false);
    }
  };

  const inputClass = "w-full px-3 py-[7px] rounded-[8px] border border-[#c9cccf] bg-white text-[13px] text-[#1a1a1a] placeholder:text-[#8c9196] hover:border-[#8c9196] focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-[#008060] transition-all";
  const labelClass = "block text-[13px] font-semibold text-[#1a1a1a] dark:text-gray-200 mb-1.5";
  const buttonPrimaryClass = "flex items-center justify-center gap-2 px-6 py-2 rounded-[10px] bg-[#253D6B] text-white font-semibold text-[13px] shadow-sm hover:bg-[#1e3156] transition-all disabled:opacity-50";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-all shadow-sm"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div>
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nuevo Cliente</h1>
           <p className="text-sm text-gray-500">
             Completa la información para registrar un nuevo cliente en el sistema.
           </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-300">
        <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6 space-y-8 shadow-sm">
          
          <div className="flex gap-4 mb-2">
            <button
              type="button"
              onClick={() => setClientType('b2b')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-all",
                clientType === 'b2b' 
                  ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300"
                  : "bg-white border-gray-200 text-gray-600 dark:bg-[#1a1a1a] dark:border-[#2a2a2a] dark:text-gray-400 hover:bg-gray-50"
              )}
            >
              <Building2 className="h-4 w-4" /> B2B (Empresa)
            </button>
            <button
              type="button"
              onClick={() => setClientType('b2c')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-all",
                clientType === 'b2c' 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300"
                  : "bg-white border-gray-200 text-gray-600 dark:bg-[#1a1a1a] dark:border-[#2a2a2a] dark:text-gray-400 hover:bg-gray-50"
              )}
            >
              <User className="h-4 w-4" /> B2C (Persona)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className={labelClass}>Código</label>
                <input type="text" name="reference" placeholder="Ej. CLI-001" required className={inputClass} />
             </div>
             
             <div className="md:col-span-2">
                <label className={labelClass}>Nombre</label>
                <input type="text" name="name" required placeholder={clientType === 'b2b' ? 'Nombre de la empresa' : 'Nombre de la persona'} className={inputClass} />
             </div>
             <div>
                <label className={labelClass}>Identificación</label>
                <input type="text" name="documentId" required placeholder="Número de identificación" className={inputClass} />
             </div>
             <div>
                <label className={labelClass}>E-Mail</label>
                <input type="email" name="email" placeholder="ejemplo@empresa.com" className={inputClass} />
             </div>
             <div>
                <label className={labelClass}>Teléfono</label>
                <input type="text" name="phone" placeholder="+507 ..." className={inputClass} />
             </div>
             <div>
                <label className={labelClass}>Celular</label>
                <input type="text" name="mobile" placeholder="+507 ..." className={inputClass} />
             </div>
             
             {/* Sección Opcional Oculta o Menos Prominente para mantener la integridad B2B */}
             <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#222] md:col-span-2 grid grid-cols-2 gap-6 opacity-60 hover:opacity-100 transition-opacity">
                <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Información de Crédito (Opcional)</div>
                <div>
                    <label className={labelClass}>Días de Crédito</label>
                    <input type="number" name="paymentTerms" defaultValue={0} min="0" className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Límite de Crédito ($)</label>
                    <input type="number" name="creditLimit" step="0.01" defaultValue={0} min="0" className={inputClass} />
                </div>
             </div>
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <button type="submit" className={buttonPrimaryClass} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar Cliente
          </button>
        </div>
      </form>
    </div>
  );
}
