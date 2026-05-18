'use client'

import { Bell, LogOut, User } from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { useOffline } from '@/hooks/use-offline'
import { useNotifications } from '@/hooks/use-notifications'
import { signOut } from '@/lib/server/actions/auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const ROLE_LABELS: Record<string, string> = {
  gerente: 'Gerente',
  asistente: 'Asistente',
  ventas: 'Ventas',
  jefe_almacen: 'Jefe de Almacén',
  operativo: 'Operativo',
  facturacion: 'Facturación',
}

export function Header() {
  const { user, role } = useUser()
  const { isOnline, pendingCount } = useOffline()
  const { unreadCount } = useNotifications()

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        {!isOnline && (
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
            Offline {pendingCount > 0 ? `· ${pendingCount} pendientes` : ''}
          </span>
        )}
        {isOnline && pendingCount > 0 && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
            Sincronizando {pendingCount} acciones…
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Link href="/notificaciones" className="relative">
          <Button variant="ghost" size="icon">
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </Link>

        <div className="flex items-center gap-2 text-sm">
          <div className="w-8 h-8 rounded-full bg-[#0066cc] flex items-center justify-center text-white font-medium text-xs">
            {user?.full_name?.[0]?.toUpperCase() ?? <User size={14} />}
          </div>
          <div className="hidden sm:block">
            <p className="font-medium text-gray-900 leading-none">{user?.full_name}</p>
            <p className="text-gray-500 text-xs mt-0.5">{role ? ROLE_LABELS[role] : ''}</p>
          </div>
        </div>

        <form action={signOut}>
          <Button variant="ghost" size="icon" type="submit" title="Cerrar sesión">
            <LogOut size={18} />
          </Button>
        </form>
      </div>
    </header>
  )
}
