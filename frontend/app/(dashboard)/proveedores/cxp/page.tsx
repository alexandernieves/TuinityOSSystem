'use client';

import { useEffect, useState } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  Download, 
  MoreVertical, 
  Eye, 
  AlertCircle,
  TrendingDown,
  Clock,
  ChevronRight,
  CreditCard,
  DollarSign
} from 'lucide-react';
import { api } from '@/lib/services/api';
import { SkeletonDashboard } from '@/components/ui/skeleton-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';

export default function CxPDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await api.getApSummary();
        setSummary(data);
      } catch (error) {
        console.error('Error fetching AP summary:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (isLoading) return <SkeletonDashboard />;

  const filteredBalances = summary?.supplierBalances?.filter((s: any) => 
    s.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.supplierCode?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalBalance = summary?.totalBalance || 0;
  const totalOverdue = summary?.totalOverdue || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Cartera de Proveedores (CxP)</h1>
          <p className="text-sm text-gray-500">Resumen global de cuentas por pagar y vencimientos.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/proveedores/cxp/nuevo-pago">
            <button className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#253D6B] text-white font-semibold text-[13px] shadow-sm hover:bg-[#1e3156] transition-all">
              <CreditCard className="h-4 w-4" />
              Registrar Pago
            </button>
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-white border border-gray-200 text-gray-700 font-semibold text-[13px] shadow-sm hover:bg-gray-50 transition-all">
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-[#141414] border-gray-200 dark:border-[#2a2a2a]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total por Pagar</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(totalBalance)}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#141414] border-gray-200 dark:border-[#2a2a2a]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Vencido</p>
                <h3 className="text-2xl font-bold text-red-600 mt-1">
                  {formatCurrency(totalOverdue)}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#141414] border-gray-200 dark:border-[#2a2a2a]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Obligaciones Pendientes</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                   {summary?.supplierCount || 0}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#141414] border-gray-200 dark:border-[#2a2a2a]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Proveedores Activos</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                   {summary?.supplierBalances?.length || 0}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
                <Building2 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aging Analysis */}
      <Card className="bg-white dark:bg-[#141414] border-gray-200 dark:border-[#2a2a2a]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Análisis de Antigüedad (Aging)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: 'Corriente', key: 'current', color: 'bg-emerald-500' },
              { label: '1 - 30 Días', key: 'days30', color: 'bg-blue-500' },
              { label: '31 - 60 Días', key: 'days60', color: 'bg-amber-500' },
              { label: '61 - 90 Días', key: 'days90', color: 'bg-orange-500' },
              { label: '+90 Días', key: 'days90Plus', color: 'bg-red-500' },
            ].map((period) => {
              const amount = summary.supplierBalances.reduce((sum: number, c: any) => sum + Number(c.aging[period.key]), 0);
              const percent = totalBalance > 0 ? (amount / totalBalance) * 100 : 0;
              return (
                <div key={period.key} className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{period.label}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(amount)}</p>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", period.color)} style={{ width: `${percent}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-400">{percent.toFixed(1)}% del total</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* List of Suppliers with Debt */}
      <Card className="bg-white dark:bg-[#141414] border-gray-200 dark:border-[#2a2a2a]">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold">Saldos por Proveedor</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-transparent focus:bg-white focus:border-blue-500 rounded-lg text-sm transition-all"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#222] bg-gray-50/50 dark:bg-gray-800/50">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Proveedor</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Saldo Total</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Corriente</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vencido</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#222]">
                {filteredBalances.map((item: any) => {
                  const overdue = Number(item.aging.days30) + Number(item.aging.days60) + Number(item.aging.days90) + Number(item.aging.days90Plus);
                  return (
                    <tr key={item.supplierId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 font-bold text-xs">
                            {(item.supplierName || 'PR').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.supplierName || 'Proveedor sin nombre'}</p>
                            <p className="text-xs text-gray-400">Código: {item.supplierCode || 'N/A'}</p>
                            <p className="text-[10px] text-gray-500">Último mov: {item.lastEntryDate ? new Date(item.lastEntryDate).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(item.balance)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-emerald-600 font-medium">{formatCurrency(item.aging.current)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("text-sm font-medium", overdue > 0 ? "text-red-600" : "text-gray-400")}>
                          {formatCurrency(overdue)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                          overdue > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                        )}>
                          {overdue > 0 ? 'Con Deuda' : 'Al Día'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/proveedores/${item.supplierId}?tab=cxp`}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors inline-block"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
