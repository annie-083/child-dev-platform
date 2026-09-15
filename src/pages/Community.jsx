import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useSession } from '../lib/useSession'

export default function Community() {
  const navigate = useNavigate()
  const session = useSession()

  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null) // null = ทั้งหมด
  const [search, setSearch] = useState('')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (session === null) {
      navigate('/login')
      return
    }
    if (!session) return

    loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, navigate])

  useEffect(() => {
    if (!session) return
    loadPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, activeCategory])

  async function loadCategories() {
    const { data } = await supabase
      .from('community_categories')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('sort_order')
    setCategories(data || [])
  }

  async function loadPosts() {
    setLoading(true)
    setError('')

    let query = supabase
      .from('posts')
      .select('id, title, content, is_pinned, is_featured, expert_recommended, created_at, category_id')
      .eq('status', 'PUBLISHED')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (activeCategory) {
      query = query.eq('category_id', activeCategory)
    }

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setPosts(data || [])
    }
    setLoading(false)
  }

  const filteredPosts = search.trim()
    ? posts.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.content.toLowerCase().includes(search.toLowerCase())
      )
    : posts

  return (
    <div className="home-shell">
      <div className="top-row">
        <div>
          <p style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>คอมมูนิตี้</p>
          <h1 style={{ fontSize: 22 }}>เรื่องเล่าจากผู้ปกครอง</h1>
        </div>
        <Link className="link-btn" to="/home">
          กลับหน้าแรก
        </Link>
      </div>

      <div className="field" style={{ marginBottom: 14 }}>
        <input
          type="text"
          placeholder="ค้นหาในคอมมูนิตี้"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 18 }}>
        <button
          onClick={() => setActiveCategory(null)}
          style={{
            fontSize: 12,
            padding: '6px 14px',
            borderRadius: 999,
            border: 'none',
            whiteSpace: 'nowrap',
            background: activeCategory === null ? 'var(--color-forest)' : 'var(--color-panel)',
            color: activeCategory === null ? '#fff' : 'var(--color-ink-soft)',
            boxShadow: activeCategory === null ? 'none' : 'inset 0 0 0 1px var(--color-line)',
          }}
        >
          ทั้งหมด
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              fontSize: 12,
              padding: '6px 14px',
              borderRadius: 999,
              border: 'none',
              whiteSpace: 'nowrap',
              background: activeCategory === cat.id ? 'var(--color-forest)' : 'var(--color-panel)',
              color: activeCategory === cat.id ? '#fff' : 'var(--color-ink-soft)',
              boxShadow: activeCategory === cat.id ? 'none' : 'inset 0 0 0 1px var(--color-line)',
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {error && <div className="error-box">{error}</div>}

      <Link className="btn-primary" to="/community/new" style={{ display: 'block', textAlign: 'center', marginBottom: 20 }}>
        + แบ่งปันเรื่องราว
      </Link>

      {!loading && filteredPosts.length === 0 && (
        <p style={{ color: 'var(--color-ink-soft)' }}>ยังไม่มีโพสต์ในหมวดนี้เลย เริ่มโพสต์แรกได้เลยค่ะ</p>
      )}

      {filteredPosts.map((post) => (
        <Link key={post.id} className="child-card" to={`/community/${post.id}`} style={{ alignItems: 'flex-start' }}>
          <div>
            {post.is_pinned && <span style={{ fontSize: 11, color: 'var(--color-ochre-dark)' }}>📌 ปักหมุด · </span>}
            {post.expert_recommended && (
              <span style={{ fontSize: 11, color: 'var(--color-forest)' }}>✓ แนะนำโดยผู้เชี่ยวชาญ · </span>
            )}
            <p className="name">{post.title}</p>
            <p className="meta" style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {post.content}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}
