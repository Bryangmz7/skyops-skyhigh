'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/client/supabase'
import { useUser } from './use-user'

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0)
  const { user } = useUser()
  const supabase = createClient()

  useEffect(() => {
    if (!user?.id) return

    // Carga inicial
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .then(({ count }) => setUnreadCount(count ?? 0))

    // Suscripción realtime
    const channel = supabase
      .channel(`notif-badge-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Reconteo al haber cualquier cambio
          supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false)
            .then(({ count }) => setUnreadCount(count ?? 0))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id])

  return { unreadCount }
}
