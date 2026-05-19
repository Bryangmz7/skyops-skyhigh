'use client'

import {
  ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
  SortingState, ColumnFiltersState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, ChevronRight, Download, Search, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchPlaceholder?: string
  searchKey?: string
  exportFileName?: string
  toolbar?: React.ReactNode
}

export function DataTable<TData, TValue>({
  columns, data, searchPlaceholder = 'Buscar…', searchKey, exportFileName, toolbar,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnFilters, globalFilter },
    initialState: { pagination: { pageSize: 20 } },
  })

  function exportToExcel() {
    const rows = table.getFilteredRowModel().rows
    const exportData = rows.map((row) => {
      const obj: Record<string, unknown> = {}
      row.getVisibleCells().forEach((cell) => {
        const header = cell.column.columnDef.header
        if (typeof header === 'string' && header !== '') {
          obj[header] = cell.getValue()
        }
      })
      return obj
    })
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Datos')
    const today = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `skyops_${exportFileName ?? 'export'}_${today}.xlsx`)
  }

  const rowCount = table.getFilteredRowModel().rows.length

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <div className="relative max-w-xs w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 h-9 bg-white border-slate-200 focus-visible:ring-sky-500 text-sm"
            />
          </div>
          {toolbar}
        </div>
        {exportFileName && (
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            className="h-9 border-slate-200 text-slate-600 hover:bg-slate-50 gap-1.5"
          >
            <FileSpreadsheet size={14} />
            Exportar Excel
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-slate-50 border-b border-slate-200 hover:bg-slate-50">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="font-semibold text-slate-600 text-xs uppercase tracking-wide py-3"
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, i) => (
                <TableRow
                  key={row.id}
                  className={`border-b border-slate-100 transition-colors hover:bg-sky-50/40 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 text-sm text-slate-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Search size={32} className="opacity-30" />
                    <p className="text-sm">No hay registros</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          <span className="font-medium text-slate-700">{rowCount}</span> registros
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 w-8 p-0 border-slate-200"
          >
            <ChevronLeft size={14} />
          </Button>
          <span className="px-3 py-1 rounded-md bg-slate-100 text-xs font-medium min-w-[80px] text-center">
            Pág. {table.getState().pagination.pageIndex + 1} / {Math.max(1, table.getPageCount())}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 w-8 p-0 border-slate-200"
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}
