"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRightLeft,
  Plus,
  Trash2,
  Package,
  AlertTriangle,
  Layers,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/contexts/auth-context";
import { cn } from "@/lib/utils/cn";
import { api } from "@/lib/services/api";

const DEFAULT_TRANSFER_INFLATION_FACTOR = 1.15;

interface TransferLine {
  productId: string;
  productDescription: string;
  productReference: string;
  sourceStock: number;
  quantityCases: number;
  looseUnits: number;
  unitsPerCase: number;
  costCIF: number;
}

export default function NuevaTransferenciaPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();
  const canViewCosts = checkPermission("canViewCosts");

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [sourceWarehouseId, setSourceWarehouseId] = useState("");
  const [destWarehouseId, setDestWarehouseId] = useState("");
  const [observation, setObservation] = useState("");
  const [lines, setLines] = useState<TransferLine[]>([]);
  const [allowPartialCases, setAllowPartialCases] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wData, pData] = await Promise.all([
          api.getWarehouses(),
          api.getProducts(),
        ]);
        setWarehouses(wData);
        if (wData.length > 1) {
          setSourceWarehouseId(wData[0].id);
          setDestWarehouseId(wData[1].id);
        }
        setProducts(pData);
      } catch (error) {
        toast.error("Error cargando datos");
      }
    };
    fetchData();
  }, []);

  const sw = warehouses.find((w) => w.id === sourceWarehouseId);
  const dw = warehouses.find((w) => w.id === destWarehouseId);
  const isB2BtoB2C = sw?.type === "B2B" && dw?.type === "B2C";

  // Add sample product
  const handleAddProduct = () => {
    const availableProducts = products.filter(
      (p) =>
        !lines.some((l) => l.productId === p.id) &&
        (p.stock?.existence || 0) > 0,
    );
    if (availableProducts.length === 0) {
      toast.error("Sin productos", {
        description: "No hay más productos disponibles para agregar",
      });
      return;
    }
    const product = availableProducts[0];
    setLines([
      ...lines,
      {
        productId: product.id,
        productDescription: product.description,
        productReference: product.reference,
        sourceStock: product.stock?.existence || 0,
        quantityCases: 1,
        looseUnits: 0,
        unitsPerCase: product.unitsPerCase,
        costCIF: product.costCIF || 0,
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleUpdateQty = (index: number, qty: number) => {
    const newLines = [...lines];
    newLines[index].quantityCases = qty;
    setLines(newLines);
  };

  const handleUpdateLooseUnits = (index: number, units: number) => {
    const newLines = [...lines];
    newLines[index].looseUnits = Math.min(
      units,
      newLines[index].unitsPerCase - 1,
    );
    setLines(newLines);
  };

  // Get total units for a line (whole cases * unitsPerCase + loose units)
  const getLineTotalUnits = (line: TransferLine) => {
    return (
      line.quantityCases * line.unitsPerCase +
      (allowPartialCases ? line.looseUnits : 0)
    );
  };

  // Get effective decimal cases for a line
  const getLineEffectiveCases = (line: TransferLine) => {
    if (!allowPartialCases) return line.quantityCases;
    return line.quantityCases + line.looseUnits / line.unitsPerCase;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  // Calculate totals
  const totalCases = lines.reduce(
    (sum, l) => sum + getLineEffectiveCases(l),
    0,
  );
  const totalUnits = lines.reduce((sum, l) => sum + getLineTotalUnits(l), 0);
  const totalValue = lines.reduce((sum, l) => {
    const costPerUnit = l.costCIF / l.unitsPerCase;
    return sum + getLineTotalUnits(l) * costPerUnit;
  }, 0);

  const handleSubmit = async () => {
    if (lines.length === 0) {
      toast.error("Sin productos", {
        description: "Agrega al menos un producto a la transferencia",
      });
      return;
    }

    setIsSaving(true);
    try {
      await api.createTransfer({
        sourceWarehouseId,
        destWarehouseId,
        observation,
        lines: lines.map((l) => {
          const lineUnits = getLineTotalUnits(l);
          const costPerUnit = l.costCIF / l.unitsPerCase;
          const lineTotalValue = lineUnits * costPerUnit;
          return {
            productId: l.productId,
            sourceStock: l.sourceStock,
            quantityCases: getLineEffectiveCases(l),
            unitsPerCase: l.unitsPerCase,
            resultingUnits: lineUnits,
            realCostCIF: l.costCIF,
            transferCost: isB2BtoB2C
              ? l.costCIF * DEFAULT_TRANSFER_INFLATION_FACTOR
              : l.costCIF,
            totalValue: lineTotalValue,
          };
        }),
        totalCases,
        totalUnits,
        totalValue,
        inflationFactor: isB2BtoB2C ? DEFAULT_TRANSFER_INFLATION_FACTOR : 1,
      });

      toast.success("Transferencia creada", {
        description: `La transferencia ha sido enviada.`,
      });
      router.push("/inventario/transferencias");
    } catch (err: any) {
      toast.error("Error al crear", { description: err.message });
      setIsSaving(false);
    }
  };

  const inputClass = "w-full px-3 py-[7px] rounded-[8px] border border-[#c9cccf] bg-white text-[13px] text-[#1a1a1a] placeholder:text-[#8c9196] hover:border-[#8c9196] focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-[#008060] transition-all";
  const labelClass = "block text-[13px] font-semibold text-[#1a1a1a] mb-1.5";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
            <ArrowRightLeft className="h-5 w-5 text-[#008060]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Nueva Transferencia
            </h1>
            <p className="text-sm text-gray-500 dark:text-[#888888]">
              Mover mercancía entre bodegas
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]">
        <div className="border-b border-gray-200 dark:border-[#2a2a2a] p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className={labelClass}>
                Bodega Origen
              </label>
              <select
                value={sourceWarehouseId}
                onChange={(e) => setSourceWarehouseId(e.target.value)}
                className={inputClass}
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>
                Bodega Destino
              </label>
              <select
                value={destWarehouseId}
                onChange={(e) => setDestWarehouseId(e.target.value)}
                className={inputClass}
              >
                {warehouses
                  .filter((w) => w.id !== sourceWarehouseId)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.type})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {isB2BtoB2C && (
            <div className="mt-4 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                    Transferencia B2B → B2C
                  </p>
                  <p className="mt-1 text-[13px] text-blue-700 dark:text-blue-400">
                    Las cajas se convertirán a unidades. Se aplicará un factor
                    de inflación del{" "}
                    {((DEFAULT_TRANSFER_INFLATION_FACTOR - 1) * 100).toFixed(0)}
                    % al costo.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <label className={labelClass}>
              Observación
            </label>
            <textarea
              placeholder="Notas adicionales..."
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              className={cn(inputClass, "resize-none h-24")}
              rows={3}
            />
          </div>
        </div>

        {/* Products Section */}
        <div className="p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Productos a Transferir
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAllowPartialCases(!allowPartialCases)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors",
                  allowPartialCases
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#141414] dark:text-gray-400 dark:hover:bg-[#1a1a1a]",
                )}
              >
                <Layers className="h-4 w-4" />
                Permitir cajas parciales
              </button>
              <button
                onClick={handleAddProduct}
                className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-[#1a1a1a] dark:text-gray-300 dark:hover:bg-[#2a2a2a]"
              >
                <Plus className="h-4 w-4" />
                Agregar Producto
              </button>
            </div>
          </div>

          {lines.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                    <th className="px-4 py-3 text-left text-[13px] font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888]">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-right text-[13px] font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888]">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-right text-[13px] font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888]">
                      Cajas
                    </th>
                    {allowPartialCases && (
                      <th className="px-4 py-3 text-right text-[13px] font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888]">
                        Und. sueltas
                      </th>
                    )}
                    <th className="px-4 py-3 text-right text-[13px] font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888]">
                      Und/Caja
                    </th>
                    <th className="px-4 py-3 text-right text-[13px] font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888]">
                      Total Und.
                    </th>
                    {canViewCosts && (
                      <th className="px-4 py-3 text-right text-[13px] font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888]">
                        Valor
                      </th>
                    )}
                    <th className="px-4 py-3 text-center text-[13px] font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                  {lines.map((line, index) => {
                    const lineTotalUnits = getLineTotalUnits(line);
                    const effectiveCases = getLineEffectiveCases(line);
                    const costPerUnit = line.costCIF / line.unitsPerCase;
                    const lineValue = lineTotalUnits * costPerUnit;

                    return (
                      <tr
                        key={line.productId}
                        className="group hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-[13px] font-medium text-gray-900 dark:text-white">
                              {line.productDescription}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-[#888]">
                              {line.productReference}
                            </p>
                            {/* Conversion preview */}
                            <div className="mt-1.5 space-y-0.5">
                              <p className="text-xs text-[#008060] dark:text-emerald-400">
                                {allowPartialCases && line.looseUnits > 0
                                  ? `${line.quantityCases} cajas + ${line.looseUnits} und. sueltas = ${lineTotalUnits} botellas`
                                  : `${effectiveCases % 1 !== 0 ? effectiveCases.toFixed(1) : effectiveCases} ${effectiveCases === 1 ? "caja" : "cajas"} \u00D7 ${line.unitsPerCase} und/caja = ${lineTotalUnits} botellas`}
                              </p>
                              {canViewCosts && (
                                <p className="text-xs text-gray-400 dark:text-[#666]">
                                  Costo por unidad:{" "}
                                  {formatCurrency(costPerUnit)}
                                  {isB2BtoB2C && (
                                    <span className="ml-1 text-blue-500">
                                      (inflado:{" "}
                                      {formatCurrency(
                                        costPerUnit *
                                        DEFAULT_TRANSFER_INFLATION_FACTOR,
                                      )}
                                      )
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-[13px] text-gray-600 dark:text-gray-400">
                            {line.sourceStock}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            max={line.sourceStock}
                            value={line.quantityCases.toString()}
                            onChange={(e) =>
                              handleUpdateQty(
                                index,
                                parseInt(e.target.value) || 0,
                              )
                            }
                            className={cn(inputClass, "w-20 ml-auto text-right")}
                          />
                        </td>
                        {allowPartialCases && (
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min={0}
                              max={line.unitsPerCase - 1}
                              value={line.looseUnits.toString()}
                              onChange={(e) =>
                                handleUpdateLooseUnits(
                                  index,
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              className={cn(inputClass, "w-20 ml-auto text-right")}
                            />
                          </td>
                        )}
                        <td className="px-4 py-3 text-right">
                          <span className="text-[13px] text-gray-600 dark:text-gray-400">
                            {line.unitsPerCase}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-[13px] font-semibold text-[#008060] dark:text-emerald-400">
                            {lineTotalUnits}
                          </span>
                        </td>
                        {canViewCosts && (
                          <td className="px-4 py-3 text-right">
                            <span className="font-mono text-[13px] text-gray-700 dark:text-gray-300">
                              {formatCurrency(
                                isB2BtoB2C
                                  ? lineValue *
                                  DEFAULT_TRANSFER_INFLATION_FACTOR
                                  : lineValue,
                              )}
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleRemoveLine(index)}
                            className="flex mx-auto h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] py-12">
              <Package className="mb-3 h-10 w-10 text-gray-400" />
              <p className="mb-1 text-[13px] font-medium text-gray-900 dark:text-white">
                Sin productos
              </p>
              <p className="mb-4 text-xs text-gray-500 dark:text-[#888]">
                Agrega productos para transferir
              </p>
              <button
                onClick={handleAddProduct}
                className="flex items-center gap-2 px-6 py-2 rounded-[10px] bg-[#008060] text-white font-semibold text-[13px] shadow-[0_0_0_1px_rgba(0,0,0,0.05)_inset,0_1px_0_rgba(0,0,0,0.08),inset_0_-2.5px_0_rgba(0,0,0,0.2)] hover:bg-[#006e52] active:translate-y-[1px] active:shadow-[inset_0_1px_0_rgba(0,0,0,0.1)] transition-all"
              >
                <Plus className="h-4 w-4" />
                Agregar Producto
              </button>
            </div>
          )}

          {/* Summary */}
          {lines.length > 0 && (
            <div className="mt-6 space-y-3">
              {/* Total preview line */}
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 dark:border-emerald-800 dark:bg-emerald-950/20">
                <Layers className="h-4 w-4 text-[#008060] dark:text-emerald-400" />
                <p className="text-[13px] font-medium text-emerald-800 dark:text-emerald-300">
                  Total:{" "}
                  {totalCases % 1 !== 0 ? totalCases.toFixed(1) : totalCases}{" "}
                  cajas ({totalUnits} unidades)
                  {canViewCosts && (
                    <span className="ml-1">
                      <ArrowRight className="inline h-3.5 w-3.5 mx-1" />
                      Costo transferencia:{" "}
                      {formatCurrency(
                        isB2BtoB2C
                          ? totalValue * DEFAULT_TRANSFER_INFLATION_FACTOR
                          : totalValue,
                      )}
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-[#1a1a1a] p-4 border border-gray-100 dark:border-[#2a2a2a] rounded-b-xl">
                <div className="flex gap-8">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-[#888]">
                      Total Cajas
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {totalCases % 1 !== 0
                        ? totalCases.toFixed(1)
                        : totalCases}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-[#888]">
                      Total Unidades
                    </p>
                    <p className="text-lg font-semibold text-[#008060] dark:text-emerald-400">
                      {totalUnits}
                    </p>
                  </div>
                  {canViewCosts && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-[#888]">
                        Valor Total
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(totalValue)}
                      </p>
                    </div>
                  )}
                  {canViewCosts && isB2BtoB2C && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-[#888]">
                        Valor Inflado
                      </p>
                      <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(
                          totalValue * DEFAULT_TRANSFER_INFLATION_FACTOR,
                        )}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => router.back()}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 px-6 py-2 rounded-[10px] bg-[#008060] text-white font-semibold shadow-[0_0_0_1px_rgba(0,0,0,0.05)_inset,0_1px_0_rgba(0,0,0,0.08),inset_0_-2.5px_0_rgba(0,0,0,0.2)] hover:bg-[#006e52] active:translate-y-[1px] active:shadow-[inset_0_1px_0_rgba(0,0,0,0.1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[190px]"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Enviar Transferencia"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
