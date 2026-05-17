import { createClient } from '@/lib/server/supabase'
import { getCurrentUser } from '@/lib/server/actions/auth'
import { MisEntregasClient } from './mis-entregas-client'

export default async function MisEntregasPage() {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()])

  const { data: deliveries } = await supabase
    .from('deliveries')
    .select('*, client_order:client_orders(internal_number, client_name, project_reference)')
    .neq('current_status', 'entregado')
    .order('scheduled_date', { ascending: true })

  return (
    <MisEntregasClient
      allDeliveries={deliveries ?? []}
      userId={user?.id ?? ''}
    />
  )
}
