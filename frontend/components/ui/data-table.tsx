"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Columns } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { Pagination } from "@/components/ui/pagination"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  filterColumn?: string
  filterPlaceholder?: string
  showColumnToggle?: boolean
  pageSize?: number
  pageIndex?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onRowSelectionChange?: (selectedRows: TData[]) => void
  rowSelection?: any
  onRowSelectionStateChange?: any
  getRowId?: (row: TData) => string
}

// Helper function to safely render any content
function safeRender(content: unknown): React.ReactNode {
  if (React.isValidElement(content)) return content
  if (content === null || content === undefined) return null
  if (typeof content === "string" || typeof content === "number" || typeof content === "boolean") return content
  if (typeof content === "object" && content !== null) {
    const obj = content as Record<string, unknown>
    if (typeof obj.name === "string") return obj.name
    if (typeof obj.description === "string") return obj.description
    if (typeof obj.label === "string") return obj.label
    if (typeof obj.title === "string") return obj.title
    if (typeof obj.reference === "string") return obj.reference
    if (typeof obj.code === "string") return obj.code
    if (obj.toString && obj.toString !== Object.prototype.toString) return obj.toString()
    return JSON.stringify(content)
  }
  return String(content)
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterColumn,
  filterPlaceholder = "Buscar...",
  showColumnToggle = true,
  pageSize = 10,
  pageIndex,
  onPageChange,
  onPageSizeChange,
  onRowSelectionChange,
  rowSelection: propsRowSelection,
  onRowSelectionStateChange,
  getRowId,
}: DataTableProps<TData, TValue>) {
  const [internalRowSelection, setInternalRowSelection] = React.useState({})
  const rowSelection = propsRowSelection || internalRowSelection
  const setRowSelection = onRowSelectionStateChange || setInternalRowSelection

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  const table = useReactTable({
    data,
    columns,
    initialState: {
      pagination: {
        pageSize: pageSize,
        pageIndex: pageIndex ?? 0,
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageSize: pageSize,
        pageIndex: pageIndex ?? 0,
      },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newState = updater({
          pageIndex: pageIndex ?? 0,
          pageSize: pageSize,
        });
        if (onPageChange && newState.pageIndex !== pageIndex) {
          onPageChange(newState.pageIndex);
        }
        if (onPageSizeChange && newState.pageSize !== pageSize) {
          onPageSizeChange(newState.pageSize);
        }
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: getRowId || ((row: any) => row.id || row._id || row.uuid),
  })

  React.useEffect(() => {
    if (onRowSelectionChange) {
      const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original)
      onRowSelectionChange(selectedRows)
    }
  }, [rowSelection, onRowSelectionChange, table])

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        {filterColumn && (
          <div className="flex items-center flex-1 max-w-sm">
            <Input
              placeholder={filterPlaceholder}
              value={(table.getColumn(filterColumn)?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn(filterColumn)?.setFilterValue(event.target.value)
              }
              className="h-9"
            />
          </div>
        )}
        
        {showColumnToggle && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Columns className="h-4 w-4 mr-2" />
                Columnas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-hidden bg-white dark:bg-[#141414] dark:border-[#2a2a2a]">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent dark:border-[#2a2a2a]">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="font-bold text-gray-700 dark:text-gray-300">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                >
                  {row.getVisibleCells().map((cell) => {
                    const content = flexRender(cell.column.columnDef.cell, cell.getContext())
                    return (
                      <TableCell key={cell.id}>
                        {safeRender(content)}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-[400px] text-center border-none">
                  <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                    <div className="rounded-full bg-slate-100 dark:bg-slate-800/50 p-6">
                        <Columns className="h-10 w-10 text-slate-400" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-lg font-semibold text-slate-900 dark:text-white">No se encontraron productos</p>
                        <p className="text-sm text-slate-500">Intenta ajustar tus filtros o añade un nuevo producto para comenzar.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={(table.getState().pagination.pageIndex ?? 0) + 1}
        totalPages={table.getPageCount()}
        totalItems={table.getFilteredRowModel().rows.length}
        rowsPerPage={table.getState().pagination.pageSize}
        onPageChange={(page) => table.setPageIndex(page - 1)}
        onRowsPerPageChange={(size) => table.setPageSize(size)}
        itemName="resultados"
      />
    </div>
  )
}
