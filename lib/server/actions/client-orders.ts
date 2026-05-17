'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/server/supabase'
import { getCurrentUser } from './auth'

export async function createClientOrder(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !['gerente', 'asistente', 'ventas'].includes(user.role)) {
    return { error: 'Sin permisos' }
  }

  const supabase = await createClient()

  let file_url: string | null = null
  const file = formData.get('file') as File | null
  if (file && file.size > 0) {
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { data, error } = await supabase.storage
      .from('client-orders')
      .upload(path, file)
    if (error) return { error: 'Error subiendo archivo' }
    const { data: { publicUrl } } = supabase.storage
      .from('client-orders')
      .getPublicUrl(data.path)
    file_url = publicUrl
  }

  const { data: order, error } = await supabase
    .from('client_orders')
    .insert({
      internal_number: 'TEMP',
      order_number: formData.get('order_number') as string,
      client_name: formData.get('client_name') as string,
      project_reference: (formData.get('project_reference') as string) || null,
      doc_type: formData.get('doc_type') as string,
      notes: (formData.get('notes') as string) || null,
      file_url,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/ordenes-cliente')
  return { success: true, id: order?.id }
}

export async function updateClientOrderStatus(id: number, status: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Sin sesión' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('client_orders')
    .update({ status })
    .eq('id', id)

  if (error) return { error: error.message }

  // Al pasar a en_proceso, crear registro de entrega automáticamente
  if (status === 'en_proceso') {
    await supabase.from('deliveries').insert({
      client_order_id: id,
      current_status: 'pendiente_programacion',
      delivery_type: 'total',
    })

    // Notificar a jefes de almacén
    const { data: jefes } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'jefe_almacen')
      .eq('is_active', true)

    if (jefes?.length) {
      const { data: oc } = await supabase
        .from('client_orders')
        .select('internal_number, client_name')
        .eq('id', id)
        .single()

      await supabase.from('notifications').insert(
        jefes.map((j) => ({
          user_id: j.id,
          title: 'Nueva OC lista para almacén',
          body: `${oc?.internal_number} - ${oc?.client_name}`,
          link: `/ordenes-cliente/${id}`,
        }))
      )
    }
  }

  revalidatePath('/ordenes-cliente')
  return { success: true }
}

export async function deleteClientOrder(id: number) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'gerente') return { error: 'Sin permisos' }

  const supabase = await createClient()
  const { error } = await supabase.from('client_orders').delete().eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/ordenes-cliente')
  return { success: true }
}
