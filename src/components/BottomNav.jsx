import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/home', label: 'หน้าแรก', icon: '🏠' },
  { to: '/community', label: 'Community', icon: '👥' },
  { to: '/journey', label: 'Journey', icon: '📖' },
  { to: '/consult', label: 'ปรึกษา', icon: '🩺' },
  { to: '/rewards', label: 'Rewards', icon: '🪙' },
]

export default function BottomNav() {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        background: 'var(--color-panel)',
        borderTop: '1px solid var(--color-line)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            padding: '10px 0',
            fontSize: 11,
            textDecoration: 'none',
            color: isActive ? 'var(--color-forest)' : 'var(--color-ink-soft)',
          })}
        >
          <span style={{ fontSize: 18 }}>{tab.icon}</span>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
