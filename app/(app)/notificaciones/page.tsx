import { createClient } from '@/lib/server/supabase'
import { getCurrentUser } from '@/lib/server/actions/auth'
import { NotificacionesClient } from './notificaciones-client'

export default async function NotificacionesPage() {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()])
  if (!user) return null

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
      <NotificacionesClient notifications={notifications ?? []} userId={user.id} />
    </div>
  )
}
