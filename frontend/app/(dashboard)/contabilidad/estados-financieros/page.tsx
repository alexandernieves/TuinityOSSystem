'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/services/api';
import { toast } from 'sonner';

const fmt = (n: number) => n?.toLocaleString('es-PA', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }) ?? '$0.00';

type Tab = 'pnl' | 'bs' | 'cf';

export default function EstadosFinancierosPage() {
  const [tab, setTab] = useState<Tab>('pnl');
  const [loading, setLoading] = useState(false);
  const [pnl, setPnl] = useState<any>(null);
  const [bs, setBs] = useState<any>(null);
  const [cf, setCf] = useState<any>(null);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', asOfDate: '', segment: 'CONSOLIDATED' });

  const loadAll = async () => {
    setLoading(true);
    try {
      const f: any = {};
      if (filters.startDate) f.startDate = filters.startDate;
      if (filters.endDate) f.endDate = filters.endDate;
      if (filters.asOfDate) f.asOfDate = filters.asOfDate;
      if (filters.segment && filters.segment !== 'CONSOLIDATED') f.segment = filters.segment;

      const [pnlData, bsData, cfData] = await Promise.all([
        api.getProfitAndLoss(f),
        api.getBalanceSheet({ asOfDate: f.asOfDate }),
        api.getCashFlow(f),
      ]);
      setPnl(pnlData);
      setBs(bsData);
      setCf(cfData);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);

  const TABS: { id: Tab; label: string }[] = [
    { id: 'pnl', label: 'Estado de Resultados' },
    { id: 'bs', label: 'Balance General' },
    { id: 'cf', label: 'Flujo de Efectivo' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Estados Financieros</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tiempo real — sin cierre contable requerido</p>
        </div>
        {bs && (
          <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${bs.isBalanced ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-red-100 text-red-700'}`}>
            {bs.isBalanced ? '✓ Balance cuadrado' : '⚠ Balance descuadrado'}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Desde</label>
          <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})}
            className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Hasta / Al</label>
          <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value, asOfDate: e.target.value})}
            className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Segmento</label>
          <select value={filters.segment} onChange={e => setFilters({...filters, segment: e.target.value})}
            className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
            <option value="CONSOLIDATED">Consolidado</option>
            <option value="B2B">Solo B2B</option>
            <option value="B2C">Solo B2C / POS</option>
          </select>
        </div>
        <button onClick={loadAll} className="ml-auto px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors">
          {loading ? 'Calculando...' : 'Actualizar'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-white/10">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === t.id ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="p-12 text-center text-gray-400">Calculando estados financieros...</div>}

      {/* P&L */}
      {!loading && tab === 'pnl' && pnl && (
        <div className="space-y-4">
          <Section title="Ingresos" color="text-emerald-600">
            {pnl.revenue.map((r: any) => <Row key={r.code} label={`[${r.code}] ${r.name}`} value={r.total} positive />)}
            <TotalRow label="Total Ingresos" value={pnl.totalRevenue} positive />
          </Section>
          <Section title="Gastos" color="text-red-500">
            {pnl.expenses.map((e: any) => <Row key={e.code} label={`[${e.code}] ${e.name}`} value={e.total} />)}
            <TotalRow label="Total Gastos" value={pnl.totalExpenses} />
          </Section>
          <div className={`rounded-2xl p-5 font-bold text-lg flex justify-between ${pnl.netIncome >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
            <span>Utilidad / Pérdida Neta</span>
            <span>{fmt(pnl.netIncome)}</span>
          </div>
        </div>
      )}

      {/* Balance Sheet */}
      {!loading && tab === 'bs' && bs && (
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <Section title="Activos" color="text-blue-600">
              {bs.assets.map((a: any) => <Row key={a.code} label={`[${a.code}] ${a.name}`} value={a.total} positive />)}
              <TotalRow label="Total Activos" value={bs.totalAssets} positive />
            </Section>
          </div>
          <div className="space-y-4">
            <Section title="Pasivos" color="text-red-500">
              {bs.liabilities.map((l: any) => <Row key={l.code} label={`[${l.code}] ${l.name}`} value={l.total} />)}
              <TotalRow label="Total Pasivos" value={bs.totalLiabilities} />
            </Section>
            <Section title="Capital" color="text-purple-600">
              {bs.equity.map((e: any) => <Row key={e.code} label={`[${e.code}] ${e.name}`} value={e.total} positive />)}
              <TotalRow label="Total Capital" value={bs.totalEquity} positive />
            </Section>
            <div className="rounded-2xl p-4 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 flex justify-between font-bold">
              <span>Pasivo + Capital</span>
              <span>{fmt(bs.totalLiabilities + bs.totalEquity)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Cash Flow */}
      {!loading && tab === 'cf' && cf && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 text-center">
              <p className="text-sm text-blue-600 font-semibold">Entradas de Efectivo</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">{fmt(cf.cashIn)}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-5 text-center">
              <p className="text-sm text-red-600 font-semibold">Salidas de Efectivo</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400 mt-1">{fmt(cf.cashOut)}</p>
            </div>
            <div className={`rounded-2xl p-5 text-center ${cf.netCash >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
              <p className={`text-sm font-semibold ${cf.netCash >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Flujo Neto</p>
              <p className={`text-2xl font-bold mt-1 ${cf.netCash >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>{fmt(cf.netCash)}</p>
            </div>
          </div>
          <Section title="Por Categoría" color="text-gray-600">
            {Object.entries(cf.byCategory).map(([cat, vals]: any) => (
              <div key={cat} className="flex justify-between items-center py-2 px-4 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl">
                <span className="text-sm text-gray-700 dark:text-gray-300">{cat}</span>
                <div className="flex gap-6 text-sm">
                  <span className="text-blue-600">↑ {fmt(vals.in)}</span>
                  <span className="text-red-500">↓ {fmt(vals.out)}</span>
                </div>
              </div>
            ))}
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
      <div className={`px-4 py-3 border-b border-gray-100 dark:border-white/5 font-bold text-sm ${color}`}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

function Row({ label, value, positive }: { label: string; value: number; positive?: boolean }) {
  return (
    <div className="flex justify-between items-center px-4 py-2 border-b border-gray-50 dark:border-white/5 text-sm">
      <span className="text-gray-600 dark:text-gray-400 text-xs">{label}</span>
      <span className={`font-mono ${positive ? 'text-emerald-600' : 'text-gray-800 dark:text-gray-200'}`}>{fmt(value)}</span>
    </div>
  );
}

function TotalRow({ label, value, positive }: { label: string; value: number; positive?: boolean }) {
  return (
    <div className="flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-white/5 font-bold text-sm">
      <span className="text-gray-700 dark:text-gray-300">{label}</span>
      <span className={`font-mono ${positive ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600'}`}>{fmt(value)}</span>
    </div>
  );
}
