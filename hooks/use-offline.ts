'use client'

import { useEffect, useState } from 'react'
import { getPendingActions } from '@/lib/client/idb'

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    async function updatePendingCount() {
      try {
        const pending = await getPendingActions()
        setPendingCount(pending.length)
      } catch {}
    }

    function handleOnline() {
      setIsOnline(true)
      updatePendingCount()
    }

    function handleOffline() {
      setIsOnline(false)
      updatePendingCount()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    updatePendingCount()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, pendingCount }
}
