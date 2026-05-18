'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/client/supabase'
import { useUser } from './use-user'

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0)
  const { user } = useUser()
  // useRef evita re-crear el cliente Supabase en cada render
  const supabase = useRef(createClient()).current

  useEffect(() => {
    if (!user?.id) return

    let isMounted = true

    const loadCount = () => {
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .then(({ count }) => {
          if (isMounted) setUnreadCount(count ?? 0)
        })
    }

    loadCount()

    // Nombre único por montaje → evita el error de Strict Mode (efecto doble)
    const channelName = `notif-badge-${user.id}-${Date.now()}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => { if (isMounted) loadCount() }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  return { unreadCount }
}
