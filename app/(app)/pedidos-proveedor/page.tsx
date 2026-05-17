import { createClient } from '@/lib/server/supabase'
import { getCurrentUser } from '@/lib/server/actions/auth'
import { SupplierOrdersClient } from './supplier-orders-client'

export default async function PedidosProveedorPage() {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()])

  const { data: orders } = await supabase
    .from('supplier_orders')
    .select('*, creator:users(full_name)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos a Proveedor</h1>
          <p className="text-gray-500 text-sm mt-1">Gestión de compras a proveedores</p>
        </div>
      </div>
      <SupplierOrdersClient orders={orders ?? []} userRole={user?.role ?? 'ventas'} />
    </div>
  )
}
