import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useSession } from '../lib/useSession'

export default function PostForm() {
  const navigate = useNavigate()
  const session = useSession()

  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (session === null) {
      navigate('/login')
      return
    }
    if (!session) return

    async function loadCategories() {
      const { data } = await supabase
        .from('community_categories')
        .select('id, name')
        .eq('is_active', true)
        .order('sort_order')
      setCategories(data || [])
      if (data && data.length > 0) setCategoryId(data[0].id)
    }
    loadCategories()
  }, [session, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { data, error: insertError } = await supabase
      .from('posts')
      .insert({
        author_id: session.user.id,
        category_id: categoryId || null,
        title,
        content,
        status: 'PUBLISHED',
      })
      .select('id')
      .single()

    setSaving(false)

    if (insertError) {
      setError(insertError.message)
    } else {
      navigate(`/community/${data.id}`)
    }
  }

  return (
    <div className="home-shell">
      <div className="top-row">
        <div>
          <p style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>คอมมูนิตี้</p>
          <h1 style={{ fontSize: 22 }}>แบ่งปันเรื่องราว</h1>
        </div>
        <Link className="link-btn" to="/community">
          กลับ
        </Link>
      </div>

      {error && <div className="error-box">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="category">หมวดหมู่</label>
          <select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="title">หัวข้อ</label>
          <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="field">
          <label htmlFor="content">เนื้อหา</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            style={{ minHeight: 140 }}
          />
        </div>

        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? 'กำลังโพสต์...' : 'โพสต์'}
        </button>
      </form>
    </div>
  )
}
