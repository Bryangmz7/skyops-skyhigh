'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useOffline } from '@/hooks/use-offline'
import { formatDate } from '@/lib/utils'
import type { Delivery } from '@/types/database'
import { Calendar, MapPin, Truck, Wifi, WifiOff } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  pendiente_programacion: 'Por programar',
  programado: 'Programado',
  en_ruta: 'En ruta',
  entregado: 'Entregado',
  incidencia: 'Incidencia',
}
const STATUS_COLORS: Record<string, string> = {
  pendiente_programacion: 'bg-gray-100 text-gray-600',
  programado: 'bg-blue-100 text-blue-700',
  en_ruta: 'bg-yellow-100 text-yellow-700',
  entregado: 'bg-green-100 text-green-700',
  incidencia: 'bg-red-100 text-red-700',
}

interface Props {
  allDeliveries: Delivery[]
  userId: string
}

export function MisEntregasClient({ allDeliveries, userId }: Props) {
  const [soloMias, setSoloMias] = useState(true)
  const { isOnline, pendingCount } = useOffline()

  const deliveries = soloMias
    ? allDeliveries.filter((d) => d.assigned_to === userId)
    : allDeliveries

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Mis Entregas</h1>
        <div className="flex items-center gap-1.5 text-xs">
          {isOnline ? (
            <span className="flex items-center gap-1 text-green-600">
              <Wifi size={14} /> Online
            </span>
          ) : (
            <span className="flex items-center gap-1 text-orange-600">
              <WifiOff size={14} /> Offline {pendingCount > 0 ? `· ${pendingCount} pendientes` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Toggle */}
      <div className="flex rounded-lg border overflow-hidden text-sm">
        <button
          onClick={() => setSoloMias(true)}
          className={`flex-1 py-2 font-medium transition-colors ${soloMias ? 'bg-sky-600 text-white' : 'bg-white text-gray-600'}`}
        >
          Asignadas a mí
        </button>
        <button
          onClick={() => setSoloMias(false)}
          className={`flex-1 py-2 font-medium transition-colors ${!soloMias ? 'bg-sky-600 text-white' : 'bg-white text-gray-600'}`}
        >
          Ver todas
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {deliveries.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Truck size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin entregas {soloMias ? 'asignadas' : 'pendientes'}</p>
          </div>
        ) : (
          deliveries.map((delivery) => {
            const oc = delivery.client_order as any
            return (
              <Link
                key={delivery.id}
                href={`/almacen/mis-entregas/${delivery.id}`}
                className="block bg-white rounded-xl border p-4 hover:shadow-md active:scale-95 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-gray-400">{oc?.internal_number}</p>
                    <p className="font-semibold text-gray-900 truncate">{oc?.client_name}</p>
                    {oc?.project_reference && (
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} /> {oc.project_reference}
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_COLORS[delivery.current_status]}`}>
                    {STATUS_LABELS[delivery.current_status]}
                  </span>
                </div>
                {delivery.scheduled_date && (
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(delivery.scheduled_date)}
                    {delivery.scheduled_time && ` a las ${delivery.scheduled_time.slice(0, 5)}`}
                  </p>
                )}
                {delivery.guide_number && (
                  <p className="text-xs text-blue-600 mt-1">Guía: {delivery.guide_number}</p>
                )}
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
