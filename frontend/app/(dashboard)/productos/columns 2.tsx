"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Product } from "@/lib/mock-data/products"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Edit, Copy, ToggleLeft, Trash2, ArrowUpDown, Package } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils/cn"

// Helper to get group name
function getGroupName(group: Product["group"]): string {
  if (typeof group === "object" && group !== null && "name" in group) {
    return (group as { name?: string }).name || "Sin categoría"
  }
  if (typeof group === "string") {
    return group
  }
  return "Sin categoría"
}

// Helper to get stock status
function getStockStatus(product: Product) {
  const available = product.stock?.available || 0
  const minimumQty = product.minimumQty || 0
  
  if (available === 0) {
    return { label: "Sin Stock", color: "bg-red-500" }
  }
  if (available <= minimumQty) {
    return { label: "Stock Bajo", color: "bg-amber-500" }
  }
  return { label: "En Stock", color: "bg-emerald-500" }
}

export interface ProductColumnsProps {
  onView: (product: Product) => void
  onEdit: (product: Product) => void
  onDuplicate: (product: Product) => void
  onToggleStatus: (product: Product) => void
  onDelete: (product: Product) => void
}

export function getProductColumns({
  onView,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onDelete,
}: ProductColumnsProps): ColumnDef<Product>[] {
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
      id: "image",
      header: "",
      cell: ({ row }) => {
        const product = row.original;
        const imageUrl = product.image;
        
        return (
          <div className="h-10 w-10 overflow-hidden rounded-md border border-slate-200 bg-slate-50 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] flex items-center justify-center">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <Package className="h-5 w-5 text-slate-400 opacity-40" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "reference",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Referencia
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const reference = row.original.reference
        if (typeof reference === "string") {
          return <span className="font-mono text-sm">{reference}</span>
        }
        return <span className="font-mono text-sm">-</span>
      },
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Descripción
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const description = row.original.description
        if (typeof description === "string") {
          return (
            <div className="font-medium max-w-xs truncate">
              {description}
            </div>
          )
        }
        return (
          <div className="font-medium max-w-xs truncate">
            -
          </div>
        )
      },
    },
    {
      accessorKey: "brand",
      header: "Marca",
      cell: ({ row }) => {
        const brandValue = row.original.brand
        
        // Si es un string, usarlo directamente
        if (typeof brandValue === "string") {
          return <span>{brandValue}</span>
        }
        
        // Si es un objeto con name, usar ese
        if (typeof brandValue === "object" && brandValue !== null) {
          const name = (brandValue as { name?: string }).name
          if (name) return <span>{name}</span>
        }
        
        return <span>Sin marca</span>
      },
    },
    {
      accessorKey: "group",
      header: "Categoría",
      cell: ({ row }) => {
        const product = row.original
        const groupValue = product.group
        
        // Si es un string, usarlo directamente
        if (typeof groupValue === "string") {
          return <span>{groupValue}</span>
        }
        
        // Si es un objeto con name, usar ese
        if (typeof groupValue === "object" && groupValue !== null) {
          const name = (groupValue as { name?: string }).name
          if (name) return <span>{name}</span>
        }
        
        return <span>Sin categoría</span>
      },
    },
    {
      accessorKey: "stock.available",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Stock
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const product = row.original
        const stockStatus = getStockStatus(product)
        const available = product.stock?.available || 0
        
        return (
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full shrink-0", stockStatus.color)} />
            <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
              {available} {available === 1 ? 'unid.' : 'unid.'}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "prices.A",
      header: ({ column }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Precio
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const price = row.original.prices?.A || 0
        return (
          <div className="text-right font-medium">
            ${price.toFixed(2)}
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const statusValue = row.original.status
        const status = typeof statusValue === "string" ? statusValue : "inactive"
        return (
          <Badge variant={status === "active" ? "default" : "secondary"}>
            {status === "active" ? "Activo" : "Inactivo"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const product = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onView(product)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver ficha
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(product)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(product)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onToggleStatus(product)}>
                <ToggleLeft className="mr-2 h-4 w-4" />
                {product.status === "active" ? "Desactivar" : "Activar"}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(product)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
