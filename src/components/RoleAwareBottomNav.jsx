import { Link } from 'react-router-dom'
import { useRole } from '../lib/useRole'
import BottomNav from './BottomNav'
import AdminBottomNav from './AdminBottomNav'

// ใช้ในหน้าที่ทั้ง Parent/Admin/Professional เข้าถึงร่วมกันได้ (เช่น รายละเอียดการจอง, แชท, ชำระเงิน)
// เพื่อให้แต่ละ role เห็นแถบเมนูที่ถูกต้องของตัวเอง ไม่ใช่ของผู้ปกครองตายตัว
export default function RoleAwareBottomNav() {
  const role = useRole()

  if (role === 'ADMIN' || role === 'SUPER_ADMIN') return <AdminBottomNav />
  if (role === 'PROFESSIONAL') {
    return (
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          padding: '12px 0',
          background: 'var(--color-panel)',
          borderTop: '1px solid var(--color-line)',
        }}
      >
        <Link to="/pro" style={{ fontSize: 13, color: 'var(--color-forest)', textDecoration: 'none' }}>
          ‹ กลับไปแดชบอร์ดของฉัน
        </Link>
      </nav>
    )
  }
  return <BottomNav />
}
