import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useSession } from '../lib/useSession'
import BottomNav from '../components/BottomNav'

export default function JourneyPicker() {
  const navigate = useNavigate()
  const session = useSession()
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session === null) {
      navigate('/login')
      return
    }
    if (!session) return

    async function load() {
      const { data } = await supabase
        .from('children')
        .select('id, nickname')
        .eq('parent_id', session.user.id)
        .order('created_at', { ascending: false })

      const list = data || []
      if (list.length === 1) {
        // มีลูกคนเดียว พาไปที่ Journey ของคนนั้นตรงๆ
        navigate(`/children/${list[0].id}/journey`, { replace: true })
        return
      }
      setChildren(list)
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
            <p style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>Journey</p>
            <h1 style={{ fontSize: 22 }}>เลือกลูก</h1>
          </div>
        </div>

        {children.length === 0 && (
          <p style={{ color: 'var(--color-ink-soft)' }}>
            ยังไม่มีข้อมูลลูกเลยค่ะ ไปเพิ่มโปรไฟล์ลูกก่อนได้ที่{' '}
            <a href="/children/new" style={{ color: 'var(--color-forest)' }}>
              หน้าเพิ่มโปรไฟล์ลูก
            </a>
          </p>
        )}

        {children.map((child) => (
          <div
            key={child.id}
            className="child-card"
            onClick={() => navigate(`/children/${child.id}/journey`)}
            style={{ cursor: 'pointer' }}
          >
            <p className="name">{child.nickname}</p>
            <span style={{ color: 'var(--color-ink-soft)' }}>›</span>
          </div>
        ))}
      </div>
      <BottomNav />
    </>
  )
}
