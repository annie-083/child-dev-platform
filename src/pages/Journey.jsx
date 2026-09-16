import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useSession } from '../lib/useSession'
import BottomNav from '../components/BottomNav'

const ENTRY_TYPE_LABELS = {
  OBSERVATION: 'สังเกตการณ์',
  MILESTONE: 'พัฒนาการก้าวสำคัญ',
  CONSULTATION_NOTE: 'บันทึกจากผู้เชี่ยวชาญ',
  FOLLOW_UP: 'ติดตามผล',
  GENERAL: 'ทั่วไป',
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Journey() {
  const { childId } = useParams()
  const navigate = useNavigate()
  const session = useSession()

  const [child, setChild] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [entryType, setEntryType] = useState('OBSERVATION')
  const [content, setContent] = useState('')
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (session === null) {
      navigate('/login')
      return
    }
    if (!session) return

    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, childId, navigate])

  async function loadData() {
    setLoading(true)
    setError('')

    // RLS จำกัดไว้แล้วว่าเห็นได้เฉพาะลูกของ parent_id = ตัวเอง (Rule 1)
    const { data: childData, error: childError } = await supabase
      .from('children')
      .select('id, nickname')
      .eq('id', childId)
      .single()

    if (childError) {
      setError('ไม่พบข้อมูลลูก หรือคุณไม่มีสิทธิ์เข้าถึง')
      setLoading(false)
      return
    }
    setChild(childData)

    const { data: entryData, error: entryError } = await supabase
      .from('journey_entries')
      .select('id, entry_type, content, occurred_at')
      .eq('child_id', childId)
      .order('occurred_at', { ascending: false })

    if (entryError) {
      setError(entryError.message)
    } else {
      setEntries(entryData || [])
    }
    setLoading(false)
  }

  function resetForm() {
    setContent('')
    setEntryType('OBSERVATION')
    setOccurredAt(new Date().toISOString().slice(0, 10))
    setEditingId(null)
    setShowForm(false)
  }

  function openEditForm(entry) {
    setEditingId(entry.id)
    setEntryType(entry.entry_type)
    setContent(entry.content)
    setOccurredAt(entry.occurred_at.slice(0, 10))
    setShowForm(true)
  }

  async function handleSubmitEntry(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    let submitError
    if (editingId) {
      // RLS จำกัดไว้แล้วว่าแก้ได้เฉพาะ entry ที่ parent_id = ตัวเอง
      ;({ error: submitError } = await supabase
        .from('journey_entries')
        .update({ entry_type: entryType, content, occurred_at: occurredAt })
        .eq('id', editingId))
    } else {
      ;({ error: submitError } = await supabase.from('journey_entries').insert({
        child_id: childId,
        parent_id: session.user.id,
        entry_type: entryType,
        content,
        occurred_at: occurredAt,
      }))
    }

    setSaving(false)

    if (submitError) {
      setError(submitError.message)
    } else {
      resetForm()
      loadData()
    }
  }

  async function handleDeleteEntry(entryId) {
    if (!window.confirm('ยืนยันลบบันทึกนี้?')) return
    const { error: deleteError } = await supabase.from('journey_entries').delete().eq('id', entryId)
    if (deleteError) {
      setError(deleteError.message)
    } else {
      loadData()
    }
  }

  if (loading) return null

  return (
    <>
    <div className="home-shell">
      <div className="top-row">
        <div>
          <p style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>Journey</p>
          <h1 style={{ fontSize: 22 }}>{child ? `Journey ของ${child.nickname}` : ''}</h1>
        </div>
        <Link className="link-btn" to="/children">
          กลับ
        </Link>
      </div>

      {error && <div className="error-box">{error}</div>}

      {!showForm && !error && (
        <button className="btn-primary" onClick={() => setShowForm(true)} style={{ marginBottom: 20 }}>
          + เพิ่มบันทึกใหม่
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSubmitEntry} style={{ marginBottom: 24 }}>
          <div className="field-row">
            <div className="field">
              <label htmlFor="occurredAt">วันที่</label>
              <input
                id="occurredAt"
                type="date"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="entryType">ประเภท</label>
              <select id="entryType" value={entryType} onChange={(e) => setEntryType(e.target.value)}>
                {Object.entries(ENTRY_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="content">เกิดอะไรขึ้น</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="เช่น น้องเริ่มพูดคำใหม่เพิ่มขึ้น..."
              required
              style={{ minHeight: 90 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? 'กำลังบันทึก...' : editingId ? 'บันทึกการแก้ไข' : 'บันทึก'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="btn-secondary"
              style={{ width: 'auto', padding: '13px 20px' }}
            >
              ยกเลิก
            </button>
          </div>
        </form>
      )}

      {entries.length === 0 && !error && (
        <p style={{ color: 'var(--color-ink-soft)' }}>ยังไม่มีบันทึก Journey เลย เริ่มบันทึกครั้งแรกได้เลยค่ะ</p>
      )}

      <div style={{ borderLeft: '2px solid var(--color-line)', paddingLeft: 16 }}>
        {entries.map((entry) => (
          <div key={entry.id} style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: 'var(--color-ink-soft)', margin: '0 0 4px' }}>
              {formatDate(entry.occurred_at)} · {ENTRY_TYPE_LABELS[entry.entry_type] || entry.entry_type}
            </p>
            <p style={{ fontSize: 14, margin: '0 0 6px', whiteSpace: 'pre-wrap' }}>{entry.content}</p>
            <div style={{ display: 'flex', gap: 14 }}>
              <button
                type="button"
                onClick={() => openEditForm(entry)}
                className="link-btn"
                style={{ color: 'var(--color-forest)' }}
              >
                แก้ไข
              </button>
              <button
                type="button"
                onClick={() => handleDeleteEntry(entry.id)}
                className="link-btn"
                style={{ color: 'var(--color-error)' }}
              >
                ลบ
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
    <BottomNav />
    </>
  )
}
