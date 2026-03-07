'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/services/api'; import {
  BookOpen,
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  X,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/auth-context';
import { cn } from '@/lib/utils/cn';
import {
  formatCurrencyAccounting,
} from '@/lib/mock-data/accounting';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Button,
  Select,
  SelectItem,
} from '@heroui/react';
import { CustomModal, CustomModalHeader, CustomModalBody, CustomModalFooter } from '@/components/ui/custom-modal';
import {
  JOURNAL_SOURCE_LABELS,
  JOURNAL_SOURCE_COLORS,
  JOURNAL_STATUS_LABELS,
  JOURNAL_STATUS_CONFIG,
} from '@/lib/types/accounting';
import type { JournalEntrySource, JournalEntryStatus } from '@/lib/types/accounting';
import { SkeletonTable } from '@/components/ui/skeleton-table';

interface NewEntryLine {
  accountId: string;
  description: string;
  debit: string;
  credit: string;
}

export default function LibroDiarioPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();
  const canCreateManualEntries = checkPermission('canCreateManualEntries');

  const [realEntries, setRealEntries] = useState<any[]>([]);
  const [realAccounts, setRealAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [entriesData, accountsData] = await Promise.all([
        api.getJournalEntries(),
        api.getAccounts()
      ]);
      setRealEntries(entriesData);
      setRealAccounts(accountsData);
    } catch (err) {
      toast.error('Error cargando datos contables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Expandable rows
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // New entry modal
  const [isOpen, setIsOpen] = useState(false);
  const [newDate, setNewDate] = useState('2026-02-26');
  const [newDescription, setNewDescription] = useState('');
  const [newLines, setNewLines] = useState<NewEntryLine[]>([
    { accountId: '', description: '', debit: '', credit: '' },
    { accountId: '', description: '', debit: '', credit: '' },
  ]);

  const leafAccounts = useMemo(
    () => realAccounts.filter((a) => !a.isGroup && a.isActive),
    [realAccounts]
  );

  const entries = useMemo(() => {
    return realEntries.filter((entry) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        entry.reference.toLowerCase().includes(searchLower) ||
        entry.description.toLowerCase().includes(searchLower);

      const matchesSource = sourceFilter === 'all' || entry.sourceType === sourceFilter;
      const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;

      let matchesDate = true;
      if (dateFrom) matchesDate = matchesDate && new Date(entry.date) >= new Date(dateFrom);
      if (dateTo) matchesDate = matchesDate && new Date(entry.date) <= new Date(dateTo);

      return matchesSearch && matchesSource && matchesStatus && matchesDate;
    });
  }, [realEntries, searchQuery, sourceFilter, statusFilter, dateFrom, dateTo]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PA', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  const addLine = () => {
    setNewLines([...newLines, { accountId: '', description: '', debit: '', credit: '' }]);
  };

  const removeLine = (index: number) => {
    if (newLines.length <= 2) return;
    setNewLines(newLines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof NewEntryLine, value: string) => {
    const updated = [...newLines];
    updated[index] = { ...updated[index], [field]: value };
    setNewLines(updated);
  };

  const totalDebit = newLines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
  const totalCredit = newLines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleSaveEntry = async () => {
    if (!newDescription.trim()) {
      toast.error('Debe ingresar una descripción');
      return;
    }
    if (!isBalanced) {
      toast.error('El asiento no está balanceado');
      return;
    }
    try {
      const lines = newLines
        .filter((l) => l.accountId)
        .map((l) => {
          const acc = realAccounts.find((a) => a._id === l.accountId);
          return {
            accountId: l.accountId,
            accountCode: acc?.code || '',
            accountName: acc?.name || '',
            debit: parseFloat(l.debit) || 0,
            credit: parseFloat(l.credit) || 0,
            memo: l.description,
          };
        });

      await api.createJournalEntry({
        date: new Date(newDate).toISOString(),
        description: newDescription,
        lines,
        sourceType: 'manual',
      });

      toast.success('Asiento registrado exitosamente');
      setIsOpen(false);
      setNewDescription('');
      setNewLines([
        { accountId: '', description: '', debit: '', credit: '' },
        { accountId: '', description: '', debit: '', credit: '' },
      ]);
      fetchData();
    } catch (err: any) {
      toast.error('Error', { description: err.message });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSourceFilter('all');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = searchQuery || sourceFilter !== 'all' || statusFilter !== 'all' || dateFrom || dateTo;

  const sourceTypes: { key: string; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'venta', label: 'Venta' },
    { key: 'compra', label: 'Compra' },
    { key: 'cobro', label: 'Cobro' },
    { key: 'pago', label: 'Pago' },
    { key: 'manual', label: 'Manual' },
    { key: 'ajuste_inventario', label: 'Ajuste Inv.' },
  ];

  const statusTypes: { key: string; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'borrador', label: 'Borrador' },
    { key: 'registrado', label: 'Registrado' },
    { key: 'aprobado', label: 'Aprobado' },
    { key: 'anulado', label: 'Anulado' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/contabilidad')}
            className="text-sm text-gray-500 dark:text-[#888888] hover:text-gray-700 dark:hover:text-white"
          >
            Contabilidad
          </button>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Libro Diario</h1>
          </div>
        </div>
        {canCreateManualEntries && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex h-9 items-center gap-2 rounded-lg bg-purple-600 px-4 text-sm font-medium text-white transition-colors hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" />
            Nuevo Asiento Manual
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar asientos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] pl-9 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666666] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {sourceTypes.map((s) => (
            <button
              key={s.key}
              onClick={() => setSourceFilter(s.key)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                sourceFilter === s.key
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                  : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2a2a2a]'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-700 dark:text-gray-300 focus:border-purple-500 focus:outline-none"
          >
            {statusTypes.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 w-[130px] rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-2 text-sm text-gray-700 dark:text-gray-300 focus:border-purple-500 focus:outline-none"
            placeholder="Desde"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 w-[130px] rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-2 text-sm text-gray-700 dark:text-gray-300 focus:border-purple-500 focus:outline-none"
            placeholder="Hasta"
          />
          {hasActiveFilters && (
            <button onClick={clearFilters} className="flex h-9 items-center gap-1 px-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
              <X className="h-3.5 w-3.5" /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]">
        {loading ? (
          <SkeletonTable rows={5} columns={8} hasHeader={true} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                  <th className="w-8 px-2 py-3" />
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Número</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Descripción</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Origen</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Debe</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Haber</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                {entries.map((entry, index) => {
                  const statusConfig = (JOURNAL_STATUS_CONFIG as any)[entry.status] || JOURNAL_STATUS_CONFIG.borrador;
                  const isExpanded = expandedRow === entry.id;

                  return (<>
                    <tr
                      key={entry.id}
                      className="group cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                      onClick={() => setExpandedRow(isExpanded ? null : entry.id)}
                    >
                      <td className="px-2 py-3 text-center">
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 text-gray-400 transition-transform',
                            isExpanded && 'rotate-180'
                          )}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                          {entry.reference}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(entry.date)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900 dark:text-white">{entry.description}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
                            (JOURNAL_SOURCE_COLORS as any)[entry.sourceType || 'manual']?.bg || 'bg-gray-100',
                            (JOURNAL_SOURCE_COLORS as any)[entry.sourceType || 'manual']?.text || 'text-gray-700'
                          )}
                        >
                          {(JOURNAL_SOURCE_LABELS as any)[entry.sourceType || 'manual']}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-sm text-gray-900 dark:text-white">
                          {formatCurrencyAccounting(entry.lines.reduce((s: number, l: any) => s + (l.debit || 0), 0))}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-sm text-gray-900 dark:text-white">
                          {formatCurrencyAccounting(entry.lines.reduce((s: number, l: any) => s + (l.credit || 0), 0))}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                            statusConfig.bg,
                            statusConfig.text
                          )}
                        >
                          <span className={cn('h-1.5 w-1.5 rounded-full', statusConfig.dot)} />
                          {(JOURNAL_STATUS_LABELS as any)[entry.status]}
                        </span>
                      </td>
                    </tr>
                    {/* Expanded detail */}
                    {isExpanded && (
                      <tr key={`${entry.id}-detail`}>
                        <td colSpan={8} className="bg-gray-50 dark:bg-[#0a0a0a] px-8 py-3">
                          <div className="rounded-lg border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-gray-100 dark:bg-[#1a1a1a]">
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Codigo</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Cuenta</th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-[#888888]">Debe</th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-[#888888]">Haber</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                                {entry.lines.map((line: any) => (
                                  <tr key={line.id} className="bg-white dark:bg-[#141414]">
                                    <td className="px-4 py-2 font-mono text-xs text-gray-600 dark:text-gray-400">
                                      {line.accountCode}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                      {line.accountName}
                                    </td>
                                    <td className="px-4 py-2 text-right font-mono text-sm text-gray-900 dark:text-white">
                                      {line.debit > 0 ? formatCurrencyAccounting(line.debit) : ''}
                                    </td>
                                    <td className="px-4 py-2 text-right font-mono text-sm text-gray-900 dark:text-white">
                                      {line.credit > 0 ? formatCurrencyAccounting(line.credit) : ''}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {entry.notes && (
                            <p className="mt-2 text-xs text-gray-500 dark:text-[#888888] italic">
                              Nota: {entry.notes}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-gray-400 dark:text-[#666666]">
                            Creado por {entry.createdBy?.name || 'Sistema'} el {formatDate(entry.createdAt)}
                          </p>
                        </td>
                      </tr>
                    )}
                  </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {
        !loading && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#141414] py-16">
            <BookOpen className="mb-4 h-12 w-12 text-gray-400 dark:text-[#666666]" />
            <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">No se encontraron asientos</h3>
            <p className="text-sm text-gray-500 dark:text-[#888888]">Ajusta los filtros o crea un nuevo asiento manual</p>
          </div>
        )
      }

      {!loading && entries.length > 0 && (
        <div className="text-center text-sm text-gray-500 dark:text-[#888888]">
          Mostrando {entries.length} asientos contables
        </div>
      )}

      {/* New Entry Modal */}
      <CustomModal isOpen={isOpen} onClose={() => setIsOpen(false)} size="3xl" scrollable>
        <CustomModalHeader onClose={() => setIsOpen(false)}>
          <Plus className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          Nuevo Asiento Manual
        </CustomModalHeader>
        <CustomModalBody className="space-y-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Descripción del asiento..."
                  className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666666] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Lines */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Líneas del asiento</label>
                <button
                  onClick={addLine}
                  className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:underline"
                >
                  <Plus className="h-3 w-3" /> Agregar línea
                </button>
              </div>
              <div className="space-y-2">
                {newLines.map((line, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={line.accountId}
                      onChange={(e) => updateLine(idx, 'accountId', e.target.value)}
                      className="h-9 flex-1 rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-2 text-xs text-gray-700 dark:text-gray-300 focus:border-purple-500 focus:outline-none"
                    >
                      <option value="">Seleccionar cuenta...</option>
                      {leafAccounts.map((acc) => (
                        <option key={acc._id} value={acc._id}>
                          {acc.code} - {acc.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Descripción"
                      value={line.description}
                      onChange={(e) => updateLine(idx, 'description', e.target.value)}
                      className="h-9 w-32 rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-2 text-xs text-gray-700 dark:text-gray-300 focus:border-purple-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Debe"
                      value={line.debit}
                      onChange={(e) => updateLine(idx, 'debit', e.target.value)}
                      className="h-9 w-28 rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-2 text-right font-mono text-xs text-gray-700 dark:text-gray-300 focus:border-purple-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Haber"
                      value={line.credit}
                      onChange={(e) => updateLine(idx, 'credit', e.target.value)}
                      className="h-9 w-28 rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-2 text-right font-mono text-xs text-gray-700 dark:text-gray-300 focus:border-purple-500 focus:outline-none"
                    />
                    <button
                      onClick={() => removeLine(idx)}
                      disabled={newLines.length <= 2}
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                        newLines.length <= 2
                          ? 'text-gray-300 dark:text-[#444444] cursor-not-allowed'
                          : 'text-red-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600'
                      )}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Balance check */}
            <div
              className={cn(
                'flex items-center justify-between rounded-lg border p-3',
                isBalanced
                  ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30'
                  : 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30'
              )}
            >
              <div className="flex items-center gap-2">
                {!isBalanced && <AlertCircle className="h-4 w-4 text-red-500" />}
                <span className={cn('text-sm font-medium', isBalanced ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300')}>
                  {isBalanced ? 'Asiento balanceado' : 'Asiento no balanceado'}
                </span>
              </div>
              <div className="flex items-center gap-4 font-mono text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Debe: <span className="font-semibold text-gray-900 dark:text-white">{formatCurrencyAccounting(totalDebit)}</span>
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  Haber: <span className="font-semibold text-gray-900 dark:text-white">{formatCurrencyAccounting(totalCredit)}</span>
                </span>
                {!isBalanced && totalDebit > 0 && (
                  <span className="text-red-600 dark:text-red-400">
                    Dif: {formatCurrencyAccounting(Math.abs(totalDebit - totalCredit))}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CustomModalBody>
        <CustomModalFooter>
          <Button variant="light" onPress={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button
            color="secondary"
            onPress={handleSaveEntry}
            isDisabled={!isBalanced}
            className="bg-purple-600 text-white"
          >
            Guardar Asiento
          </Button>
        </CustomModalFooter>
      </CustomModal>
    </div >
  );
}
