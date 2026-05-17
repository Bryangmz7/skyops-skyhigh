import { createClient } from '@/lib/server/supabase'
import { getCurrentUser } from '@/lib/server/actions/auth'
import { redirect } from 'next/navigation'
import { AuditoriaClient } from './auditoria-client'

export default async function AuditoriaPage() {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()])
  if (!user || !['gerente', 'asistente'].includes(user.role)) redirect('/dashboard')

  const { data: logs } = await supabase
    .from('audit_log')
    .select('*, user:users(full_name)')
    .order('created_at', { ascending: false })
    .limit(500)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Registro de Auditoría</h1>
      <AuditoriaClient logs={logs ?? []} />
    </div>
  )
}
