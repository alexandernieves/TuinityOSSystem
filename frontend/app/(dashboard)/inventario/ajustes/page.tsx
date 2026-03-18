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
      if (selectedTab !== "all" && adj.status !== selectedTab) return false;

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
  const getStatusBadge = (status: AdjustmentStatus) => {
    switch (status) {
      case "pendiente":
        return {
          label: ADJUSTMENT_STATUS_LABELS[status],
          icon: Clock,
          bgColor: "bg-amber-100",
          textColor: "text-amber-700",
          iconColor: "text-amber-600",
        };
      case "aprobado":
        return {
          label: ADJUSTMENT_STATUS_LABELS[status],
          icon: CheckCircle,
          bgColor: "bg-emerald-100",
          textColor: "text-emerald-700",
          iconColor: "text-emerald-600",
        };
      case "rechazado":
        return {
          label: ADJUSTMENT_STATUS_LABELS[status],
          icon: XCircle,
          bgColor: "bg-red-100",
          textColor: "text-red-700",
          iconColor: "text-red-600",
        };
      case "aplicado":
        return {
          label: ADJUSTMENT_STATUS_LABELS[status],
          icon: CheckCircle,
          bgColor: "bg-blue-100",
          textColor: "text-blue-700",
          iconColor: "text-blue-600",
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

  // Handlers
  const handleViewAdjustment = (adj: any) => {
    // router.push(`/inventario/ajustes/${adj._id || adj.id}`);
    toast.info("Visualización de detalle en construcción"); // Placeholder until detail view is refactored
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
      pendiente: adjustments.filter((a) => a.status === "pendiente").length,
      aprobado: adjustments.filter((a) => a.status === "aprobado").length,
      rechazado: adjustments.filter((a) => a.status === "rechazado").length,
      aplicado: adjustments.filter((a) => a.status === "aplicado").length,
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
                        className="font-mono text-sm font-medium text-blue-600 hover:text-blue-700"
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
                          adj.type === "positivo"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700",
                        )}
                      >
                        {adj.type === "positivo" ? "+" : "-"}{" "}
                        {adj.type.charAt(0).toUpperCase() + adj.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {reasonLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {adj.totalItems}
                      </span>
                    </td>
                    {canViewCosts && (
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-sm text-gray-700">
                          {formatCurrency(adj.totalValue)}
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
                        {adj.createdBy?.name || "-"}
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
                            {canApproveAdjustments && adj.status === 'pendiente' && (
                              <DropdownMenuItem onClick={() => handleApprove(adj)} className="flex items-center gap-2 text-emerald-600">
                                <CheckCircle className="h-4 w-4" />
                                Aprobar
                              </DropdownMenuItem>
                            )}
                            {canApproveAdjustments && adj.status === 'aprobado' && (
                              <DropdownMenuItem onClick={() => handleApply(adj)} className="flex items-center gap-2 text-blue-600">
                                <CheckCircle className="h-4 w-4" />
                                Aplicar
                              </DropdownMenuItem>
                            )}
                            {canApproveAdjustments && adj.status === 'pendiente' && (
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

      {/* Results count */}
      {!loading && filteredAdjustments.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Mostrando {filteredAdjustments.length} ajuste
          {filteredAdjustments.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
