'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/services/api'; import {
  Scale,
  ChevronRight,
  ChevronDown,
  Plus,
  Activity,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/auth-context';
import { cn } from '@/lib/utils/cn';
import {
  formatCurrencyAccounting,
} from '@/lib/mock-data/accounting';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPE_COLORS,
  ACCOUNT_NATURE_LABELS,
} from '@/lib/types/accounting';
import type { Account, AccountType, AccountNature } from '@/lib/types/accounting';

function AccountRow({
  account,
  expanded,
  onToggle,
  searchQuery,
}: {
  account: Account;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  searchQuery: string;
}) {
  const hasChildren = account.children && account.children.length > 0;
  const isExpanded = expanded.has(account.id);

  const typeColor = ACCOUNT_TYPE_COLORS[account.type as AccountType] || { bg: 'bg-gray-100', text: 'text-gray-700' };
  const indent = (account.level - 1) * 24;

  return (
    <>
      <tr
        className={cn(
          'group transition-colors',
          account.level === 1
            ? 'bg-gray-50 dark:bg-[#1a1a1a] font-semibold'
            : 'hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
        )}
      >
        <td className="px-4 py-2.5" style={{ paddingLeft: `${16 + indent}px` }}>
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button
                onClick={() => onToggle(account.id)}
                className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-gray-200 dark:hover:bg-[#2a2a2a]"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
                )}
              </button>
            ) : (
              <span className="w-5" />
            )}
            <span
              className={cn(
                'font-mono text-sm',
                account.level === 1
                  ? 'font-bold text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400'
              )}
            >
              {account.code}
            </span>
          </div>
        </td>
        <td className="px-4 py-2.5">
          <span
            className={cn(
              'text-sm',
              account.level === 1
                ? 'font-bold text-gray-900 dark:text-white'
                : account.level === 2
                  ? 'font-medium text-gray-800 dark:text-gray-200'
                  : 'text-gray-700 dark:text-gray-300'
            )}
          >
            {account.name}
          </span>
          {account.balance !== 0 && (
            <Activity className="ml-1.5 inline h-3 w-3 text-emerald-500" />
          )}
        </td>
        <td className="px-4 py-2.5 text-center">
          <span
            className={cn(
              'inline-flex rounded-md px-2 py-0.5 text-xs font-medium',
              typeColor.bg,
              typeColor.text
            )}
          >
            {ACCOUNT_TYPE_LABELS[account.type as AccountType]}
          </span>
        </td>
        <td className="px-4 py-2.5 text-center">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {ACCOUNT_NATURE_LABELS[account.nature as AccountNature]}
          </span>
        </td>
        <td className="px-4 py-2.5 text-center">
          <span
            className={cn(
              'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
              account.isActive
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'bg-gray-500/10 text-gray-500'
            )}
          >
            {account.isActive ? 'Activa' : 'Inactiva'}
          </span>
        </td>
        <td className="px-4 py-2.5 text-right">
          <span
            className={cn(
              'font-mono text-sm',
              account.level === 1
                ? 'font-bold text-gray-900 dark:text-white'
                : 'text-gray-700 dark:text-gray-300',
              account.balance < 0 && 'text-red-600 dark:text-red-400'
            )}
          >
            {formatCurrencyAccounting(account.balance)}
          </span>
        </td>
      </tr>
      {isExpanded &&
        account.children?.map((child: any) => (
          <AccountRow
            key={child.id}
            account={child}
            expanded={expanded}
            onToggle={onToggle}
            searchQuery={searchQuery}
          />
        ))}
    </>
  );
}

export default function PlanCuentasPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();
  const canCreateManualEntries = checkPermission('canCreateManualEntries');

  const [realAccounts, setRealAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAccounts = async () => {
    try {
      const data = await api.getAccounts();
      setRealAccounts(data);
    } catch (err) {
      toast.error('Error cargando cuentas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [isOpen, setIsOpen] = useState(false);

  // New account form
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<string>('asset');
  const [newNature, setNewNature] = useState<string>('deudora');
  const [newParent, setNewParent] = useState<string>('');

  const accountTree = useMemo(() => {
    const list = realAccounts.map(a => ({
      ...a,
      id: a._id,
      nature: (a.type === 'asset' || a.type === 'expense') ? 'deudora' : 'acreedora',
      level: a.code.split('.').length,
    }));

    const buildTree = (parentId: string | null = null): any[] => {
      return list
        .filter((a) => a.parentId === (parentId ? list.find(l => l.id === parentId)?.code : null))
        .map((a) => ({
          ...a,
          children: buildTree(a.id),
        }))
        .sort((a, b) => a.code.localeCompare(b.code));
    };

    return buildTree(null);
  }, [realAccounts]);

  const parentAccounts = useMemo(
    () => realAccounts.filter((a) => a.isGroup),
    [realAccounts]
  );

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpanded(new Set(realAccounts.map((a) => a._id)));
  };

  const collapseAll = () => {
    setExpanded(new Set());
  };

  const handleSaveAccount = async () => {
    if (!newCode.trim() || !newName.trim()) {
      toast.error('Debe ingresar código y nombre de la cuenta');
      return;
    }
    try {
      const parentAcc = newParent ? realAccounts.find((a) => a._id === newParent) : null;
      await api.createAccount({
        code: newCode,
        name: newName,
        type: newType,
        parentId: parentAcc ? parentAcc.code : null,
        isGroup: false, // Default to leaf for now
      });
      toast.success('Cuenta creada exitosamente');
      setIsOpen(false);
      setNewCode('');
      setNewName('');
      fetchAccounts();
    } catch (err: any) {
      toast.error('Error', { description: err.message });
    }
  };

  const handleSeed = async () => {
    try {
      await api.seedCOA();
      toast.success('COA generado');
      fetchAccounts();
    } catch (err) {
      toast.error('Error al generar COA');
    }
  };

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
            <Scale className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Plan de Cuentas</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSeed}
            className="h-9 px-4 text-sm font-medium"
          >
            Generar catálogo base
          </Button>
          {canCreateManualEntries && (
            <Button
              onClick={() => setIsOpen(true)}
              className="flex h-9 items-center gap-2 rounded-lg bg-purple-600 px-4 text-sm font-medium text-white transition-colors hover:bg-purple-700"
            >
              <Plus className="h-4 w-4" />
              Nueva Cuenta
            </Button>
          )}
        </div>
      </div>

      {/* Search + Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar cuenta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] pl-9 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666666] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="rounded-lg bg-gray-100 dark:bg-[#1a1a1a] px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2a2a2a]"
          >
            Expandir todo
          </button>
          <button
            onClick={collapseAll}
            className="rounded-lg bg-gray-100 dark:bg-[#1a1a1a] px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2a2a2a]"
          >
            Colapsar todo
          </button>
        </div>
      </div>

      {/* Account Tree Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                  Nombre
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                  Tipo
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                  Naturaleza
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                  Saldo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
              {accountTree.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  expanded={expanded}
                  onToggle={toggleExpand}
                  searchQuery={searchQuery}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center text-sm text-gray-500 dark:text-[#888888]">
        {realAccounts.length} cuentas en el plan contable
      </div>

      {/* New Account Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Nueva Cuenta
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Código (XXXX-YYY)
                </label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="1100-006"
                  className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 font-mono text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666666] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nombre de la cuenta"
                  className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666666] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
                <Select
                  value={newType}
                  onValueChange={setNewType}
                >
                  <SelectTrigger className="h-10 w-full bg-white dark:bg-[#1a1a1a] border-gray-300 dark:border-[#2a2a2a]">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACCOUNT_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Naturaleza</label>
                <Select
                  value={newNature}
                  onValueChange={setNewNature}
                >
                  <SelectTrigger className="h-10 w-full bg-white dark:bg-[#1a1a1a] border-gray-300 dark:border-[#2a2a2a]">
                    <SelectValue placeholder="Seleccionar naturaleza" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACCOUNT_NATURE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cuenta Padre</label>
              <Select
                value={newParent || "root"}
                onValueChange={(val) => setNewParent(val === "root" ? "" : val)}
              >
                <SelectTrigger className="h-10 w-full bg-white dark:bg-[#1a1a1a] border-gray-300 dark:border-[#2a2a2a]">
                  <SelectValue placeholder="Sin cuenta padre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Sin cuenta padre (nivel 1)</SelectItem>
                  {parentAccounts.map((acc) => (
                    <SelectItem key={acc._id} value={acc._id}>
                      {acc.code} - {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAccount} className="bg-purple-600 text-white hover:bg-purple-700">
              Crear Cuenta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
