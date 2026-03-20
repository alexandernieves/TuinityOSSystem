"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  FileText,
  Search,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/contexts/auth-context";
import { cn } from "@/lib/utils/cn";
import { api } from "@/lib/services/api";
import { useStore } from "@/hooks/use-store";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import {
  ADJUSTMENT_STATUS_LABELS,
  ADJUSTMENT_REASONS,
  type AdjustmentStatus,
} from "@/lib/types/inventory";
import { CustomModal, CustomModalHeader, CustomModalBody } from "@/components/ui/custom-modal";
import { Package, MapPin, User, Info, FileStack } from "lucide-react";

type TabKey = "all" | "pendiente" | "aprobado" | "rechazado" | "aplicado";

export default function AjustesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkPermission } = useAuth();
  const canCreateAdjustments = checkPermission("canCreateAdjustments");
  const canApproveAdjustments = checkPermission("canApproveAdjustments");
  const canViewCosts = checkPermission("canViewCosts");

  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Get initial tab from URL
  const initialTab = (searchParams.get("status") as TabKey) || "all";
  const [selectedTab, setSelectedTab] = useState<TabKey>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch data
  const fetchAdjustments = async () => {
    setLoading(true);
    try {
      const data = await api.getAdjustments();
      setAdjustments(data);
    } catch (error) {
      console.error("Error fetching adjustments:", error);
      toast.error("Error cargando ajustes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdjustments();
  }, []);

  // Filter adjustments
  const filteredAdjustments = useMemo(() => {
    return adjustments.filter((adj) => {
      // Tab filter
      if (selectedTab !== "all" && adj.status?.toLowerCase() !== selectedTab && adj.status !== selectedTab) return false;

      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const reasonLabel =
          ADJUSTMENT_REASONS[adj.reason as keyof typeof ADJUSTMENT_REASONS] ||
          adj.reason ||
          "";
        const matchesSearch =
          (adj.reference || adj.id).toLowerCase().includes(searchLower) ||
          (adj.warehouseId?.name || "").toLowerCase().includes(searchLower) ||
          (adj.createdBy?.name || "").toLowerCase().includes(searchLower) ||
          reasonLabel.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [adjustments, selectedTab, searchQuery]);

  // Get status badge
  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || "pendiente";
    switch (s) {
      case "pendiente":
      case "pending":
        return {
          label: ADJUSTMENT_STATUS_LABELS["pendiente"],
          icon: Clock,
          bgColor: "bg-amber-100",
          textColor: "text-amber-700",
          iconColor: "text-amber-600",
        };
      case "aprobado":
      case "approved":
        return {
          label: ADJUSTMENT_STATUS_LABELS["aprobado"],
          icon: CheckCircle,
          bgColor: "bg-emerald-100",
          textColor: "text-emerald-700",
          iconColor: "text-emerald-600",
        };
      case "rechazado":
      case "rejected":
        return {
          label: ADJUSTMENT_STATUS_LABELS["rechazado"],
          icon: XCircle,
          bgColor: "bg-red-100",
          textColor: "text-red-700",
          iconColor: "text-red-600",
        };
      case "aplicado":
      case "applied":
        return {
          label: ADJUSTMENT_STATUS_LABELS["aplicado"],
          icon: CheckCircle,
          bgColor: "bg-blue-100",
          textColor: "text-blue-700",
          iconColor: "text-blue-600",
        };
      default:
        return {
          label: s,
          icon: Info,
          bgColor: "bg-gray-100",
          textColor: "text-gray-700",
          iconColor: "text-gray-500",
        };
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-PA", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  // View adjustment modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<any>(null);

  const handleViewAdjustment = async (adj: any) => {
    try {
      setLoading(true);
      const detail = await api.getAdjustmentById(adj._id || adj.id);
      setSelectedAdjustment(detail);
      setIsViewModalOpen(true);
    } catch (error) {
      toast.error("Error al cargar el detalle");
    } finally {
      setLoading(false);
    }
  };

  const handleNewAdjustment = () => {
    router.push("/inventario/ajustes/nuevo");
  };

  const updateStatus = async (adj: any, status: string) => {
    try {
      await api.updateAdjustmentStatus(adj._id || adj.id, status);
      toast.success(`Ajuste ${status}`);
      fetchAdjustments(); // Recargar lista
    } catch (error: any) {
      toast.error("Error", { description: error.message });
    }
  };

  const handleApprove = (adj: any) => updateStatus(adj, "aprobado");
  const handleReject = (adj: any) => updateStatus(adj, "rechazado");
  const handleApply = (adj: any) => updateStatus(adj, "aplicado");

  // Count by status
  const counts = useMemo(
    () => ({
      all: adjustments.length,
      pendiente: adjustments.filter((a) => a.status?.toLowerCase() === "pendiente" || a.status === "PENDING").length,
      aprobado: adjustments.filter((a) => a.status?.toLowerCase() === "aprobado" || a.status === "APPROVED").length,
      rechazado: adjustments.filter((a) => a.status?.toLowerCase() === "rechazado" || a.status === "REJECTED").length,
      aplicado: adjustments.filter((a) => a.status?.toLowerCase() === "aplicado" || a.status === "APPLIED").length,
    }),
    [adjustments],
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/inventario")}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Ajustes de Inventario
              </h1>
              <p className="text-sm text-gray-500">
                Gestión de ajustes positivos y negativos
              </p>
            </div>
          </div>
        </div>
        {canCreateAdjustments && (
          <button
            onClick={handleNewAdjustment}
            className="flex h-9 items-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-800"
          >
            <Plus className="h-4 w-4" />
            Nuevo Ajuste
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 overflow-x-auto">
        {[
          { key: 'all' as TabKey, label: 'Todos', count: counts.all, color: 'text-gray-600', countClass: 'bg-gray-200 text-gray-600' },
          { key: 'pendiente' as TabKey, label: 'Pendientes', count: counts.pendiente, color: 'text-amber-700', countClass: 'bg-amber-100 text-amber-700' },
          { key: 'aprobado' as TabKey, label: 'Aprobados', count: counts.aprobado, color: 'text-emerald-700', countClass: 'bg-emerald-100 text-emerald-700' },
          { key: 'rechazado' as TabKey, label: 'Rechazados', count: counts.rechazado, color: 'text-red-700', countClass: 'bg-red-100 text-red-700' },
          { key: 'aplicado' as TabKey, label: 'Aplicados', count: counts.aplicado, color: 'text-blue-700', countClass: 'bg-blue-100 text-blue-700' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key)}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-all',
              selectedTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', selectedTab === tab.key ? tab.countClass : 'bg-gray-200 text-gray-600')}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar ajuste..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Adjustments Table */}
      {loading ? (
        <SkeletonTable rows={5} columns={10} hasHeader={true} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Bodega
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Motivo
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Items
                </th>
                {canViewCosts && (
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Valor
                  </th>
                )}
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Creado por
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAdjustments.map((adj, index) => {
                const statusBadge =
                  getStatusBadge(adj.status as AdjustmentStatus) ||
                  getStatusBadge("pendiente");
                const reasonLabel =
                  ADJUSTMENT_REASONS[
                  adj.reason as keyof typeof ADJUSTMENT_REASONS
                  ] ||
                  adj.reason ||
                  "Desconocido";

                return (
                  <motion.tr
                    key={adj._id || adj.id || `adj-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="group transition-colors hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleViewAdjustment(adj)}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                      >
                        {adj.reference || adj.id}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {formatDate(adj.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">
                        {adj.warehouseId?.name || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          adj.type?.toLowerCase() === "positivo"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700",
                        )}
                      >
                        {adj.type?.toLowerCase() === "positivo" ? "+" : "-"}{" "}
                        {adj.type?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {reasonLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {adj.lines?.length || 0} productos
                      </span>
                    </td>
                    {canViewCosts && (
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-gray-700">
                          {formatCurrency(Number(adj.totalValue || 0))}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                          statusBadge.bgColor,
                          statusBadge.textColor,
                        )}
                      >
                        <statusBadge.icon
                          className={cn("h-3.5 w-3.5", statusBadge.iconColor)}
                        />
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {adj.createdByUser?.name || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewAdjustment(adj)} className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              Ver detalle
                            </DropdownMenuItem>
                            {canApproveAdjustments && (adj.status?.toLowerCase() === 'pendiente' || adj.status === 'PENDING') && (
                              <DropdownMenuItem onClick={() => handleApprove(adj)} className="flex items-center gap-2 text-emerald-600">
                                <CheckCircle className="h-4 w-4" />
                                Aprobar
                              </DropdownMenuItem>
                            )}
                            {canApproveAdjustments && (adj.status?.toLowerCase() === 'aprobado' || adj.status === 'APPROVED') && (
                              <DropdownMenuItem onClick={() => handleApply(adj)} className="flex items-center gap-2 text-blue-600">
                                <CheckCircle className="h-4 w-4" />
                                Aplicar
                              </DropdownMenuItem>
                            )}
                            {canApproveAdjustments && (adj.status?.toLowerCase() === 'pendiente' || adj.status === 'PENDING') && (
                              <DropdownMenuItem onClick={() => handleReject(adj)} className="flex items-center gap-2 text-red-600">
                                <XCircle className="h-4 w-4" />
                                Rechazar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredAdjustments.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16">
          <FileText className="mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-1 text-lg font-medium text-gray-900">
            No hay ajustes
          </h3>
          <p className="mb-4 text-sm text-gray-500">
            {selectedTab === "all"
              ? "No se encontraron ajustes con los filtros actuales"
              : `No hay ajustes ${ADJUSTMENT_STATUS_LABELS[selectedTab as AdjustmentStatus].toLowerCase()}`}
          </p>
          {canCreateAdjustments && (
            <button
              onClick={handleNewAdjustment}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Crear Ajuste
            </button>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <CustomModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        size="xl"
      >
        {selectedAdjustment && (
          <CustomModalBody className="space-y-6">
            <CustomModalHeader>
               Detalle de Ajuste: {selectedAdjustment?.reference || ""}
            </CustomModalHeader>
            
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
              <div className="space-y-1">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Fecha</span>
                <div className="flex items-center gap-2 text-sm text-gray-700 font-semibold">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {formatDate(selectedAdjustment.createdAt)}
                </div>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Bodega</span>
                <div className="flex items-center gap-2 justify-end text-sm text-gray-700 font-semibold">
                   <MapPin className="h-4 w-4 text-gray-400" />
                   {selectedAdjustment.warehouseId?.name || selectedAdjustment.warehouse?.name || "-"}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Motivo</span>
                <div className="flex items-center gap-2 text-sm text-gray-700 font-semibold">
                  <Info className="h-4 w-4 text-gray-400" />
                  {ADJUSTMENT_REASONS[selectedAdjustment.reason as keyof typeof ADJUSTMENT_REASONS] || selectedAdjustment.reason || "Sin motivo"}
                </div>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Realizado por</span>
                <div className="flex items-center gap-2 justify-end text-sm text-gray-700 font-semibold">
                  <User className="h-4 w-4 text-gray-400" />
                  {selectedAdjustment.createdByUser?.name || "-"}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-500" />
                  Productos Ajustados
                </h3>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                  {selectedAdjustment.lines?.length || 0} Items
                </span>
              </div>
              <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-200">
                      <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase">Producto</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-bold text-gray-500 uppercase">Ajuste</th>
                      {canViewCosts && (
                        <th className="px-4 py-2.5 text-right text-[11px] font-bold text-gray-500 uppercase">Valor</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedAdjustment.lines?.map((line: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-gray-900 leading-none mb-1">
                            {line.product?.description || line.product?.name || "Producto"}
                          </div>
                          <div className="text-[10px] font-bold text-blue-500/70 border border-blue-100 bg-blue-50/30 w-fit px-1.5 rounded uppercase">
                            REF: {line.product?.sku || line.product?.reference || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn(
                            "font-bold text-sm",
                            selectedAdjustment.type?.toLowerCase() === 'positivo' ? "text-emerald-600" : "text-red-600"
                          )}>
                            {selectedAdjustment.type?.toLowerCase() === 'positivo' ? "+" : "-"}
                            {line.adjustmentQty}
                          </span>
                        </td>
                        {canViewCosts && (
                          <td className="px-4 py-3 text-right font-bold text-gray-700">
                            {formatCurrency(Number(line.adjustmentQty) * (Number(line.unitCost) || 0))}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  {canViewCosts && (
                    <tfoot className="bg-gray-50/80">
                      <tr>
                        <td className="px-4 py-3 font-black text-gray-500 text-xs uppercase text-right" colSpan={2}>Valor Total del Ajuste</td>
                        <td className="px-4 py-3 text-right font-black text-blue-700 text-base">
                          {formatCurrency(Number(selectedAdjustment.totalValue || 0))}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {selectedAdjustment.notes && (
              <div className="space-y-2 group">
                <div className="flex items-center gap-2 px-1">
                   <FileStack className="h-3.5 w-3.5 text-gray-400" />
                   <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Observaciones</h3>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-sm text-gray-600 italic leading-relaxed group-hover:border-blue-100 transition-colors">
                  {selectedAdjustment.notes}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <Button 
                onClick={() => setIsViewModalOpen(false)}
                className="bg-gray-900 border-none shadow-xl hover:bg-gray-800 rounded-xl px-8 h-11 font-bold text-sm"
              >
                Cerrar
              </Button>
            </div>
          </CustomModalBody>
        )}
      </CustomModal>
    </div>
  );
}
