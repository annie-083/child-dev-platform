import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useSession } from '../lib/useSession'
import AdminBottomNav from '../components/AdminBottomNav'

export default function AdminPayments() {
  const navigate = useNavigate()
  const session = useSession()
  const [isAdmin, setIsAdmin] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    if (session === null) {
      navigate('/login')
      return
    }
    if (!session) return

    async function checkAdminAndLoad() {
      const { data: profile } = await supabase.from('users').select('role').eq('id', session.user.id).single()

      if (profile?.role !== 'ADMIN' && profile?.role !== 'SUPER_ADMIN') {
        setIsAdmin(false)
        setLoading(false)
        return
      }
      setIsAdmin(true)
      await loadPayments()
    }
    checkAdminAndLoad()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, navigate])

  async function loadPayments() {
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('payments')
      .select(
        'id, amount, bank_reference, slip_url, status, created_at, booking_id, bookings(appointment_date, start_time, professionals(professional_name), users:parent_id(username))'
      )
      .eq('status', 'SUBMITTED')
      .order('created_at', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setPayments(data || [])
    }
    setLoading(false)
  }

  async function getSlipUrl(path) {
    const { data } = await supabase.storage.from('payment-slips').createSignedUrl(path, 300)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function handleVerify(payment, approve) {
    setBusyId(payment.id)
    setError('')

    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        status: approve ? 'VERIFIED' : 'REJECTED',
        verified_by: session.user.id,
        verified_at: new Date().toISOString(),
      })
      .eq('id', payment.id)

    if (paymentError) {
      setError(paymentError.message)
      setBusyId(null)
      return
    }

    if (approve) {
      await supabase.from('bookings').update({ status: 'CONFIRMED' }).eq('id', payment.booking_id)
    }

    setBusyId(null)
    loadPayments()
  }

  if (loading) return null

  if (isAdmin === false) {
    return (
      <div className="home-shell">
        <p style={{ color: 'var(--color-ink-soft)' }}>หน้านี้สำหรับแอดมินเท่านั้นค่ะ</p>
      </div>
    )
  }

  return (
    <>
    <div className="home-shell">
      <div className="top-row">
        <div>
          <p style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>Admin</p>
          <h1 style={{ fontSize: 22 }}>ตรวจสอบการชำระเงิน</h1>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {payments.length === 0 && <p style={{ color: 'var(--color-ink-soft)' }}>ไม่มีรายการรอตรวจสอบค่ะ</p>}

      {payments.map((p) => (
        <div key={p.id} style={{ border: '1px solid var(--color-line)', borderRadius: 8, padding: 14, marginBottom: 12 }}>
          <p style={{ fontSize: 13, margin: '0 0 4px' }}>
            {p.bookings?.professionals?.professional_name} · {p.bookings?.users?.username || 'ผู้ปกครอง'}
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-ink-soft)', margin: '0 0 10px' }}>
            {p.bookings?.appointment_date && new Date(p.bookings.appointment_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}{' '}
            {p.bookings?.start_time?.slice(0, 5)}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13 }}>ยอดที่ต้องได้รับ</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>฿{Number(p.amount).toLocaleString()}</span>
          </div>
          {p.bank_reference && (
            <p style={{ fontSize: 12, color: 'var(--color-ink-soft)', margin: '0 0 10px' }}>
              เลขอ้างอิง: {p.bank_reference}
            </p>
          )}
          <button
            type="button"
            onClick={() => getSlipUrl(p.slip_url)}
            className="btn-secondary"
            style={{ marginBottom: 10 }}
          >
            ดูรูปสลิป
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn-primary"
              disabled={busyId === p.id}
              onClick={() => handleVerify(p, true)}
              style={{ flex: 1 }}
            >
              อนุมัติ
            </button>
            <button
              disabled={busyId === p.id}
              onClick={() => handleVerify(p, false)}
              style={{
                flex: 1,
                padding: '13px 14px',
                background: 'none',
                border: '1px solid var(--color-error)',
                color: 'var(--color-error)',
                borderRadius: 6,
              }}
            >
              ปฏิเสธ
            </button>
          </div>
        </div>
      ))}
    </div>
    <AdminBottomNav />
    </>
  )
}
