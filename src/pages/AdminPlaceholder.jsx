import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../lib/useRole'
import AdminBottomNav from '../components/AdminBottomNav'

export default function AdminPlaceholder({ title, description }) {
  const navigate = useNavigate()
  const role = useRole()

  useEffect(() => {
    if (role === null) {
      navigate('/login')
      return
    }
    if (role === undefined) return
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') navigate('/home')
  }, [role, navigate])

  if (role === undefined) return null

  return (
    <>
      <div className="home-shell">
        <div className="top-row">
          <div>
            <p style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>Admin</p>
            <h1 style={{ fontSize: 22 }}>{title}</h1>
          </div>
        </div>
        <p style={{ color: 'var(--color-ink-soft)' }}>{description}</p>
      </div>
      <AdminBottomNav />
    </>
  )
}
