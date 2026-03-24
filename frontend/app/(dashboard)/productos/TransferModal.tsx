"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Truck, Package, Trash2, AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: any[];
  onSuccess: () => void;
}

export function TransferModal({
  isOpen,
  onClose,
  selectedProducts,
  onSuccess,
}: TransferModalProps) {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [destinationWarehouseId, setDestinationWarehouseId] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadWarehouses();
      // Initialize items with selected products and default quantity 1
      setItems(
        selectedProducts.map((p) => ({
          productId: p.id,
          name: p.description || p.name,
          reference: p.reference,
          quantity: 1,
          maxQuantity: p.stock?.available || 0,
        }))
      );
    }
  }, [isOpen, selectedProducts]);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const data = await api.getWarehouses();
      // Filter for B2C warehouses if possible, but for now show all
      setWarehouses(data);
      if (data.length > 0) {
        // Try to find a B2C warehouse by default
        const b2c = data.find((w: any) => w.type === "B2C");
        setDestinationWarehouseId(b2c?.id || data[0].id);
      }
    } catch (error) {
      toast.error("Error al cargar bodegas");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (productId: string, qty: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(1, Math.min(qty, item.maxQuantity)) }
          : item
      )
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleSubmit = async () => {
    if (!destinationWarehouseId) {
      toast.error("Selecciona una bodega de destino");
      return;
    }

    if (items.length === 0) {
      toast.error("No hay productos seleccionados");
      return;
    }

    // Dynamically find 'Bodega Principal' (MAIN) as the source
    const mainWarehouse = warehouses.find(w => w.code === 'MAIN') || warehouses.find(w => w.isHeadquarters) || warehouses[0];
    const sourceWarehouseId = mainWarehouse?.id;

    if (!sourceWarehouseId) {
      toast.error("No se pudo determinar la bodega de origen");
      return;
    }

    setSubmitting(true);
    try {
      await api.batchTransfer({
        sourceWarehouseId,
        destinationWarehouseId,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      toast.success("Transferencia completada correctamente");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Error al realizar la transferencia");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Truck className="h-6 w-6 text-brand-500" />
            Transferir a Sucursal / POS
          </DialogTitle>
          <DialogDescription>
            Selecciona la sucursal de destino y confirma las cantidades a transferir. 
            El stock se descontará de la Bodega Principal.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Warehouse Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Sucursal / Bodega de Destino
            </label>
            <Select
              value={destinationWarehouseId}
              onValueChange={setDestinationWarehouseId}
            >
              <SelectTrigger className="h-12 border-gray-200 dark:border-[#2a2a2a] rounded-xl shadow-sm">
                <SelectValue placeholder="Selecciona una sucursal" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id} className="rounded-lg">
                    {w.name} {w.type === 'B2C' ? '(Sucursal/POS)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Productos a Transferir ({items.length})
            </label>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-[#2a2a2a] bg-gray-50/50 dark:bg-[#1a1a1a]/40"
                >
                  <div className="h-10 w-10 rounded-lg bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#2a2a2a] flex items-center justify-center text-gray-400">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-tight">
                      REF: {item.reference} • Disponible: {item.maxQuantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-gray-200 dark:border-[#2a2a2a] rounded-lg overflow-hidden bg-white dark:bg-[#0a0a0a]">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 0)}
                        className="w-12 text-center text-sm font-bold focus:outline-none bg-transparent"
                      />
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-500"
                      onClick={() => removeItem(item.productId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {items.length > 0 && items.some(i => i.quantity > i.maxQuantity) && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex gap-3 text-red-700 dark:text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-xs leading-relaxed">
                Algunos productos exceden el stock disponible. La cantidad se ajustará al máximo permitido.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 bg-gray-50/80 dark:bg-[#1a1a1a] border-t border-gray-100 dark:border-[#2a2a2a]">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || items.length === 0}
            className="px-8 h-11 rounded-xl shadow-md min-w-[140px]"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Transfering...
              </>
            ) : (
              "Confirmar Transferencia"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
