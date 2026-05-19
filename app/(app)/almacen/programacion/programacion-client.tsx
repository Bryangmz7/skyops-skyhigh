'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { scheduleDelivery } from '@/lib/server/actions/deliveries'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import type { Delivery, UserRole } from '@/types/database'
import { Calendar, Clock, Truck, CheckCircle, AlertCircle } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pendiente_programacion: { label: 'Por Programar', color: 'border-t-gray-400 bg-gray-50', icon: <Clock size={14} /> },
  programado: { label: 'Programado', color: 'border-t-blue-400 bg-blue-50', icon: <Calendar size={14} /> },
  en_ruta: { label: 'En Ruta', color: 'border-t-yellow-400 bg-yellow-50', icon: <Truck size={14} /> },
  entregado: { label: 'Entregado', color: 'border-t-green-400 bg-green-50', icon: <CheckCircle size={14} /> },
  incidencia: { label: 'Incidencia', color: 'border-t-red-400 bg-red-50', icon: <AlertCircle size={14} /> },
}

interface Props {
  deliveries: Delivery[]
  operativos: { id: string; full_name: string }[]
  userRole: UserRole
}

export function ProgramacionClient({ deliveries, operativos, userRole }: Props) {
  const [selected, setSelected] = useState<Delivery | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const canSchedule = ['gerente', 'asistente', 'jefe_almacen'].includes(userRole)

  async function handleSchedule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selected) return
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await scheduleDelivery(selected.id, formData)
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Entrega programada y operativo notificado')
      setSelected(null)
      router.refresh()
    }
  }

  const columns = ['pendiente_programacion', 'programado', 'en_ruta', 'entregado', 'incidencia']

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((status) => {
          const config = STATUS_CONFIG[status]
          const colDeliveries = deliveries.filter((d) => d.current_status === status)
          return (
            <div key={status} className="flex-shrink-0 w-72">
              <div className={`rounded-lg border-t-4 ${config.color}`}>
                <div className="p-3 border-b bg-white rounded-t-none">
                  <div className="flex items-center gap-2">
                    {config.icon}
                    <span className="font-semibold text-sm text-gray-700">{config.label}</span>
                    <span className="ml-auto text-xs bg-white border rounded-full px-2 py-0.5 text-gray-500">
                      {colDeliveries.length}
                    </span>
                  </div>
                </div>
                <div className="p-2 space-y-2 min-h-24 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {colDeliveries.map((delivery) => {
                    const oc = delivery.client_order as any
                    return (
                      <div
                        key={delivery.id}
                        onClick={() => canSchedule && setSelected(delivery)}
                        className={`bg-white rounded-lg border p-3 transition-all ${canSchedule ? 'cursor-pointer hover:shadow-sm hover:border-sky-600' : ''}`}
                      >
                        <p className="text-xs font-mono text-gray-400">{oc?.internal_number}</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{oc?.client_name}</p>
                        {oc?.project_reference && (
                          <p className="text-xs text-gray-500 truncate">{oc.project_reference}</p>
                        )}
                        {delivery.guide_number && (
                          <p className="text-xs text-blue-600 mt-1">Guía: {delivery.guide_number}</p>
                        )}
                        {delivery.scheduled_date && (
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Calendar size={10} />
                            {formatDate(delivery.scheduled_date)} {delivery.scheduled_time?.slice(0, 5)}
                          </p>
                        )}
                        {(delivery.assigned_user as any)?.full_name && (
                          <p className="text-xs text-purple-600 mt-1">
                            → {(delivery.assigned_user as any).full_name}
                          </p>
                        )}
                      </div>
                    )
                  })}
                  {colDeliveries.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">Sin entregas</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Sheet para programar */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Programar Entrega</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="mt-4">
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                <p className="font-medium">{(selected.client_order as any)?.client_name}</p>
                <p className="text-gray-500">{(selected.client_order as any)?.internal_number}</p>
              </div>
              <form onSubmit={handleSchedule} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="scheduled_date">Fecha</Label>
                    <Input id="scheduled_date" name="scheduled_date" type="date" defaultValue={selected.scheduled_date ?? ''} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="scheduled_time">Hora</Label>
                    <Input id="scheduled_time" name="scheduled_time" type="time" defaultValue={selected.scheduled_time ?? ''} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="guide_number">N° Guía Digital</Label>
                  <Input id="guide_number" name="guide_number" placeholder="Número de guía" defaultValue={selected.guide_number ?? ''} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo de entrega</Label>
                  <div className="flex gap-3">
                    {[{ value: 'total', label: 'Total' }, { value: 'parcial', label: 'Parcial' }].map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="delivery_type" value={opt.value} defaultChecked={selected.delivery_type === opt.value || opt.value === 'total'} />
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="assigned_to">Asignar operativo</Label>
                  <Select name="assigned_to" defaultValue={selected.assigned_to ?? ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar operativo…" />
                    </SelectTrigger>
                    <SelectContent>
                      {operativos.map((op) => (
                        <SelectItem key={op.id} value={op.id}>{op.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vehicle_plate">Vehículo / Placa</Label>
                  <Input id="vehicle_plate" name="vehicle_plate" placeholder="ABC-123" defaultValue={selected.vehicle_plate ?? ''} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea id="notes" name="notes" placeholder="Instrucciones adicionales…" defaultValue={selected.notes ?? ''} />
                </div>
                <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700" disabled={loading}>
                  {loading ? 'Guardando…' : 'Confirmar Programación'}
                </Button>
              </form>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
