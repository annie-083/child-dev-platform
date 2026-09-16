import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useSession } from '../lib/useSession'
import BottomNav from '../components/BottomNav'

function formatDateLabel(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function buildMonthGrid(year, month) {
  // month: 0-11
  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay() // 0 = อาทิตย์
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  return cells
}

const WEEKDAY_LABELS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

export default function BookingFlow() {
  const { id: professionalId } = useParams()
  const navigate = useNavigate()
  const session = useSession()

  const [professional, setProfessional] = useState(null)
  const [slots, setSlots] = useState([])
  const [children, setChildren] = useState([])
  const today = new Date()
  const [calendarMonth, setCalendarMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [selectedChildId, setSelectedChildId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (session === null) {
      navigate('/login')
      return
    }
    if (!session) return

    async function load() {
      const { data: prof } = await supabase
        .from('professionals')
        .select('id, professional_name, consultation_fee')
        .eq('id', professionalId)
        .single()
      setProfessional(prof)

      const { data: availData } = await supabase
        .from('professional_availability')
        .select('id, date, start_time, end_time')
        .eq('professional_id', professionalId)
        .eq('status', 'AVAILABLE')
        .gte('date', new Date().toISOString().slice(0, 10))
        .order('date')
        .order('start_time')
      setSlots(availData || [])

      const { data: childData } = await supabase
        .from('children')
        .select('id, nickname')
        .eq('parent_id', session.user.id)
      setChildren(childData || [])
      if (childData && childData.length > 0) setSelectedChildId(childData[0].id)

      setLoading(false)
    }
    load()
  }, [session, professionalId, navigate])

  const availableDatesSet = new Set(slots.map((s) => s.date))
  const slotsForDate = selectedDate ? slots.filter((s) => s.date === selectedDate) : []

  async function handleConfirm() {
    if (!selectedSlot || !selectedChildId) return
    setSaving(true)
    setError('')

    // ล็อก slot แบบ atomic — ป้องกันจองซ้อนกัน (Rule 5)
    const { data: lockedSlot, error: lockError } = await supabase
      .from('professional_availability')
      .update({ status: 'BOOKED' })
      .eq('id', selectedSlot.id)
      .eq('status', 'AVAILABLE')
      .select()

    if (lockError || !lockedSlot || lockedSlot.length === 0) {
      setError('ขออภัยค่ะ ช่วงเวลานี้เพิ่งถูกจองไปโดยคนอื่น กรุณาเลือกเวลาอื่น')
      setSaving(false)
      // โหลด slot ใหม่
      const { data: freshSlots } = await supabase
        .from('professional_availability')
        .select('id, date, start_time, end_time')
        .eq('professional_id', professionalId)
        .eq('status', 'AVAILABLE')
        .gte('date', new Date().toISOString().slice(0, 10))
      setSlots(freshSlots || [])
      setSelectedSlot(null)
      return
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        parent_id: session.user.id,
        child_id: selectedChildId,
        professional_id: professionalId,
        availability_id: selectedSlot.id,
        appointment_date: selectedSlot.date,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        base_price: professional.consultation_fee,
        final_price: professional.consultation_fee,
        status: 'PENDING',
      })
      .select('id')
      .single()

    setSaving(false)

    if (bookingError) {
      setError(bookingError.message)
    } else {
      navigate(`/bookings/${booking.id}/payment`)
    }
  }

  if (loading) return null

  return (
    <>
    <div className="home-shell">
      <div className="top-row">
        <div>
          <p style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>เลือกวันนัด</p>
          <h1 style={{ fontSize: 20 }}>{professional?.professional_name}</h1>
        </div>
        <Link className="link-btn" to={`/consult/${professionalId}`}>
          กลับ
        </Link>
      </div>

      {error && <div className="error-box">{error}</div>}

      {children.length === 0 && (
        <p style={{ color: 'var(--color-ink-soft)' }}>
          ต้องเพิ่มโปรไฟล์ลูกก่อนถึงจะจองได้ค่ะ{' '}
          <Link to="/children/new" style={{ color: 'var(--color-forest)' }}>
            เพิ่มโปรไฟล์ลูก
          </Link>
        </p>
      )}

      {children.length > 0 && (
        <>
          <div className="field">
            <label htmlFor="childSelect">สำหรับลูกคนไหน</label>
            <select id="childSelect" value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)}>
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nickname}
                </option>
              ))}
            </select>
          </div>

          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)', marginBottom: 8 }}>เลือกวัน</p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <button
              type="button"
              onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
              className="link-btn"
              style={{ fontSize: 16 }}
            >
              ‹
            </button>
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              {calendarMonth.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
              className="link-btn"
              style={{ fontSize: 16 }}
            >
              ›
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
            {WEEKDAY_LABELS.map((w) => (
              <div key={w} style={{ textAlign: 'center', fontSize: 11, color: 'var(--color-ink-soft)' }}>
                {w}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 20 }}>
            {buildMonthGrid(calendarMonth.getFullYear(), calendarMonth.getMonth()).map((d, i) => {
              if (!d) return <div key={i} />
              const dateStr = toDateStr(d)
              const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate())
              const hasSlots = availableDatesSet.has(dateStr)
              const isSelected = selectedDate === dateStr

              return (
                <button
                  key={i}
                  type="button"
                  disabled={isPast}
                  onClick={() => {
                    setSelectedDate(dateStr)
                    setSelectedSlot(null)
                  }}
                  style={{
                    aspectRatio: '1',
                    fontSize: 12,
                    border: 'none',
                    borderRadius: 6,
                    cursor: isPast ? 'default' : 'pointer',
                    opacity: isPast ? 0.35 : 1,
                    background: isSelected ? 'var(--color-forest)' : hasSlots ? 'var(--color-panel)' : 'transparent',
                    color: isSelected ? '#fff' : 'var(--color-ink)',
                    boxShadow: isSelected ? 'none' : hasSlots ? 'inset 0 0 0 1px var(--color-forest)' : 'none',
                  }}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>

          {selectedDate && slotsForDate.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginBottom: 20 }}>
              ไม่มีคิวว่างวันนี้ ลองเลือกวันอื่นที่มีกรอบสีเขียวดูค่ะ
            </p>
          )}

          {selectedDate && slotsForDate.length > 0 && (
            <>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)', marginBottom: 8 }}>
                เลือกเวลา
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {slotsForDate.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSlot(s)}
                    style={{
                      fontSize: 13,
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: 'none',
                      background: selectedSlot?.id === s.id ? 'var(--color-ochre)' : 'var(--color-panel)',
                      color: selectedSlot?.id === s.id ? '#fff' : 'var(--color-ink)',
                      boxShadow: selectedSlot?.id === s.id ? 'none' : 'inset 0 0 0 1px var(--color-line)',
                    }}
                  >
                    {s.start_time?.slice(0, 5)}
                  </button>
                ))}
              </div>
            </>
          )}

          {selectedSlot && (
            <>
              <div
                style={{
                  border: '1px solid var(--color-line)',
                  borderRadius: 8,
                  padding: 14,
                  marginBottom: 16,
                  fontSize: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span>วันที่</span>
                  <span>{formatDateLabel(selectedSlot.date)} {selectedSlot.start_time?.slice(0, 5)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>ราคา</span>
                  <span>฿{Number(professional.consultation_fee).toLocaleString()}</span>
                </div>
              </div>

              <button className="btn-primary" onClick={handleConfirm} disabled={saving} style={{ width: '100%' }}>
                {saving ? 'กำลังจอง...' : 'ยืนยันการจอง'}
              </button>
            </>
          )}
        </>
      )}
    </div>
    <BottomNav />
    </>
  )
}
