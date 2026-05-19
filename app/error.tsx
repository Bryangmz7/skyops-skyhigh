'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[SkyOps Error]', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle size={32} className="text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Algo salió mal</h1>
        <p className="text-gray-500 text-sm">
          Ocurrió un error inesperado. Por favor intenta de nuevo.
        </p>
        <Button onClick={reset} className="bg-sky-600 hover:bg-sky-700">
          <RefreshCw size={16} className="mr-2" />
          Reintentar
        </Button>
      </div>
    </div>
  )
}
