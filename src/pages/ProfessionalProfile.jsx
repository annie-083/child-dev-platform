import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useSession } from '../lib/useSession'
import BottomNav from '../components/BottomNav'

export default function ProfessionalProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const session = useSession()
  const [professional, setProfessional] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (session === null) {
      navigate('/login')
      return
    }
    if (!session) return

    async function load() {
      const { data, error: fetchError } = await supabase
        .from('professionals')
        .select('id, professional_name, profession, bio, education, consultation_fee')
        .eq('id', id)
        .single()

      if (fetchError) {
        setError('ไม่พบข้อมูลผู้เชี่ยวชาญ')
      } else {
        setProfessional(data)
      }
      setLoading(false)
    }
    load()
  }, [session, id, navigate])

  if (loading) return null

  return (
    <>
    <div className="home-shell">
      <div className="top-row">
        <div>
          <p style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>โปรไฟล์ผู้เชี่ยวชาญ</p>
        </div>
        <Link className="link-btn" to="/consult">
          กลับ
        </Link>
      </div>

      {error && <div className="error-box">{error}</div>}

      {professional && (
        <>
          <h1 style={{ fontSize: 20, marginBottom: 4 }}>{professional.professional_name}</h1>
          <p style={{ fontSize: 14, color: 'var(--color-ink-soft)', marginBottom: 16 }}>
            {professional.profession}
          </p>

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: 'var(--color-ink-soft)', margin: '0 0 4px' }}>การศึกษา</p>
            <p style={{ fontSize: 14, margin: 0 }}>{professional.education || '-'}</p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: 'var(--color-ink-soft)', margin: '0 0 4px' }}>เกี่ยวกับ</p>
            <p style={{ fontSize: 14, margin: 0 }}>{professional.bio || '-'}</p>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              padding: '12px 14px',
              border: '1px solid var(--color-line)',
              borderRadius: 8,
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>ค่าปรึกษา</span>
            <span style={{ fontSize: 18, fontWeight: 600 }}>
              ฿{Number(professional.consultation_fee).toLocaleString()}
            </span>
          </div>

          <Link to={`/consult/${professional.id}/book`} className="btn-primary" style={{ display: 'block', textAlign: 'center' }}>
            เลือกวันนัด
          </Link>
        </>
      )}
    </div>
    <BottomNav />
    </>
  )
}
