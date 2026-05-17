'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/server/supabase'
import { getCurrentUser } from './auth'

export async function scheduleDelivery(deliveryId: number, formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !['gerente', 'asistente', 'jefe_almacen'].includes(user.role)) {
    return { error: 'Sin permisos' }
  }

  const supabase = await createClient()
  const assignedTo = formData.get('assigned_to') as string | null

  const { error } = await supabase
    .from('deliveries')
    .update({
      guide_number: (formData.get('guide_number') as string) || null,
      delivery_type: formData.get('delivery_type') as string,
      scheduled_date: (formData.get('scheduled_date') as string) || null,
      scheduled_time: (formData.get('scheduled_time') as string) || null,
      assigned_to: assignedTo || null,
      scheduled_by: user.id,
      vehicle_plate: (formData.get('vehicle_plate') as string) || null,
      notes: (formData.get('notes') as string) || null,
      current_status: 'programado',
    })
    .eq('id', deliveryId)

  if (error) return { error: error.message }

  // Notificar al operativo asignado
  if (assignedTo) {
    const { data: delivery } = await supabase
      .from('deliveries')
      .select('client_order:client_orders(internal_number, client_name)')
      .eq('id', deliveryId)
      .single()

    const oc = (delivery?.client_order as any)
    await supabase.from('notifications').insert({
      user_id: assignedTo,
      title: 'Nueva entrega asignada',
      body: `${oc?.internal_number} - ${oc?.client_name}`,
      link: `/almacen/mis-entregas/${deliveryId}`,
    })
  }

  revalidatePath('/almacen/programacion')
  return { success: true }
}

export async function recordDeliveryEvent(
  deliveryId: number,
  eventType: string,
  data: { notes?: string; gps_lat?: number; gps_lng?: number }
) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Sin sesión' }

  const supabase = await createClient()

  const { error: timelineError } = await supabase
    .from('delivery_timeline')
    .insert({
      delivery_id: deliveryId,
      event_type: eventType,
      user_id: user.id,
      notes: data.notes || null,
      gps_lat: data.gps_lat || null,
      gps_lng: data.gps_lng || null,
    })

  if (timelineError) return { error: timelineError.message }

  // Actualizar estado de la entrega
  const statusMap: Record<string, string> = {
    inicio: 'en_ruta',
    en_punto: 'en_ruta',
    esperando: 'en_ruta',
    finalizado: 'entregado',
    incidencia: 'incidencia',
  }

  const newStatus = statusMap[eventType]
  if (newStatus) {
    await supabase
      .from('deliveries')
      .update({ current_status: newStatus })
      .eq('id', deliveryId)
  }

  // Si finalizado, notificar al creador de la OC y a facturación
  if (eventType === 'finalizado') {
    const { data: delivery } = await supabase
      .from('deliveries')
      .select('client_order:client_orders(id, internal_number, client_name, created_by)')
      .eq('id', deliveryId)
      .single()

    const oc = delivery?.client_order as any
    if (oc) {
      const { data: facturacion } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'facturacion')
        .eq('is_active', true)

      const notifTargets = [
        { user_id: oc.created_by },
        ...(facturacion?.map((f: any) => ({ user_id: f.id })) ?? []),
      ]

      await supabase.from('notifications').insert(
        notifTargets.map((t) => ({
          user_id: t.user_id,
          title: 'Entrega completada',
          body: `${oc.internal_number} - ${oc.client_name}`,
          link: `/ordenes-cliente/${oc.id}`,
        }))
      )
    }
  }

  revalidatePath('/almacen/mis-entregas')
  revalidatePath('/almacen/programacion')
  return { success: true }
}

export async function uploadSealedGuidePhoto(deliveryId: number, file: File) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Sin sesión' }

  const supabase = await createClient()
  const ext = file.name.split('.').pop()
  const path = `${deliveryId}/${Date.now()}.${ext}`

  const { data, error } = await supabase.storage
    .from('delivery-photos')
    .upload(path, file)

  if (error) return { error: 'Error subiendo foto' }

  const { data: { publicUrl } } = supabase.storage
    .from('delivery-photos')
    .getPublicUrl(data.path)

  await supabase
    .from('deliveries')
    .update({ sealed_guide_photo_url: publicUrl })
    .eq('id', deliveryId)

  revalidatePath(`/almacen/mis-entregas/${deliveryId}`)
  return { success: true, url: publicUrl }
}

export async function markDeliveryBilled(deliveryId: number) {
  const user = await getCurrentUser()
  if (!user || !['gerente', 'asistente', 'facturacion'].includes(user.role)) {
    return { error: 'Sin permisos' }
  }

  const supabase = await createClient()

  const { data: delivery } = await supabase
    .from('deliveries')
    .select('client_order_id')
    .eq('id', deliveryId)
    .single()

  if (!delivery) return { error: 'Entrega no encontrada' }

  await supabase
    .from('client_orders')
    .update({ status: 'facturado' })
    .eq('id', delivery.client_order_id)

  const { data: oc } = await supabase
    .from('client_orders')
    .select('created_by, internal_number, client_name')
    .eq('id', delivery.client_order_id)
    .single()

  if (oc) {
    await supabase.from('notifications').insert({
      user_id: oc.created_by,
      title: 'Pedido facturado',
      body: `${oc.internal_number} - ${oc.client_name} ha sido facturado.`,
      link: `/ordenes-cliente/${delivery.client_order_id}`,
    })
  }

  revalidatePath('/almacen/programacion')
  revalidatePath('/ordenes-cliente')
  return { success: true }
}
