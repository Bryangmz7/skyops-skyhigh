import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/server/supabase'
import { getCurrentUser } from '@/lib/server/actions/auth'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser || !['gerente', 'asistente'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { email, full_name, role, department_id, phone } = await request.json()

  const supabase = await createServiceClient()

  // Generar password temporal
  const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-4).toUpperCase()

  // Crear en auth.users
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // Crear en tabla users
  const { error: dbError } = await supabase.from('users').insert({
    id: authUser.user.id,
    email,
    full_name,
    role,
    department_id: department_id ? Number(department_id) : null,
    phone: phone || null,
  })

  if (dbError) {
    await supabase.auth.admin.deleteUser(authUser.user.id)
    return NextResponse.json({ error: dbError.message }, { status: 400 })
  }

  // Enviar email de bienvenida
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'SkyOps <noreply@skyhighsac.com>',
      to: email,
      subject: 'Bienvenido a SkyOps — Sky High SAC',
      html: `
        <h2>Bienvenido a SkyOps</h2>
        <p>Hola ${full_name},</p>
        <p>Tu cuenta ha sido creada. Aquí están tus credenciales:</p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Contraseña temporal:</strong> ${tempPassword}</li>
        </ul>
        <p>Por seguridad, cambia tu contraseña al ingresar por primera vez.</p>
        <p>— Sistema SkyOps</p>
      `,
    })
  }

  return NextResponse.json({ success: true })
}
