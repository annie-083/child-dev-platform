import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')

    if (password !== confirmPassword) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน')
      return
    }
    if (password.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
      return
    }

    setLoading(true)

    // ตรวจสอบว่า username ซ้ำหรือไม่ (ตาราง users ต้องเปิด select ให้เช็คซ้ำได้)
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    if (existing) {
      setError('username นี้มีคนใช้แล้ว ลองชื่ออื่นดูนะคะ')
      setLoading(false)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // ตั้งค่า username ในตาราง public.users (แถวถูกสร้างอัตโนมัติโดย trigger ตอนสมัคร)
    if (data.user) {
      await supabase
        .from('users')
        .update({ username })
        .eq('id', data.user.id)

      // หมายเหตุ: referralCode ยังไม่ถูกบันทึกลงตาราง referrals
      // เพราะตาราง referrals และระบบ Coin จะสร้างในขั้นตอน MVP-4
    }

    setLoading(false)

    if (data.session) {
      navigate('/home')
    } else {
      setInfo('สมัครสำเร็จแล้วค่ะ กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ (เช็คกล่องจดหมายของคุณ)')
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-story">
        <span className="mark">Child Journey</span>
        <h1 className="headline">
          บันทึกทุกก้าวของลูก <em>เล่าเรื่องราวที่</em> เติบโตไปด้วยกัน
        </h1>
        <p className="footnote">
          พื้นที่สำหรับผู้ปกครองบันทึกพัฒนาการ พูดคุยกับคอมมูนิตี้
          และปรึกษานักกิจกรรมบำบัดเมื่อพร้อม
        </p>
      </div>
      <div className="auth-form-side">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h1>สร้างบัญชีผู้ปกครอง</h1>
          <p className="subtitle">เริ่มบันทึก Journey ของลูกได้ในไม่กี่นาที</p>

          {error && <div className="error-box">{error}</div>}
          {info && <div className="info-box">{info}</div>}

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
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
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
              minLength={8}
            />
          </div>

          <div className="field">
            <label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="referralCode">รหัสแนะนำ (ถ้ามี)</label>
            <input
              id="referralCode"
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="ไม่บังคับ"
            />
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'กำลังสมัคร...' : 'สร้างบัญชี'}
          </button>

          <div className="auth-switch">
            มีบัญชีอยู่แล้ว? <Link to="/login">เข้าสู่ระบบ</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
