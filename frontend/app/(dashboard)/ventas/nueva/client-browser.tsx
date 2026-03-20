"use client"

import { useState, useMemo } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Search, 
  User, 
  Check, 
  ChevronsUpDown,
  Building2,
  Mail,
  CreditCard
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from '@/components/ui/badge'

interface ClientBrowserProps {
  clients: any[]
  onSelect: (clientId: string) => void
  value?: string
  placeholder?: string
}

export function ClientBrowser({ 
  clients, 
  onSelect, 
  value,
  placeholder = "Seleccionar cliente..."
}: ClientBrowserProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === value)
  }, [clients, value])

  const filteredClients = useMemo(() => {
    if (!search) return clients;
    const lowerSearch = search.toLowerCase();
    return clients.filter(c => {
      const name = (c.legalName || c.name || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      const code = (c.code || "").toLowerCase();
      const taxId = (c.taxId || "").toLowerCase();
      return name.includes(lowerSearch) || 
             email.includes(lowerSearch) || 
             code.includes(lowerSearch) || 
             taxId.includes(lowerSearch);
    });
  }, [clients, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-12 rounded-xl border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-4 text-left font-normal hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-all"
        >
          {selectedClient ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#253D6B]/10 text-[#253D6B] font-bold text-xs uppercase">
                {selectedClient.legalName?.charAt(0) || selectedClient.name?.charAt(0) || 'C'}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-gray-900 dark:text-white truncate">
                  {selectedClient.legalName || selectedClient.name}
                </span>
                <span className="text-[10px] text-gray-500 truncate">
                  {selectedClient.code} • {selectedClient.taxId || 'Sin RUC'}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-gray-500 font-medium">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl border-gray-200 dark:border-[#2a2a2a] shadow-2xl overflow-hidden" align="start">
        <div className="flex items-center border-b px-4 py-3 bg-gray-50/50 dark:bg-[#1a1a1a]/50">
          <Search className="mr-3 h-4 w-4 shrink-0 text-gray-400" />
          <input
            className="flex h-8 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50 font-medium"
            placeholder="Buscar por nombre, RUC, código o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="max-h-[350px] overflow-y-auto overflow-x-hidden custom-scrollbar">
          {filteredClients.length === 0 ? (
            <div className="py-12 text-center">
              <User className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">No se encontraron clientes</p>
              <p className="text-xs text-gray-500 mt-1 px-4">Intenta con otros términos de búsqueda</p>
            </div>
          ) : (
            <div className="p-1.5 space-y-1">
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => {
                    onSelect(client.id)
                    setOpen(false)
                    setSearch("")
                  }}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-xl px-3 py-2.5 outline-none transition-all group",
                    value === client.id 
                      ? "bg-[#253D6B] text-white" 
                      : "hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-gray-700 dark:text-gray-300"
                  )}
                >
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-sm uppercase mr-3 transition-colors",
                    value === client.id 
                      ? "bg-white/20 text-white" 
                      : "bg-[#253D6B]/5 text-[#253D6B]"
                  )}>
                    {client.legalName?.charAt(0) || client.name?.charAt(0) || 'C'}
                  </div>
                  
                  <div className="flex flex-col items-start overflow-hidden flex-1">
                    <div className="flex items-center gap-2 w-full overflow-hidden">
                      <span className={cn(
                        "font-bold text-[13px] truncate",
                        value === client.id ? "text-white" : "text-gray-900 dark:text-white"
                      )}>
                        {client.legalName || client.name}
                      </span>
                      {client.creditProfile?.priceLevel && (
                        <Badge className={cn(
                          "h-4 px-1 text-[9px] font-black border-none",
                          value === client.id 
                            ? "bg-white/20 text-white" 
                            : client.creditProfile.priceLevel === 'A' ? "bg-emerald-500/10 text-emerald-600" :
                              client.creditProfile.priceLevel === 'B' ? "bg-blue-500/10 text-blue-600" : "bg-purple-500/10 text-purple-600"
                        )}>
                          NIVEL {client.creditProfile.priceLevel}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className={cn(
                        "text-[10px] font-medium flex items-center gap-1",
                        value === client.id ? "text-white/70" : "text-gray-500"
                      )}>
                        <Building2 className="h-3 w-3" />
                        {client.code}
                      </span>
                      {client.taxId && (
                        <span className={cn(
                          "text-[10px] font-medium flex items-center gap-1",
                          value === client.id ? "text-white/70" : "text-gray-500"
                        )}>
                          <CreditCard className="h-3 w-3" />
                          {client.taxId}
                        </span>
                      )}
                    </div>
                  </div>

                  {value === client.id && (
                    <div className="bg-white/20 p-1 rounded-full">
                      <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {clients.length > 0 && (
          <div className="border-t p-2 bg-gray-50/30 dark:bg-[#1a1a1a]/30">
            <p className="text-[10px] text-center font-bold text-gray-400 uppercase tracking-widest">
              Mostrando {filteredClients.length} de {clients.length} clientes
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
