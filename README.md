# SkyOps — Sky High SAC

Sistema operativo interno que reemplaza la coordinación por WhatsApp. Centraliza pedidos a proveedores, órdenes de clientes y entregas con trazabilidad completa.

## Stack
- **Frontend/Backend:** Next.js 14 (App Router) + TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **Base de datos:** Supabase PostgreSQL con Row Level Security
- **Auth:** Supabase Auth
- **PWA:** Offline-first con IndexedDB para operativos en campo

## Módulos
| Módulo | Ruta | Acceso |
|---|---|---|
| Dashboard | `/dashboard` | Todos |
| Pedidos Proveedor | `/pedidos-proveedor` | Ventas, Gerencia |
| OC Clientes | `/ordenes-cliente` | Ventas, Gerencia |
| Programación Entregas | `/almacen/programacion` | Jefe Almacén, Gerencia |
| Mis Entregas (móvil) | `/almacen/mis-entregas` | Operativos |
| Notificaciones | `/notificaciones` | Todos |
| Admin Usuarios | `/admin/usuarios` | Gerencia |
| Auditoría | `/admin/auditoria` | Gerencia |

## Setup local

```bash
npm install
# Completar variables en .env.local
npm run dev
```

## Variables de entorno (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@skyhighsac.com
```

## Base de datos

Ejecutar `supabase/migrations/001_schema_inicial.sql` en el SQL Editor de Supabase.

## Reglas inmutables del sistema

1. `delivery_timeline` es INMUTABLE — solo INSERT
2. Jefe de Almacén no elimina ni modifica datos críticos
3. Toda modificación queda en `audit_log`
4. Usuarios se desactivan, nunca se eliminan
5. Timestamps los pone el servidor

## Deploy

Conectar repositorio a Vercel y configurar las variables de entorno en el panel.
