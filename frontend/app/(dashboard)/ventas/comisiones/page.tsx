'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Download,
  DollarSign,
  ChevronDown,
  Briefcase,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  Clock,
  X,
  Target
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/mock-data/sales-orders';
import { cn } from '@/lib/utils/cn';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import { Pagination } from '@/components/ui/pagination';
import { commissionsService, CommissionRecord, CommissionsSummary } from '@/lib/services/api/commissions';
import { api } from '@/lib/services/api'; // for grabbing users if needed

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  // Collection Statuses
  PENDING: { label: 'Pendiente', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  PARTIAL: { label: 'Parcial', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
  PAID: { label: 'Pagado', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },

  // Commission Statuses
  PENDING_COLLECTION: { label: 'Esperando Cobro', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', dot: 'bg-gray-500' },
  PARTIAL_ELIGIBLE: { label: 'Elegible Parcial', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
  ELIGIBLE: { label: 'Elegible Total', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  LIQUIDATED: { label: 'Liquidado', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', dot: 'bg-purple-500' },
};

export default function CommissionsPage() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<CommissionRecord[]>([]);
  const [summary, setSummary] = useState<CommissionsSummary | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [collectionStatus, setCollectionStatus] = useState<string>('all');
  const [commissionStatus, setCommissionStatus] = useState<string>('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const [recs, sum] = await Promise.all([
        commissionsService.getAll(),
        commissionsService.getSummary()
      ]);
      setRecords(recs || []);
      setSummary(sum || null);
    } catch (error) {
      toast.error('Error al cargar comisiones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const search = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        r.invoice.number.toLowerCase().includes(search) ||
        r.customer.legalName.toLowerCase().includes(search) ||
        r.seller.name.toLowerCase().includes(search);

      const matchCol = collectionStatus === 'all' || r.collectionStatus === collectionStatus;
      const matchComm = commissionStatus === 'all' || r.commissionStatus === commissionStatus;
      
      // If user is basic seller, force filter on their ID
      const matchUser = (user?.role === 'vendedor') ? r.sellerUserId === user.id : true;

      return matchSearch && matchCol && matchComm && matchUser;
    });
  }, [records, searchQuery, collectionStatus, commissionStatus, user]);

  const paginatedRecords = useMemo(() => {
    return filteredRecords.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );
  }, [filteredRecords, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);

  const clearFilters = () => {
    setSearchQuery('');
    setCollectionStatus('all');
    setCommissionStatus('all');
  };

  const handleExport = () => {
    toast.success('Exportando reporte de comisiones');
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <SkeletonTable rows={5} columns={8} hasHeader={true} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Comisiones</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Descargar Reporte
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: 'Venta Total', value: summary?.invoiceTotal || 0, icon: Briefcase, color: 'blue' },
          { label: 'Base Comisionable', value: summary?.commissionableAmount || 0, icon: Target, color: 'purple' },
          { label: 'Comisión Elegible (Cobrado)', value: summary?.commissionEligibleAmount || 0, icon: FileCheck, color: 'emerald' },
          { label: 'Pendiente Comisionar (Por Cobrar)', value: summary?.commissionPendingAmount || 0, icon: Clock, color: 'amber' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="rounded-[12px] border-none bg-white p-4 shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_1px_0_rgba(0,0,0,0.08),inset_0_-1px_0_rgba(0,0,0,0.2)]"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                stat.color === 'blue' && 'bg-blue-500/10 text-blue-500',
                stat.color === 'purple' && 'bg-purple-500/10 text-purple-500',
                stat.color === 'emerald' && 'bg-emerald-500/10 text-emerald-500',
                stat.color === 'amber' && 'bg-amber-500/10 text-amber-500'
              )}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{formatCurrency(stat.value)}</p>
                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por Factura, Cliente o Vendedor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-4 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Collection Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={collectionStatus !== 'all' ? 'default' : 'secondary'} size="sm" className="gap-2">
                {collectionStatus !== 'all' ? STATUS_CONFIG[collectionStatus]?.label : 'Cobro'}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setCollectionStatus('all')}>Todos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCollectionStatus('PENDING')}>Pendiente</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCollectionStatus('PARTIAL')}>Parcial</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCollectionStatus('PAID')}>Pagado</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Commission Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={commissionStatus !== 'all' ? 'default' : 'secondary'} size="sm" className="gap-2">
                {commissionStatus !== 'all' ? STATUS_CONFIG[commissionStatus]?.label : 'Comisión'}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setCommissionStatus('all')}>Todos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCommissionStatus('PENDING_COLLECTION')}>Esperando Cobro</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCommissionStatus('PARTIAL_ELIGIBLE')}>Elegible Parcial</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCommissionStatus('ELIGIBLE')}>Elegible Total</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCommissionStatus('LIQUIDATED')}>Liquidado</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {(searchQuery || collectionStatus !== 'all' || commissionStatus !== 'all') && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              <X className="h-4 w-4 mr-1" /> Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-[#1a1a1a] border-b border-border">
            <tr>
              <th className="px-4 py-3 font-semibold text-muted-foreground uppercase text-xs">Factura / Fecha</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground uppercase text-xs">Cliente / Vendedor</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground text-right uppercase text-xs">Total</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground text-right uppercase text-xs">Comisionable</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground text-right uppercase text-xs">Cobrado</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground text-right uppercase text-xs text-blue-600">Elegible (A Pagar)</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground text-center uppercase text-xs">Estado Cobro</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground text-center uppercase text-xs">Estado Comisión</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedRecords.map((r) => {
              const colCfg = STATUS_CONFIG[r.collectionStatus] || STATUS_CONFIG.PENDING;
              const commCfg = STATUS_CONFIG[r.commissionStatus] || STATUS_CONFIG.PENDING_COLLECTION;

              return (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-blue-600">{r.invoice?.number || '-'}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(r.saleDate)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium truncate max-w-[200px]" title={r.customer?.legalName}>{r.customer?.legalName}</div>
                    <div className="text-xs text-muted-foreground">{r.seller?.name || 'Vendedor Desconocido'}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(Number(r.invoiceTotal))}</td>
                  <td className="px-4 py-3 text-right text-purple-600 font-medium">{formatCurrency(Number(r.commissionableAmount))}</td>
                  
                  <td className="px-4 py-3 text-right">
                    <div className="font-medium">{formatCurrency(Number(r.paidAmount))}</div>
                    <div className="text-[10px] text-muted-foreground text-amber-600">Pend: {formatCurrency(Number(r.invoiceTotal) - Number(r.paidAmount))}</div>
                  </td>
                  
                  <td className="px-4 py-3 text-right text-emerald-600">
                    <div className="font-bold">{formatCurrency(Number(r.commissionEligibleAmount))}</div>
                    <div className="text-[10px] text-muted-foreground">Pend: {formatCurrency(Number(r.commissionPendingAmount))}</div>
                  </td>
                  
                  <td className="px-4 py-3 text-center">
                    <span className={cn('inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold', colCfg.bg, colCfg.text)}>
                       {colCfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold', commCfg.bg, commCfg.text)}>
                       {commCfg.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            
            {paginatedRecords.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-muted-foreground">
                  No se encontraron resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Pagination */}
      {filteredRecords.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredRecords.length}
          rowsPerPage={rowsPerPage}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(val) => {
            setRowsPerPage(val);
            setCurrentPage(1);
          }}
          itemName="comisiones"
        />
      )}
    </div>
  );
}
