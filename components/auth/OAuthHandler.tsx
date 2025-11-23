"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function OAuthHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')

    if (code) {
      const supabase = createClient()

      // Exchange code for session
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error) {
          console.error('OAuth error:', error)
          router.push('/login')
        } else if (data.session) {
          console.log('OAuth success, redirecting to dashboard')
          router.push('/dashboard')
        }
      })
    }
  }, [searchParams, router])

  return null
}
