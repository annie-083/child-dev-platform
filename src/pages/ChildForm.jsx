import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useSession } from '../lib/useSession'
import BottomNav from '../components/BottomNav'

const emptyForm = {
  nickname: '',
  date_of_birth: '',
  gender: '',
  birth_status: 'UNKNOWN',
  birth_history: '',
  health_history: '',
  education_history: '',
  development_history: '',
}

export default function ChildForm() {
  const { id } = useParams() // ถ้ามี id = แก้ไข, ถ้าไม่มี = เพิ่มใหม่
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const session = useSession()

  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (session === null) {
      navigate('/login')
      return
    }
    if (!session || !isEditing) return

    async function loadChild() {
      const { data, error: fetchError } = await supabase
        .from('children')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) {
        setError('ไม่พบข้อมูลลูก หรือคุณไม่มีสิทธิ์เข้าถึง')
      } else {
        setForm({
          nickname: data.nickname || '',
          date_of_birth: data.date_of_birth || '',
          gender: data.gender || '',
          birth_status: data.birth_status || 'UNKNOWN',
          birth_history: data.birth_history || '',
          health_history: data.health_history || '',
          education_history: data.education_history || '',
          development_history: data.development_history || '',
        })
      }
      setLoading(false)
    }

    loadChild()
  }, [session, id, isEditing, navigate])

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const payload = {
      ...form,
      date_of_birth: form.date_of_birth || null,
    }

    let saveError
    if (isEditing) {
      // RLS จำกัดไว้แล้วว่าแก้ได้เฉพาะ children ที่ parent_id = ตัวเอง (Rule 1)
      ;({ error: saveError } = await supabase.from('children').update(payload).eq('id', id))
    } else {
      ;({ error: saveError } = await supabase
        .from('children')
        .insert({ ...payload, parent_id: session.user.id }))
    }

    setSaving(false)

    if (saveError) {
      setError(saveError.message)
    } else {
      navigate('/children')
    }
  }

  async function handleDelete() {
    if (!window.confirm(`ยืนยันลบโปรไฟล์ของ "${form.nickname}"? การลบนี้จะลบ Journey ที่เกี่ยวข้องทั้งหมดด้วย`)) {
      return
    }
    setSaving(true)
    const { error: deleteError } = await supabase.from('children').delete().eq('id', id)
    setSaving(false)

    if (deleteError) {
      setError(deleteError.message)
    } else {
      navigate('/children')
    }
  }

  if (loading) return null

  return (
    <>
    <div className="home-shell">
      <div className="top-row">
        <div>
          <p style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>โปรไฟล์ลูก</p>
          <h1 style={{ fontSize: 22 }}>{isEditing ? 'แก้ไขข้อมูล' : 'เพิ่มโปรไฟล์ลูก'}</h1>
        </div>
        <Link className="link-btn" to="/children">
          กลับ
        </Link>
      </div>

      {isEditing && (
        <Link
          to={`/children/${id}/journey`}
          className="btn-secondary"
          style={{ marginBottom: 20 }}
        >
          ดู Journey ของ{form.nickname || 'ลูก'}
        </Link>
      )}

      {error && <div className="error-box">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="nickname">ชื่อเล่น</label>
          <input
            id="nickname"
            type="text"
            value={form.nickname}
            onChange={(e) => updateField('nickname', e.target.value)}
            required
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="dob">วันเกิด</label>
            <input
              id="dob"
              type="date"
              value={form.date_of_birth}
              onChange={(e) => updateField('date_of_birth', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="gender">เพศ</label>
            <select
              id="gender"
              value={form.gender}
              onChange={(e) => updateField('gender', e.target.value)}
            >
              <option value="">ไม่ระบุ</option>
              <option value="ชาย">ชาย</option>
              <option value="หญิง">หญิง</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="birthStatus">ภาวะการคลอด</label>
          <select
            id="birthStatus"
            value={form.birth_status}
            onChange={(e) => updateField('birth_status', e.target.value)}
          >
            <option value="UNKNOWN">ไม่ระบุ</option>
            <option value="TERM">คลอดครบกำหนด (Term)</option>
            <option value="PRETERM">คลอดก่อนกำหนด (Preterm)</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="birthHistory">ประวัติการคลอด</label>
          <textarea
            id="birthHistory"
            value={form.birth_history}
            onChange={(e) => updateField('birth_history', e.target.value)}
            placeholder="เช่น น้ำหนักแรกเกิด, ภาวะแทรกซ้อนตอนคลอด"
          />
        </div>

        <div className="field">
          <label htmlFor="healthHistory">ประวัติสุขภาพ</label>
          <textarea
            id="healthHistory"
            value={form.health_history}
            onChange={(e) => updateField('health_history', e.target.value)}
            placeholder="เช่น โรคประจำตัว, การแพ้"
          />
        </div>

        <div className="field">
          <label htmlFor="educationHistory">ประวัติการเรียน</label>
          <textarea
            id="educationHistory"
            value={form.education_history}
            onChange={(e) => updateField('education_history', e.target.value)}
            placeholder="เช่น โรงเรียน/ศูนย์พัฒนาเด็กที่เข้าเรียน"
          />
        </div>

        <div className="field">
          <label htmlFor="developmentHistory">ประวัติพัฒนาการ</label>
          <textarea
            id="developmentHistory"
            value={form.development_history}
            onChange={(e) => updateField('development_history', e.target.value)}
            placeholder="เช่น พัฒนาการด้านการพูด การเดิน ที่ผ่านมา"
          />
        </div>

        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? 'กำลังบันทึก...' : isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มโปรไฟล์ลูก'}
        </button>

        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            style={{
              width: '100%',
              marginTop: 12,
              padding: '12px 14px',
              background: 'none',
              border: 'none',
              color: 'var(--color-error)',
              fontSize: 14,
            }}
          >
            ลบโปรไฟล์นี้
          </button>
        )}
      </form>
    </div>
    <BottomNav />
    </>
  )
}
