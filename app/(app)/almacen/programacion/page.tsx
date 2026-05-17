import { createClient } from '@/lib/server/supabase'
import { getCurrentUser } from '@/lib/server/actions/auth'
import { ProgramacionClient } from './programacion-client'

export default async function ProgramacionPage() {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()])

  const [{ data: deliveries }, { data: operativos }] = await Promise.all([
    supabase
      .from('deliveries')
      .select('*, client_order:client_orders(internal_number, client_name, project_reference), assigned_user:users!assigned_to(full_name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('users')
      .select('id, full_name')
      .eq('role', 'operativo')
      .eq('is_active', true),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Programación de Entregas</h1>
        <p className="text-gray-500 text-sm mt-1">Coordina y asigna las entregas al equipo</p>
      </div>
      <ProgramacionClient
        deliveries={deliveries ?? []}
        operativos={operativos ?? []}
        userRole={user?.role ?? 'jefe_almacen'}
      />
    </div>
  )
}
