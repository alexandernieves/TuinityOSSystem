'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, Search, Building2, User, Phone, Mail, MoreVertical, CreditCard, Filter } from 'lucide-react';
import { api } from '@/lib/services/api';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/contexts/auth-context';

import { SkeletonTable } from '@/components/ui/skeleton-table';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

interface Client {
  id: string;
  reference: string;
  name: string;
  documentId: string;
  type: string;
  contactName?: string;
  email?: string;
  phone?: string;
  paymentTerms: number;
  creditLimit: number;
  currentBalance: number;
  status: string;
}

export default function ClientsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await api.getClients();
        setClients(data);
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.documentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || client.type === filterType;
    return matchesSearch && matchesType;
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <SkeletonTable rows={5} columns={6} hasHeader={true} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Clientes y CRM</h1>
          <p className="text-sm text-gray-500">Gestiona tus clientes B2B y B2C, límites de crédito y saldos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => router.push('/clientes/nuevo')}
          >
            <Plus className="h-4 w-4" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 dark:border-[#222] p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por Razón Social, RUC o Código..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-10 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] px-3 text-sm text-gray-900 dark:text-white"
              >
                <option value="all">Todos los clientes</option>
                <option value="b2b">B2B (Mayoristas)</option>
                <option value="b2c">B2C (Al Detal)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
            <thead className="bg-gray-50/50 dark:bg-[#1a1a1a]/50 text-xs text-gray-500 dark:text-[#888]">
              <tr>
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Tipo</th>
                <th className="px-6 py-4 font-medium">Contacto</th>
                <th className="px-6 py-4 font-medium text-right">Balance</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium text-right">Ver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <SkeletonTable hasHeader={false} />
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <User className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                    <p>No se encontraron clientes.</p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={client.id}
                    onClick={() => router.push(`/clientes/${client.id}`)}
                    className="group cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                          client.type === 'b2b' ? "bg-blue-50/50 border-blue-100 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800" : "bg-emerald-50/50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800"
                        )}>
                          {client.type === 'b2b' ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">{client.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{client.documentId} • {client.reference}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
                        client.type === 'b2b' ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300" : "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300"
                      )}>
                        {client.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">{client.contactName || 'N/A'}</div>
                      {(client.email || client.phone) && (
                        <div className="text-xs text-gray-500 mt-0.5 flex gap-2">
                          {client.email && <span>{client.email}</span>}
                          {client.phone && <span>• {client.phone}</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={cn("font-medium", client.currentBalance > 0 ? "text-amber-600 dark:text-amber-500" : "text-gray-900 dark:text-white")}>
                        {formatCurrency(client.currentBalance)}
                      </div>
                      {client.creditLimit > 0 && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          Restante: {formatCurrency(client.creditLimit - client.currentBalance)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className={cn("h-1.5 w-1.5 rounded-full", client.status === 'active' ? "bg-emerald-500" : "bg-red-500")} />
                        <span className={client.status === 'active' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}>
                          {client.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button size="icon" variant="ghost" className="text-gray-400">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
