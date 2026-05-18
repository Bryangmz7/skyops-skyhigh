// SkyOps Service Worker — offline-first para operativos en campo
const CACHE_NAME = 'skyops-v1'
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/almacen/mis-entregas',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
]

// Instalación: pre-cachear assets estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Si algún asset falla, continúa igual
      })
    })
  )
  self.skipWaiting()
})

// Activación: limpiar caches viejos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: Network-first para API y Supabase, Cache-first para estáticos
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorar peticiones no GET y chrome-extension
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return

  // API de Supabase y Next.js server actions → Network only (sin caché)
  if (
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    request.headers.get('content-type')?.includes('application/json')
  ) {
    return
  }

  // Para el resto: Network-first con fallback a caché
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Guardar copia en caché si la respuesta es válida
        if (response.ok && response.status === 200) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => {
        // Sin red: intentar desde caché
        return caches.match(request).then(
          (cached) =>
            cached ||
            new Response(
              `<html><body style="font-family:sans-serif;text-align:center;padding:40px">
                <h2>Sin conexión</h2>
                <p>SkyOps está en modo offline. Tus acciones se sincronizarán al reconectar.</p>
              </body></html>`,
              { headers: { 'Content-Type': 'text/html' } }
            )
        )
      })
  )
})

// Sync en background cuando se recupera la red
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(syncPendingActions())
  }
})

async function syncPendingActions() {
  // Notificar a la app que sincronice desde IndexedDB
  const clients = await self.clients.matchAll()
  clients.forEach((client) => client.postMessage({ type: 'SYNC_PENDING' }))
}

// Push notifications (in-app)
self.addEventListener('push', (event) => {
  if (!event.data) return
  const { title, body, link } = event.data.json()
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { link },
      vibrate: [200, 100, 200],
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const link = event.notification.data?.link || '/dashboard'
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(link))
      if (existing) return existing.focus()
      return self.clients.openWindow(link)
    })
  )
})
