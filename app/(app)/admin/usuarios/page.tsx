import { createClient } from '@/lib/server/supabase'
import { getCurrentUser } from '@/lib/server/actions/auth'
import { redirect } from 'next/navigation'
import { UsuariosClient } from './usuarios-client'

export default async function UsuariosAdminPage() {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()])
  if (!user || !['gerente', 'asistente'].includes(user.role)) redirect('/dashboard')

  const [{ data: users }, { data: departments }] = await Promise.all([
    supabase.from('users').select('*, department:departments(name)').order('full_name'),
    supabase.from('departments').select('*').order('name'),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
      <UsuariosClient users={users ?? []} departments={departments ?? []} />
    </div>
  )
}
