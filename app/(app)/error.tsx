'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[SkyOps App Error]', error)
  }, [error])

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-5">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle size={32} className="text-red-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Error al cargar</h2>
          <p className="text-gray-500 text-sm mt-1">
            No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <Home size={16} className="mr-2" />
              Dashboard
            </Link>
          </Button>
          <Button onClick={reset} className="bg-sky-600 hover:bg-sky-700">
            <RefreshCw size={16} className="mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    </div>
  )
}
