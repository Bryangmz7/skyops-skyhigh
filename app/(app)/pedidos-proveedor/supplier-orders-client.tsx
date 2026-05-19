'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/components/data-table/data-table'
import { getSupplierOrderColumns } from '@/components/data-table/columns-supplier-orders'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SupplierOrderForm } from '@/components/forms/supplier-order-form'
import { deleteSupplierOrder } from '@/lib/server/actions/supplier-orders'
import { Plus, LayoutGrid, List } from 'lucide-react'
import { toast } from 'sonner'
import type { SupplierOrder, UserRole } from '@/types/database'
import { KanbanBoard } from '@/components/kanban/kanban-board'

interface Props {
  orders: SupplierOrder[]
  userRole: UserRole
}

export function SupplierOrdersClient({ orders, userRole }: Props) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'table' | 'kanban'>('table')
  const router = useRouter()

  const canCreate = ['gerente', 'asistente', 'ventas'].includes(userRole)
  const canDelete = userRole === 'gerente'

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este pedido? Esta acción no se puede deshacer.')) return
    const result = await deleteSupplierOrder(id)
    if (result.error) toast.error(result.error)
    else { toast.success('Pedido eliminado'); router.refresh() }
  }

  const columns = getSupplierOrderColumns(canDelete, handleDelete)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex rounded-lg border overflow-hidden">
          <button
            onClick={() => setView('table')}
            className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${view === 'table' ? 'bg-sky-600 text-white' : 'bg-white text-gray-600'}`}
          >
            <List size={14} /> Tabla
          </button>
          <button
            onClick={() => setView('kanban')}
            className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${view === 'kanban' ? 'bg-sky-600 text-white' : 'bg-white text-gray-600'}`}
          >
            <LayoutGrid size={14} /> Kanban
          </button>
        </div>
        {canCreate && (
          <Button className="bg-sky-600 hover:bg-sky-700" onClick={() => setOpen(true)}>
            <Plus size={16} className="mr-2" /> Nuevo Pedido
          </Button>
        )}
      </div>

      {view === 'table' ? (
        <DataTable
          columns={columns}
          data={orders}
          searchPlaceholder="Buscar por número, proveedor, cliente…"
          exportFileName="pedidos_proveedor"
        />
      ) : (
        <KanbanBoard items={orders} type="supplier" />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nuevo Pedido a Proveedor</DialogTitle>
          </DialogHeader>
          <SupplierOrderForm onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
