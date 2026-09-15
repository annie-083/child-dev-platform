import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useSession } from '../lib/useSession'

export default function ParentProfile() {
  const navigate = useNavigate()
  const session = useSession()
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (session === null) {
      navigate('/login')
      return
    }
    if (!session) return

    async function loadProfile() {
      const { data, error: fetchError } = await supabase
        .from('parent_profiles')
        .select('display_name')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (fetchError) {
        setError(fetchError.message)
      } else if (data) {
        setDisplayName(data.display_name || '')
      }
      setLoading(false)
    }

    loadProfile()
  }, [session, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaved(false)
    setSaving(true)

    // upsert: ถ้ายังไม่มีแถว parent_profiles ของ user นี้ให้สร้างใหม่ ถ้ามีแล้วให้อัปเดต
    const { error: upsertError } = await supabase
      .from('parent_profiles')
      .upsert(
        { user_id: session.user.id, display_name: displayName },
        { onConflict: 'user_id' }
      )

    setSaving(false)

    if (upsertError) {
      setError(upsertError.message)
    } else {
      setSaved(true)
    }
  }

  if (loading) return null

  return (
    <div className="home-shell">
      <div className="top-row">
        <div>
          <p style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>โปรไฟล์ของคุณ</p>
          <h1 style={{ fontSize: 22 }}>ข้อมูลผู้ปกครอง</h1>
        </div>
        <Link className="link-btn" to="/home">
          กลับหน้าแรก
        </Link>
      </div>

      {error && <div className="error-box">{error}</div>}
      {saved && <div className="info-box">บันทึกข้อมูลแล้วค่ะ</div>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="displayName">ชื่อที่แสดง</label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="เช่น คุณแอน"
            required
          />
        </div>

        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? 'กำลังบันทึก...' : 'บันทึกโปรไฟล์'}
        </button>
      </form>

      <div className="next-steps">
        <p style={{ fontWeight: 600, marginBottom: 10 }}>ขั้นตอนถัดไป</p>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <li>
            <Link to="/children">เพิ่มโปรไฟล์ลูก</Link>
          </li>
        </ul>
      </div>
    </div>
  )
}
