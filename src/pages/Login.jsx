import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      setLoading(false)
      return
    }

    // อัปเดตเวลา login ล่าสุด
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', data.user.id)

    // role ต้องถูกตรวจสอบฝั่ง backend เสมอ (Part 2 — role check)
    // RLS policy บนตาราง users อนุญาตให้อ่านได้เฉพาะแถวของตัวเองหรือ admin เท่านั้น
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single()

    setLoading(false)

    if (profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN') {
      navigate('/admin')
    } else if (profile?.role === 'PROFESSIONAL') {
      navigate('/pro')
    } else {
      navigate('/home')
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-story">
        <span className="mark">Child Journey</span>
        <h1 className="headline">
          กลับมา<em>บันทึกต่อ</em> จากจุดที่ลูกเติบโตไป
        </h1>
        <p className="footnote">
          Journey ของคุณยังอยู่ครบ พร้อมให้เข้ามาดูและเพิ่มบันทึกใหม่ได้ทุกเมื่อ
        </p>
      </div>
      <div className="auth-form-side">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h1>เข้าสู่ระบบ</h1>
          <p className="subtitle">ยินดีต้อนรับกลับมา</p>

          {error && <div className="error-box">{error}</div>}

          <div className="field">
            <label htmlFor="email">อีเมล</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">รหัสผ่าน</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>

          <div className="auth-switch">
            ยังไม่มีบัญชี? <Link to="/register">สร้างบัญชีใหม่</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
