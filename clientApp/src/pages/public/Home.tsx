import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { itemsApi } from '../../api/items'
import { categoriesApi } from '../../api/categories'
import type { Item } from '../../api/items'
import type { Category } from '../../api/categories'
import Toast from '../../components/Toast'
import ProductCard from '../../components/ProductCard'

const CATEGORY_ICONS: Record<string, string> = {
  rings: '💍',
  necklaces: '📿',
  earrings: '✨',
  bracelets: '⌚',
  bangles: '🔮',
  pendants: '🌙',
  anklets: '🦋',
  nose: '❋',
}

const getCategoryIcon = (name: string) => {
  const key = name.toLowerCase()
  for (const [k, v] of Object.entries(CATEGORY_ICONS)) {
    if (key.includes(k)) return v
  }
  return '💎'
}

const CATEGORY_GRADIENTS = [
  'linear-gradient(135deg, #1a1228 0%, #2d1f3d 100%)',
  'linear-gradient(135deg, #0d1a12 0%, #1a3020 100%)',
  'linear-gradient(135deg, #1a0d0d 0%, #3d1515 100%)',
  'linear-gradient(135deg, #0d0d1a 0%, #1a2040 100%)',
  'linear-gradient(135deg, #1a1810 0%, #3d3518 100%)',
  'linear-gradient(135deg, #0d1a1a 0%, #1a3535 100%)',
]

const TESTIMONIALS = [
  { name: 'Priya S.', loc: 'Mumbai', text: 'Absolutely stunning! The kashmiri earrings I ordered is exactly as pictured — delicate, beautifully crafted, and arrived in gorgeous packaging.', stars: 5 },
  { name: 'Ananya K.', loc: 'Bangalore', text: 'Shimmer Diva never disappoints. The quality is exceptional and the pieces always get compliments. My go-to for all jewellery gifts.', stars: 4.5 },
  { name: 'Meera R.', loc: 'Delhi', text: 'Ordered the western earrings and pendants and it was just perfect. The craftsmanship is superb and customer service was amazing. Will definitely order again!', stars: 5 },
]

const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n)

export default function Home() {
  const [featuredItems, setFeaturedItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  useEffect(() => {
    Promise.allSettled([
      itemsApi.getPublicAll({ size: 8, sortBy: 'createdAt', sortDir: 'desc' }),
      categoriesApi.getAll(),
    ]).then(([items, cats]) => {
      if (items.status === 'fulfilled') setFeaturedItems(items.value?.content ?? [])
      if (cats.status === 'fulfilled') setCategories(cats.value ?? [])
      setLoading(false)
    })
  }, []);

  return (
    <>
      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-pattern" />
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              New Collection {new Date().getFullYear()}
            </div>
            <h1>
              Where Every Piece
              <br />
              Tells a <span className="highlight">Story</span>
            </h1>
            <p>
              Discover our unique jewellery collection — from timeless western
              classics to contemporary traditional designs. Made for the woman who
              knows her worth.
            </p>
            <div className="hero-actions">
              <Link to="/shop">
                <button className="btn-gold">Shop Collection →</button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <div className="features-strip">
        <div className="container">
          <div className="features-grid">
            {[
              {
                icon: "🚚",
                title: "Free Delivery",
                desc: "On all orders above ₹500",
              },
              {
                icon: "💎",
                title: "Certified Quality",
                desc: "Certified jewellery",
              },
              {
                icon: "🔒",
                title: "Secure Payment",
                desc: "Your transactions are safe",
              },
            ].map(f => (
              <div key={f.title} className="feature-item">
                <span className="feature-icon">{f.icon}</span>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CATEGORIES ── */}
      {categories.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <span className="section-label">Browse by Style</span>
              <h2 className="section-title">Shop by Category</h2>
              <div className="divider">
                <span>✦</span>
              </div>
            </div>
            <div
              className="category-grid"
              style={{
                gridTemplateColumns: `repeat(auto-fill, minmax(150px, 1fr))`,
              }}
            >
              {categories.slice(0, 6).map((cat, idx) => (
                <Link
                  key={cat.id}
                  to={`/shop?categoryId=${cat.id}`}
                  className="category-card"
                  style={{
                    background:
                      CATEGORY_GRADIENTS[idx % CATEGORY_GRADIENTS.length],
                  }}
                >
                  <div className="category-card-bg" />
                  <div className="category-card-content">
                    <span className="category-icon">
                      {getCategoryIcon(cat.name)}
                    </span>
                    <div className="category-name">{cat.name}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FEATURED ITEMS ── */}
      <section
        className="section"
        style={{ background: "#fff", paddingTop: 80 }}
      >
        <div className="container">
          <div className="section-header">
            <span className="section-label">Handpicked for You</span>
            <h2 className="section-title">New Arrivals</h2>
            <div className="divider">
              <span>✦</span>
            </div>
            <p className="section-sub">
              Each piece is crafted with love using the finest metals and
              stones.
            </p>
          </div>

          {loading ? (
            <div className="page-loading">
              <div className="spinner" />
            </div>
          ) : (
            <>
              <div className="products-grid">
                {featuredItems.map(item => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    categories={categories}
                    onAddToCart={message => setToast(message)}
                  />
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: 48 }}>
                <Link to="/shop">
                  <button className="btn-dark">View All Jewellery →</button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── BANNER ── */}
      <section
        style={{
          background:
            "linear-gradient(135deg, #1a0a00 0%, #3d1f00 50%, #1a0a00 100%)",
          padding: "80px 0",
          textAlign: "center",
        }}
      >
        <div className="container">
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: "var(--gold)",
              display: "block",
              marginBottom: 12,
            }}
          >
            Limited Time
          </span>
          <h2
            style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: "clamp(28px, 4vw, 48px)",
              color: "#fff",
              marginBottom: 16,
            }}
          >
            The Bridal Collection is Here
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: 16,
              marginBottom: 32,
              maxWidth: 460,
              margin: "0 auto 32px",
            }}
          >
            Exquisite sets crafted for your most special day. Gold, diamond &
            more.
          </p>
          <Link to="/shop">
            <button className="btn-gold">Explore Bridal →</button>
          </Link>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Customer Love</span>
            <h2 className="section-title">What Our Customers Say</h2>
            <div className="divider">
              <span>✦</span>
            </div>
          </div>
          <div className="testimonials-grid">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="testimonial-card">
                <p className="testimonial-text">{t.text}</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.name[0]}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-loc">
                      <span className="stars" style={{ fontSize: 11 }}>
                        {stars(t.stars)}
                      </span>
                      {" · "}
                      {t.loc}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </>
  )
}
