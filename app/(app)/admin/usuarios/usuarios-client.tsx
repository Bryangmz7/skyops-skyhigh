'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/client/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, UserCheck, UserX, Search } from 'lucide-react'
import type { User, Department } from '@/types/database'

const ROLE_LABELS: Record<string, string> = {
  gerente: 'Gerente', asistente: 'Asistente', ventas: 'Ventas',
  jefe_almacen: 'Jefe Almacén', operativo: 'Operativo', facturacion: 'Facturación',
}

interface Props {
  users: User[]
  departments: Department[]
}

export function UsuariosClient({ users: initialUsers, departments }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const filtered = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)

    // Crear usuario via Supabase Auth Admin (necesita service role - se hace via API route)
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.get('email'),
        full_name: formData.get('full_name'),
        role: formData.get('role'),
        department_id: formData.get('department_id'),
        phone: formData.get('phone'),
      }),
    })

    const result = await res.json()
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Usuario creado y email de bienvenida enviado')
      setOpen(false)
      router.refresh()
    }
  }

  async function toggleActive(userId: string, current: boolean) {
    await supabase.from('users').update({ is_active: !current }).eq('id', userId)
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: !current } : u))
    toast.success(current ? 'Usuario desactivado' : 'Usuario reactivado')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar usuario…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button className="bg-sky-600 hover:bg-sky-700" onClick={() => setOpen(true)}>
          <Plus size={16} className="mr-2" /> Crear Usuario
        </Button>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Nombre', 'Email', 'Departamento', 'Rol', 'Estado', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-gray-700">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{user.full_name}</td>
                <td className="px-4 py-3 text-gray-500">{user.email}</td>
                <td className="px-4 py-3 text-gray-500">{(user.department as any)?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive(user.id, user.is_active)}
                    title={user.is_active ? 'Desactivar' : 'Reactivar'}
                  >
                    {user.is_active ? <UserX size={16} className="text-red-500" /> : <UserCheck size={16} className="text-green-500" />}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear nuevo usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre completo *</Label>
              <Input name="full_name" required placeholder="Juan Pérez" />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input name="email" type="email" required placeholder="juan@skyhighsac.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input name="phone" placeholder="999 000 000" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Rol *</Label>
                <Select name="role" required>
                  <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Departamento</Label>
                <Select name="department_id">
                  <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1 bg-sky-600 hover:bg-sky-700" disabled={loading}>
                {loading ? 'Creando…' : 'Crear Usuario'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
