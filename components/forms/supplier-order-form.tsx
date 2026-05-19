'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupplierOrder } from '@/lib/server/actions/supplier-orders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export function SupplierOrderForm({ onSuccess }: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await createSupplierOrder(formData)
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Pedido creado correctamente')
      onSuccess?.()
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="order_number">N° Pedido *</Label>
          <Input id="order_number" name="order_number" required placeholder="Ej: 0012345" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="supplier_name">Proveedor *</Label>
          <Input id="supplier_name" name="supplier_name" required placeholder="Nombre del proveedor" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="client_reference">Referencia Cliente</Label>
          <Input id="client_reference" name="client_reference" placeholder="Nombre del cliente final" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="project_reference">Referencia Proyecto</Label>
          <Input id="project_reference" name="project_reference" placeholder="Proyecto u obra" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Stock *</Label>
        <div className="flex gap-4">
          {[
            { value: 'disponible', label: 'Disponible', color: 'text-green-700' },
            { value: 'no_hay', label: 'No hay', color: 'text-red-700' },
            { value: 'parcial', label: 'Parcial', color: 'text-orange-700' },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="stock_status" value={opt.value} required />
              <span className={`text-sm font-medium ${opt.color}`}>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="file">PDF / Foto del pedido</Label>
        <Input id="file" name="file" type="file" accept=".pdf,image/*" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Observaciones</Label>
        <Textarea id="notes" name="notes" placeholder="Notas adicionales…" rows={3} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess}>Cancelar</Button>
        <Button type="submit" className="bg-sky-600 hover:bg-sky-700" disabled={loading}>
          {loading ? 'Guardando…' : 'Crear Pedido'}
        </Button>
      </div>
    </form>
  )
}
