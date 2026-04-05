import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../../app/hooks'
import { logout } from '../../features/auth/authSlice'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: '◈', end: true },
  { to: '/admin/items', label: 'Items', icon: '◆' },
  { to: '/admin/categories', label: 'Categories', icon: '◇' },
  { to: '/admin/materials', label: 'Materials', icon: '◉' },
  { to: '/admin/orders', label: 'Orders', icon: '◎' },
  { to: '/admin/stock', label: 'Stock', icon: '▣' },
  { to: '/admin/promocodes', label: 'Promo Codes', icon: '◈' },
  { to: '/admin/reviews', label: 'Reviews', icon: '★' },
]

export default function AdminLayout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">✦ Shimmer Diva</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%' }}>
            Sign Out
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <div className="admin-topbar">
          <span style={{ fontSize: 14, color: '#888' }}>Admin Panel</span>
        </div>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
