"use client"

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { 
  Search, 
  Package, 
  X, 
  ShoppingCart,
  Plus,
  ChevronDown,
  Filter
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/mock-data/sales-orders"
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { DataTable } from '@/components/ui/data-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ColumnDef } from '@tanstack/react-table'

const getText = (val: any): string => {
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object' && val !== null) return val.name || val.label || val.description || "";
  return "";
};

interface ProductBrowserProps {
  products: any[]
  onSelect: (product: any) => void
  selectedClient: any
  includeIncomingStock: boolean
  value?: string
  placeholder?: string
}

export function ProductBrowser({ 
  products, 
  onSelect, 
  selectedClient, 
  includeIncomingStock,
  value,
  placeholder = "Busca un producto..."
}: ProductBrowserProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === value)
  }, [products, value])

  // Extract unique categories (groups)
  const categories = useMemo(() => {
    const cats = new Set(
      products.map(p => {
        const group = p.group;
        if (typeof group === 'string') return group;
        if (typeof group === 'object' && group !== null) return group.name || group.label;
        return null;
      }).filter(Boolean)
    )
    return ["all", ...Array.from(cats)]
  }, [products])

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const pName = (p.description || p.name || "").toLowerCase()
      const pRef = (p.reference || p.sku || "").toLowerCase()
      const searchLower = search.toLowerCase()
      
      const matchesSearch = pName.includes(searchLower) || pRef.includes(searchLower)
      
      const getGroup = (group: any) => {
        if (typeof group === 'string') return group;
        if (typeof group === 'object' && group !== null) return group.name || group.label;
        return "";
      }
      
      const matchesCategory = selectedCategory === "all" || getGroup(p.group) === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, search, selectedCategory])

  const handleSelect = (product: any) => {
    onSelect(product)
    setIsOpen(false)
  }

  // Column definitions for DataTable
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "reference",
      header: "Referencia",
      cell: ({ row }) => <code className="text-xs font-mono font-bold bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600">{getText(row.getValue("reference"))}</code>
    },
    {
      accessorKey: "description",
      header: "Descripción",
      cell: ({ row }) => (
        <div className="max-w-[400px] truncate font-medium text-gray-900 dark:text-gray-100">
          {getText(row.getValue("description"))}
        </div>
      )
    },
    {
      accessorKey: "brand",
      header: "Marca",
      cell: ({ row }) => {
        const brand = row.getValue("brand");
        const brandLabel = getText(brand) || "N/A";
        return <span className="text-xs text-gray-500">{brandLabel}</span>
      }
    },
    {
      id: "stock",
      header: "Disponible",
      cell: ({ row }) => {
        const product = row.original
        const stock = product.stock || { existence: 0, reserved: 0, arriving: 0 }
        const available = (stock.existence || 0) - (stock.reserved || 0) + (includeIncomingStock ? (stock.arriving || 0) : 0)
        return (
          <Badge 
            variant={available > 0 ? "outline" : "destructive"}
            className={cn(
              "font-bold",
              available > 0 ? "border-emerald-200 text-emerald-700 bg-emerald-50" : ""
            )}
          >
            {available}
          </Badge>
        )
      }
    },
    {
      id: "price",
      header: "Precio",
      cell: ({ row }) => {
        const product = row.original
        const priceLevel = selectedClient?.priceLevel || 'C'
        const price = product.prices?.[priceLevel] || product.price || 0
        return <span className="font-bold text-[#253D6B]">{formatCurrency(price)}</span>
      }
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button 
          size="sm" 
          onClick={() => handleSelect(row.original)}
          className="bg-[#253D6B] hover:bg-[#1e3156] h-8 rounded-lg"
        >
          <Plus className="h-4 w-4 mr-1" />
          Elegir
        </Button>
      )
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button 
          type="button"
          disabled={!selectedClient}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#141414] dark:border-[#2a2a2a]",
            !value && "text-muted-foreground"
          )}
        >
          <span className="truncate">
            {selectedProduct ? getText(selectedProduct.description || selectedProduct.name) : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-[95vw] h-[95vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-[#0a0a0a] border-none shadow-2xl rounded-2xl">
        {/* Header Section */}
        <div className="border-b p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-[#f0f4f9] dark:bg-blue-900/20 flex items-center justify-center">
                <Package className="h-6 w-6 text-[#253D6B]" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight text-[#1a1c1e]">Catálogo de Productos</DialogTitle>
                <p className="text-sm text-gray-500 font-medium tracking-tight">Selecciona productos para tu cotización de forma rápida y sencilla</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
               <Badge className="bg-[#f0f4f9] text-[#253D6B] border-none px-3 py-1 text-xs font-bold rounded-lg">
                 Cliente: {getText(selectedClient?.name) || "General"}
               </Badge>
            </div>
          </div>

          <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Busca por descripción, marca o código de referencia..." 
                  className="pl-11 h-12 bg-gray-50/50 border-[#dfe3e8] dark:bg-[#0a0a0a] dark:border-[#2a2a2a] rounded-xl focus:ring-[#253D6B] transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button 
                    onClick={() => setSearch("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-gray-500" />
                  </button>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-12 px-5 rounded-xl border-[#dfe3e8] bg-white flex gap-2 font-bold text-gray-600 hover:bg-gray-50">
                    <Filter className="h-4 w-4 text-[#253D6B]" />
                    {selectedCategory === "all" ? "Todas las categorías" : selectedCategory}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[240px] rounded-xl p-1 shadow-xl border-[#dfe3e8]">
                   {categories.map(cat => (
                     <DropdownMenuItem 
                       key={getText(cat)} 
                       onClick={() => setSelectedCategory(getText(cat))}
                       className={cn(
                         "font-bold text-gray-600 rounded-lg px-3 py-2 cursor-pointer transition-colors",
                         selectedCategory === getText(cat) ? "bg-[#253D6B] text-white" : "hover:bg-gray-100"
                       )}
                     >
                       {getText(cat) === "all" ? "Todas las categorías" : getText(cat)}
                     </DropdownMenuItem>
                   ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 dark:bg-[#0d0d0d]">
           <div className="bg-white dark:bg-[#141414] rounded-2xl border border-[#dfe3e8] dark:border-[#2a2a2a] p-1 shadow-sm overflow-hidden min-h-[500px]">
             <DataTable 
               columns={columns} 
               data={filteredProducts} 
               pageSize={12}
               showColumnToggle={false}
             />
           </div>

          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center">
              <div className="h-24 w-24 rounded-full bg-gray-100 dark:bg-[#141414] flex items-center justify-center mb-6">
                <Search className="h-10 w-10 text-gray-300" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">Sin resultados correspondientes</h4>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mt-2 leading-relaxed">
                No pudimos encontrar productos con los términos ingresados. Prueba con palabras clave más generales.
              </p>
              <Button 
                variant="outline" 
                className="mt-6 rounded-xl border-[#dfe3e8]"
                onClick={() => { setSearch(""); setSelectedCategory("all"); }}
              >
                Restablecer catálogo
              </Button>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="bg-white dark:bg-[#141414] border-t px-6 py-4 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nivel de precio activo</span>
                <span className="text-sm font-bold text-[#253D6B]">Nivel {selectedClient?.priceLevel || 'C'}</span>
              </div>
              <div className="w-px h-8 bg-gray-100 mx-2" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total productos</span>
                <span className="text-sm font-bold text-gray-700">{filteredProducts.length}</span>
              </div>
           </div>
           <div className="flex items-center gap-4">
             <span className="text-[10px] font-bold text-gray-400 italic">
               * Precios y stock calculados en tiempo real según el nivel del cliente seleccionado
             </span>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
