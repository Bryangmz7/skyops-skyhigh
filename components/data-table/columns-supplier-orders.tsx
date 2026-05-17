'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Eye, Trash2 } from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDate } from '@/lib/utils'
import type { SupplierOrder } from '@/types/database'
import Link from 'next/link'

const STATUS_LABELS: Record<string, string> = {
  nuevo: 'Nuevo', en_proceso: 'En proceso', listo_almacen: 'Listo',
  en_ruta: 'En ruta', entregado: 'Entregado', facturado: 'Facturado', cancelado: 'Cancelado',
}
const STATUS_COLORS: Record<string, string> = {
  nuevo: 'bg-gray-100 text-gray-700', en_proceso: 'bg-blue-100 text-blue-700',
  listo_almacen: 'bg-purple-100 text-purple-700', en_ruta: 'bg-yellow-100 text-yellow-700',
  entregado: 'bg-green-100 text-green-700', facturado: 'bg-emerald-100 text-emerald-700',
  cancelado: 'bg-red-100 text-red-700',
}
const STOCK_COLORS: Record<string, string> = {
  disponible: 'bg-green-100 text-green-700',
  no_hay: 'bg-red-100 text-red-700',
  parcial: 'bg-orange-100 text-orange-700',
}
const STOCK_LABELS: Record<string, string> = {
  disponible: 'Disponible', no_hay: 'No hay', parcial: 'Parcial',
}

export function getSupplierOrderColumns(
  canDelete: boolean,
  onDelete: (id: number) => void
): ColumnDef<SupplierOrder>[] {
  return [
    { accessorKey: 'internal_number', header: 'N° Interno' },
    { accessorKey: 'order_number', header: 'N° Pedido' },
    { accessorKey: 'supplier_name', header: 'Proveedor' },
    { accessorKey: 'client_reference', header: 'Cliente Ref.', cell: ({ row }) => row.original.client_reference ?? '—' },
    { accessorKey: 'project_reference', header: 'Proyecto', cell: ({ row }) => row.original.project_reference ?? '—' },
    {
      accessorKey: 'stock_status',
      header: 'Stock',
      cell: ({ row }) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STOCK_COLORS[row.original.stock_status]}`}>
          {STOCK_LABELS[row.original.stock_status]}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[row.original.status]}`}>
          {STATUS_LABELS[row.original.status]}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Fecha',
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreHorizontal size={16} /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/pedidos-proveedor/${row.original.id}`}>
                <Eye size={14} className="mr-2" /> Ver detalle
              </Link>
            </DropdownMenuItem>
            {canDelete && (
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete(row.original.id)}
              >
                <Trash2 size={14} className="mr-2" /> Eliminar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}
