"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
} from "@heroui/react";
import {
  ArrowLeft,
  ArrowRightLeft,
  Warehouse,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Package,
  User,
  Calendar,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/contexts/auth-context";
import { cn } from "@/lib/utils/cn";
import { api } from "@/lib/services/api";
import { TransferStatus } from "@/lib/types/inventory";

interface ReceivedQuantity {
  lineId: string;
  receivedQty: number;
  notes: string;
}

export default function TransferenciaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, checkPermission } = useAuth();
  const canConfirm = checkPermission("canConfirmTransfers");
  const canViewCosts = checkPermission("canViewCosts");

  const transferId = params.id as string;
  const [transfer, setTransfer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [receivedQuantities, setReceivedQuantities] = useState<
    ReceivedQuantity[]
  >([]);

  const fetchTransfer = async () => {
    try {
      const data = await api.getTransferById(transferId);
      setTransfer(data);
    } catch (err: any) {
      toast.error("Error", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfer();
  }, [transferId]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando...</div>;
  }

  if (!transfer) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <Package className="mb-4 h-12 w-12 text-gray-300" />
        <p className="text-lg font-medium text-gray-900">
          Transferencia no encontrada
        </p>
        <p className="text-sm text-gray-500">
          La transferencia {params.id} no existe
        </p>
        <Button variant="light" onPress={() => router.back()} className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  const isCreator =
    user?.id === (transfer.createdBy?._id || transfer.createdBy);
  const canConfirmTransfer =
    canConfirm && !isCreator && transfer.status === "enviada";
  const isB2BtoB2C =
    transfer.sourceWarehouseId?.type === "B2B" &&
    transfer.destWarehouseId?.type === "B2C";

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-PA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const getStatusColor = (status: TransferStatus) => {
    switch (status) {
      case "borrador":
        return "bg-gray-100 text-gray-700";
      case "enviada":
        return "bg-blue-100 text-blue-700";
      case "recibida":
        return "bg-green-100 text-green-700";
      case "recibida_discrepancia":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: TransferStatus) => {
    switch (status) {
      case "borrador":
        return "Borrador";
      case "enviada":
        return "Enviada";
      case "recibida":
        return "Recibida";
      case "recibida_discrepancia":
        return "Recibida con Discrepancia";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: TransferStatus) => {
    switch (status) {
      case "borrador":
        return <FileText className="h-4 w-4" />;
      case "enviada":
        return <Clock className="h-4 w-4" />;
      case "recibida":
        return <CheckCircle2 className="h-4 w-4" />;
      case "recibida_discrepancia":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleOpenConfirmModal = () => {
    // Initialize received quantities with expected values
    const initialQuantities = transfer.lines.map((line: any) => ({
      lineId: line._id || line.productId?._id || line.id,
      receivedQty: line.totalUnits || line.resultingUnits || 0,
      notes: "",
    }));
    setReceivedQuantities(initialQuantities);
    setIsConfirmModalOpen(true);
  };

  const handleUpdateReceivedQty = (lineId: string, qty: number) => {
    setReceivedQuantities((prev) =>
      prev.map((rq) =>
        rq.lineId === lineId ? { ...rq, receivedQty: qty } : rq,
      ),
    );
  };

  const handleUpdateNotes = (lineId: string, notes: string) => {
    setReceivedQuantities((prev) =>
      prev.map((rq) => (rq.lineId === lineId ? { ...rq, notes } : rq)),
    );
  };

  const handleConfirmTransfer = async () => {
    const hasDiscrepancies = receivedQuantities.some((rq) => {
      const line = transfer.lines.find(
        (l: any) => (l._id || l.productId?._id || l.id) === rq.lineId,
      );
      const expectedUs = line?.totalUnits || line?.resultingUnits || 0;
      return line && rq.receivedQty !== expectedUs;
    });

    const updatedLines = transfer.lines.map((line: any) => {
      const lId = line._id || line.productId?._id || line.id;
      const expectedUs = line.totalUnits || line.resultingUnits || 0;
      const rq = receivedQuantities.find((r) => r.lineId === lId);
      if (!rq) return line;

      const diff = rq.receivedQty !== expectedUs;
      return {
        ...line,
        receivedQty: rq.receivedQty,
        hasDiscrepancy: diff,
        discrepancyNotes: diff ? rq.notes : undefined,
      };
    });

    try {
      await api.updateTransferStatus(transferId, {
        status: "recibida",
        receivedLines: updatedLines,
      });
      setIsConfirmModalOpen(false);

      if (hasDiscrepancies) {
        toast.warning("Transferencia confirmada con discrepancias");
      } else {
        toast.success("Transferencia confirmada");
      }

      router.push("/inventario/transferencias");
    } catch (err: any) {
      toast.error("Error al confirmar", { description: err.message });
    }
  };

  // Timeline items
  const timelineItems = [
    {
      label: "Creada",
      date: transfer.createdAt,
      user: transfer.createdBy?.name || transfer.createdByName || "-",
      icon: <FileText className="h-4 w-4" />,
      completed: true,
    },
    {
      label: "Enviada",
      date: transfer.createdAt,
      icon: <ArrowRightLeft className="h-4 w-4" />,
      completed: transfer.status !== "borrador",
    },
    {
      label: "Recibida",
      date: transfer.receivedAt,
      user: transfer.receivedBy?.name || transfer.receivedByName || "-",
      icon: <CheckCircle2 className="h-4 w-4" />,
      completed:
        transfer.status === "recibida" ||
        transfer.status === "recibida_discrepancia",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100">
              <ArrowRightLeft className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {transfer.reference || transfer.id}
                </h1>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                    getStatusColor(transfer.status),
                  )}
                >
                  {getStatusIcon(transfer.status)}
                  {getStatusLabel(transfer.status)}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Transferencia de mercancía
              </p>
            </div>
          </div>
        </div>
        {canConfirmTransfer && (
          <Button
            color="primary"
            onPress={handleOpenConfirmModal}
            className="bg-brand-600"
          >
            Confirmar Recepción
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Warehouses Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Bodegas
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Warehouse className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Origen
                  </span>
                  <span
                    className={cn(
                      "ml-auto rounded-full px-2 py-0.5 text-xs font-medium",
                      transfer.sourceWarehouseType === "B2B"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700",
                    )}
                  >
                    {transfer.sourceWarehouseId?.type || "B2B"}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {transfer.sourceWarehouseId?.name ||
                    transfer.sourceWarehouseName}
                </p>
              </div>

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100">
                <ArrowRight className="h-4 w-4 text-brand-600" />
              </div>

              <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Warehouse className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Destino
                  </span>
                  <span
                    className={cn(
                      "ml-auto rounded-full px-2 py-0.5 text-xs font-medium",
                      transfer.destWarehouseType === "B2B"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700",
                    )}
                  >
                    {transfer.destWarehouseId?.type || "B2C"}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {transfer.destWarehouseId?.name || transfer.destWarehouseName}
                </p>
              </div>
            </div>

            {isB2BtoB2C && (
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-blue-600" />
                  <div>
                    <p className="text-xs font-medium text-blue-900">
                      Conversión B2B → B2C aplicada
                    </p>
                    <p className="text-xs text-blue-700">
                      Factor de inflación:{" "}
                      {((transfer.inflationFactor - 1) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Products Table */}
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900">Productos</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Cajas
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Und/Caja
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Total Und
                    </th>
                    {transfer.status !== "enviada" && (
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        Recibido
                      </th>
                    )}
                    {canViewCosts && (
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        Valor
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transfer.lines.map((line: any, index: number) => {
                    const expectedUnits =
                      line.totalUnits || line.resultingUnits || 0;
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {line.productId?.name || line.productDescription}
                            </p>
                            <p className="text-xs text-gray-500">
                              {line.productId?.sku || line.productReference}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm text-gray-600">
                            {line.quantityCases}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm text-gray-600">
                            {line.unitsPerCase}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-medium text-gray-900">
                            {expectedUnits}
                          </span>
                        </td>
                        {transfer.status !== "enviada" && (
                          <td className="px-4 py-3 text-right">
                            <span
                              className={cn(
                                "text-sm font-medium",
                                line.hasDiscrepancy
                                  ? "text-amber-600"
                                  : "text-green-600",
                              )}
                            >
                              {line.receivedQty}
                              {line.hasDiscrepancy && (
                                <span className="ml-1 text-xs">
                                  ({line.receivedQty! - expectedUnits})
                                </span>
                              )}
                            </span>
                          </td>
                        )}
                        {canViewCosts && (
                          <td className="px-4 py-3 text-right">
                            <span className="font-mono text-sm text-gray-700">
                              {formatCurrency(line.totalValue)}
                            </span>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t border-gray-200 bg-gray-50">
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      {transfer.totalCases}
                    </td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      {transfer.totalUnits}
                    </td>
                    {transfer.status !== "enviada" && (
                      <td className="px-4 py-3"></td>
                    )}
                    {canViewCosts && (
                      <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-gray-900">
                        {formatCurrency(transfer.totalValue)}
                      </td>
                    )}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Discrepancy Details */}
          {transfer.hasDiscrepancies && transfer.discrepancySummary && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-900">
                    Discrepancias Detectadas
                  </p>
                  <p className="mt-1 text-sm text-amber-700">
                    {transfer.discrepancySummary}
                  </p>
                  {transfer.lines
                    .filter((l: any) => l.hasDiscrepancy && l.discrepancyNotes)
                    .map((line: any, index: number) => (
                      <div
                        key={index}
                        className="mt-2 rounded-lg bg-white/50 p-2"
                      >
                        <p className="text-xs font-medium text-amber-800">
                          {line.productId?.sku || line.productReference}:
                        </p>
                        <p className="text-xs text-amber-700">
                          {line.discrepancyNotes}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Observation */}
          {transfer.observation && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-2 text-sm font-medium text-gray-700">
                Observación
              </h2>
              <p className="text-sm text-gray-600">{transfer.observation}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Historial
            </h2>
            <div className="space-y-4">
              {timelineItems.map((item, index) => (
                <div key={index} className="flex gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      item.completed
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-400",
                    )}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        item.completed ? "text-gray-900" : "text-gray-400",
                      )}
                    >
                      {item.label}
                    </p>
                    {item.completed && item.date && (
                      <p className="text-xs text-gray-500">
                        {formatDate(item.date)}
                      </p>
                    )}
                    {item.user && (
                      <p className="text-xs text-gray-500">Por: {item.user}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Details Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Detalles
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                  <User className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Creado por</p>
                  <p className="text-sm font-medium text-gray-900">
                    {transfer.createdBy?.name || transfer.createdByName || "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                  <Calendar className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fecha de creación</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(transfer.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                  <Package className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total productos</p>
                  <p className="text-sm font-medium text-gray-900">
                    {transfer.lines.length} productos
                  </p>
                </div>
              </div>

              {transfer.receivedByName && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Recibido por</p>
                    <p className="text-sm font-medium text-gray-900">
                      {transfer.receivedBy?.name ||
                        transfer.receivedByName ||
                        "-"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        size="2xl"
      >
        <ModalContent>
          <ModalHeader className="border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirmar Recepción
                </h3>
                <p className="text-sm text-gray-500">
                  Verifica las cantidades recibidas
                </p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Ingresa las cantidades efectivamente recibidas. Si hay
                diferencias, se registrarán como discrepancias.
              </p>

              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Producto
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        Esperado
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        Recibido
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Notas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transfer.lines.map((line: any, index: number) => {
                      const lineId = line._id || line.productId?._id || line.id;
                      const expectedUnits =
                        line.totalUnits || line.resultingUnits || 0;
                      const receivedQty =
                        receivedQuantities.find((rq) => rq.lineId === lineId)
                          ?.receivedQty ?? expectedUnits;
                      const diff = receivedQty - expectedUnits;

                      return (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900">
                              {line.productId?.name || line.productDescription}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-gray-600">
                              {expectedUnits}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <Input
                                type="number"
                                min={0}
                                value={receivedQty.toString()}
                                onChange={(e) =>
                                  handleUpdateReceivedQty(
                                    lineId,
                                    parseInt(e.target.value) || 0,
                                  )
                                }
                                variant="bordered"
                                size="sm"
                                classNames={{
                                  base: "w-20",
                                  inputWrapper: "bg-white",
                                  input: "text-right",
                                }}
                              />
                              {diff !== 0 && (
                                <span
                                  className={cn(
                                    "text-xs font-medium",
                                    diff > 0
                                      ? "text-green-600"
                                      : "text-red-600",
                                  )}
                                >
                                  {diff > 0 ? "+" : ""}
                                  {diff}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              placeholder="Notas..."
                              value={
                                receivedQuantities.find(
                                  (rq) => rq.lineId === lineId,
                                )?.notes || ""
                              }
                              onChange={(e) =>
                                handleUpdateNotes(lineId, e.target.value)
                              }
                              variant="bordered"
                              size="sm"
                              classNames={{ inputWrapper: "bg-white" }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {receivedQuantities.some((rq) => {
                const line = transfer.lines.find(
                  (l: any) => (l._id || l.productId?._id || l.id) === rq.lineId,
                );
                const expectedUnits =
                  line?.totalUnits || line?.resultingUnits || 0;
                return line && rq.receivedQty !== expectedUnits;
              }) && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                    <p className="text-xs text-amber-700">
                      Se detectaron diferencias en las cantidades. La
                      transferencia se marcará como &quot;Recibida con
                      Discrepancia&quot;.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-gray-200">
            <Button
              variant="light"
              onPress={() => setIsConfirmModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={handleConfirmTransfer}
              className="bg-brand-600"
            >
              Confirmar Recepción
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
