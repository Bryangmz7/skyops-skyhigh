'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import type { SupplierOrder, ClientOrder } from '@/types/database'

const COLUMNS = [
  { key: 'nuevo', label: 'Nuevo', color: 'border-t-gray-400' },
  { key: 'en_proceso', label: 'En Proceso', color: 'border-t-blue-400' },
  { key: 'listo_almacen', label: 'Listo Almacén', color: 'border-t-purple-400' },
  { key: 'en_ruta', label: 'En Ruta', color: 'border-t-yellow-400' },
  { key: 'entregado', label: 'Entregado', color: 'border-t-green-400' },
  { key: 'facturado', label: 'Facturado', color: 'border-t-emerald-400' },
]

interface Props {
  items: (SupplierOrder | ClientOrder)[]
  type: 'supplier' | 'client'
}

export function KanbanBoard({ items, type }: Props) {
  const basePath = type === 'supplier' ? '/pedidos-proveedor' : '/ordenes-cliente'

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const colItems = items.filter((i) => i.status === col.key)
        return (
          <div key={col.key} className="flex-shrink-0 w-64">
            <div className={`rounded-lg border-t-4 bg-gray-50 ${col.color}`}>
              <div className="p-3 border-b">
                <span className="font-semibold text-sm text-gray-700">{col.label}</span>
                <span className="ml-2 text-xs bg-white border rounded-full px-2 py-0.5 text-gray-500">
                  {colItems.length}
                </span>
              </div>
              <div className="p-2 space-y-2 min-h-24 max-h-[calc(100vh-280px)] overflow-y-auto">
                {colItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`${basePath}/${item.id}`}
                    className="block bg-white rounded-lg border p-3 hover:shadow-sm hover:border-[#0066cc] transition-all"
                  >
                    <p className="text-xs font-mono text-gray-400">{item.internal_number}</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5 truncate">
                      {'supplier_name' in item ? item.supplier_name : item.client_name}
                    </p>
                    {'client_reference' in item && item.client_reference && (
                      <p className="text-xs text-gray-500 truncate">{item.client_reference}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{formatDate(item.created_at)}</p>
                  </Link>
                ))}
                {colItems.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">Sin registros</p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
