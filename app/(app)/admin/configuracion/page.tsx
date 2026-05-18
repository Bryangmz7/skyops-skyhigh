import { getCurrentUser } from '@/lib/server/actions/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Bell, Database, Shield } from 'lucide-react'

export default async function ConfiguracionPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'gerente') redirect('/dashboard')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
        <p className="text-gray-500 mt-1">Parámetros generales de SkyOps</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bell size={18} className="text-[#0066cc]" />
            </div>
            <div>
              <CardTitle className="text-base">Notificaciones Push</CardTitle>
              <CardDescription className="text-xs">Configurar VAPID y suscripciones</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Las notificaciones push están configuradas con claves VAPID.
              Para activarlas en cada dispositivo, el usuario debe permitir notificaciones en el navegador.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-green-700 font-medium">VAPID configurado</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
              <Database size={18} className="text-green-600" />
            </div>
            <div>
              <CardTitle className="text-base">Base de Datos</CardTitle>
              <CardDescription className="text-xs">Estado de conexión Supabase</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Proyecto Supabase activo en producción.
              Todas las tablas con RLS habilitado.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-green-700 font-medium">Conectado · guowusoiarbdbjqfhyrz</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
              <Shield size={18} className="text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-base">Permisos y Roles</CardTitle>
              <CardDescription className="text-xs">6 roles configurados</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 text-xs text-gray-600">
              {['gerente','asistente','ventas','jefe_almacen','operativo','facturacion'].map(r => (
                <div key={r} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0066cc]" />
                  <span className="capitalize">{r.replace('_',' ')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
              <Settings size={18} className="text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-base">Empresa</CardTitle>
              <CardDescription className="text-xs">Sky High SAC</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="text-gray-400">RUC:</span> 20455911401</p>
              <p><span className="text-gray-400">Ciudad:</span> Arequipa, Perú</p>
              <p><span className="text-gray-400">Sistema:</span> SkyOps v1.0</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
