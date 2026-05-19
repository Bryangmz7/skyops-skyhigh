export const revalidate = 60

import { getCurrentUser } from '@/lib/server/actions/auth'
import { createClient } from '@/lib/server/supabase'
import { formatDate } from '@/lib/utils'
import { Package, Truck, CheckCircle2, Clock, ArrowRight, Zap } from 'lucide-react'
import Link from 'next/link'

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
  const h = now.getHours()
  const greeting = h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches'
  const firstName = user?.full_name?.split(' ')[0] ?? ''

  const kpis = [
    {
      label: 'Pedidos hoy',
      value: pedidosHoy ?? 0,
      icon: Package,
      iconBg: 'bg-sky-100',
      iconColor: 'text-sky-600',
      trend: null,
    },
    {
      label: 'Entregas pendientes',
      value: entregasPendientes ?? 0,
      icon: Truck,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      trend: null,
    },
    {
      label: 'Entregadas hoy',
      value: entregadasHoy ?? 0,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      trend: null,
    },
    {
      label: 'Tiempo prom. entrega',
      value: avgMinutes !== null ? `${avgMinutes}m` : '—',
      icon: Clock,
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
      sub: avgMinutes !== null ? 'promedio hoy' : 'sin entregas',
    },
  ]

  const quickLinks = [
    {
      label: 'Nuevo pedido',
      desc: 'Registrar pedido a proveedor',
      href: '/pedidos-proveedor',
      icon: Package,
      color: 'text-sky-600',
      bg: 'bg-sky-50 hover:bg-sky-100',
    },
    {
      label: 'Nueva OC',
      desc: 'Orden de compra cliente',
      href: '/ordenes-cliente',
      icon: Truck,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 hover:bg-emerald-100',
    },
    {
      label: 'Programación',
      desc: 'Asignar entregas del día',
      href: '/almacen/programacion',
      icon: Zap,
      color: 'text-amber-600',
      bg: 'bg-amber-50 hover:bg-amber-100',
    },
  ]

  return (
    <div className="space-y-7">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-slate-400 mt-1 text-sm">{formatDate(new Date())}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2 leading-none">{kpi.value}</p>
                  {kpi.sub && (
                    <p className="text-xs text-slate-400 mt-1.5">{kpi.sub}</p>
                  )}
                </div>
                <div className={`w-11 h-11 rounded-xl ${kpi.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={22} className={kpi.iconColor} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick links + System status */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Quick actions — spans 3 cols */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Accesos rápidos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quickLinks.map((ql) => {
              const Icon = ql.icon
              return (
                <Link
                  key={ql.href}
                  href={ql.href}
                  className={`group flex flex-col gap-2 p-4 rounded-xl ${ql.bg} transition-colors`}
                >
                  <div className={`w-9 h-9 rounded-lg bg-white/70 flex items-center justify-center shadow-sm`}>
                    <Icon size={20} className={ql.color} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{ql.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{ql.desc}</p>
                  </div>
                  <ArrowRight size={14} className={`${ql.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                </Link>
              )
            })}
          </div>
        </div>

        {/* System status — spans 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Estado del sistema</h2>
          <div className="space-y-3">
            {[
              { label: 'Base de datos', status: 'Conectado', ok: true },
              { label: 'Notificaciones push', status: 'Activas', ok: true },
              { label: 'Modo offline', status: 'Disponible', ok: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1">
                <span className="text-sm text-slate-600">{item.label}</span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${item.ok ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {item.ok && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
