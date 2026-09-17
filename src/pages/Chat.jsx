import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useSession } from '../lib/useSession'
import RoleAwareBottomNav from '../components/RoleAwareBottomNav'

export default function Chat() {
  const { id: bookingId } = useParams()
  const navigate = useNavigate()
  const session = useSession()

  const [booking, setBooking] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (session === null) {
      navigate('/login')
      return
    }
    if (!session) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, bookingId, navigate])

  async function load() {
    setLoading(true)
    setError('')

    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select('id, status, professionals(professional_name)')
      .eq('id', bookingId)
      .single()

    if (bookingError) {
      setError('ไม่พบการจองนี้ หรือคุณไม่มีสิทธิ์เข้าถึงแชทนี้')
      setLoading(false)
      return
    }
    setBooking(bookingData)

    const { data: messageData } = await supabase
      .from('consultation_chats')
      .select('id, message, message_type, sender_id, created_at')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true })
    setMessages(messageData || [])

    setLoading(false)
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!newMessage.trim()) return
    setSending(true)

    const { error: sendError } = await supabase.from('consultation_chats').insert({
      booking_id: bookingId,
      sender_id: session.user.id,
      message: newMessage,
      message_type: 'TEXT',
    })

    setSending(false)

    if (sendError) {
      setError('ส่งข้อความไม่ได้ค่ะ (แชทเปิดเฉพาะตอนสถานะยืนยันแล้วเท่านั้น)')
    } else {
      setNewMessage('')
      load()
    }
  }

  if (loading) return null

  const canSend = booking?.status === 'CONFIRMED'

  return (
    <>
    <div className="home-shell">
      <div className="top-row">
        <div>
          <p style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>แชท</p>
          <h1 style={{ fontSize: 20 }}>{booking?.professionals?.professional_name}</h1>
        </div>
        <Link className="link-btn" to={`/bookings/${bookingId}`}>
          กลับ
        </Link>
      </div>

      {error && <div className="error-box">{error}</div>}

      {booking && (
        <>
          {!canSend && (
            <div className="info-box">
              {booking.status === 'COMPLETED'
                ? 'การปรึกษาเสร็จสิ้นแล้ว แชทนี้ปิดไม่ให้ส่งข้อความใหม่'
                : 'แชทจะเปิดใช้งานได้หลังจากยืนยันการจองแล้วเท่านั้น'}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {messages.map((m) => {
              const isMine = m.sender_id === session.user.id
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: isMine ? 'flex-end' : 'flex-start',
                    background: isMine ? 'var(--color-ochre)' : 'var(--color-panel)',
                    color: isMine ? '#fff' : 'var(--color-ink)',
                    boxShadow: isMine ? 'none' : 'inset 0 0 0 1px var(--color-line)',
                    borderRadius: 10,
                    padding: '8px 12px',
                    maxWidth: '75%',
                    fontSize: 13,
                  }}
                >
                  {m.message}
                </div>
              )
            })}
            {messages.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>ยังไม่มีข้อความค่ะ</p>
            )}
          </div>

          {canSend && (
            <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="พิมพ์ข้อความ..."
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  fontSize: 14,
                  border: '1px solid var(--color-line)',
                  borderRadius: 6,
                }}
              />
              <button className="btn-primary" type="submit" disabled={sending} style={{ width: 'auto', padding: '12px 18px' }}>
                ส่ง
              </button>
            </form>
          )}
        </>
      )}
    </div>
    <RoleAwareBottomNav />
    </>
  )
}
