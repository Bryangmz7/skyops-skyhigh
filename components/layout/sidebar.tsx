'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Package, ShoppingCart, Truck, Bell,
  Users, Settings, ChevronLeft, ChevronRight,
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
        'hidden md:flex flex-col h-screen bg-slate-900 text-white transition-all duration-300 flex-shrink-0 select-none',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo / Brand */}
      <div className={cn(
        'flex items-center h-16 border-b border-slate-800 flex-shrink-0',
        collapsed ? 'justify-center px-4' : 'px-4 gap-3'
      )}>
        <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-sky-900/30">
          <span className="text-white font-extrabold text-xs tracking-tighter">SK</span>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm tracking-tight leading-none">SkyOps</p>
            <p className="text-slate-400 text-[10px] mt-0.5 truncate">Sky High SAC</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'p-1.5 rounded-md hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200',
            collapsed && 'mt-0'
          )}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-700">
        {NAV_ITEMS.map((item) => {
          if (!canShow(item)) return null

          if (item.children) {
            const isOpen = openSections.includes(item.href)
            const hasVisibleChildren = item.children.some(canShow)
            if (!hasVisibleChildren) return null
            const anyChildActive = item.children.some(c => pathname.startsWith(c.href))

            return (
              <div key={item.href}>
                <button
                  onClick={() => toggleSection(item.href)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                    anyChildActive
                      ? 'text-sky-400 bg-slate-800'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800',
                    collapsed ? 'justify-center' : ''
                  )}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left font-medium">{item.label}</span>
                      <ChevronRight
                        size={13}
                        className={cn('text-slate-500 transition-transform duration-200', isOpen && 'rotate-90')}
                      />
                    </>
                  )}
                </button>
                {isOpen && !collapsed && (
                  <div className="mt-0.5 ml-3 pl-3 border-l border-slate-700/60 space-y-0.5">
                    {item.children.map((child) => {
                      if (!canShow(child)) return null
                      const active = pathname.startsWith(child.href)
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            'flex items-center px-2.5 py-1.5 rounded-md text-sm transition-colors',
                            active
                              ? 'text-white bg-sky-600 font-medium'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
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

          const active = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-sky-600 text-white font-medium shadow-sm shadow-sky-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800',
                collapsed && 'justify-center'
              )}
              title={collapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={cn(
        'border-t border-slate-800 flex-shrink-0',
        collapsed ? 'py-3 flex justify-center' : 'px-4 py-3'
      )}>
        {collapsed ? (
          <div className="w-6 h-6 rounded-md bg-slate-700 flex items-center justify-center">
            <span className="text-slate-400 text-[9px] font-bold">v1</span>
          </div>
        ) : (
          <p className="text-[11px] text-slate-500">Sky High SAC · v1.0</p>
        )}
      </div>
    </aside>
  )
}
