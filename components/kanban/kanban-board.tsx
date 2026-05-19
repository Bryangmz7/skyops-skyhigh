'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import type { SupplierOrder, ClientOrder } from '@/types/database'

const COLUMNS = [
  {
    key: 'nuevo',
    label: 'Nuevo',
    dotColor: 'bg-slate-400',
    headerBg: 'bg-slate-50',
    borderTop: 'border-t-slate-300',
    countBg: 'bg-slate-100 text-slate-600',
  },
  {
    key: 'en_proceso',
    label: 'En Proceso',
    dotColor: 'bg-sky-500',
    headerBg: 'bg-sky-50',
    borderTop: 'border-t-sky-400',
    countBg: 'bg-sky-100 text-sky-700',
  },
  {
    key: 'listo_almacen',
    label: 'Listo Almacén',
    dotColor: 'bg-violet-500',
    headerBg: 'bg-violet-50',
    borderTop: 'border-t-violet-400',
    countBg: 'bg-violet-100 text-violet-700',
  },
  {
    key: 'en_ruta',
    label: 'En Ruta',
    dotColor: 'bg-amber-500',
    headerBg: 'bg-amber-50',
    borderTop: 'border-t-amber-400',
    countBg: 'bg-amber-100 text-amber-700',
  },
  {
    key: 'entregado',
    label: 'Entregado',
    dotColor: 'bg-emerald-500',
    headerBg: 'bg-emerald-50',
    borderTop: 'border-t-emerald-400',
    countBg: 'bg-emerald-100 text-emerald-700',
  },
  {
    key: 'facturado',
    label: 'Facturado',
    dotColor: 'bg-teal-500',
    headerBg: 'bg-teal-50',
    borderTop: 'border-t-teal-400',
    countBg: 'bg-teal-100 text-teal-700',
  },
]

interface Props {
  items: (SupplierOrder | ClientOrder)[]
  type: 'supplier' | 'client'
}

export function KanbanBoard({ items, type }: Props) {
  const basePath = type === 'supplier' ? '/pedidos-proveedor' : '/ordenes-cliente'

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
      {COLUMNS.map((col) => {
        const colItems = items.filter((i) => i.status === col.key)

        return (
          <div key={col.key} className="flex-shrink-0 w-60">
            {/* Column header */}
            <div className={`rounded-xl border border-slate-200 border-t-4 ${col.borderTop} bg-white shadow-sm overflow-hidden`}>
              <div className={`${col.headerBg} px-3 py-2.5 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                  <span className="font-semibold text-sm text-slate-700">{col.label}</span>
                </div>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${col.countBg}`}>
                  {colItems.length}
                </span>
              </div>

              {/* Cards */}
              <div className="p-2 space-y-2 min-h-20 max-h-[calc(100vh-300px)] overflow-y-auto bg-slate-50/50">
                {colItems.length === 0 && (
                  <div className="flex items-center justify-center py-6">
                    <p className="text-xs text-slate-400">Sin registros</p>
                  </div>
                )}
                {colItems.map((item) => {
                  const name = 'supplier_name' in item ? item.supplier_name : item.client_name
                  const ref = 'client_reference' in item
                    ? item.client_reference
                    : 'project_reference' in item
                      ? (item as ClientOrder).project_reference
                      : null

                  return (
                    <Link
                      key={item.id}
                      href={`${basePath}/${item.id}`}
                      className="group block bg-white rounded-xl border border-slate-200 p-3 hover:border-sky-300 hover:shadow-md transition-all"
                    >
                      <p className="text-[10px] font-mono text-slate-400 group-hover:text-sky-500 transition-colors tracking-wide">
                        {item.internal_number}
                      </p>
                      <p className="text-sm font-semibold text-slate-800 mt-1 truncate leading-tight">
                        {name}
                      </p>
                      {ref && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{ref}</p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                        {formatDate(item.created_at)}
                      </p>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
