'use client'

import { useUser } from './use-user'
import type { UserRole } from '@/types/database'

type Action =
  | 'crear_pedido_proveedor'
  | 'crear_oc_cliente'
  | 'editar_pedido_propio'
  | 'editar_pedido_ajeno'
  | 'ver_todos_pedidos'
  | 'programar_entrega'
  | 'registrar_guia'
  | 'asignar_operativo'
  | 'marcar_progreso'
  | 'subir_foto_guia'
  | 'marcar_facturado'
  | 'eliminar_registros'
  | 'crear_usuarios'
  | 'ver_audit_log'
  | 'exportar_excel'
  | 'configurar_notificaciones'

const PERMISSIONS: Record<Action, UserRole[]> = {
  crear_pedido_proveedor: ['gerente', 'asistente', 'ventas'],
  crear_oc_cliente: ['gerente', 'asistente', 'ventas'],
  editar_pedido_propio: ['gerente', 'asistente', 'ventas'],
  editar_pedido_ajeno: ['gerente', 'asistente'],
  ver_todos_pedidos: ['gerente', 'asistente', 'jefe_almacen'],
  programar_entrega: ['gerente', 'asistente', 'jefe_almacen'],
  registrar_guia: ['gerente', 'asistente', 'jefe_almacen'],
  asignar_operativo: ['gerente', 'asistente', 'jefe_almacen'],
  marcar_progreso: ['gerente', 'asistente', 'jefe_almacen', 'operativo'],
  subir_foto_guia: ['gerente', 'asistente', 'jefe_almacen', 'operativo'],
  marcar_facturado: ['gerente', 'asistente', 'facturacion'],
  eliminar_registros: ['gerente'],
  crear_usuarios: ['gerente', 'asistente'],
  ver_audit_log: ['gerente', 'asistente'],
  exportar_excel: ['gerente', 'asistente', 'jefe_almacen'],
  configurar_notificaciones: ['gerente', 'asistente'],
}

export function usePermission(action: Action): boolean {
  const { role } = useUser()
  if (!role) return false
  return PERMISSIONS[action]?.includes(role) ?? false
}
