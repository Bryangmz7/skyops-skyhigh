export const revalidate = 60 // Revalidar KPIs cada 60 segundos

import { getCurrentUser } from '@/lib/server/actions/auth'
import { createClient } from '@/lib/server/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { Package, Truck, CheckCircle, Clock } from 'lucide-react'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  const [
    { count: pedidosHoy },
    { count: entregasPendientes },
    { count: entregadasHoy },
    { data: tiemposHoy },
  ] = await Promise.all([
    supabase
      .from('client_orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00`),
    supabase
      .from('deliveries')
      .select('*', { count: 'exact', head: true })
      .neq('current_status', 'entregado'),
    supabase
      .from('delivery_timeline')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'finalizado')
      .gte('event_time', `${today}T00:00:00`),
    // Calcular tiempo promedio: inicio → finalizado de hoy
    supabase
      .from('delivery_timeline')
      .select('delivery_id, event_type, event_time')
      .in('event_type', ['inicio', 'finalizado'])
      .gte('event_time', `${today}T00:00:00`),
  ])

  // Calcular tiempo promedio en minutos
  let avgMinutes: number | null = null
  if (tiemposHoy && tiemposHoy.length > 0) {
    const byDelivery: Record<string, { inicio?: string; finalizado?: string }> = {}
    for (const ev of tiemposHoy) {
      if (!byDelivery[ev.delivery_id]) byDelivery[ev.delivery_id] = {}
      if (ev.event_type === 'inicio') byDelivery[ev.delivery_id].inicio = ev.event_time
      if (ev.event_type === 'finalizado') byDelivery[ev.delivery_id].finalizado = ev.event_time
    }
    const diffs = Object.values(byDelivery)
      .filter((d) => d.inicio && d.finalizado)
      .map((d) => (new Date(d.finalizado!).getTime() - new Date(d.inicio!).getTime()) / 60000)
    if (diffs.length > 0) avgMinutes = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length)
  }

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Buenos días' : now.getHours() < 18 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}, {user?.full_name?.split(' ')[0]}
        </h1>
        <p className="text-gray-500 mt-1">{formatDate(new Date())}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pedidos hoy</CardTitle>
            <Package size={18} className="text-[#0066cc]" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pedidosHoy ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Entregas pendientes</CardTitle>
            <Truck size={18} className="text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{entregasPendientes ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Entregadas hoy</CardTitle>
            <CheckCircle size={18} className="text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{entregadasHoy ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tiempo prom. entrega</CardTitle>
            <Clock size={18} className="text-purple-500" />
          </CardHeader>
          <CardContent>
            {avgMinutes !== null ? (
              <>
                <p className="text-3xl font-bold">{avgMinutes}m</p>
                <p className="text-xs text-gray-400">Promedio de hoy</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold">—</p>
                <p className="text-xs text-gray-400">Sin entregas hoy</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Accesos rápidos</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <a href="/pedidos-proveedor" className="p-4 rounded-lg border hover:bg-gray-50 transition-colors text-center">
              <Package size={24} className="mx-auto mb-2 text-[#0066cc]" />
              <p className="text-sm font-medium">Nuevo Pedido</p>
            </a>
            <a href="/ordenes-cliente" className="p-4 rounded-lg border hover:bg-gray-50 transition-colors text-center">
              <Truck size={24} className="mx-auto mb-2 text-green-600" />
              <p className="text-sm font-medium">Nueva OC</p>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estado del sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Base de datos</span>
              <span className="text-green-600 font-medium">✓ Conectado</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Notificaciones push</span>
              <span className="text-gray-400">Pendiente configurar</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Modo offline</span>
              <span className="text-green-600 font-medium">✓ Disponible</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
