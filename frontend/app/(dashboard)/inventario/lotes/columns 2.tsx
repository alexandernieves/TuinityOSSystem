"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Edit, Trash2, Calendar, Package } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils/cn"

export interface LotData {
  id: string
  lotNumber: string
  product: {
    id: string
    name: string
    sku: string
  }
  expirationDate?: string
  availableQuantity: number
  warehouse: {
    id: string
    name: string
  }
}

// Helper to get expiry status
function getExpiryStatus(date?: string) {
  if (!date) return { label: 'Sin Expiración', color: 'secondary' as const }
  
  const days = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
  
  if (days <= 0) return { label: 'Expirado', color: 'destructive' as const }
  if (days <= 90) return { label: `Próximo (${days}d)`, color: 'warning' as const }
  return { label: `Válido (${days}d)`, color: 'success' as const }
}

export interface LotColumnsProps {
  onView?: (lot: LotData) => void
  onEdit?: (lot: LotData) => void
  onDelete?: (lot: LotData) => void
}

export function getLotColumns({
  onView,
  onEdit,
  onDelete,
}: LotColumnsProps = {}): ColumnDef<LotData>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Seleccionar todas"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Seleccionar fila"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "product.name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Producto / SKU
          <Calendar className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const product = row.original.product
        return (
          <div>
            <div className="font-semibold text-gray-900">{product.name}</div>
            <div className="text-xs text-blue-600 font-medium">{product.sku}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "lotNumber",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Lote
          <Calendar className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm text-gray-600">
          {row.getValue("lotNumber")}
        </div>
      ),
    },
    {
      accessorKey: "expirationDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Expiración
          <Calendar className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.getValue("expirationDate") as string
        const expiry = getExpiryStatus(date)
        return (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-3.5 w-3.5" />
            {date ? new Date(date).toLocaleDateString() : 'N/A'}
          </div>
        )
      },
    },
    {
      accessorKey: "availableQuantity",
      header: ({ column }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Disponible
            <Calendar className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const quantity = row.getValue("availableQuantity") as number
        return (
          <div className="text-right">
            <span className="font-bold text-gray-900">{quantity}</span>
            <span className="text-xs text-gray-400 ml-1">und</span>
          </div>
        )
      },
    },
    {
      accessorKey: "expirationDate",
      header: "Estado",
      cell: ({ row }) => {
        const date = row.getValue("expirationDate") as string
        const expiry = getExpiryStatus(date)
        return (
          <Badge variant={expiry.color}>
            {expiry.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: "warehouse.name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Bodega
          <Calendar className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const warehouse = row.original.warehouse
        return (
          <div className="text-sm text-gray-600">
            {warehouse.name}
          </div>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const lot = row.original
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
              >
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(lot)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalles
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(lot)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(lot)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
