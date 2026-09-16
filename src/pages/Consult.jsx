import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useSession } from '../lib/useSession'
import BottomNav from '../components/BottomNav'

const STATUS_LABELS = {
  PENDING: '🟡 รอชำระเงิน',
  CONFIRMED: '🟢 ยืนยันแล้ว',
  CANCELLED: '⚪ ยกเลิก',
  COMPLETED: '✅ เสร็จสิ้น',
}

export default function Consult() {
  const navigate = useNavigate()
  const session = useSession()
  const [professionals, setProfessionals] = useState([])
  const [myBookings, setMyBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session === null) {
      navigate('/login')
      return
    }
    if (!session) return

    async function load() {
      const { data: profs } = await supabase
        .from('professionals')
        .select('id, professional_name, profession, consultation_fee')
        .eq('status', 'APPROVED')
      setProfessionals(profs || [])

      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, appointment_date, start_time, status, professionals(professional_name)')
        .order('appointment_date', { ascending: false })
        .limit(5)
      setMyBookings(bookings || [])

      setLoading(false)
    }
    load()
  }, [session, navigate])

  if (loading) return null

  return (
    <>
      <div className="home-shell">
        <div className="top-row">
          <div>
            <p style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>ปรึกษาผู้เชี่ยวชาญ</p>
            <h1 style={{ fontSize: 22 }}>เลือกผู้เชี่ยวชาญ</h1>
          </div>
        </div>

        {myBookings.length > 0 && (
          <>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)', marginBottom: 8 }}>
              การจองของฉัน
            </p>
            {myBookings.map((b) => (
              <Link key={b.id} to={`/bookings/${b.id}`} className="child-card" style={{ marginBottom: 8 }}>
                <div>
                  <p className="name">{b.professionals?.professional_name}</p>
                  <p className="meta">
                    {new Date(b.appointment_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}{' '}
                    {b.start_time?.slice(0, 5)} · {STATUS_LABELS[b.status] || b.status}
                  </p>
                </div>
                <span style={{ color: 'var(--color-ink-soft)' }}>›</span>
              </Link>
            ))}
            <div style={{ marginBottom: 10 }} />
          </>
        )}

        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)', marginBottom: 8 }}>
          ผู้เชี่ยวชาญทั้งหมด
        </p>
        {professionals.map((p) => (
          <Link key={p.id} to={`/consult/${p.id}`} className="child-card">
            <div>
              <p className="name">{p.professional_name}</p>
              <p className="meta">
                {p.profession} · ฿{Number(p.consultation_fee).toLocaleString()}
              </p>
            </div>
            <span style={{ color: 'var(--color-ink-soft)' }}>›</span>
          </Link>
        ))}
      </div>
      <BottomNav />
    </>
  )
}
