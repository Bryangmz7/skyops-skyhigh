'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/client/supabase'
import type { User, UserRole } from '@/types/database'

interface UseUserReturn {
  user: User | null
  role: UserRole | null
  isLoading: boolean
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        setIsLoading(false)
        return
      }

      const { data } = await supabase
        .from('users')
        .select('*, department:departments(*)')
        .eq('id', authUser.id)
        .single()

      if (data && !data.is_active) {
        await supabase.auth.signOut()
        setIsLoading(false)
        return
      }

      setUser(data)
      setIsLoading(false)
    }

    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUser()
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, role: user?.role ?? null, isLoading }
}
