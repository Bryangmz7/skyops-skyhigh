import { createClient } from '@/lib/server/supabase'
import { getCurrentUser } from '@/lib/server/actions/auth'
import { ClientOrdersClient } from './client-orders-client'

export default async function OrdenesClientePage() {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()])

  const { data: orders } = await supabase
    .from('client_orders')
    .select('*, creator:users(full_name)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Órdenes de Cliente</h1>
        <p className="text-gray-500 text-sm mt-1">OC y cotizaciones recibidas de clientes</p>
      </div>
      <ClientOrdersClient orders={orders ?? []} userRole={user?.role ?? 'ventas'} />
    </div>
  )
}
