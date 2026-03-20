'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/services/api';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const fmt = (n: number) => n.toLocaleString('es-PA', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-PA', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function LibroMayorPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [ledger, setLedger] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 30;

  useEffect(() => {
    api.getAccounts().then(setAccounts).catch(() => {});
  }, []);

  const loadLedger = async () => {
    if (!selectedId) return toast.error('Selecciona una cuenta');
    setLoading(true);
    try {
      const f: any = {};
      if (filters.startDate) f.startDate = filters.startDate;
      if (filters.endDate) f.endDate = filters.endDate;
      const data = await api.getLedger(selectedId, f);
      setLedger(data);
      setPage(1);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const rows = ledger?.rows || [];
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Libro Mayor</h1>
        <p className="text-sm text-gray-500 mt-0.5">Movimientos por cuenta contable con saldo running</p>
      </div>

      {/* Selector */}
      <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">Cuenta Contable</label>
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500">
            <option value="">Selecciona una cuenta...</option>
            {accounts.map(a => <option key={a.id} value={a.id}>[{a.code}] {a.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Desde</label>
          <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})}
            className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Hasta</label>
          <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})}
            className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500" />
        </div>
        <button onClick={loadLedger} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors">
          Consultar
        </button>
      </div>

      {/* Account title card */}
      {ledger && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-5 flex justify-between items-center">
          <div>
            <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">{ledger.account.code}</p>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{ledger.account.name}</h2>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Saldo Final</p>
            <p className={`text-2xl font-bold ${ledger.finalBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {fmt(ledger.finalBalance)}
            </p>
          </div>
        </div>
      )}

      {/* Ledger Table */}
      {ledger && (
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-12 px-4 py-3 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 text-xs font-bold text-gray-500 uppercase tracking-wider gap-2">
            <span className="col-span-1">Fecha</span>
            <span className="col-span-2">Asiento</span>
            <span className="col-span-2">Módulo</span>
            <span className="col-span-3">Descripción</span>
            <span className="col-span-1 text-right">Débito</span>
            <span className="col-span-1 text-right">Crédito</span>
            <span className="col-span-2 text-right">Saldo</span>
          </div>
          {loading ? (
            <div className="p-12 text-center text-gray-400">Cargando...</div>
          ) : paged.length === 0 ? (
            <div className="p-12 text-center text-gray-400">Sin movimientos en este período</div>
          ) : paged.map((row: any, i: number) => (
            <div key={i} className="grid grid-cols-12 px-4 py-2.5 border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 text-xs gap-2 items-center">
              <span className="col-span-1 text-gray-500">{fmtDate(row.date)}</span>
              <span className="col-span-2 font-mono text-gray-600 dark:text-gray-300">{row.entryNumber}</span>
              <span className="col-span-2 text-gray-500 truncate">{row.referenceType || '—'}</span>
              <span className="col-span-3 text-gray-700 dark:text-gray-200 truncate">{row.memo || '—'}</span>
              <span className="col-span-1 text-right font-mono text-blue-600">{row.debit > 0 ? fmt(row.debit) : '—'}</span>
              <span className="col-span-1 text-right font-mono text-emerald-600">{row.credit > 0 ? fmt(row.credit) : '—'}</span>
              <span className={`col-span-2 text-right font-mono font-bold ${row.balance >= 0 ? 'text-gray-800 dark:text-white' : 'text-red-600'}`}>
                {fmt(row.balance)}
              </span>
            </div>
          ))}
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
    </div>
  );
}
