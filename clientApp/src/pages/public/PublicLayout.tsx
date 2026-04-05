import { useState } from 'react'
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom'
import { useAppSelector } from '../../app/hooks'
import { selectCartCount } from '../../features/cart/cartSlice'

export default function PublicLayout() {
  const cartCount = useAppSelector(selectCartCount)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQ.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQ.trim())}`)
      setMenuOpen(false)
    }
  }

  return (
    <>
      <nav className="navbar">
        <div className="container navbar-inner">
          <Link to="/" className="navbar-brand">
            <span className="brand-name">✦ Shimmer Diva</span>
            <span className="brand-tagline">Fine Jewellery</span>
          </Link>

          <ul className={`navbar-links${menuOpen ? ' open' : ''}`}>
            <li>
              <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setMenuOpen(false)}>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/shop" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setMenuOpen(false)}>
                Shop
              </NavLink>
            </li>
            <li>
              <form onSubmit={handleSearch} style={{ display: 'flex' }}>
                <div className="search-bar" style={{ maxWidth: 220 }}>
                  <span>🔍</span>
                  <input
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    placeholder="Search jewellery…"
                  />
                </div>
              </form>
            </li>
          </ul>

          <div className="navbar-actions">
            <button
              className="nav-toggle"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
            <Link to="/cart">
              <button className="cart-btn">
                <span>🛍</span>
                Cart
                {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <Outlet />

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="brand-name">✦ Shimmer Diva</div>
              <p>
                Crafting timeless pieces that celebrate your unique story. Each jewel is a testament
                to artistry, passion, and the finest materials.
              </p>
            </div>
            <div className="footer-col">
              <h4>Shop</h4>
              <ul>
                <li><a href="/shop">All Jewellery</a></li>
                <li><a href="/shop?category=rings">Rings</a></li>
                <li><a href="/shop?category=necklaces">Necklaces</a></li>
                <li><a href="/shop?category=earrings">Earrings</a></li>
                <li><a href="/shop?category=bracelets">Bracelets</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Help</h4>
              <ul>
                <li><a href="#">Size Guide</a></li>
                <li><a href="#">Care Instructions</a></li>
                <li><a href="#">Shipping Info</a></li>
                <li><a href="#">Returns Policy</a></li>
                <li><Link to="/login">Admin login</Link></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Connect</h4>
              <ul>
                <li><a href="#">Instagram</a></li>
                <li><a href="#">Pinterest</a></li>
                <li><a href="#">WhatsApp</a></li>
                <li><a href="#">Email Us</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2025 Shimmer Diva. All rights reserved.</span>
            <span>Made with ♥ for jewellery lovers</span>
          </div>
        </div>
      </footer>
    </>
  )
}
