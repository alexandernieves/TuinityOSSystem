'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/services/api';
import { toast } from 'sonner';
import { Search, Filter, ChevronLeft, ChevronRight, Eye, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SOURCE_LABELS: Record<string, string> = {
  B2B_INVOICE: 'Factura B2B', B2B_INVOICE_COST: 'Costo Factura B2B', B2B_COLLECTION: 'Cobro Cliente',
  POS_SALE: 'Venta POS', POS_SALE_COST: 'Costo Venta POS', POS_RETURN: 'Devolución POS', POS_RETURN_COST: 'Costo Dev. POS',
  PURCHASE_RECEIPT: 'Recepción Compra', SUPPLIER_PAYMENT: 'Pago Proveedor', REVERSAL: 'Reverso', manual: 'Manual',
};

const STATUS_COLORS: Record<string, string> = {
  POSTED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  DRAFT: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  REVERSED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const fmt = (n: number) => n.toLocaleString('es-PA', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-PA', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function LibroDiarioPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', status: '', sourceType: '' });
  const [selected, setSelected] = useState<any>(null);
  const [reverseModal, setReverseModal] = useState<string | null>(null);
  const [reverseReason, setReverseReason] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const load = async () => {
    setLoading(true);
    try {
      const f: any = {};
      if (filters.startDate) f.startDate = filters.startDate;
      if (filters.endDate) f.endDate = filters.endDate;
      if (filters.status) f.status = filters.status;
      if (filters.sourceType) f.sourceType = filters.sourceType;
      const data = await api.getJournalEntries(f);
      setEntries(data);
    } catch { toast.error('Error cargando asientos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const paged = entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(entries.length / PAGE_SIZE);

  const handleReverse = async () => {
    if (!reverseModal) return;
    try {
      await api.reverseJournalEntry(reverseModal, reverseReason || 'Reverso manual');
      toast.success('Asiento revertido');
      setReverseModal(null);
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Libro Diario</h1>
          <p className="text-sm text-gray-500 mt-0.5">Registro cronológico de asientos contables</p>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-white/10 px-3 py-1.5 rounded-lg">{entries.length} asientos</span>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-4 flex flex-wrap gap-3">
        <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})}
          className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
        <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})}
          className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
        <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}
          className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
          <option value="">Todos los estados</option>
          <option value="POSTED">Contabilizado</option>
          <option value="DRAFT">Borrador</option>
          <option value="REVERSED">Revertido</option>
        </select>
        <select value={filters.sourceType} onChange={e => setFilters({...filters, sourceType: e.target.value})}
          className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
          <option value="">Todos los módulos</option>
          {Object.entries(SOURCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button onClick={load} className="ml-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors">
          <Filter className="h-4 w-4 inline mr-1.5" />Filtrar
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 px-4 py-3 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 text-xs font-bold text-gray-500 uppercase tracking-wider gap-2">
          <span className="col-span-1">Fecha</span>
          <span className="col-span-2">Número</span>
          <span className="col-span-2">Módulo</span>
          <span className="col-span-3">Descripción</span>
          <span className="col-span-1 text-right">Débito</span>
          <span className="col-span-1 text-right">Crédito</span>
          <span className="col-span-1">Estado</span>
          <span className="col-span-1 text-center">·</span>
        </div>
        {loading ? (
          <div className="p-12 text-center text-gray-400">Cargando asientos...</div>
        ) : paged.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No hay asientos registrados</div>
        ) : paged.map(entry => {
          const totalDebit = entry.lines?.reduce((s: number, l: any) => s + Number(l.debit), 0) || 0;
          const totalCredit = entry.lines?.reduce((s: number, l: any) => s + Number(l.credit), 0) || 0;
          return (
            <div key={entry.id}
              onClick={() => setSelected(selected?.id === entry.id ? null : entry)}
              className="grid grid-cols-12 px-4 py-3 border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer gap-2 items-center">
              <span className="col-span-1 text-xs text-gray-500">{fmtDate(entry.entryDate)}</span>
              <span className="col-span-2 text-xs font-mono text-gray-700 dark:text-gray-300">{entry.number}</span>
              <span className="col-span-2 text-xs text-gray-600 dark:text-gray-400">{SOURCE_LABELS[entry.referenceType || ''] || entry.referenceType || '—'}</span>
              <span className="col-span-3 text-xs text-gray-800 dark:text-gray-200 truncate">{entry.memo || '—'}</span>
              <span className="col-span-1 text-xs font-mono text-right text-blue-600">{fmt(totalDebit)}</span>
              <span className="col-span-1 text-xs font-mono text-right text-emerald-600">{fmt(totalCredit)}</span>
              <span className="col-span-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[entry.status]}`}>
                  {entry.status === 'POSTED' ? 'Cont.' : entry.status === 'REVERSED' ? 'Rev.' : 'Bor.'}
                </span>
              </span>
              <div className="col-span-1 flex gap-1 justify-center">
                {entry.status === 'POSTED' && (
                  <button onClick={e => { e.stopPropagation(); setReverseModal(entry.id); setReverseReason(''); }}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors" title="Revertir">
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Lines */}
      {selected && (
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 font-bold text-sm flex justify-between items-center">
            <span>Detalle: {selected.number}</span>
            <span className="text-xs text-gray-400">{selected.memo}</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 bg-gray-50 dark:bg-white/5">
                <th className="text-left px-4 py-2">Cuenta</th>
                <th className="text-right px-4 py-2">Nombre</th>
                <th className="text-right px-4 py-2">Débito</th>
                <th className="text-right px-4 py-2">Crédito</th>
              </tr>
            </thead>
            <tbody>
              {selected.lines?.map((l: any) => (
                <tr key={l.id} className="border-t border-gray-100 dark:border-white/5 text-sm">
                  <td className="px-4 py-2 font-mono text-xs text-gray-500">{l.account?.code}</td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{l.account?.name}</td>
                  <td className="px-4 py-2 text-right font-mono text-blue-600">{Number(l.debit) > 0 ? fmt(Number(l.debit)) : '—'}</td>
                  <td className="px-4 py-2 text-right font-mono text-emerald-600">{Number(l.credit) > 0 ? fmt(Number(l.credit)) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 disabled:opacity-30 hover:bg-gray-200">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-4 py-2 text-sm">Página {page} de {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 disabled:opacity-30 hover:bg-gray-200">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Reverse Modal */}
      {reverseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#141414] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-red-600">Revertir Asiento</h2>
            <p className="text-sm text-gray-500">Se creará un asiento de contrapartida. No se podrá deshacer.</p>
            <textarea value={reverseReason} onChange={e => setReverseReason(e.target.value)}
              placeholder="Motivo del reverso (obligatorio)..."
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-500 h-24 resize-none" />
            <div className="flex gap-3">
              <button onClick={() => setReverseModal(null)} className="flex-1 py-2.5 bg-gray-100 dark:bg-white/10 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/20">Cancelar</button>
              <button onClick={handleReverse} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold">Revertir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
