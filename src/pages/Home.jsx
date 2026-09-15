import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useSession } from '../lib/useSession'

export default function Home() {
  const navigate = useNavigate()
  const session = useSession()

  if (session === undefined) return null
  if (session === null) {
    navigate('/login')
    return null
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="home-shell">
      <div className="top-row">
        <div>
          <p style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>สวัสดีค่ะ</p>
          <h1 style={{ fontSize: 22 }}>{session.user.email}</h1>
        </div>
        <button className="link-btn" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </div>

      <p style={{ color: 'var(--color-ink-soft)' }}>
        เข้าสู่ระบบสำเร็จ — บัญชีของคุณเชื่อมกับฐานข้อมูลจริงแล้ว
      </p>

      <div className="next-steps">
        <p style={{ fontWeight: 600, marginBottom: 10 }}>เริ่มใช้งานได้เลย</p>
        <ul style={{ paddingLeft: 18, margin: '0 0 14px' }}>
          <li>
            <Link to="/profile">โปรไฟล์ผู้ปกครอง</Link>
          </li>
          <li>
            <Link to="/children">โปรไฟล์ลูก</Link>
          </li>
        </ul>
        <p style={{ fontWeight: 600, marginBottom: 10 }}>ขั้นตอนถัดไปที่ยังไม่ได้สร้าง</p>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <li>บันทึก Journey ของลูก</li>
          <li>เข้าคอมมูนิตี้</li>
        </ul>
      </div>
    </div>
  )
}
