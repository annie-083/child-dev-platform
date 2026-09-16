import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useSession } from './useSession'

// คืนค่า: undefined = ยังโหลดไม่เสร็จ, null = ยังไม่ login, หรือ role string เช่น 'PARENT'/'ADMIN'
export function useRole() {
  const session = useSession()
  const [role, setRole] = useState(undefined)

  useEffect(() => {
    if (session === undefined) return
    if (session === null) {
      setRole(null)
      return
    }
    supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setRole(data?.role || 'PARENT'))
  }, [session])

  return role
}
