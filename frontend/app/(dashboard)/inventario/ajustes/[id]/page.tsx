"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  Warehouse,
  AlertTriangle,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/contexts/auth-context";
import { cn } from "@/lib/utils/cn";
import { api } from "@/lib/services/api";
import {
  ADJUSTMENT_STATUS_LABELS,
  ADJUSTMENT_REASONS,
  type AdjustmentStatus,
} from "@/lib/types/inventory";
import { SkeletonDashboard } from "@/components/ui/skeleton-dashboard";

export default function AjusteDetallePage() {
  const router = useRouter();
  const params = useParams();
  const { user, checkPermission } = useAuth();
  const canApproveAdjustments = checkPermission("canApproveAdjustments");
  const canViewCosts = checkPermission("canViewCosts");

  const adjustmentId = params.id as string;
  const [adjustment, setAdjustment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdjustment = async () => {
      try {
        const data = await api.getAdjustmentById(adjustmentId);
        setAdjustment(data);
      } catch (err: any) {
        toast.error("Error cargando detalle", { description: err.message });
      } finally {
        setLoading(false);
      }
    };
    fetchAdjustment();
  }, [adjustmentId]);

  // Modals
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  if (loading) {
    return <SkeletonDashboard />;
  }

  if (!adjustment) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText className="mb-4 h-12 w-12 text-gray-400" />
        <h2 className="mb-2 text-lg font-semibold text-gray-900">
          Ajuste no encontrado
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          El ajuste {adjustmentId} no existe
        </p>
        <Button
          onClick={() => router.push("/inventario/ajustes")}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Volver a Ajustes
        </Button>
      </div>
    );
  }

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

  const statusBadge = getStatusBadge(adjustment.status);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-PA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
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

  // Can approve this adjustment?
  const canApprove =
    canApproveAdjustments &&
    adjustment.status === "pendiente" &&
    adjustment.createdBy !== user?.id;

  // Handle approve
  const handleApprove = async () => {
    try {
      await api.updateAdjustmentStatus(
        adjustment._id || adjustmentId,
        "aprobado",
      );

      // We will automatically prompt apply after approve, or apply it directly depending on workflow.
      // For now, let's just approve it and redirect back to list to allow 'apply' separately.
      toast.success("Ajuste aprobado", {
        description: `El ajuste ha sido aprobado. Puede aplicarlo desde la vista de lista.`,
      });
      setIsApproveOpen(false);
      router.push("/inventario/ajustes");
    } catch (err: any) {
      toast.error("Error al aprobar", { description: err.message });
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Motivo requerido", {
        description: "Debes indicar un motivo para rechazar el ajuste",
      });
      return;
    }

    try {
      await api.updateAdjustmentStatus(
        adjustment._id || adjustmentId,
        "rechazado",
      );
      toast.success("Ajuste rechazado", {
        description: `El ajuste ha sido rechazado.`,
      });
      setIsRejectOpen(false);
      router.push("/inventario/ajustes");
    } catch (err: any) {
      toast.error("Error al rechazar", { description: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {adjustment.reference || adjustment._id || adjustment.id}
                </h1>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                    statusBadge.bgColor,
                    statusBadge.textColor,
                  )}
                >
                  <statusBadge.icon
                    className={cn("h-3.5 w-3.5", statusBadge.iconColor)}
                  />
                  {statusBadge.label}
                </span>
              </div>
              <p className="text-sm text-gray-500">Ajuste de inventario</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {canApprove && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => setIsRejectOpen(true)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Rechazar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setIsApproveOpen(true)}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Aprobar
            </Button>
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Información del Ajuste
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-gray-500">Bodega</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-gray-900">
                  <Warehouse className="h-4 w-4 text-gray-400" />
                  {adjustment.warehouseId?.name || adjustment.warehouseName}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tipo</p>
                <p className="mt-1">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      adjustment.type === "positivo"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700",
                    )}
                  >
                    {adjustment.type === "positivo" ? "+" : "-"}{" "}
                    {adjustment.type.charAt(0).toUpperCase() +
                      adjustment.type.slice(1)}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Motivo</p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {
                    ADJUSTMENT_REASONS[
                    adjustment.reason as keyof typeof ADJUSTMENT_REASONS
                    ]
                  }
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Fecha de Creación</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-900">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {formatDate(adjustment.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Creado por</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-900">
                  <User className="h-4 w-4 text-gray-400" />
                  {adjustment.createdBy?.name || adjustment.createdByName}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Items</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {adjustment.totalItems}
                </p>
              </div>
            </div>

            {adjustment.observation && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-500">Observación</p>
                <p className="mt-1 text-sm text-gray-700">
                  {adjustment.observation}
                </p>
              </div>
            )}
          </div>

          {/* Products Table */}
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Productos</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Stock Antes
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Ajuste
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Stock Después
                    </th>
                    {canViewCosts && (
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        Valor
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {adjustment.lines.map((line: any, index: number) => (
                    <motion.tr
                      key={line.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {line.productDescription}
                          </p>
                          <p className="text-xs text-gray-500">
                            {line.productReference}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-gray-600">
                          {line.currentStock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            adjustment.type === "positivo"
                              ? "text-emerald-600"
                              : "text-red-600",
                          )}
                        >
                          {adjustment.type === "positivo" ? "+" : "-"}
                          {Math.abs(line.adjustmentQty)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {line.resultingStock}
                        </span>
                      </td>
                      {canViewCosts && (
                        <td className="px-6 py-4 text-right">
                          <span className="font-mono text-sm text-gray-700">
                            {formatCurrency(line.lineValue)}
                          </span>
                        </td>
                      )}
                    </motion.tr>
                  ))}
                </tbody>
                {canViewCosts && (
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                      <td
                        colSpan={4}
                        className="px-6 py-3 text-right text-sm font-medium text-gray-700"
                      >
                        Total
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="font-mono text-sm font-semibold text-gray-900">
                          {formatCurrency(adjustment.totalValue)}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Historial
            </h2>
            <div className="space-y-4">
              {/* Created */}
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                  <FileText className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Ajuste creado
                  </p>
                  <p className="text-xs text-gray-500">
                    {adjustment.createdBy?.name || adjustment.createdByName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(adjustment.createdAt)}
                  </p>
                </div>
              </div>

              {/* Approved/Rejected */}
              {adjustment.approvedAt && (
                <div className="flex gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      adjustment.status === "rechazado"
                        ? "bg-red-100"
                        : "bg-emerald-100",
                    )}
                  >
                    {adjustment.status === "rechazado" ? (
                      <XCircle className="h-4 w-4 text-red-600" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {adjustment.status === "rechazado"
                        ? "Ajuste rechazado"
                        : "Ajuste aprobado"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {adjustment.approvedBy?.name ||
                        adjustment.approvedByName ||
                        "-"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(adjustment.approvedAt)}
                    </p>
                    {adjustment.rejectionReason && (
                      <p className="mt-1 text-xs text-red-600">
                        {adjustment.rejectionReason}
                      </p>
                    )}
                    {adjustment.approvalNotes && (
                      <p className="mt-1 text-xs text-gray-600">
                        {adjustment.approvalNotes}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Applied */}
              {adjustment.appliedAt && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Inventario actualizado
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(adjustment.appliedAt)}
                    </p>
                  </div>
                </div>
              )}

              {/* Pending */}
              {adjustment.status === "pendiente" && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-amber-300 bg-amber-50">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-700">
                      Esperando aprobación
                    </p>
                    <p className="text-xs text-gray-500">
                      Un supervisor debe aprobar este ajuste
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Evidence */}
          {adjustment.evidenceUrls && adjustment.evidenceUrls.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Evidencia
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {adjustment.evidenceUrls.map((url: string, index: number) => (
                  <div
                    key={index}
                    className="aspect-square overflow-hidden rounded-lg bg-gray-100"
                  >
                    <ImageIcon className="h-full w-full p-8 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning for same user */}
          {canApproveAdjustments &&
            adjustment.status === "pendiente" &&
            adjustment.createdBy === user?.id && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      No puedes aprobar este ajuste
                    </p>
                    <p className="mt-1 text-xs text-amber-700">
                      El ajuste fue creado por ti. Otro supervisor debe
                      aprobarlo.
                    </p>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="h-5 w-5" />
              Aprobar Ajuste
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              ¿Estás seguro de aprobar este ajuste? El inventario se actualizará
              inmediatamente.
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Notas (opcional)</label>
              <Textarea
                placeholder="Agregar notas de aprobación..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="bg-white min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsApproveOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleApprove}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Aprobar y Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Rechazar Ajuste
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Motivo del rechazo *</label>
              <Textarea
                placeholder="Escribe el motivo por el cual rechazas este ajuste..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="bg-white min-h-[100px]"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRejectOpen(false)}>
              Cancelar
            </Button>
            <Button 
                variant="destructive"
                onClick={handleReject}
                className="bg-red-600 hover:bg-red-700 text-white"
            >
              Rechazar Ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
