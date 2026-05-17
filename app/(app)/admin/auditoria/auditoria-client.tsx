'use client'

import { useState } from 'react'
import { DataTable } from '@/components/data-table/data-table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatDateTime } from '@/lib/utils'
import type { AuditLog } from '@/types/database'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
}
const TABLE_LABELS: Record<string, string> = {
  client_orders: 'OC Clientes', supplier_orders: 'Pedidos Proveedor',
  deliveries: 'Entregas', users: 'Usuarios',
}

interface Props { logs: AuditLog[] }

export function AuditoriaClient({ logs }: Props) {
  const [selected, setSelected] = useState<AuditLog | null>(null)

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: 'created_at',
      header: 'Fecha/Hora',
      cell: ({ row }) => <span className="text-xs">{formatDateTime(row.original.created_at)}</span>,
    },
    {
      id: 'user',
      header: 'Usuario',
      cell: ({ row }) => (row.original.user as any)?.full_name ?? 'Sistema',
    },
    {
      accessorKey: 'action',
      header: 'Acción',
      cell: ({ row }) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[row.original.action] ?? 'bg-gray-100 text-gray-700'}`}>
          {row.original.action}
        </span>
      ),
    },
    {
      accessorKey: 'table_name',
      header: 'Tabla',
      cell: ({ row }) => TABLE_LABELS[row.original.table_name] ?? row.original.table_name,
    },
    { accessorKey: 'record_id', header: 'ID Registro' },
    {
      id: 'diff',
      header: '',
      cell: ({ row }) => (
        (row.original.old_value || row.original.new_value) ? (
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelected(row.original)}>
            Ver cambios
          </Button>
        ) : null
      ),
    },
  ]

  return (
    <>
      <DataTable
        columns={columns}
        data={logs}
        searchPlaceholder="Buscar por usuario, tabla, acción…"
        exportFileName="auditoria"
      />

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del cambio</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                {selected.old_value && (
                  <div>
                    <p className="font-semibold text-red-600 mb-2">Antes</p>
                    <pre className="bg-red-50 p-3 rounded-lg text-xs overflow-auto">
                      {JSON.stringify(selected.old_value, null, 2)}
                    </pre>
                  </div>
                )}
                {selected.new_value && (
                  <div>
                    <p className="font-semibold text-green-600 mb-2">Después</p>
                    <pre className="bg-green-50 p-3 rounded-lg text-xs overflow-auto">
                      {JSON.stringify(selected.new_value, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
