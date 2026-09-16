import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useSession } from '../lib/useSession'
import BottomNav from '../components/BottomNav'

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
  return `${years} ขวบ ${months} เดือน`
}

export default function Home() {
  const navigate = useNavigate()
  const session = useSession()
  const [displayName, setDisplayName] = useState('')
  const [firstChild, setFirstChild] = useState(null)
  const [latestEntry, setLatestEntry] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session === null) {
      navigate('/login')
      return
    }
    if (!session) return

    async function load() {
      const { data: profile } = await supabase
        .from('parent_profiles')
        .select('display_name')
        .eq('user_id', session.user.id)
        .maybeSingle()
      if (profile?.display_name) setDisplayName(profile.display_name)

      const { data: children } = await supabase
        .from('children')
        .select('id, nickname, date_of_birth')
        .eq('parent_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (children && children.length > 0) {
        setFirstChild(children[0])

        const { data: entries } = await supabase
          .from('journey_entries')
          .select('content, occurred_at')
          .eq('child_id', children[0].id)
          .order('occurred_at', { ascending: false })
          .limit(1)

        if (entries && entries.length > 0) setLatestEntry(entries[0])
      }

      setLoading(false)
    }
    load()
  }, [session, navigate])

  if (session === undefined || loading) return null

  return (
    <>
      <div className="home-shell">
        <div className="top-row">
          <div>
            <p style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>สวัสดีค่ะ</p>
            <h1 style={{ fontSize: 20 }}>{displayName || session.user.email}</h1>
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

        {/* Child Card */}
        {firstChild ? (
          <Link
            to={`/children/${firstChild.id}`}
            className="child-card"
            style={{ marginBottom: 18 }}
          >
            <div>
              <p className="name">{firstChild.nickname}</p>
              <p className="meta">{calculateAge(firstChild.date_of_birth) || 'ยังไม่ระบุวันเกิด'}</p>
            </div>
            <span style={{ color: 'var(--color-ink-soft)' }}>›</span>
          </Link>
        ) : (
          <Link to="/children/new" className="btn-secondary" style={{ marginBottom: 18 }}>
            + เพิ่มโปรไฟล์ลูกคนแรก
          </Link>
        )}

        {/* Journey Summary */}
        {firstChild && (
          <>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)', marginBottom: 8 }}>
              สรุป Journey
            </p>
            <div
              style={{
                background: 'var(--color-panel)',
                border: '1px solid var(--color-line)',
                borderRadius: 8,
                padding: '12px 14px',
                marginBottom: 18,
              }}
            >
              {latestEntry ? (
                <>
                  <p style={{ fontSize: 13, margin: '0 0 4px' }}>{latestEntry.content}</p>
                  <p style={{ fontSize: 11, color: 'var(--color-ink-soft)', margin: 0 }}>
                    บันทึกเมื่อ {new Date(latestEntry.occurred_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                  </p>
                </>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--color-ink-soft)', margin: 0 }}>
                  ยังไม่มีบันทึก Journey — เริ่มบันทึกแรกได้เลย
                </p>
              )}
            </div>
          </>
        )}

        {/* Upcoming Consultation (placeholder จนกว่าจะสร้าง MVP-2) */}
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)', marginBottom: 8 }}>
          นัดปรึกษาที่จะถึง
        </p>
        <div
          style={{
            border: '1px dashed var(--color-line)',
            borderRadius: 8,
            padding: '12px 14px',
            marginBottom: 20,
            fontSize: 13,
            color: 'var(--color-ink-soft)',
          }}
        >
          ยังไม่เปิดให้จองคิว (เร็วๆ นี้)
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <Link
            to={firstChild ? `/children/${firstChild.id}/journey` : '/children/new'}
            className="btn-primary"
            style={{ flex: 1, textAlign: 'center', fontSize: 13, padding: '10px 4px' }}
          >
            + เพิ่ม Journey
          </Link>
          <Link
            to="/consult"
            className="btn-secondary"
            style={{ flex: 1, textAlign: 'center', fontSize: 13, padding: '10px 4px' }}
          >
            ขอคำปรึกษา
          </Link>
        </div>
      </div>
      <BottomNav />
    </>
  )
}
