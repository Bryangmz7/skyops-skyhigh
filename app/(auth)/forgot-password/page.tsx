'use client'

import { useState } from 'react'
import { resetPassword } from '@/lib/server/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string

    const result = await resetPassword(email)
    if (result?.error) {
      setStatus('error')
      setMessage(result.error)
    } else {
      setStatus('success')
      setMessage('Revisa tu email para restablecer tu contraseña.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center">
          <CardTitle>Recuperar contraseña</CardTitle>
          <CardDescription>Te enviaremos un enlace a tu email</CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'success' ? (
            <div className="text-center space-y-4">
              <p className="text-green-700 bg-green-50 p-3 rounded-lg text-sm">{message}</p>
              <a href="/login" className="text-[#0066cc] hover:underline text-sm">
                Volver al login
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@skyhighsac.com"
                  required
                />
              </div>
              {status === 'error' && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{message}</p>
              )}
              <Button
                type="submit"
                className="w-full bg-[#0066cc] hover:bg-[#0052a3]"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Enviando…' : 'Enviar enlace'}
              </Button>
              <div className="text-center">
                <a href="/login" className="text-sm text-[#0066cc] hover:underline">
                  Volver al login
                </a>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
