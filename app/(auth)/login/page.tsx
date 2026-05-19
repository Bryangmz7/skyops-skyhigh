'use client'

import { useState } from 'react'
import { signIn } from '@/lib/server/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const result = await signIn(email, password)
    if (result?.error) {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/30 p-8 space-y-7">
          {/* Brand */}
          <div className="text-center space-y-3">
            <div className="mx-auto w-14 h-14 bg-gradient-to-br from-sky-500 to-sky-700 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-900/30">
              <span className="text-white font-extrabold text-xl tracking-tighter">SK</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">SkyOps</h1>
              <p className="text-slate-500 text-sm mt-1">Sistema interno de Sky High SAC</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-700 text-sm font-medium">
                Correo electrónico
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@skyhighsac.com"
                required
                autoComplete="email"
                className="h-10 border-slate-200 focus-visible:ring-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-700 text-sm font-medium">
                Contraseña
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="h-10 border-slate-200 focus-visible:ring-sky-500"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2.5 rounded-lg">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-10 bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-sm transition-colors"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Ingresando…
                </>
              ) : (
                'Ingresar'
              )}
            </Button>

            <div className="text-center">
              <a
                href="/forgot-password"
                className="text-sm text-sky-600 hover:text-sky-700 hover:underline transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </form>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Sky High SAC © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
