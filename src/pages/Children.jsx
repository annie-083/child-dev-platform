import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useSession } from '../lib/useSession'

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return ''
  const dob = new Date(dateOfBirth)
  const now = new Date()
  let years = now.getFullYear() - dob.getFullYear()
  let months = now.getMonth() - dob.getMonth()
  if (months < 0) {
    years -= 1
    months += 12
  }
  if (now.getDate() < dob.getDate()) {
    months -= 1
    if (months < 0) {
      years -= 1
      months += 11
    }
  }
  return `${years} ขวบ ${months} เดือน`
}

export default function Children() {
  const navigate = useNavigate()
  const session = useSession()
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (session === null) {
      navigate('/login')
      return
    }
    if (!session) return

    async function loadChildren() {
      // RLS จำกัดไว้แล้วว่าเห็นได้เฉพาะลูกของ parent_id = ตัวเอง
      const { data, error: fetchError } = await supabase
        .from('children')
        .select('id, nickname, date_of_birth, gender, profile_image')
        .order('created_at', { ascending: false })

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setChildren(data || [])
      }
      setLoading(false)
    }

    loadChildren()
  }, [session, navigate])

  if (loading) return null

  return (
    <div className="home-shell">
      <div className="top-row">
        <div>
          <p style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>โปรไฟล์ลูก</p>
          <h1 style={{ fontSize: 22 }}>ลูกของฉัน</h1>
        </div>
        <Link className="link-btn" to="/home">
          กลับหน้าแรก
        </Link>
      </div>

      {error && <div className="error-box">{error}</div>}

      {children.length === 0 && (
        <p style={{ color: 'var(--color-ink-soft)', marginBottom: 20 }}>
          ยังไม่มีข้อมูลลูกเลยค่ะ เริ่มเพิ่มโปรไฟล์ลูกคนแรกได้เลย
        </p>
      )}

      {children.map((child) => (
        <Link key={child.id} className="child-card" to={`/children/${child.id}`}>
          <div>
            <p className="name">{child.nickname}</p>
            <p className="meta">
              {child.date_of_birth ? calculateAge(child.date_of_birth) : 'ยังไม่ระบุวันเกิด'}
              {child.gender ? ` · ${child.gender}` : ''}
            </p>
          </div>
          <span style={{ color: 'var(--color-ink-soft)' }}>›</span>
        </Link>
      ))}

      <Link className="btn-secondary" to="/children/new" style={{ marginTop: 12 }}>
        + เพิ่มโปรไฟล์ลูก
      </Link>
    </div>
  )
}
