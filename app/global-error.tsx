'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

// global-error.tsx: único archivo en Next.js que puede tener <html><body>
// Se activa cuando falla el root layout o un error no capturado por otros boundaries
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[SkyOps GlobalError]', error)
  }, [error])

  return (
    <html lang="es">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Error crítico</h1>
            <p className="text-gray-500 text-sm">
              Ocurrió un error inesperado. Por favor intenta de nuevo.
            </p>
            <Button onClick={reset} className="bg-[#0066cc] hover:bg-[#0052a3]">
              <RefreshCw size={16} className="mr-2" />
              Reintentar
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
}
