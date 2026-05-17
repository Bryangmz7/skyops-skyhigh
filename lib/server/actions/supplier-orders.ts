'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/server/supabase'
import { getCurrentUser } from './auth'

export async function createSupplierOrder(formData: FormData) {
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
      .from('supplier-orders')
      .upload(path, file)
    if (error) return { error: 'Error subiendo archivo' }
    const { data: { publicUrl } } = supabase.storage
      .from('supplier-orders')
      .getPublicUrl(data.path)
    file_url = publicUrl
  }

  const { error } = await supabase.from('supplier_orders').insert({
    internal_number: 'TEMP',
    order_number: formData.get('order_number') as string,
    supplier_name: formData.get('supplier_name') as string,
    client_reference: (formData.get('client_reference') as string) || null,
    project_reference: (formData.get('project_reference') as string) || null,
    stock_status: formData.get('stock_status') as string,
    notes: (formData.get('notes') as string) || null,
    file_url,
    created_by: user.id,
  })

  if (error) return { error: error.message }

  revalidatePath('/pedidos-proveedor')
  return { success: true }
}

export async function updateSupplierOrderStatus(id: number, status: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Sin sesión' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('supplier_orders')
    .update({ status })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/pedidos-proveedor')
  return { success: true }
}

export async function deleteSupplierOrder(id: number) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'gerente') return { error: 'Sin permisos' }

  const supabase = await createClient()
  const { error } = await supabase.from('supplier_orders').delete().eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/pedidos-proveedor')
  return { success: true }
}
