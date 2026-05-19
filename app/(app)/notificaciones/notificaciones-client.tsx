'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/client/supabase'
import { formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Notification } from '@/types/database'
import { Bell, CheckCheck, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Props {
  notifications: Notification[]
  userId: string
}

export function NotificacionesClient({ notifications, userId }: Props) {
  const [items, setItems] = useState(notifications)
  const router = useRouter()
  const supabase = createClient()

  const unreadCount = items.filter((n) => !n.is_read).length

  async function markRead(id: number) {
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  }

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
    toast.success('Todas marcadas como leídas')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo leído'}
        </p>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck size={14} className="mr-2" /> Marcar todas como leídas
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Bell size={40} className="mx-auto mb-3 opacity-30" />
          <p>Sin notificaciones</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((notif) => (
            <div
              key={notif.id}
              className={`rounded-xl border p-4 transition-colors ${!notif.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}
              onClick={() => !notif.is_read && markRead(notif.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className={`text-sm font-medium ${!notif.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                    {notif.title}
                  </p>
                  {notif.body && <p className="text-xs text-gray-500 mt-0.5">{notif.body}</p>}
                  <p className="text-xs text-gray-400 mt-1">{formatDateTime(notif.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!notif.is_read && (
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-600 flex-shrink-0" />
                  )}
                  {notif.link && (
                    <Link href={notif.link} className="text-sky-600 hover:text-sky-700">
                      <ExternalLink size={14} />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
