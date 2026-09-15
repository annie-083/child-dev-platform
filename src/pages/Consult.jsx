import BottomNav from '../components/BottomNav'

export default function Consult() {
  return (
    <>
      <div className="home-shell">
        <div className="top-row">
          <div>
            <p style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>ปรึกษาผู้เชี่ยวชาญ</p>
            <h1 style={{ fontSize: 22 }}>เร็วๆ นี้</h1>
          </div>
        </div>
        <p style={{ color: 'var(--color-ink-soft)' }}>
          ระบบจองคิวปรึกษานักกิจกรรมบำบัดกำลังอยู่ระหว่างพัฒนา (MVP-2) จะเปิดให้ใช้งานเร็วๆ นี้ค่ะ
        </p>
      </div>
      <BottomNav />
    </>
  )
}
