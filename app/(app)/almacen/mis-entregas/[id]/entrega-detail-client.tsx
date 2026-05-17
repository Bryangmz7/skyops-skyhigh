'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { recordDeliveryEvent, uploadSealedGuidePhoto } from '@/lib/server/actions/deliveries'
import { addPendingAction } from '@/lib/client/idb'
import { useOffline } from '@/hooks/use-offline'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils'
import type { Delivery, DeliveryTimeline } from '@/types/database'
import { ArrowLeft, Camera, MapPin, WifiOff, Wifi } from 'lucide-react'
import Link from 'next/link'

const EVENT_BUTTONS = [
  { event: 'inicio', label: 'INICIO PEDIDO', bg: 'bg-blue-500 hover:bg-blue-600', icon: '🔵' },
  { event: 'en_punto', label: 'LLEGUÉ AL PUNTO', bg: 'bg-yellow-500 hover:bg-yellow-600', icon: '🟡' },
  { event: 'esperando', label: 'ESPERANDO', bg: 'bg-orange-500 hover:bg-orange-600', icon: '🟠', needsReason: true },
  { event: 'finalizado', label: 'FINALIZADO', bg: 'bg-green-500 hover:bg-green-600', icon: '🟢' },
]

const EVENT_LABELS: Record<string, string> = {
  inicio: 'Inicio del pedido',
  en_punto: 'Llegó al punto',
  esperando: 'En espera',
  finalizado: 'Finalizado',
  incidencia: 'Incidencia',
}

interface Props {
  delivery: Delivery
  timeline: DeliveryTimeline[]
  userId: string
}

export function EntregaDetailClient({ delivery, timeline, userId }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [reasonModal, setReasonModal] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [receiverName, setReceiverName] = useState(delivery.receiver_name ?? '')
  const [receiverDni, setReceiverDni] = useState(delivery.receiver_dni ?? '')
  const { isOnline, pendingCount } = useOffline()
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const completedEvents = timeline.map((t) => t.event_type)
  const oc = delivery.client_order as any

  async function getGPS(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(null); return }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 5000 }
      )
    })
  }

  async function handleEvent(eventType: string, notes?: string) {
    setLoading(eventType)
    const gps = await getGPS()
    const payload = {
      delivery_id: delivery.id,
      event_type: eventType,
      notes: notes || null,
      gps_lat: gps?.lat,
      gps_lng: gps?.lng,
    }

    if (!isOnline) {
      await addPendingAction('record_delivery_event', payload)
      toast.info('Sin conexión — acción guardada para sincronizar', { icon: <WifiOff size={16} /> })
      setLoading(null)
      return
    }

    const result = await recordDeliveryEvent(delivery.id, eventType, {
      notes: notes || undefined,
      gps_lat: gps?.lat,
      gps_lng: gps?.lng,
    })

    setLoading(null)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Evento registrado')
      router.refresh()
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading('photo')
    const result = await uploadSealedGuidePhoto(delivery.id, file)
    setLoading(null)
    if (result.error) toast.error(result.error)
    else { toast.success('Foto subida correctamente'); router.refresh() }
  }

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/almacen/mis-entregas" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 font-mono">{oc?.internal_number}</p>
          <h1 className="font-bold text-gray-900 truncate">{oc?.client_name}</h1>
        </div>
        {isOnline ? (
          <span className="text-xs text-green-600 flex items-center gap-1"><Wifi size={12} /> Online</span>
        ) : (
          <span className="text-xs text-orange-600 flex items-center gap-1"><WifiOff size={12} /> Offline</span>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 rounded-xl p-4 space-y-1.5 text-sm">
        <p><span className="text-gray-500">Proyecto:</span> <span className="font-medium">{oc?.project_reference ?? '—'}</span></p>
        <p><span className="text-gray-500">N° OC:</span> <span className="font-medium">{oc?.order_number}</span></p>
        {delivery.guide_number && (
          <p><span className="text-gray-500">N° Guía:</span> <span className="font-medium">{delivery.guide_number}</span></p>
        )}
        {delivery.vehicle_plate && (
          <p><span className="text-gray-500">Vehículo:</span> <span className="font-medium">{delivery.vehicle_plate}</span></p>
        )}
      </div>

      {/* Botones de evento */}
      <div className="space-y-3">
        {EVENT_BUTTONS.map((btn) => {
          const done = completedEvents.includes(btn.event as any)
          return (
            <button
              key={btn.event}
              disabled={done || loading !== null}
              onClick={() => {
                if (btn.needsReason) { setReasonModal(btn.event); return }
                handleEvent(btn.event)
              }}
              className={`w-full h-20 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-3 transition-all
                ${done ? 'opacity-40 cursor-not-allowed bg-gray-300' : btn.bg}
                ${loading === btn.event ? 'animate-pulse' : ''}
              `}
            >
              <span className="text-2xl">{btn.icon}</span>
              {loading === btn.event ? 'REGISTRANDO…' : done ? `${btn.label} ✓` : btn.label}
            </button>
          )
        })}
      </div>

      {/* Datos del receptor */}
      <div className="bg-white rounded-xl border p-4 space-y-3">
        <p className="font-semibold text-sm text-gray-700">Datos del receptor</p>
        <div className="space-y-2">
          <div>
            <Label className="text-xs">Nombre</Label>
            <Input
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder="Nombre de quien recibe"
              className="h-9"
            />
          </div>
          <div>
            <Label className="text-xs">DNI</Label>
            <Input
              value={receiverDni}
              onChange={(e) => setReceiverDni(e.target.value)}
              placeholder="DNI del receptor"
              className="h-9"
            />
          </div>
        </div>
      </div>

      {/* Foto de guía sellada */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-sm text-gray-700">Foto de guía sellada</p>
          {delivery.sealed_guide_photo_url && (
            <a href={delivery.sealed_guide_photo_url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-[#0066cc]">Ver foto</a>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment"
          className="hidden" onChange={handlePhotoUpload} />
        <Button
          variant="outline"
          className="w-full h-14 border-dashed"
          onClick={() => fileRef.current?.click()}
          disabled={loading === 'photo'}
        >
          <Camera size={20} className="mr-2" />
          {loading === 'photo' ? 'Subiendo…' : delivery.sealed_guide_photo_url ? 'Reemplazar foto' : 'Tomar foto de guía'}
        </Button>
      </div>

      {/* Timeline */}
      {timeline.length > 0 && (
        <div className="bg-white rounded-xl border p-4">
          <p className="font-semibold text-sm text-gray-700 mb-3">Historial de eventos</p>
          <div className="space-y-3">
            {timeline.map((event, i) => (
              <div key={event.id} className="flex gap-3 text-sm">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0066cc] mt-0.5 flex-shrink-0" />
                  {i < timeline.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                </div>
                <div className="pb-3">
                  <p className="font-medium text-gray-800">{EVENT_LABELS[event.event_type]}</p>
                  <p className="text-gray-400 text-xs">{formatDateTime(event.event_time)}</p>
                  {event.notes && <p className="text-gray-500 text-xs mt-0.5 italic">"{event.notes}"</p>}
                  {event.gps_lat && (
                    <a
                      href={`https://maps.google.com/?q=${event.gps_lat},${event.gps_lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#0066cc] flex items-center gap-1 mt-0.5"
                    >
                      <MapPin size={10} /> Ver en mapa
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal motivo espera */}
      <Dialog open={!!reasonModal} onOpenChange={() => setReasonModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Motivo de espera</DialogTitle>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe el motivo de la espera…"
            rows={3}
          />
          <Button
            className="w-full bg-orange-500 hover:bg-orange-600 mt-2"
            onClick={() => {
              handleEvent(reasonModal!, reason)
              setReasonModal(null)
              setReason('')
            }}
          >
            Confirmar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
