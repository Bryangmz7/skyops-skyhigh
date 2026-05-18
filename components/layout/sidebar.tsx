'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Package, ShoppingCart, Truck, Bell,
  Users, ClipboardList, Settings, ChevronLeft, ChevronRight,
  MapPin, Menu
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/use-user'
import type { UserRole } from '@/types/database'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  roles?: UserRole[]
  children?: { label: string; href: string; roles?: UserRole[] }[]
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: 'Pedidos Proveedor',
    href: '/pedidos-proveedor',
    icon: <Package size={18} />,
    roles: ['gerente', 'asistente', 'ventas', 'jefe_almacen'],
  },
  {
    label: 'OC Clientes',
    href: '/ordenes-cliente',
    icon: <ShoppingCart size={18} />,
    roles: ['gerente', 'asistente', 'ventas', 'jefe_almacen', 'facturacion'],
  },
  {
    label: 'Almacén',
    href: '/almacen',
    icon: <Truck size={18} />,
    children: [
      {
        label: 'Programación',
        href: '/almacen/programacion',
        roles: ['gerente', 'asistente', 'jefe_almacen'],
      },
      {
        label: 'Mis Entregas',
        href: '/almacen/mis-entregas',
        roles: ['operativo', 'jefe_almacen', 'gerente', 'asistente'],
      },
    ],
  },
  {
    label: 'Notificaciones',
    href: '/notificaciones',
    icon: <Bell size={18} />,
  },
  {
    label: 'Admin',
    href: '/admin',
    icon: <Settings size={18} />,
    roles: ['gerente', 'asistente'],
    children: [
      { label: 'Usuarios', href: '/admin/usuarios', roles: ['gerente', 'asistente'] },
      { label: 'Auditoría', href: '/admin/auditoria', roles: ['gerente', 'asistente'] },
      { label: 'Configuración', href: '/admin/configuracion', roles: ['gerente'] },
    ],
  },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [openSections, setOpenSections] = useState<string[]>([])
  const pathname = usePathname()
  const { role } = useUser()

  function toggleSection(href: string) {
    setOpenSections(prev =>
      prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
    )
  }

  function canShow(item: { roles?: UserRole[] }) {
    if (!item.roles) return true
    if (!role) return false
    return item.roles.includes(role)
  }

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen bg-[#0066cc] text-white transition-all duration-300 flex-shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-blue-500">
        {!collapsed && (
          <span className="font-bold text-lg tracking-tight">SkyOps</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-blue-500 transition-colors ml-auto"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          if (!canShow(item)) return null

          if (item.children) {
            const isOpen = openSections.includes(item.href)
            const hasVisibleChildren = item.children.some(canShow)
            if (!hasVisibleChildren) return null

            return (
              <div key={item.href}>
                <button
                  onClick={() => toggleSection(item.href)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-blue-500 transition-colors',
                    collapsed ? 'justify-center' : 'justify-between'
                  )}
                >
                  <span className="flex items-center gap-3">
                    {item.icon}
                    {!collapsed && item.label}
                  </span>
                  {!collapsed && (
                    <ChevronRight
                      size={14}
                      className={cn('transition-transform', isOpen && 'rotate-90')}
                    />
                  )}
                </button>
                {isOpen && !collapsed && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => {
                      if (!canShow(child)) return null
                      const active = pathname.startsWith(child.href)
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            'block px-3 py-2 rounded-lg text-sm hover:bg-blue-500 transition-colors',
                            active && 'bg-blue-700'
                          )}
                        >
                          {child.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-blue-500 transition-colors',
                active && 'bg-blue-700',
                collapsed && 'justify-center'
              )}
            >
              {item.icon}
              {!collapsed && item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-blue-500 text-xs text-blue-200">
          Sky High SAC · v1.0
        </div>
      )}
    </aside>
  )
}
