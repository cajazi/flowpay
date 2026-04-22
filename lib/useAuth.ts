'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // 🔹 Get initial session
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser()

      if (!mounted) return

      if (error) {
        console.error('Auth error:', error.message)
        setUser(null)
      } else {
        setUser(data.user ?? null)
      }

      setLoading(false)
    }

    getUser()

    // 🔹 Listen to auth changes (IMPORTANT)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}