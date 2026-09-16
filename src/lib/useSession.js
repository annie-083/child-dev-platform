import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export function useSession() {
  const [session, setSession] = useState(undefined) // undefined = ยังโหลดไม่เสร็จ

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return session
}
