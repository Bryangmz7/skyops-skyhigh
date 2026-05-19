'use client'

import { Bell, LogOut, Wifi, WifiOff } from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { useOffline } from '@/hooks/use-offline'
import { useNotifications } from '@/hooks/use-notifications'
import { signOut } from '@/lib/server/actions/auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const ROLE_LABELS: Record<string, string> = {
  gerente: 'Gerente',
  asistente: 'Asistente',
  ventas: 'Ventas',
  jefe_almacen: 'Jefe de Almacén',
  operativo: 'Operativo',
  facturacion: 'Facturación',
}

const ROLE_COLORS: Record<string, string> = {
  gerente: 'from-violet-500 to-purple-600',
  asistente: 'from-sky-500 to-blue-600',
  ventas: 'from-emerald-500 to-green-600',
  jefe_almacen: 'from-amber-500 to-orange-600',
  operativo: 'from-cyan-500 to-sky-600',
  facturacion: 'from-pink-500 to-rose-600',
}

export function Header() {
  const { user, role } = useUser()
  const { isOnline, pendingCount } = useOffline()
  const { unreadCount } = useNotifications()

  const initials = user?.full_name
    ?.split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() ?? '?'

  const gradientClass = role ? (ROLE_COLORS[role] ?? 'from-sky-500 to-blue-600') : 'from-sky-500 to-blue-600'

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-5 flex-shrink-0">
      {/* Left — connectivity status */}
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <span className="inline-flex items-center gap-1.5 text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2.5 py-1 rounded-full font-medium">
            <WifiOff size={12} />
            Offline {pendingCount > 0 ? `· ${pendingCount} en cola` : ''}
          </span>
        ) : pendingCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-xs bg-sky-50 text-sky-600 border border-sky-200 px-2.5 py-1 rounded-full font-medium">
            <Wifi size={12} />
            Sincronizando {pendingCount} acciones…
          </span>
        ) : null}
      </div>

      {/* Right — notifications + user */}
      <div className="flex items-center gap-1.5">
        {/* Notification bell */}
        <Link href="/notificaciones" className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </Link>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* User info */}
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 shadow-sm',
            gradientClass
          )}>
            {initials}
          </div>
          <div className="hidden sm:block leading-none">
            <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.full_name ?? '—'}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{role ? ROLE_LABELS[role] : ''}</p>
          </div>
        </div>

        {/* Sign out */}
        <form action={signOut}>
          <Button
            variant="ghost"
            size="icon"
            type="submit"
            title="Cerrar sesión"
            className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
          </Button>
        </form>
      </div>
    </header>
  )
}
