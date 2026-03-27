'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/services/api';
import { toast } from 'sonner';

const fmt = (n: number) => n?.toLocaleString('es-PA', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }) ?? '$0.00';

const OP_LABELS: Record<string, { label: string; desc: string }> = {
  B2B_INVOICE: { label: 'Factura B2B', desc: 'CxC (Débito) vs Ingresos B2B (Crédito)' },
  B2B_INVOICE_COST: { label: 'Costo Factura B2B', desc: 'Costo Ventas (Débito) vs Inventario (Crédito)' },
  B2B_COLLECTION: { label: 'Cobro Cliente B2B', desc: 'Banco (Débito) vs CxC (Crédito)' },
  POS_SALE: { label: 'Venta POS', desc: 'Banco (Débito) vs Ingresos POS (Crédito)' },
  POS_SALE_COST: { label: 'Costo Venta POS', desc: 'Costo Ventas (Débito) vs Inventario (Crédito)' },
  POS_RETURN: { label: 'Devolución POS', desc: 'Ingresos POS (Débito) vs Banco (Crédito)' },
  POS_RETURN_COST: { label: 'Costo Dev. POS', desc: 'Inventario (Débito) vs Costo Ventas (Crédito)' },
  PURCHASE_RECEIPT: { label: 'Recepción de Compra', desc: 'Inventario (Débito) vs CxP (Crédito)' },
  SUPPLIER_PAYMENT: { label: 'Pago a Proveedor', desc: 'CxP (Débito) vs Banco (Crédito)' },
};

export default function MapeoContablePage() {
  const [mappings, setMappings] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const load = async () => {
    setLoading(true);
    try {
      const [m, a] = await Promise.all([api.getAccountingMappings(), api.getAccounts()]);
      setMappings(m);
      setAccounts(a);
    } catch { toast.error('Error cargando mapeos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const getMapping = (op: string) => mappings.find(m => m.operationType === op);

  const handleSave = async (op: string) => {
    try {
      await api.saveAccountingMapping({
        operationType: op,
        debitAccountId: form[op + '_d'] || null,
        creditAccountId: form[op + '_c'] || null,
        description: OP_LABELS[op]?.desc || op,
      });
      toast.success('Mapeo guardado');
      setEditing(null);
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const openEdit = (op: string) => {
    const m = getMapping(op);
    setForm(prev => ({
      ...prev,
      [op + '_d']: m?.debitAccountId || '',
      [op + '_c']: m?.creditAccountId || '',
    }));
    setEditing(op);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mapeo Contable</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configura qué cuentas se debitan/acreditan por cada operación</p>
        </div>
        <button onClick={() => api.seedAccountingCOA().then(() => { toast.success('COA re-inicializado'); load(); }).catch(e => toast.error(e.message))}
          className="px-4 py-2 bg-gray-100 dark:bg-white/10 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
          Re-inicializar COA
        </button>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/40 rounded-2xl p-4 text-sm text-blue-700 dark:text-blue-300">
        <strong>Principio:</strong> La contabilidad es automática. Cada operación del sistema genera un asiento según este mapeo. No modifiques las cuentas salvo que necesites reclasificar.
      </div>

      <div className="space-y-3">
        {Object.entries(OP_LABELS).map(([op, { label, desc }]) => {
          const mapping = getMapping(op);
          const isEditing = editing === op;
          return (
            <div key={op} className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${mapping ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                      {mapping ? 'Configurado' : 'Sin mapeo'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  {mapping && !isEditing && (
                    <div className="flex gap-6 mt-2 text-xs">
                      <div>
                        <span className="text-blue-500 font-semibold">Débito: </span>
                        <span className="font-mono text-gray-600 dark:text-gray-300">[{mapping.debitAccount?.code}] {mapping.debitAccount?.name}</span>
                      </div>
                      <div>
                        <span className="text-emerald-500 font-semibold">Crédito: </span>
                        <span className="font-mono text-gray-600 dark:text-gray-300">[{mapping.creditAccount?.code}] {mapping.creditAccount?.name}</span>
                      </div>
                    </div>
                  )}
                  {isEditing && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="text-xs text-blue-500 font-semibold mb-1 block">Cuenta Débito</label>
                        <select value={form[op + '_d'] || ''} onChange={e => setForm(prev => ({...prev, [op + '_d']: e.target.value}))}
                          className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500">
                          <option value="">— Sin mapeo —</option>
                          {accounts.filter(a => a.isActive).map(a => <option key={a.id} value={a.id}>[{a.code}] {a.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-emerald-500 font-semibold mb-1 block">Cuenta Crédito</label>
                        <select value={form[op + '_c'] || ''} onChange={e => setForm(prev => ({...prev, [op + '_c']: e.target.value}))}
                          className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500">
                          <option value="">— Sin mapeo —</option>
                          {accounts.filter(a => a.isActive).map(a => <option key={a.id} value={a.id}>[{a.code}] {a.name}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {isEditing ? (
                    <>
                      <button onClick={() => setEditing(null)} className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-white/10 rounded-xl hover:bg-gray-200 dark:hover:bg-white/20 font-bold">Cancelar</button>
                      <button onClick={() => handleSave(op)} className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold">Guardar</button>
                    </>
                  ) : (
                    <button onClick={() => openEdit(op)} className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-white/10 rounded-xl hover:bg-gray-200 dark:hover:bg-white/20 font-bold">
                      {mapping ? 'Editar' : 'Configurar'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
