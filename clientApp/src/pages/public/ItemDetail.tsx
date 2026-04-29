import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import type { Item, ItemVariant } from '../../api/items'
import type { Review } from '../../api/reviews'
import { useAppDispatch } from '../../app/hooks'
import { addToCart } from '../../features/cart/cartSlice'
import Toast from '../../components/Toast'

const stars = (n: number) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n))

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()

  const locationItem = (location.state as { item?: Item } | null)?.item ?? null
  const [item, setItem] = useState<Item | null>(locationItem)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(!locationItem)
  const [activeImg, setActiveImg] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<ItemVariant | null>(
    locationItem?.variants?.[0] ?? null,
  )
  const [qty, setQty] = useState(1)
  const [toast, setToast] = useState('')
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/v1/items/${id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((data: Item) => {
        setItem(data)
        if (data.variants?.length) setSelectedVariant(data.variants[0])
      })
      .catch(() => { if (!locationItem) setItem(null) })
      .finally(() => setLoading(false))

    fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/v1/items/${id}/reviews`)
      .then((r) => r.json())
      .then((data) => setReviews(Array.isArray(data) ? data : data.content ?? []))
      .catch(() => {})
  }, [id])

  const handleAddToCart = () => {
    if (!item) return
    dispatch(
      addToCart({
        itemId: item.id,
        variantId: selectedVariant?.id,
        variantInfo: selectedVariant
          ? [selectedVariant.size, selectedVariant.color].filter(Boolean).join(', ')
          : undefined,
        name: item.name,
        price: item.price,
        discountPrice: item.discountPrice,
        imageUrl: item.images?.[0]?.imageUrl,
        quantity: qty,
      }),
    )
    setAdded(true)
    setToast(`${item.name} added to cart!`)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleBuyNow = () => {
    handleAddToCart()
    navigate('/cart')
  }

  if (loading) {
    return (
      <div className="container">
        <div className="page-loading" style={{ minHeight: '60vh' }}>
          <div className="spinner" />
          <span>Loading jewel details…</span>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: 56 }}>💎</div>
        <h2 style={{ fontFamily: '"Playfair Display", serif', margin: '16px 0 8px' }}>Item not found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
          This jewel may have been removed from our collection.
        </p>
        <Link to="/shop"><button className="btn-dark">Browse Collection →</button></Link>
      </div>
    )
  }

  const discount = item.discountPrice && item.price > item.discountPrice
    ? Math.round(((item.price - item.discountPrice) / item.price) * 100)
    : 0

  const tags = item.tags ? item.tags.split(',').map((t) => t.trim()).filter(Boolean) : []

  return (
    <>
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span>›</span>
          <Link to="/shop">Shop</Link>
          <span>›</span>
          {item.category && (
            <>
              <Link to={`/shop?categoryId=${item.categoryId}`}>{item.category}</Link>
              <span>›</span>
            </>
          )}
          <span className="current">{item.name}</span>
        </nav>

        <div className="detail-layout">
          {/* ── Images ── */}
          <div className="detail-images">
            <div className="main-image">
              {item.images?.[activeImg] ? (
                <img src={item.images[activeImg].imageUrl} alt={item.name} />
              ) : (
                <div className="main-image-placeholder">💎</div>
              )}
            </div>
            {item.images && item.images.length > 1 && (
              <div className="thumb-row">
                {item.images.map((img, idx) => (
                  <div
                    key={img.id}
                    className={`thumb${activeImg === idx ? ' active' : ''}`}
                    onClick={() => setActiveImg(idx)}
                  >
                    <img src={img.imageUrl} alt={`View ${idx + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Info ── */}
          <div className="detail-info">
            <div className="detail-badge-row">
              {item.category && (
                <span className="detail-badge category">{item.category}</span>
              )}
              {item.material && (
                <span className="detail-badge material">{item.material}</span>
              )}
            </div>

            <h1 className="detail-name">{item.name}</h1>

            {item.averageRating ? (
              <div className="detail-rating">
                <span className="stars" style={{ fontSize: 18 }}>
                  {stars(item.averageRating)}
                </span>
                <span className="detail-rating-text">
                  {item.averageRating.toFixed(1)} · {item.reviewCount} review
                  {item.reviewCount !== 1 ? 's' : ''}
                </span>
              </div>
            ) : null}

            <div className="detail-price">
              <span className="detail-price-current">
                ₹{(item.discountPrice ?? item.price).toLocaleString()}
              </span>
              {discount > 0 && (
                <span className="detail-price-original">₹{item.price.toLocaleString()}</span>
              )}
              {discount > 0 && (
                <span className="detail-price-save">{discount}% OFF</span>
              )}
            </div>

            {item.description && (
              <p className="detail-desc">{item.description}</p>
            )}

            {/* Variants */}
            {item.variants && item.variants.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div className="detail-section-label">Select Variant</div>
                <div className="variants-row">
                  {item.variants.map((v, idx) => {
                    const label = [v.size, v.color].filter(Boolean).join(' / ') || `Variant ${idx + 1}`
                    return (
                      <button
                        key={v.id ?? idx}
                        className={`variant-chip${selectedVariant === v ? ' selected' : ''}`}
                        onClick={() => setSelectedVariant(v)}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Qty + Actions */}
            <div className="detail-section-label">Quantity</div>
            <div className="qty-row">
              <div className="qty-control">
                <button
                  className="qty-btn"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span className="qty-value">{qty}</span>
                <button className="qty-btn" onClick={() => setQty((q) => q + 1)}>
                  +
                </button>
              </div>

              <button
                className={`add-to-cart-btn${added ? ' added' : ''}`}
                onClick={handleAddToCart}
              >
                {added ? '✓ Added!' : <><span>🛍</span> Add to Cart</>}
              </button>

              <button className="buy-now-btn" onClick={handleBuyNow}>
                Buy Now
              </button>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="tags-row">
                {tags.map((tag) => (
                  <span key={tag} className="tag">#{tag}</span>
                ))}
              </div>
            )}

            {/* Guarantees */}
            <div style={{
              marginTop: 28,
              padding: '16px 20px',
              background: 'var(--cream)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              {[
                { icon: '🚚', text: 'Free delivery on orders above ₹500' },
                { icon: '💎', text: 'Certified authentic jewellery' },
                { icon: '🔄', text: '15-day hassle-free returns' },
                { icon: '🔒', text: '100% secure checkout' },
              ].map((g) => (
                <div key={g.text} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--text-muted)' }}>
                  <span>{g.icon}</span>
                  <span>{g.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Reviews ── */}
        {reviews.length > 0 && (
          <div className="reviews-section">
            <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 28, marginBottom: 24 }}>
              Customer Reviews ({reviews.length})
            </h2>
            {reviews.map((r) => (
              <div key={r.id} className="review-card">
                <div className="review-header">
                  <div className="reviewer-info">
                    <div className="reviewer-name">{r.userEmail?.split('@')[0] ?? 'Customer'}</div>
                    <div className="review-date">
                      {new Date(r.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                  <span className="stars" style={{ fontSize: 16 }}>{stars(r.rating)}</span>
                </div>
                {r.title && <div className="review-title">{r.title}</div>}
                <p className="review-body">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </>
  )
}
