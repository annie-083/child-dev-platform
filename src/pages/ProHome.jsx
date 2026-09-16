import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useRole } from '../lib/useRole'
import { useSession } from '../lib/useSession'

const STATUS_LABELS = {
  PENDING: '🟡 รอชำระเงิน',
  CONFIRMED: '🟢 ยืนยันแล้ว',
  CANCELLED: '⚪ ยกเลิก',
  COMPLETED: '✅ เสร็จสิ้น',
}

export default function ProHome() {
  const navigate = useNavigate()
  const role = useRole()
  const session = useSession()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    if (role === null) {
      navigate('/login')
      return
    }
    if (role === undefined) return
    if (role !== 'PROFESSIONAL') {
      navigate('/home')
      return
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, navigate])

  async function load() {
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('bookings')
      .select('id, appointment_date, start_time, status, children(nickname)')
      .order('appointment_date', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setBookings(data || [])
    }
    setLoading(false)
  }

  async function markCompleted(bookingId) {
    setBusyId(bookingId)
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'COMPLETED' })
      .eq('id', bookingId)
    setBusyId(null)
    if (updateError) {
      setError(updateError.message)
    } else {
      load()
    }
  }

  if (role === undefined || loading) return null

  return (
    <div className="home-shell">
      <div className="top-row">
        <div>
          <p style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>Professional</p>
          <h1 style={{ fontSize: 20 }}>{session?.user.email}</h1>
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

      {error && <div className="error-box">{error}</div>}

      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)', marginBottom: 8 }}>เคสของฉัน</p>

      {bookings.length === 0 && <p style={{ color: 'var(--color-ink-soft)' }}>ยังไม่มีเคสที่จองเข้ามาค่ะ</p>}

      {bookings.map((b) => (
        <div key={b.id} style={{ border: '1px solid var(--color-line)', borderRadius: 8, padding: 14, marginBottom: 10 }}>
          <p style={{ fontSize: 13, margin: '0 0 4px' }}>{b.children?.nickname || '-'}</p>
          <p style={{ fontSize: 12, color: 'var(--color-ink-soft)', margin: '0 0 8px' }}>
            {new Date(b.appointment_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}{' '}
            {b.start_time?.slice(0, 5)} · {STATUS_LABELS[b.status] || b.status}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {(b.status === 'CONFIRMED' || b.status === 'COMPLETED') && (
              <Link to={`/bookings/${b.id}/chat`} className="btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
                แชท
              </Link>
            )}
            {b.status === 'CONFIRMED' && (
              <button
                type="button"
                disabled={busyId === b.id}
                onClick={() => markCompleted(b.id)}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                ทำเครื่องหมายว่าเสร็จสิ้น
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
