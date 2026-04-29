import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import {
  removeFromCart,
  updateQuantity,
  selectCartTotal,
} from '../../features/cart/cartSlice'
import type { CartItem } from '../../features/cart/cartSlice'
import { SHIPPING_FEE, SHIPPING_THRESHOLD } from '../../utils/Constants'

export default function Cart() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const items = useAppSelector((state) => state.cart.items)
  const subtotal = useAppSelector(selectCartTotal)
  const [promoCode, setPromoCode] = useState('')
  const [promoError, setPromoError] = useState('')
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoApplied, setPromoApplied] = useState('')

  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
  const total = subtotal - promoDiscount + shipping

  const handleQty = (item: CartItem, qty: number) => {
    dispatch(updateQuantity({ itemId: item.itemId, variantId: item.variantId, quantity: qty }))
  }

  const handleRemove = (item: CartItem) => {
    dispatch(removeFromCart({ itemId: item.itemId, variantId: item.variantId }))
  }

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return
    setPromoError('')
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/v1/orders/validate-promo?code=${promoCode}&orderAmount=${subtotal}`,
      )
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const discount = data.discountAmount ?? 0
      setPromoDiscount(discount)
      setPromoApplied(promoCode.toUpperCase())
    } catch {
      setPromoError('Invalid or expired promo code')
      setPromoDiscount(0)
      setPromoApplied('')
    }
  }

  const handleRemovePromo = () => {
    setPromoCode('')
    setPromoApplied('')
    setPromoDiscount(0)
    setPromoError('')
  }

  if (items.length === 0) {
    return (
      <div className="container cart-page">
        <div className="cart-empty">
          <span className="cart-empty-icon">🛍</span>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added any jewellery yet.</p>
          <Link to="/shop">
            <button className="btn-dark">Start Shopping →</button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container cart-page">
      <h1 className="cart-page-title">Shopping Cart</h1>

      <div className="cart-layout">
        {/* ── Cart Items ── */}
        <div>
          <div className="cart-items">
            {items.map((item) => (
              <div className="cart-item" key={`${item.itemId}-${item.variantId ?? ''}`}>
                <div className="cart-item-img">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} />
                  ) : (
                    <div className="cart-item-placeholder">💎</div>
                  )}
                </div>

                <div>
                  <div
                    className="cart-item-name"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/item/${item.itemId}`)}
                  >
                    {item.name}
                  </div>
                  {item.variantInfo && (
                    <div className="cart-item-variant">{item.variantInfo}</div>
                  )}
                  <div className="cart-item-price">
                    ₹{(item.discountPrice ?? item.price).toLocaleString()}
                    {item.discountPrice && item.price > item.discountPrice && (
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'line-through', marginLeft: 8 }}>
                        ₹{item.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="cart-item-qty">
                    <button
                      className="cart-qty-btn"
                      onClick={() => handleQty(item, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="cart-qty-val">{item.quantity}</span>
                    <button
                      className="cart-qty-btn"
                      onClick={() => handleQty(item, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="cart-item-right">
                  <div className="cart-item-total">
                    ₹{((item.discountPrice ?? item.price) * item.quantity).toLocaleString()}
                  </div>
                  <button className="cart-remove-btn" onClick={() => handleRemove(item)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <Link to="/shop">
              <button className="btn-ghost">← Continue Shopping</button>
            </Link>
          </div>
        </div>

        {/* ── Summary ── */}
        <div className="cart-summary">
          <h3>Order Summary</h3>

          <div className="summary-row">
            <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
            <span className="amount">₹{subtotal.toLocaleString()}</span>
          </div>

          {promoDiscount > 0 && (
            <div className="summary-row" style={{ color: '#2e7d32' }}>
              <span>Promo ({promoApplied})</span>
              <span>−₹{promoDiscount.toLocaleString()}</span>
            </div>
          )}

          <div className="summary-row">
            <span>Shipping</span>
            <span className="amount">
              {shipping === 0 ? (
                <span style={{ color: '#2e7d32', fontWeight: 600 }}>FREE</span>
              ) : (
                `₹${shipping}`
              )}
            </span>
          </div>

          {shipping > 0 && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -4, marginBottom: 8 }}>
              Add ₹{(SHIPPING_THRESHOLD - subtotal).toLocaleString()} more for free shipping
            </p>
          )}

          <div className="summary-row total">
            <span>Total</span>
            <span className="amount">₹{total.toLocaleString()}</span>
          </div>

          {/* Promo code */}
          {!promoApplied ? (
            <div>
              <div className="promo-row">
                <input
                  className="promo-input"
                  placeholder="PROMO CODE"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                />
                <button className="promo-btn" onClick={handleApplyPromo}>
                  Apply
                </button>
              </div>
              {promoError && (
                <p style={{ fontSize: 12, color: '#c62828', marginTop: 4 }}>{promoError}</p>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '10px 0' }}>
              <span style={{ color: '#2e7d32', fontWeight: 600 }}>✓ {promoApplied} applied</span>
              <button
                onClick={handleRemovePromo}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}
              >
                Remove
              </button>
            </div>
          )}

          <button className="checkout-btn" onClick={() => navigate('/checkout')}>
            Proceed to Checkout →
          </button>

          <div className="security-note" style={{ marginTop: 12 }}>
            <span>🔒</span> Secure checkout · SSL encrypted
          </div>

          {/* Accepted payments */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center', fontSize: 22 }}>
            <span title="Visa">💳</span>
            <span title="UPI">📱</span>
            <span title="Net Banking">🏦</span>
          </div>
        </div>
      </div>
    </div>
  )
}
