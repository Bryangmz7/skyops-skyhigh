import { createClient } from '@/lib/server/supabase'
import { getCurrentUser } from '@/lib/server/actions/auth'
import { notFound } from 'next/navigation'
import { EntregaDetailClient } from './entrega-detail-client'

export default async function EntregaDetailPage({ params }: { params: { id: string } }) {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()])

  const [{ data: delivery }, { data: timeline }] = await Promise.all([
    supabase
      .from('deliveries')
      .select('*, client_order:client_orders(internal_number, client_name, project_reference, order_number)')
      .eq('id', params.id)
      .single(),
    supabase
      .from('delivery_timeline')
      .select('*, user:users(full_name)')
      .eq('delivery_id', params.id)
      .order('event_time', { ascending: true }),
  ])

  if (!delivery) notFound()

  return (
    <EntregaDetailClient
      delivery={delivery}
      timeline={timeline ?? []}
      userId={user?.id ?? ''}
    />
  )
}
