import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useSession } from '../lib/useSession'

function formatDateTime(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const session = useSession()

  const [post, setPost] = useState(null)
  const [authorName, setAuthorName] = useState('ผู้ปกครอง')
  const [likeCount, setLikeCount] = useState(0)
  const [likedByMe, setLikedByMe] = useState(false)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    if (session === null) {
      navigate('/login')
      return
    }
    if (!session) return
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, id, navigate])

  async function loadAll() {
    setLoading(true)
    setError('')

    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select('id, title, content, author_id, created_at')
      .eq('id', id)
      .single()

    if (postError) {
      setError('ไม่พบโพสต์นี้')
      setLoading(false)
      return
    }
    setPost(postData)
    setIsOwner(postData.author_id === session.user.id)

    const { data: profileData } = await supabase
      .from('parent_profiles')
      .select('display_name')
      .eq('user_id', postData.author_id)
      .maybeSingle()
    if (profileData?.display_name) setAuthorName(profileData.display_name)

    const { count } = await supabase
      .from('post_likes')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', id)
    setLikeCount(count || 0)

    const { data: myLike } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', session.user.id)
      .maybeSingle()
    setLikedByMe(Boolean(myLike))

    const { data: commentData } = await supabase
      .from('comments')
      .select('id, content, author_id, created_at')
      .eq('post_id', id)
      .eq('status', 'PUBLISHED')
      .order('created_at', { ascending: true })
    setComments(commentData || [])

    setLoading(false)
  }

  async function toggleLike() {
    if (likedByMe) {
      await supabase.from('post_likes').delete().eq('post_id', id).eq('user_id', session.user.id)
      setLikedByMe(false)
      setLikeCount((c) => c - 1)
    } else {
      await supabase.from('post_likes').insert({ post_id: id, user_id: session.user.id })
      setLikedByMe(true)
      setLikeCount((c) => c + 1)
    }
  }

  async function handleAddComment(e) {
    e.preventDefault()
    if (!newComment.trim()) return

    const { error: commentError } = await supabase.from('comments').insert({
      post_id: id,
      author_id: session.user.id,
      content: newComment,
    })

    if (commentError) {
      setError(commentError.message)
    } else {
      setNewComment('')
      loadAll()
    }
  }

  async function handleDeletePost() {
    if (!window.confirm('ยืนยันลบโพสต์นี้?')) return
    const { error: deleteError } = await supabase.from('posts').delete().eq('id', id)
    if (deleteError) {
      setError(deleteError.message)
    } else {
      navigate('/community')
    }
  }

  if (loading) return null

  return (
    <div className="home-shell">
      <div className="top-row">
        <div>
          <p style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>โพสต์</p>
        </div>
        <Link className="link-btn" to="/community">
          กลับ
        </Link>
      </div>

      {error && <div className="error-box">{error}</div>}

      {post && (
        <>
          <p style={{ fontSize: 12, color: 'var(--color-ink-soft)', margin: '0 0 6px' }}>
            {authorName} · {formatDateTime(post.created_at)}
          </p>
          <h1 style={{ fontSize: 20, marginBottom: 10 }}>{post.title}</h1>
          <p style={{ fontSize: 14, whiteSpace: 'pre-wrap', marginBottom: 16 }}>{post.content}</p>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
            <button
              type="button"
              onClick={toggleLike}
              className="link-btn"
              style={{ color: likedByMe ? 'var(--color-clay)' : 'var(--color-ink-soft)', fontSize: 14 }}
            >
              {likedByMe ? '❤️' : '🤍'} ถูกใจ ({likeCount})
            </button>
            {isOwner && (
              <button type="button" onClick={handleDeletePost} className="link-btn" style={{ color: 'var(--color-error)', fontSize: 14 }}>
                ลบโพสต์
              </button>
            )}
          </div>

          <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>ความคิดเห็น ({comments.length})</p>

          {comments.map((c) => (
            <div key={c.id} style={{ marginBottom: 12, borderBottom: '1px solid var(--color-line)', paddingBottom: 10 }}>
              <p style={{ fontSize: 13, margin: 0 }}>{c.content}</p>
              <p style={{ fontSize: 11, color: 'var(--color-ink-soft)', margin: '4px 0 0' }}>
                {formatDateTime(c.created_at)}
              </p>
            </div>
          ))}

          <form onSubmit={handleAddComment} style={{ marginTop: 16 }}>
            <div className="field">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="เขียนความคิดเห็น..."
                style={{ minHeight: 60 }}
              />
            </div>
            <button className="btn-primary" type="submit">
              ส่งความคิดเห็น
            </button>
          </form>
        </>
      )}
    </div>
  )
}
