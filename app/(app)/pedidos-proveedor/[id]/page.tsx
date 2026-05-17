import { createClient } from '@/lib/server/supabase'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  nuevo: 'Nuevo', en_proceso: 'En proceso', listo_almacen: 'Listo',
  en_ruta: 'En ruta', entregado: 'Entregado', facturado: 'Facturado', cancelado: 'Cancelado',
}
const STOCK_LABELS: Record<string, string> = {
  disponible: 'Disponible', no_hay: 'No hay', parcial: 'Parcial',
}

export default async function SupplierOrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('supplier_orders')
    .select('*, creator:users(full_name, email)')
    .eq('id', params.id)
    .single()

  if (!order) notFound()

  const { data: logs } = await supabase
    .from('audit_log')
    .select('*, user:users(full_name)')
    .eq('table_name', 'supplier_orders')
    .eq('record_id', params.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/pedidos-proveedor" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{order.internal_number}</h1>
          <p className="text-gray-500 text-sm">Pedido a proveedor</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Datos del pedido</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Row label="N° Pedido" value={order.order_number} />
            <Row label="Proveedor" value={order.supplier_name} />
            <Row label="Cliente Ref." value={order.client_reference ?? '—'} />
            <Row label="Proyecto" value={order.project_reference ?? '—'} />
            <Row label="Stock" value={STOCK_LABELS[order.stock_status]} />
            <Row label="Estado" value={
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {STATUS_LABELS[order.status]}
              </span>
            } />
            <Row label="Creado por" value={(order.creator as any)?.full_name ?? '—'} />
            <Row label="Fecha" value={formatDateTime(order.created_at)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Observaciones y archivo</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">{order.notes ?? 'Sin observaciones'}</p>
            {order.file_url && (
              <a
                href={order.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#0066cc] hover:underline text-sm"
              >
                <FileText size={16} /> Ver documento adjunto
              </a>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Historial de cambios</CardTitle></CardHeader>
        <CardContent>
          {logs && logs.length > 0 ? (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-sm border-l-2 border-gray-200 pl-3">
                  <div>
                    <p className="text-gray-800">
                      <span className="font-medium">{(log.user as any)?.full_name ?? 'Sistema'}</span>
                      {' — '}{log.action}
                    </p>
                    <p className="text-gray-400 text-xs">{formatDateTime(log.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Sin cambios registrados</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4 text-sm">
      <span className="text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-gray-900 font-medium text-right">{value}</span>
    </div>
  )
}
