import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useSession } from '../lib/useSession'
import { useRole } from '../lib/useRole'
import RoleAwareBottomNav from '../components/RoleAwareBottomNav'

const BOOKING_STATUS_LABELS = {
  PENDING: '🟡 รอชำระเงิน / รอตรวจสอบ',
  CONFIRMED: '🟢 ยืนยันแล้ว',
  CANCELLED: '⚪ ยกเลิก',
  COMPLETED: '✅ เสร็จสิ้น',
}

const PAYMENT_STATUS_LABELS = {
  SUBMITTED: 'ส่งหลักฐานแล้ว รอตรวจสอบ',
  VERIFIED: 'ตรวจสอบแล้ว ยืนยันการชำระเงิน',
  REJECTED: 'หลักฐานไม่ผ่าน กรุณาติดต่อแอดมิน',
}

export default function BookingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const session = useSession()
  const role = useRole()
  const [booking, setBooking] = useState(null)
  const [payment, setPayment] = useState(null)
  const [rating, setRating] = useState(null)
  const [ratingValue, setRatingValue] = useState(5)
  const [ratingComment, setRatingComment] = useState('')
  const [savingRating, setSavingRating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (session === null) {
      navigate('/login')
      return
    }
    if (!session) return

    async function load() {
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(
          'id, appointment_date, start_time, final_price, status, professional_id, professionals(professional_name), children(nickname)'
        )
        .eq('id', id)
        .single()

      if (bookingError) {
        setError('ไม่พบการจองนี้')
        setLoading(false)
        return
      }
      setBooking(bookingData)

      const { data: paymentData } = await supabase
        .from('payments')
        .select('status')
        .eq('booking_id', id)
        .order('created_at', { ascending: false })
        .maybeSingle()
      setPayment(paymentData)

      if (bookingData.status === 'COMPLETED') {
        const { data: ratingData } = await supabase
          .from('ratings')
          .select('rating, comment')
          .eq('booking_id', id)
          .maybeSingle()
        setRating(ratingData)
      }

      setLoading(false)
    }
    load()
  }, [session, id, navigate])

  async function handleSubmitRating(e) {
    e.preventDefault()
    setSavingRating(true)
    setError('')

    const { error: ratingError } = await supabase.from('ratings').insert({
      booking_id: id,
      parent_id: session.user.id,
      professional_id: booking.professional_id,
      rating: ratingValue,
      comment: ratingComment,
    })

    setSavingRating(false)

    if (ratingError) {
      setError(ratingError.message)
    } else {
      setRating({ rating: ratingValue, comment: ratingComment })
    }
  }

  if (loading) return null

  return (
    <>
    <div className="home-shell">
      <div className="top-row">
        <div>
          <p style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>รายละเอียดการจอง</p>
        </div>
        <Link className="link-btn" to="/consult">
          กลับ
        </Link>
      </div>

      {error && <div className="error-box">{error}</div>}

      {booking && (
        <>
          <h1 style={{ fontSize: 20, marginBottom: 4 }}>{booking.professionals?.professional_name}</h1>
          <p style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginBottom: 16 }}>
            สำหรับ {booking.children?.nickname || '-'}
          </p>

          <div style={{ border: '1px solid var(--color-line)', borderRadius: 8, padding: 14, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>วันที่</span>
              <span style={{ fontSize: 13 }}>
                {new Date(booking.appointment_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}{' '}
                {booking.start_time?.slice(0, 5)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>ยอดชำระ</span>
              <span style={{ fontSize: 13 }}>฿{Number(booking.final_price).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>สถานะการจอง</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {BOOKING_STATUS_LABELS[booking.status] || booking.status}
              </span>
            </div>
          </div>

          {payment ? (
            <div className="info-box">{PAYMENT_STATUS_LABELS[payment.status] || payment.status}</div>
          ) : (
            <Link to={`/bookings/${id}/payment`} className="btn-primary" style={{ display: 'block', textAlign: 'center' }}>
              ไปชำระเงิน
            </Link>
          )}

          {(booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') && (
            <Link
              to={`/bookings/${id}/chat`}
              className="btn-secondary"
              style={{ display: 'block', textAlign: 'center', marginTop: 12 }}
            >
              💬 {role === 'PROFESSIONAL' ? 'แชทกับผู้ปกครอง' : 'แชทกับผู้เชี่ยวชาญ'}
            </Link>
          )}

          {booking.status === 'COMPLETED' && (
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)', marginBottom: 8 }}>
                ให้คะแนนการปรึกษา
              </p>
              {rating ? (
                <div className="info-box">
                  ให้คะแนนแล้ว: {'⭐'.repeat(rating.rating)} {rating.comment && `— ${rating.comment}`}
                </div>
              ) : (
                <form onSubmit={handleSubmitRating}>
                  <div className="field">
                    <label htmlFor="ratingValue">คะแนน (1-5)</label>
                    <select id="ratingValue" value={ratingValue} onChange={(e) => setRatingValue(Number(e.target.value))}>
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {'⭐'.repeat(n)} ({n})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="ratingComment">ความคิดเห็น (ถ้ามี)</label>
                    <textarea
                      id="ratingComment"
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      style={{ minHeight: 70 }}
                    />
                  </div>
                  <button className="btn-primary" type="submit" disabled={savingRating}>
                    {savingRating ? 'กำลังส่ง...' : 'ส่งคะแนน'}
                  </button>
                </form>
              )}
            </div>
          )}
        </>
      )}
    </div>
    <RoleAwareBottomNav />
    </>
  )
}
