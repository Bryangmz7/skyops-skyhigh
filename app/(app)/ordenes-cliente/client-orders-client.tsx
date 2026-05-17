'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/components/data-table/data-table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ClientOrderForm } from '@/components/forms/client-order-form'
import { deleteClientOrder, updateClientOrderStatus } from '@/lib/server/actions/client-orders'
import { Plus, LayoutGrid, List } from 'lucide-react'
import { toast } from 'sonner'
import type { ClientOrder, UserRole } from '@/types/database'
import { KanbanBoard } from '@/components/kanban/kanban-board'
import { ColumnDef } from '@tanstack/react-table'
import { formatDate } from '@/lib/utils'
import { MoreHorizontal, Eye, Trash2, Play } from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

interface Props {
  orders: ClientOrder[]
  userRole: UserRole
}

const DOC_TYPE_LABELS: Record<string, string> = { oc: 'OC', cotizacion: 'Cotización' }
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

export function ClientOrdersClient({ orders, userRole }: Props) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'table' | 'kanban'>('table')
  const router = useRouter()

  const canCreate = ['gerente', 'asistente', 'ventas'].includes(userRole)
  const canDelete = userRole === 'gerente'
  const canAdvance = ['gerente', 'asistente', 'ventas'].includes(userRole)

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar esta OC? Esta acción no se puede deshacer.')) return
    const result = await deleteClientOrder(id)
    if (result.error) toast.error(result.error)
    else { toast.success('OC eliminada'); router.refresh() }
  }

  async function handleAdvance(id: number) {
    const result = await updateClientOrderStatus(id, 'en_proceso')
    if (result.error) toast.error(result.error)
    else { toast.success('OC pasada a proceso y almacén notificado'); router.refresh() }
  }

  const columns: ColumnDef<ClientOrder>[] = [
    { accessorKey: 'internal_number', header: 'N° Interno' },
    { accessorKey: 'order_number', header: 'N° OC' },
    { accessorKey: 'client_name', header: 'Cliente' },
    { accessorKey: 'project_reference', header: 'Proyecto', cell: ({ row }) => row.original.project_reference ?? '—' },
    {
      accessorKey: 'doc_type',
      header: 'Tipo',
      cell: ({ row }) => (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
          {DOC_TYPE_LABELS[row.original.doc_type]}
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
    { accessorKey: 'created_at', header: 'Fecha', cell: ({ row }) => formatDate(row.original.created_at) },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreHorizontal size={16} /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/ordenes-cliente/${row.original.id}`}>
                <Eye size={14} className="mr-2" /> Ver detalle
              </Link>
            </DropdownMenuItem>
            {canAdvance && row.original.status === 'nuevo' && (
              <DropdownMenuItem onClick={() => handleAdvance(row.original.id)}>
                <Play size={14} className="mr-2 text-blue-600" /> Pasar a proceso
              </DropdownMenuItem>
            )}
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(row.original.id)}>
                  <Trash2 size={14} className="mr-2" /> Eliminar
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex rounded-lg border overflow-hidden">
          <button onClick={() => setView('table')} className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${view === 'table' ? 'bg-[#0066cc] text-white' : 'bg-white text-gray-600'}`}>
            <List size={14} /> Tabla
          </button>
          <button onClick={() => setView('kanban')} className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${view === 'kanban' ? 'bg-[#0066cc] text-white' : 'bg-white text-gray-600'}`}>
            <LayoutGrid size={14} /> Kanban
          </button>
        </div>
        {canCreate && (
          <Button className="bg-[#0066cc] hover:bg-[#0052a3]" onClick={() => setOpen(true)}>
            <Plus size={16} className="mr-2" /> Nueva OC
          </Button>
        )}
      </div>

      {view === 'table' ? (
        <DataTable columns={columns} data={orders} searchPlaceholder="Buscar por cliente, número…" exportFileName="ordenes_cliente" />
      ) : (
        <KanbanBoard items={orders} type="client" />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva Orden de Cliente</DialogTitle>
          </DialogHeader>
          <ClientOrderForm onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
