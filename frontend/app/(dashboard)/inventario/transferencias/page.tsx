"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tabs,
  Tab,
} from "@heroui/react";
import {
  Plus,
  ArrowRightLeft,
  Search,
  MoreVertical,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Package,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/contexts/auth-context";
import { cn } from "@/lib/utils/cn";
import { api } from "@/lib/services/api";
import { useStore } from "@/hooks/use-store";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import {
  TRANSFER_STATUS_LABELS,
  type TransferStatus,
  type InventoryTransfer,
} from "@/lib/types/inventory";

type TabKey =
  | "all"
  | "borrador"
  | "enviada"
  | "recibida"
  | "recibida_discrepancia";

export default function TransferenciasPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();
  const canCreateTransfers = checkPermission("canCreateTransfers");
  const canConfirmTransfers = checkPermission("canConfirmTransfers");
  const canViewCosts = checkPermission("canViewCosts");

  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTab, setSelectedTab] = useState<TabKey>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const data = await api.getTransfers();
      setTransfers(data);
    } catch (error) {
      toast.error("Error cargando transferencias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  // Filter transfers
  const filteredTransfers = useMemo(() => {
    return transfers.filter((transfer) => {
      if (selectedTab !== "all" && transfer.status !== selectedTab)
        return false;
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          (transfer.reference || transfer.id)
            .toLowerCase()
            .includes(searchLower) ||
          (transfer.sourceWarehouseId?.name || "")
            .toLowerCase()
            .includes(searchLower) ||
          (transfer.destWarehouseId?.name || "")
            .toLowerCase()
            .includes(searchLower);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [transfers, selectedTab, searchQuery]);

  // Get status badge
  const getStatusBadge = (status: TransferStatus) => {
    switch (status) {
      case "borrador":
        return {
          label: TRANSFER_STATUS_LABELS[status],
          icon: Clock,
          bgColor: "bg-gray-100",
          textColor: "text-gray-700",
        };
      case "enviada":
        return {
          label: TRANSFER_STATUS_LABELS[status],
          icon: Truck,
          bgColor: "bg-blue-100",
          textColor: "text-blue-700",
        };
      case "recibida":
        return {
          label: TRANSFER_STATUS_LABELS[status],
          icon: CheckCircle,
          bgColor: "bg-emerald-100",
          textColor: "text-emerald-700",
        };
      case "recibida_discrepancia":
        return {
          label: TRANSFER_STATUS_LABELS[status],
          icon: AlertTriangle,
          bgColor: "bg-amber-100",
          textColor: "text-amber-700",
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-PA", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
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

  const handleViewTransfer = (transfer: any) => {
    // router.push(`/inventario/transferencias/${transfer._id || transfer.id}`);
    toast.info("Visualización de detalle en construcción"); // Placeholder until detail view is refactored
  };

  const handleNewTransfer = () => {
    router.push("/inventario/transferencias/nueva");
  };

  const handleConfirmTransfer = async (transfer: any) => {
    try {
      await api.updateTransferStatus(transfer._id || transfer.id, {
        status: "recibida",
      });
      toast.success("Transferencia confirmada");
      fetchTransfers();
    } catch (err: any) {
      toast.error("Error confirmando transferencia", {
        description: err.message,
      });
    }
  };

  // Count by status
  const counts = useMemo(
    () => ({
      all: transfers.length,
      borrador: transfers.filter((t) => t.status === "borrador").length,
      enviada: transfers.filter((t) => t.status === "enviada").length,
      recibida: transfers.filter((t) => t.status === "recibida").length,
      recibida_discrepancia: transfers.filter(
        (t) => t.status === "recibida_discrepancia",
      ).length,
    }),
    [transfers],
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100">
              <ArrowRightLeft className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Transferencias
              </h1>
              <p className="text-sm text-gray-500">
                Movimiento de mercancía entre bodegas
              </p>
            </div>
          </div>
        </div>
        {canCreateTransfers && (
          <button
            onClick={handleNewTransfer}
            className="flex h-9 items-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-800"
          >
            <Plus className="h-4 w-4" />
            Nueva Transferencia
          </button>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key as TabKey)}
        color="primary"
        variant="underlined"
        classNames={{
          tabList: "gap-6 border-b border-gray-200",
          cursor: "bg-brand-600",
          tab: "px-0 h-10",
          tabContent: "group-data-[selected=true]:text-brand-600",
        }}
      >
        <Tab
          key="all"
          title={
            <div className="flex items-center gap-2">
              <span>Todas</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                {counts.all}
              </span>
            </div>
          }
        />
        <Tab
          key="enviada"
          title={
            <div className="flex items-center gap-2">
              <span>Enviadas</span>
              {counts.enviada > 0 && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {counts.enviada}
                </span>
              )}
            </div>
          }
        />
        <Tab
          key="recibida"
          title={
            <div className="flex items-center gap-2">
              <span>Recibidas</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                {counts.recibida}
              </span>
            </div>
          }
        />
        <Tab
          key="recibida_discrepancia"
          title={
            <div className="flex items-center gap-2">
              <span>Con Discrepancia</span>
              {counts.recibida_discrepancia > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  {counts.recibida_discrepancia}
                </span>
              )}
            </div>
          }
        />
      </Tabs>

      {/* Search */}
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar transferencia..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {/* Transfers Table */}
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
                  Origen
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"></th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Destino
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Cajas
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Unidades
                </th>
                {canViewCosts && (
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Valor
                  </th>
                )}
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  Estado
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransfers.map((transfer, index) => {
                const statusBadge =
                  getStatusBadge(transfer.status as TransferStatus) ||
                  getStatusBadge("borrador");
                return (
                  <motion.tr
                    key={transfer.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="group transition-colors hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleViewTransfer(transfer)}
                        className="font-mono text-sm font-medium text-brand-600 hover:text-brand-700"
                      >
                        {transfer.reference || transfer.id}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {formatDate(transfer.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {transfer.sourceWarehouseId?.name || "-"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {transfer.sourceWarehouseId?.type || "B2B"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ArrowRightLeft className="h-4 w-4 text-gray-400" />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {transfer.destWarehouseId?.name || "-"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {transfer.destWarehouseId?.type || "B2C"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {transfer.totalCases}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-gray-600">
                        {transfer.totalUnits}
                      </span>
                    </td>
                    {canViewCosts && (
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-sm text-gray-700">
                          {formatCurrency(transfer.totalValue)}
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
                        <statusBadge.icon className="h-3.5 w-3.5" />
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Dropdown placement="bottom-end">
                        <DropdownTrigger>
                          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownTrigger>
                        <DropdownMenu
                          aria-label="Acciones"
                          classNames={{
                            base: "bg-white border border-gray-200 shadow-lg",
                          }}
                          items={[
                            {
                              key: "view",
                              label: "Ver detalle",
                              icon: Eye,
                              action: () => handleViewTransfer(transfer),
                              show: true,
                              className: "",
                            },
                            {
                              key: "confirm",
                              label: "Confirmar recepción",
                              icon: CheckCircle,
                              action: () => handleConfirmTransfer(transfer),
                              show:
                                canConfirmTransfers &&
                                transfer.status === "enviada",
                              className: "text-emerald-600",
                            },
                          ].filter((menuItem) => menuItem.show)}
                        >
                          {(menuItem) => (
                            <DropdownItem
                              key={menuItem.key}
                              startContent={
                                <menuItem.icon className="h-4 w-4" />
                              }
                              onPress={menuItem.action}
                              className={menuItem.className}
                            >
                              {menuItem.label}
                            </DropdownItem>
                          )}
                        </DropdownMenu>
                      </Dropdown>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredTransfers.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16">
          <Package className="mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-1 text-lg font-medium text-gray-900">
            No hay transferencias
          </h3>
          <p className="mb-4 text-sm text-gray-500">
            No se encontraron transferencias con los filtros actuales
          </p>
          {canCreateTransfers && (
            <button
              onClick={handleNewTransfer}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              Nueva Transferencia
            </button>
          )}
        </div>
      )}

      {!loading && filteredTransfers.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Mostrando {filteredTransfers.length} transferencia
          {filteredTransfers.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
