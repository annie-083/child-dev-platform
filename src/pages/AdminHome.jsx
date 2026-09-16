import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useRole } from '../lib/useRole'
import AdminBottomNav from '../components/AdminBottomNav'

export default function AdminHome() {
  const navigate = useNavigate()
  const role = useRole()
  const [pendingPayments, setPendingPayments] = useState(0)
  const [totalUsers, setTotalUsers] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (role === null) {
      navigate('/login')
      return
    }
    if (role === undefined) return
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      navigate('/home')
      return
    }

    async function load() {
      const { count: pendingCount } = await supabase
        .from('payments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'SUBMITTED')
      setPendingPayments(pendingCount || 0)

      const { count: userCount } = await supabase.from('users').select('id', { count: 'exact', head: true })
      setTotalUsers(userCount)

      setLoading(false)
    }
    load()
  }, [role, navigate])

  if (role === undefined || loading) return null

  return (
    <>
      <div className="home-shell">
        <div className="top-row">
          <div>
            <p style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>Admin</p>
            <h1 style={{ fontSize: 22 }}>แดชบอร์ด</h1>
          </div>
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut()
              navigate('/login')
            }}
            className="link-btn"
          >
            ออกจากระบบ
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <div style={{ border: '1px solid var(--color-line)', borderRadius: 8, padding: 14 }}>
            <p style={{ fontSize: 12, color: 'var(--color-ink-soft)', margin: '0 0 4px' }}>ผู้ใช้ทั้งหมด</p>
            <p style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{totalUsers ?? '-'}</p>
          </div>
          <Link
            to="/admin/payments"
            style={{
              border: '1px solid var(--color-line)',
              borderRadius: 8,
              padding: 14,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <p style={{ fontSize: 12, color: 'var(--color-ink-soft)', margin: '0 0 4px' }}>รอตรวจ Payment</p>
            <p style={{ fontSize: 22, fontWeight: 600, margin: 0, color: pendingPayments > 0 ? 'var(--color-clay)' : 'inherit' }}>
              {pendingPayments}
            </p>
          </Link>
        </div>

        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)', marginBottom: 8 }}>งานที่ต้องทำ</p>
        <Link to="/admin/payments" className="child-card" style={{ marginBottom: 20 }}>
          <div>
            <p className="name">ตรวจสอบการชำระเงิน</p>
            <p className="meta">{pendingPayments} รายการรอดำเนินการ</p>
          </div>
          <span style={{ color: 'var(--color-ink-soft)' }}>›</span>
        </Link>

        <p style={{ fontSize: 12, color: 'var(--color-ink-soft)' }}>
          การจัดการผู้ใช้ / คอมมูนิตี้ / รายงานรายได้ อยู่ระหว่างพัฒนาในขั้นตอนถัดไปค่ะ
        </p>
      </div>
      <AdminBottomNav />
    </>
  )
}
