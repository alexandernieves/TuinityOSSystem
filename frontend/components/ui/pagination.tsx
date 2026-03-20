"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  rowsPerPage: number
  onPageChange: (page: number) => void
  onRowsPerPageChange: (rowsPerPage: number) => void
  itemName?: string
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  itemName = "elementos",
  className = "",
}: PaginationProps) {
  const startItem = (currentPage - 1) * rowsPerPage + 1
  const endItem = Math.min(currentPage * rowsPerPage, totalItems)

  if (totalItems === 0) return null

  return (
    <div className={`flex items-center justify-between px-4 py-3 bg-white dark:bg-[#141414] border border-gray-100 dark:border-[#2a2a2a] rounded-xl shadow-sm ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700 dark:text-gray-300">
          Mostrando {startItem} a {endItem} de {totalItems} {itemName}
        </span>
      </div>
      
      <div className="flex items-center gap-6">
        {/* Selector de filas por página */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">Filas por página:</span>
          <Select 
            value={rowsPerPage.toString()} 
            onValueChange={(value: string) => {
              onRowsPerPageChange(Number(value))
            }}
          >
            <SelectTrigger className="w-20 h-9 border-gray-200 dark:border-[#2a2a2a] font-medium rounded-lg">
              <SelectValue>
                {rowsPerPage === totalItems ? "Todo" : rowsPerPage}
              </SelectValue>
            </SelectTrigger>
            <SelectContent side="top" className="rounded-xl">
              {[5, 10, 50, 100, 250, 500].map((size) => (
                <SelectItem key={size} value={size.toString()} className="rounded-lg text-xs">
                  {size}
                </SelectItem>
              ))}
              <SelectItem value={totalItems.toString()} className="rounded-lg text-xs">
                Todo
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Controles de paginación */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0 border-gray-200 dark:border-[#2a2a2a] rounded-lg"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0 border-gray-200 dark:border-[#2a2a2a] rounded-lg"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 font-bold">
            Página {currentPage} de {totalPages || 1}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage >= totalPages}
            className="h-8 w-8 p-0 border-gray-200 dark:border-[#2a2a2a] rounded-lg"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            className="h-8 w-8 p-0 border-gray-200 dark:border-[#2a2a2a] rounded-lg"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Hook personalizado para manejar paginación
export function usePagination<T>(
  data: T[],
  initialRowsPerPage: number = 10
) {
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage)

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage
    const endIndex = startIndex + rowsPerPage
    return data.slice(startIndex, endIndex)
  }, [data, currentPage, rowsPerPage])

  const totalPages = Math.ceil(data.length / rowsPerPage)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage)
    setCurrentPage(1)
  }

  return {
    currentPage,
    totalPages,
    totalItems: data.length,
    rowsPerPage,
    paginatedData,
    handlePageChange,
    handleRowsPerPageChange,
  }
}
