'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Search, CircleDollarSign, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/services/api';
import { cn } from '@/lib/utils/cn';
import { SkeletonDashboard } from '@/components/ui/skeleton-dashboard';

import { Pagination, usePagination } from '@/components/ui/pagination';

function fmt(n: any) {
  const val = Number(n) || 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
}

export default function CXCPage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getClients().then((data) => {
      setClients(data.filter((c: any) => (Number(c.currentBalance) || 0) > 0));
    }).catch(console.error).finally(() => setIsLoading(false));
  }, []);

  const filtered = clients.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.reference || '').toLowerCase().includes(search.toLowerCase())
  );

  const {
    currentPage,
    totalPages,
    totalItems,
    rowsPerPage,
    paginatedData,
    handlePageChange,
    handleRowsPerPageChange,
  } = usePagination(filtered, 10);

  const totalCXC = clients.reduce((s, c) => s + (Number(c.currentBalance) || 0), 0);

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Cuentas por Cobrar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Clientes con saldos pendientes de cobro.</p>
        </div>
        <Button
          className="font-medium shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => router.push('/clientes/cxc/cobro')}
        >
          <CircleDollarSign className="h-4 w-4 mr-2" />
          Registrar Cobro
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total CXC</p>
          <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{fmt(totalCXC)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Clientes con Deuda</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{clients.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Promedio por Cliente</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{fmt(clients.length > 0 ? totalCXC / clients.length : 0)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-[#222]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                handlePageChange(1);
              }}
              className="h-10 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-gray-400 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 dark:bg-[#1a1a1a]/50 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Crédito</th>
                <th className="px-6 py-3 font-medium text-right">Límite</th>
                <th className="px-6 py-3 font-medium text-right">Balance Pendiente</th>
                <th className="px-6 py-3 font-medium text-right">Cobrar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400 mb-2" />
                    <p>No hay cuentas pendientes de cobro.</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((client: any) => (
                  <motion.tr
                    key={client.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{client.name}</div>
                      <div className="text-xs text-gray-500">{client.reference} • {client.documentId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded">{client.paymentTerms > 0 ? `${client.paymentTerms} días` : 'Contado'}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">{fmt(client.creditLimit)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-amber-600 dark:text-amber-400">{fmt(client.currentBalance)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                        onClick={() => router.push(`/clientes/cxc/cobro?clientId=${client.id}&clientName=${encodeURIComponent(client.name)}`)}
                      >
                        Cobrar
                        <ArrowRight className="h-3 w-3 ml-2" />
                      </Button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Paginación */}
        <div className="p-4 border-t border-gray-100 dark:border-[#222]">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            rowsPerPage={rowsPerPage}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            itemName="clientes"
          />
        </div>
      </div>
    </div>
  );
}
