'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Truck, Bell, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/use-user'
import { useNotifications } from '@/hooks/use-notifications'

export function BottomNav() {
  const pathname = usePathname()
  const { role } = useUser()
  const { unreadCount } = useNotifications()

  const items = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Entregas',
      href: '/almacen/mis-entregas',
      icon: Truck,
      roles: ['operativo', 'jefe_almacen', 'gerente', 'asistente'],
    },
    {
      label: 'Notif.',
      href: '/notificaciones',
      icon: Bell,
      badge: unreadCount,
    },
  ]

  const visibleItems = items.filter((item) => {
    if (!item.roles) return true
    if (!role) return false
    return item.roles.includes(role)
  })

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-16">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors relative',
                active ? 'text-[#0066cc]' : 'text-gray-400'
              )}
            >
              <div className="relative">
                <Icon size={22} />
                {item.badge != null && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
