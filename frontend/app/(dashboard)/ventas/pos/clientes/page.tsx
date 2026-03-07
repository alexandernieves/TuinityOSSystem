'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/hooks/use-store';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@heroui/react';
import { CustomModal, CustomModalHeader, CustomModalBody, CustomModalFooter } from '@/components/ui/custom-modal';
import { ArrowLeft, Search, Users, Plus, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/auth-context';
import { cn } from '@/lib/utils/cn';
import { MOCK_POS_CLIENTS, subscribePosClients, getPosClientsData } from '@/lib/mock-data/pos';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' });
}

const DOC_TYPE_LABELS: Record<string, string> = {
  ruc: 'RUC',
  cedula: 'Cedula',
  pasaporte: 'Pasaporte',
};

export default function ClientesPOSPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();

  useStore(subscribePosClients, getPosClientsData);

  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // New client form state
  const [formName, setFormName] = useState('');
  const [formDocType, setFormDocType] = useState('cedula');
  const [formDocNum, setFormDocNum] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');

  const filteredClients = useMemo(() => {
    if (!searchQuery) return MOCK_POS_CLIENTS;
    const searchLower = searchQuery.toLowerCase();
    return MOCK_POS_CLIENTS.filter(
      (client) =>
        client.id.toLowerCase().includes(searchLower) ||
        client.name.toLowerCase().includes(searchLower) ||
        client.documentNumber.toLowerCase().includes(searchLower) ||
        (client.email && client.email.toLowerCase().includes(searchLower)) ||
        (client.phone && client.phone.includes(searchQuery))
    );
  }, [searchQuery]);

  const handleCreateClient = () => {
    if (!formName || !formDocNum) {
      toast.error('Nombre y documento son obligatorios', { id: 'client-error' });
      return;
    }
    toast.success('Cliente registrado exitosamente', { id: 'create-client', description: formName });
    setIsOpen(false);
    setFormName('');
    setFormDocType('cedula');
    setFormDocNum('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
  };

  if (!checkPermission('canAccessPOS')) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-gray-500 dark:text-[#888888]">No tienes permisos para acceder a esta seccion.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/ventas/pos')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Clientes B2C</h1>
            <p className="text-sm text-gray-500 dark:text-[#888888]">Consumidores registrados en punto de venta</p>
          </div>
        </div>
        <Button variant="bordered" size="sm" onPress={() => setIsOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Nuevo Cliente
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por codigo, nombre, documento, email o telefono..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-10 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      {/* Table */}
      {filteredClients.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Codigo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Documento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Telefono</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Email</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-[#888888]">Compras</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Ultima compra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-4 py-3 font-mono text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      {client.id}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {client.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      <span className="text-xs text-gray-400 dark:text-[#666] mr-1">{DOC_TYPE_LABELS[client.documentType]}</span>
                      {client.documentNumber}
                      {client.dv && <span className="text-xs text-gray-400 dark:text-[#666] ml-1">DV {client.dv}</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {client.phone || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {client.email || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-gray-100 dark:bg-[#1a1a1a] px-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                        {client.totalPurchases}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {client.lastPurchaseDate ? formatDate(client.lastPurchaseDate) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-200 dark:border-[#2a2a2a] px-4 py-3 bg-gray-50 dark:bg-[#0a0a0a]">
            <p className="text-xs text-gray-500 dark:text-[#888888]">
              {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''}
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] py-16">
          <Users className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-[#888888]">No se encontraron clientes</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-[#666]">Intenta con otra busqueda</p>
        </div>
      )}

      {/* New Client Modal */}
      <CustomModal isOpen={isOpen} onClose={() => setIsOpen(false)} size="md">
        <CustomModalHeader onClose={() => setIsOpen(false)}>
          <UserPlus className="h-5 w-5 text-emerald-600" />
          Nuevo Cliente B2C
        </CustomModalHeader>
        <CustomModalBody className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">Nombre completo *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#555] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Ej: Roberto Gonzalez"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">Tipo documento</label>
                  <select
                    value={formDocType}
                    onChange={(e) => setFormDocType(e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-700 dark:text-gray-300 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="cedula">Cedula</option>
                    <option value="ruc">RUC</option>
                    <option value="pasaporte">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">Numero *</label>
                  <input
                    type="text"
                    value={formDocNum}
                    onChange={(e) => setFormDocNum(e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#555] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Ej: 8-456-1234"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">Telefono</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#555] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Ej: +507 6612-3344"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#555] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Ej: correo@ejemplo.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">Direccion</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#555] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Ej: Via Espana, Local 42"
                />
              </div>
            </div>
          </CustomModalBody>
          <CustomModalFooter>
            <Button variant="light" onPress={() => setIsOpen(false)}>Cancelar</Button>
            <Button color="success" onPress={handleCreateClient}>
              <Plus className="h-4 w-4" /> Registrar Cliente
            </Button>
          </CustomModalFooter>
      </CustomModal>
    </div>
  );
}
