'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, Search, Building2, User, Phone, Mail, MoreVertical, 
  CreditCard, Filter, ChevronLeft, ChevronRight as ChevronRightIcon, 
  ChevronsLeft, ChevronsRight, Upload, Download, FileSpreadsheet, DownloadCloud, FileCheck2, AlertCircle, Edit, Copy, ToggleLeft, Trash2, Loader2
} from 'lucide-react';
import { api } from '@/lib/services/api';
import { cn } from '@/lib/utils/cn';
import * as XLSX from 'xlsx';
import { useAuth } from '@/lib/contexts/auth-context';
import { useAlerts } from '@/components/providers/alert-provider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Progress } from '@/components/ui/progress';

import { SkeletonTable } from '@/components/ui/skeleton-table';
import { Pagination } from '@/components/ui/pagination';

function formatCurrency(amount: number | undefined | null) {
  if (amount === undefined || amount === null) return '$0.00';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { success: alertSuccess, error: alertError, info: alertInfo } = useAlerts();

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [exportSearchQuery, setExportSearchQuery] = useState('');
  const [exportSelectedIds, setExportSelectedIds] = useState<Set<string>>(new Set());
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);


  const loadClients = async () => {
    try {
      const data = await api.getClients();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleEditClient = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/clientes/${client.id}/editar`);
  };

  const handleDuplicateClient = async (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const clientName = client.name || "Cliente";
      const copyData = {
        name: `${clientName} (Copia)`,
        reference: `${client.reference}-COPIA`,
        documentId: client.documentId,
        type: client.type,
        status: 'inactive'
      };
      
      await api.createClient(copyData);
      alertSuccess(`Cliente duplicado`, `"${clientName}" ha sido copiado.`);
      loadClients();
    } catch (error: any) {
      alertError("Error al duplicar", error.message || "Ocurrió un error.");
    }
  };

  const handleToggleStatus = async (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newStatus = client.status === "active" ? "inactive" : "active";
      await api.updateClient(client.id, { status: newStatus });
      alertSuccess(
        `Cliente ${newStatus === "active" ? "activado" : "desactivado"}`,
        `"${client.name}" ha sido actualizado.`
      );
      loadClients();
    } catch (err: any) {
      alertError("Error al cambiar estado", err.message);
    }
  };

  const handleDeleteClick = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClient(client);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedClient) {
      try {
        await api.deleteClient(selectedClient.id);
        alertSuccess("Cliente eliminado", `"${selectedClient.name}" ha sido eliminado.`);
        loadClients();
      } catch (err: any) {
        alertError("Error al eliminar", err.message);
      } finally {
        setIsDeleteOpen(false);
        setSelectedClient(null);
      }
    }
  };

  const handleExportClients = () => {
    if (clients.length === 0) {
      alertError('Sin clientes', 'No tienes clientes registrados para exportar.');
      return;
    }
    setExportSelectedIds(new Set(clients.map(c => c.id)));
    setExportSearchQuery('');
    setExportFormat('xlsx');
    setIsExportOpen(true);
  };

  const onExportFile = async () => {
    if (exportSelectedIds.size === 0) {
      alertError('Sin selección', 'Selecciona al menos un cliente para exportar.');
      return;
    }
    setIsExporting(true);
    try {
      await api.exportClients(exportFormat, Array.from(exportSelectedIds));
      alertSuccess('Exportación completada', `${exportSelectedIds.size} cliente(s) exportado(s) correctamente.`);
      setIsExportOpen(false);
    } catch (err: any) {
      alertError('Error al exportar', err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClients = () => {
    setIsImportOpen(true);
    setImportResults(null);
    setImportProgress(0);
    setSelectedFile(null);
    setImportSuccess(false);
  };

  const onImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  }
  const onConfirmImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setImportProgress(2);

    try {
      const reader = new FileReader();
      const fileData = await new Promise<ArrayBuffer>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
        reader.onerror = (e) => reject(e);
        reader.readAsArrayBuffer(selectedFile);
      });

      const workbook = XLSX.read(fileData, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (jsonData.length < 2) {
        throw new Error("El archivo está vacío o no tiene suficientes filas");
      }

      // Identify headers
      let headerRowIndex = 0;
      let headers: string[] = [];

      for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
        const row = jsonData[i];
        if (row && Array.isArray(row) && row.some((v: any) => v?.toString().trim().toLowerCase().includes('codigo') || v?.toString().trim().toLowerCase().includes('código'))) {
          headerRowIndex = i;
          headers = row.map((v: any) => v?.toString().trim());
          break;
        }
      }

      if (headers.length === 0) {
        headers = jsonData[0].map((v: any) => v?.toString().trim());
      }

      const colMap: any = {};
      headers.forEach((h, i) => {
        if (!h) return;
        const lower = h.toLowerCase();
        if (lower.includes('codigo') || lower.includes('código')) colMap.code = i;
        if (lower.includes('nombre') || lower.includes('razon') || lower.includes('razón')) colMap.name = i;
        if (lower.includes('identificacion') || lower.includes('identificación') || lower.includes('ruc')) colMap.taxId = i;
        if (lower.includes('telefono') || lower.includes('teléfono')) colMap.phone = i;
        if (lower.includes('celular') || lower.includes('movil') || lower.includes('móvil')) colMap.mobile = i;
        if (lower.includes('correo') || lower.includes('email')) colMap.email = i;
      });

      const missing: string[] = [];
      if (colMap.code === undefined) missing.push('Código');
      if (colMap.name === undefined) missing.push('Nombre');

      if (missing.length > 0) {
        alertError("Columnas faltantes", `Faltan requeridas: ${missing.join(', ')}`);
        setIsImporting(false);
        return;
      }

      const rowsToProcess = jsonData.slice(headerRowIndex + 1);
      const totalRows = rowsToProcess.length;
      const batchSize = 50;
      const finalResults = { success: 0, failed: 0, errors: [] as string[] };

      for (let i = 0; i < totalRows; i += batchSize) {
        const batch = rowsToProcess.slice(i, i + batchSize).map((row, idx) => ({
          code: row[colMap.code]?.toString().trim(),
          legalName: row[colMap.name]?.toString().trim(),
          taxId: colMap.taxId !== undefined ? row[colMap.taxId]?.toString().trim() : null,
          phone: colMap.phone !== undefined ? row[colMap.phone]?.toString().trim() : null,
          mobile: colMap.mobile !== undefined ? row[colMap.mobile]?.toString().trim() : null,
          email: colMap.email !== undefined ? row[colMap.email]?.toString().trim() : null,
          rowNumber: headerRowIndex + 1 + i + idx + 1
        }));

        const response = await api.importClientsBatch(batch);

        if (response.success) {
          finalResults.success += response.details.success;
          finalResults.failed += response.details.failed;
          finalResults.errors.push(...response.details.errors);
        }

        setImportProgress(Math.min(100, Math.round(((i + batch.length) / totalRows) * 100)));
      }

      setImportResults(finalResults);
      setImportSuccess(true);
      alertSuccess("Importación completada", `Se procesaron ${totalRows} filas.`);
      loadClients();

    } catch (error: any) {
      alertError("Error al importar", error.message || "No se pudo procesar el archivo");
      console.error("Import error:", error);
    } finally {
      setIsImporting(false);
    }
  };


  const filteredClients = clients.filter(client => {
    const matchesSearch = (client.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (client.reference?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (client.documentId?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || client.type === filterType;
    return matchesSearch && matchesType;
  });

  // Paginación
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredClients.slice(startIndex, endIndex);
  }, [filteredClients, currentPage, rowsPerPage]);

  const isAllSelected = paginatedClients.length > 0 && paginatedClients.every(c => selectedIds.has(c.id));
  const isIndeterminate = paginatedClients.some(c => selectedIds.has(c.id)) && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        paginatedClients.forEach(c => next.delete(c.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        paginatedClients.forEach(c => next.add(c.id));
        return next;
      });
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    let success = 0;
    let failed = 0;
    for (const id of selectedIds) {
      try {
        await api.deleteClient(id);
        success++;
      } catch {
        failed++;
      }
    }
    setIsBulkDeleting(false);
    setIsBulkDeleteOpen(false);
    setSelectedIds(new Set());
    if (success > 0) alertSuccess(`${success} cliente(s) eliminado(s)`, failed > 0 ? `${failed} no pudieron eliminarse.` : '');
    if (failed > 0 && success === 0) alertError('Error al eliminar', `No se pudo eliminar ningún cliente.`);
    loadClients();
  };

  const totalPages = Math.ceil(filteredClients.length / rowsPerPage);

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
            variant="secondary"
            onClick={handleImportClients}
            className="hidden sm:flex"
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button
            variant="secondary"
            onClick={handleExportClients}
            className="hidden sm:flex"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            onClick={() => router.push('/clientes/nuevo')}
          >
            <Plus className="h-4 w-4 mr-2" />
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

        <div className="overflow-x-auto relative">
          {/* Barra de acciones masivas */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-brand-50 dark:bg-brand-950/30 border-b border-brand-200 dark:border-brand-800 animate-in slide-in-from-top-1 duration-200">
              <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
                {selectedIds.size} cliente{selectedIds.size !== 1 ? 's' : ''} seleccionado{selectedIds.size !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancelar selección
                </button>
                <button
                  onClick={() => setIsBulkDeleteOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar {selectedIds.size}
                </button>
              </div>
            </div>
          )}
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
            <thead className="bg-gray-50/50 dark:bg-[#1a1a1a]/50 text-xs text-gray-500 dark:text-[#888]">
              <tr>
                <th className="pl-4 pr-2 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => { if (el) el.indeterminate = isIndeterminate; }}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-4 font-medium">Cliente</th>
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
                  <td colSpan={7} className="p-0">
                    <SkeletonTable hasHeader={false} />
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <User className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                    <p>No se encontraron clientes.</p>
                  </td>
                </tr>
              ) : (
                paginatedClients.map((client) => (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={client.id}
                    onClick={() => router.push(`/clientes/${client.id}`)}
                    className={cn(
                      "group cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors",
                      selectedIds.has(client.id) && "bg-brand-50/50 dark:bg-brand-900/10"
                    )}
                  >
                    <td className="pl-4 pr-2 py-4" onClick={(e) => toggleSelect(client.id, e)}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(client.id)}
                        onChange={() => { }}
                        className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-4">
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
                        {client.type?.toUpperCase() || 'CLIENTE'}
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
                          Restante: {formatCurrency((client.creditLimit || 0) - (client.currentBalance || 0))}
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
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="text-gray-400 hover:text-brand-500">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] shadow-lg">
                          <DropdownMenuItem onClick={(e) => handleEditClient(client, e)} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                            <Edit className="mr-2 h-4 w-4 text-gray-500" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleDuplicateClient(client, e)} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                            <Copy className="mr-2 h-4 w-4 text-gray-500" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleToggleStatus(client, e)} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                            <ToggleLeft className="mr-2 h-4 w-4 text-gray-500" />
                            {client.status === "active" ? "Desactivar" : "Activar"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-gray-100 dark:bg-[#2a2a2a]" />
                          <DropdownMenuItem
                            onClick={(e) => handleDeleteClick(client, e)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {filteredClients.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredClients.length}
          rowsPerPage={rowsPerPage}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(newRowsPerPage) => {
            setRowsPerPage(newRowsPerPage);
            setCurrentPage(1);
          }}
          itemName="clientes"
        />
      )}

      {/* MODAL DE IMPORTACIÓN */}
      <Dialog open={isImportOpen} onOpenChange={(open) => !isImporting && setIsImportOpen(open)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Importar Clientes</DialogTitle>
            <DialogDescription>
              Carga un archivo Excel o CSV para añadir o actualizar clientes de forma masiva.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {!importResults ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-200 dark:border-[#2a2a2a] rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors relative">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={onImportFile}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isImporting}
                  />
                  <FileSpreadsheet className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedFile ? selectedFile.name : "Haz clic o arrastra un archivo aquí"}
                  </p>
                  {!selectedFile && (
                    <p className="text-xs text-gray-500 mt-1">Soporta .xlsx y .csv</p>
                  )}
                </div>

                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                  <h4 className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center justify-between">
                    Columnas Permitidas:
                  </h4>
                  <p className="text-[10px] text-blue-700 dark:text-blue-500 leading-normal">
                    <strong>Código</strong>, <strong>Nombre</strong>, Identificación, Teléfono, Celular, E-Mail.
                  </p>
                  <a
                    href="/templates/plantilla-clientes.xlsx"
                    download
                    className="inline-flex items-center gap-1.5 mt-3 text-[11px] font-semibold text-brand-600 hover:text-brand-700 bg-white dark:bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-blue-200 dark:border-brand-900/50 shadow-sm transition-colors"
                  >
                    <DownloadCloud className="h-3 w-3" />
                    Descargar Plantilla de Ejemplo
                  </a>
                </div>

                {isImporting && (
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Procesando archivo...</span>
                      <span className="text-gray-500">{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} className="h-2" />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border flex items-center gap-4 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                    <FileCheck2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                      Importación Finalizada
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                      Se han procesado {importResults.success + importResults.failed} registros.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] text-center">
                    <div className="text-2xl font-bold text-emerald-600">{importResults.success}</div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">Exitosos</div>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] text-center">
                    <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">Fallidos</div>
                  </div>
                </div>

                {importResults.errors?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      Detalle de Errores ({importResults.errors.length})
                    </h4>
                    <div className="max-h-[150px] overflow-y-auto p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-xs text-red-600 dark:text-red-400 space-y-1">
                      {importResults.errors.map((err: string, idx: number) => (
                        <div key={idx} className="flex gap-2">
                          <span className="opacity-50">•</span>
                          <span>{err}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
            {!importResults ? (
               <>
                <Button
                    variant="ghost"
                    disabled={isImporting}
                    onClick={() => {
                        setIsImportOpen(false);
                        setImportResults(null);
                        setSelectedFile(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                >
                    Cancelar
                </Button>
                {selectedFile && (
                    <Button
                        onClick={onConfirmImport}
                        disabled={isImporting}
                        className={cn(
                          "px-6 h-10 rounded-xl shadow-sm text-white font-medium",
                          isImporting && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isImporting ? "Procesando..." : "Confirmar e Importar"}
                    </Button>
                )}
               </>
            ) : (
                <Button 
                   onClick={() => setIsImportOpen(false)} 
                   className="w-full h-10 rounded-xl shadow-sm font-medium"
                >
                    Listo
                </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE EXPORTACIÓN */}
      <Dialog open={isExportOpen} onOpenChange={(open) => !isExporting && setIsExportOpen(open)}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DownloadCloud className="h-5 w-5 text-brand-500" />
              Exportar Clientes
            </DialogTitle>
            <DialogDescription>
              Selecciona los clientes que deseas exportar y el formato de descarga.
            </DialogDescription>
          </DialogHeader>

          {/* Formato */}
          <div className="flex gap-3 py-2">
            <button
              onClick={() => setExportFormat('xlsx')}
              className={cn(
                "flex-1 flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                exportFormat === 'xlsx'
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                  : "border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] hover:border-emerald-300"
              )}
            >
              <FileSpreadsheet className={cn("h-5 w-5", exportFormat === 'xlsx' ? "text-emerald-600" : "text-gray-400")} />
              <span className={cn("text-sm font-semibold", exportFormat === 'xlsx' ? "text-emerald-700 dark:text-emerald-300" : "text-gray-600 dark:text-gray-400")}>Excel (.xlsx)</span>
            </button>
            <button
              onClick={() => setExportFormat('csv')}
              className={cn(
                "flex-1 flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                exportFormat === 'csv'
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                  : "border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] hover:border-blue-300"
              )}
            >
              <FileCheck2 className={cn("h-5 w-5", exportFormat === 'csv' ? "text-blue-600" : "text-gray-400")} />
              <span className={cn("text-sm font-semibold", exportFormat === 'csv' ? "text-blue-700 dark:text-blue-300" : "text-gray-600 dark:text-gray-400")}>CSV (.csv)</span>
            </button>
          </div>

          {/* Buscador + Selección */}
          <div className="border border-gray-200 dark:border-[#2a2a2a] rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a]">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={exportSelectedIds.size === clients.length && clients.length > 0}
                  ref={(el) => {
                    if (el) el.indeterminate = exportSelectedIds.size > 0 && exportSelectedIds.size < clients.length;
                  }}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setExportSelectedIds(new Set(clients.map(c => c.id)));
                    } else {
                      setExportSelectedIds(new Set());
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Seleccionar todos ({exportSelectedIds.size}/{clients.length})
                </span>
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={exportSearchQuery}
                  onChange={(e) => setExportSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0a0a0a] text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500 w-44"
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1" style={{ maxHeight: '280px' }}>
              {clients
                .filter(c => !exportSearchQuery || c.name.toLowerCase().includes(exportSearchQuery.toLowerCase()) || c.documentId?.toLowerCase().includes(exportSearchQuery.toLowerCase()))
                .map(client => (
                  <label
                    key={client.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a] border-b border-gray-100 dark:border-[#1e1e1e] last:border-0",
                      exportSelectedIds.has(client.id) && "bg-brand-50/50 dark:bg-brand-900/10"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={exportSelectedIds.has(client.id)}
                      onChange={(e) => {
                        setExportSelectedIds(prev => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(client.id);
                          else next.delete(client.id);
                          return next;
                        });
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{client.name}</p>
                      <p className="text-xs text-gray-500">{client.documentId || 'Sin ID'} • {client.type?.toUpperCase()}</p>
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 shrink-0">
                      Balance: ${Number(client.currentBalance || 0).toFixed(2)}
                    </span>
                  </label>
                ))
              }
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" disabled={isExporting} onClick={() => setIsExportOpen(false)}>
              Cancelar
            </Button>
            <button
              onClick={onExportFile}
              disabled={isExporting || exportSelectedIds.size === 0}
              style={{ backgroundColor: '#10b981', color: '#ffffff', fontWeight: 600 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity text-sm"
            >
              {isExporting
                ? <><Loader2 className="h-4 w-4 animate-spin" />Exportando...</>
                : <><DownloadCloud className="h-4 w-4" />Exportar {exportSelectedIds.size} cliente{exportSelectedIds.size !== 1 ? 's' : ''}</>
              }
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE ELIMINAR */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Eliminar Cliente
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar permanentemente a <strong>{selectedClient?.name}</strong>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* MODAL ELIMINACIÓN MASIVA */}
      <Dialog open={isBulkDeleteOpen} onOpenChange={(open) => !isBulkDeleting && setIsBulkDeleteOpen(open)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Eliminar {selectedIds.size} cliente{selectedIds.size !== 1 ? 's' : ''}
            </DialogTitle>
            <DialogDescription>
              Esta acción eliminará permanentemente <strong>{selectedIds.size} cliente{selectedIds.size !== 1 ? 's' : ''}</strong> seleccionado{selectedIds.size !== 1 ? 's' : ''}. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button variant="outline" disabled={isBulkDeleting} onClick={() => setIsBulkDeleteOpen(false)}>
              Cancelar
            </Button>
            <button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              style={{ backgroundColor: '#dc2626', color: '#ffffff', fontWeight: 600 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity text-sm"
            >
              {isBulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {isBulkDeleting ? 'Eliminando...' : `Eliminar ${selectedIds.size}`}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
