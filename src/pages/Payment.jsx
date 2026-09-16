import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useSession } from '../lib/useSession'

export default function Payment() {
  const { id: bookingId } = useParams()
  const navigate = useNavigate()
  const session = useSession()

  const [booking, setBooking] = useState(null)
  const [file, setFile] = useState(null)
  const [bankReference, setBankReference] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (session === null) {
      navigate('/login')
      return
    }
    if (!session) return

    async function load() {
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select('id, appointment_date, start_time, final_price, status, professionals(professional_name)')
        .eq('id', bookingId)
        .single()

      if (fetchError) {
        setError('ไม่พบการจองนี้')
      } else {
        setBooking(data)
      }
      setLoading(false)
    }
    load()
  }, [session, bookingId, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) {
      setError('กรุณาแนบรูปสลิปโอนเงิน')
      return
    }
    setSaving(true)
    setError('')

    const filePath = `${bookingId}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from('payment-slips').upload(filePath, file)

    if (uploadError) {
      setError('อัปโหลดไฟล์ไม่สำเร็จ: ' + uploadError.message)
      setSaving(false)
      return
    }

    const { error: insertError } = await supabase.from('payments').insert({
      booking_id: bookingId,
      amount: booking.final_price,
      bank_reference: bankReference,
      slip_url: filePath,
      status: 'SUBMITTED',
    })

    setSaving(false)

    if (insertError) {
      setError(insertError.message)
    } else {
      setDone(true)
      setTimeout(() => navigate(`/bookings/${bookingId}`), 1500)
    }
  }

  if (loading) return null

  return (
    <div className="home-shell">
      <div className="top-row">
        <div>
          <p style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>ชำระเงิน</p>
        </div>
        <Link className="link-btn" to="/consult">
          กลับ
        </Link>
      </div>

      {error && <div className="error-box">{error}</div>}
      {done && <div className="info-box">ส่งหลักฐานการโอนเงินแล้วค่ะ รอแอดมินตรวจสอบ</div>}

      {booking && !done && (
        <>
          <div
            style={{
              border: '1px solid var(--color-line)',
              borderRadius: 8,
              padding: 14,
              marginBottom: 20,
              fontSize: 14,
            }}
          >
            <p style={{ margin: '0 0 4px' }}>{booking.professionals?.professional_name}</p>
            <p style={{ margin: '0 0 10px', color: 'var(--color-ink-soft)', fontSize: 12 }}>
              {new Date(booking.appointment_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}{' '}
              {booking.start_time?.slice(0, 5)}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
              <span>ยอดที่ต้องโอน</span>
              <span>฿{Number(booking.final_price).toLocaleString()}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="bankRef">เลขอ้างอิงการโอน (ถ้ามี)</label>
              <input
                id="bankRef"
                type="text"
                value={bankReference}
                onChange={(e) => setBankReference(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="slip">แนบรูปสลิปโอนเงิน</label>
              <input id="slip" type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} required />
            </div>

            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? 'กำลังส่ง...' : 'ส่งหลักฐานการโอนเงิน'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
