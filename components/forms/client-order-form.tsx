'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientOrder } from '@/lib/server/actions/client-orders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export function ClientOrderForm({ onSuccess }: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [docType, setDocType] = useState<'oc' | 'cotizacion'>('oc')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set('doc_type', docType)
    const result = await createClientOrder(formData)
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('OC creada correctamente')
      onSuccess?.()
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Toggle OC / Cotización */}
      <div className="flex rounded-lg border overflow-hidden w-fit">
        {(['oc', 'cotizacion'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setDocType(type)}
            className={`px-5 py-2 text-sm font-medium transition-colors ${
              docType === type ? 'bg-[#0066cc] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {type === 'oc' ? 'Orden de Compra' : 'Cotización'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="order_number">N° {docType === 'oc' ? 'OC' : 'Cotización'} *</Label>
          <Input id="order_number" name="order_number" required placeholder="Número del documento" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="client_name">Cliente *</Label>
          <Input id="client_name" name="client_name" required placeholder="Nombre del cliente" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="project_reference">Proyecto / Obra</Label>
          <Input id="project_reference" name="project_reference" placeholder="Nombre del proyecto u obra" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="file">PDF / Foto de la {docType === 'oc' ? 'OC' : 'cotización'}</Label>
        <Input id="file" name="file" type="file" accept=".pdf,image/*" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Observaciones</Label>
        <Textarea id="notes" name="notes" placeholder="Notas adicionales…" rows={3} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess}>Cancelar</Button>
        <Button type="submit" className="bg-[#0066cc] hover:bg-[#0052a3]" disabled={loading}>
          {loading ? 'Guardando…' : `Crear ${docType === 'oc' ? 'OC' : 'Cotización'}`}
        </Button>
      </div>
    </form>
  )
}
