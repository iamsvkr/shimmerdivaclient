import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { clearCart, selectCartTotal } from '../../features/cart/cartSlice'
import { setToken } from '../../features/auth/authSlice'
import { paymentApi, initiateRazorpayPayment } from '../../api/payment'
import { api } from '../../api/client'
import { authApi } from '../../api/auth'

const SHIPPING_THRESHOLD = 999
const SHIPPING_FEE = 99

type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'cod'

interface AddressForm {
  fullName: string
  email: string
  phone: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

interface CardForm {
  number: string
  expiry: string
  cvv: string
  name: string
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal',
]

const formatCard = (val: string) =>
  val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()

const formatExpiry = (val: string) => {
  const digits = val.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return `${digits.slice(0, 2)} / ${digits.slice(2)}`
  return digits
}

export default function Checkout() {
  const dispatch = useAppDispatch()
  const items = useAppSelector((state) => state.cart.items)
  const token = useAppSelector((state) => state.auth.token)
  const subtotal = useAppSelector(selectCartTotal)
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
  const total = subtotal + shipping

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [placing, setPlacing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [completedTotal, setCompletedTotal] = useState(0)
  const [orderId] = useState(() => Math.floor(100000 + Math.random() * 900000))
  const [paymentError, setPaymentError] = useState('')

  const [address, setAddress] = useState<AddressForm>({
    fullName: '', email: '', phone: '',
    street: '', city: '', state: '', zipCode: '', country: 'India',
  })

  const [card, setCard] = useState<CardForm>({
    number: '', expiry: '', cvv: '', name: '',
  })

  const [upi, setUpi] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const setAddr = (field: keyof AddressForm, val: string) =>
    setAddress((a) => ({ ...a, [field]: val }))

  const setCardField = (field: keyof CardForm, val: string) =>
    setCard((c) => ({ ...c, [field]: val }))

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!address.fullName.trim()) errs.fullName = 'Required'
    if (!address.email.match(/^[^@]+@[^@]+\.[^@]+$/)) errs.email = 'Valid email required'
    if (!address.phone.match(/^\d{10}$/)) errs.phone = '10-digit mobile number'
    if (!address.street.trim()) errs.street = 'Required'
    if (!address.city.trim()) errs.city = 'Required'
    if (!address.state) errs.state = 'Required'
    if (!address.zipCode.match(/^\d{6}$/)) errs.zipCode = '6-digit PIN code'

    if (paymentMethod === 'card') {
      if (card.number.replace(/\s/g, '').length < 16) errs.cardNumber = 'Enter valid card number'
      if (!card.expiry.includes('/')) errs.expiry = 'Enter MM / YY'
      if (card.cvv.length < 3) errs.cvv = 'Enter 3-digit CVV'
      if (!card.name.trim()) errs.cardName = 'Required'
    }
    if (paymentMethod === 'upi') {
      if (!upi.match(/^[a-zA-Z0-9.\-_]+@[a-zA-Z]+$/)) errs.upi = 'Enter valid UPI ID (e.g. name@upi)'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setPlacing(true)
    setPaymentError('')

    try {
      if (paymentMethod === 'cod') {
        // COD: find/create user, sync cart, save address, place order
        let activeToken = token
        if (!activeToken) {
          const guestRes = await authApi.guestCheckout(address.email)
          activeToken = guestRes.token
          dispatch(setToken(activeToken))
        }

        for (const item of items) {
          await api.post('/api/v1/cart/items', {
            ...(item.variantId ? { itemVariantId: item.variantId } : { itemId: item.itemId }),
            quantity: item.quantity,
          })
        }

        const addressResponse = await api.post<{ id: number }>('/api/v1/addresses', {
          line1: address.street,
          line2: '',
          city: address.city,
          state: address.state,
          pincode: address.zipCode,
          country: address.country,
          isDefault: true,
        })

        await api.post('/api/v1/orders', {
          addressId: addressResponse.id,
          promoCode: '',
        })

        setCompletedTotal(total)
        dispatch(clearCart())
        setSuccess(true)
      } else {
        // For online payments, follow this sequence:
        // 1. Ensure user exists (find or create guest account) → get token
        // 2. Sync local cart items to server
        // 3. Save address → get addressId
        // 4. Place order → get orderId
        // 5. Create Razorpay order with orderId → razorpayId is saved to DB
        // 6. Verify payment → finds order by razorpayId

        // Step 1: Find or create guest user if not logged in
        let activeToken = token
        if (!activeToken) {
          const guestRes = await authApi.guestCheckout(address.email)
          activeToken = guestRes.token
          dispatch(setToken(activeToken))
        }

        console.log('***items', items);
        // Step 2: Sync local cart items to the server
        // The server's placeOrder reads from the server-side cart, so we must push
        // all local cart items there before placing the order.
        // If variantId is missing we fall back to itemId so the server picks the first variant.
        for (const item of items) {
          await api.post('/api/v1/cart/items', {
            ...(item.variantId ? { itemVariantId: item.variantId } : { itemId: item.itemId }),
            quantity: item.quantity,
          })
        }

        const addressResponse = await api.post<{ id: number }>('/api/v1/addresses', {
          line1: address.street,
          line2: '',
          city: address.city,
          state: address.state,
          pincode: address.zipCode,
          country: address.country,
          isDefault: true,
        })

        const addressId = addressResponse.id

        // Step 4: Place order
        const orderResponse = await api.post<{ id: number }>('/api/v1/orders', {
          addressId: addressId,
          promoCode: '', // Add if available
        })

        const dbOrderId = orderResponse.id

        // Step 5: Create Razorpay order with DB orderId
        const razorpayOrderResponse = await paymentApi.createOrder({
          orderId: dbOrderId,
          amount: total,
          currency: 'INR',
          receipt: `order_${dbOrderId}`,
          notes: {
            userEmail: address.email,
            fullName: address.fullName,
            phone: address.phone,
          },
        })

        // Fetch Razorpay key safely from backend
        const keyData = await paymentApi.getRazorpayKey()
        const razorpayKeyId = keyData.keyId

        // Step 4: Initiate payment
        initiateRazorpayPayment(
          razorpayOrderResponse.razorpayId,
          razorpayKeyId,
          total,
          address.email,
          address.phone,
          async (response) => {
            try {
              // Verify payment on backend
              await paymentApi.handlePaymentSuccess({
                razorpayId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              })
              setCompletedTotal(total)
              dispatch(clearCart())
              setSuccess(true)
            } catch (error) {
              console.error('Payment verification failed:', error)
              setPaymentError('Payment verification failed. Please contact support.')
            } finally {
              setPlacing(false)
            }
          },
          (error) => {
            console.error('Payment failed:', error)
            setPaymentError('Payment cancelled or failed. Please try again.')
            setPlacing(false)
          },
        )
      }
    } catch (error) {
      console.error('Order creation failed:', error)
      setPaymentError(error instanceof Error ? error.message : 'An error occurred. Please try again.')
      setPlacing(false)
    }
  }

  if (items.length === 0 && !success) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🛍</div>
        <h2 style={{ fontFamily: '"Playfair Display", serif', marginBottom: 12 }}>Your cart is empty</h2>
        <Link to="/shop"><button className="btn-dark">Browse Collection →</button></Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="container">
        <div className="order-success">
          <div className="success-icon">🎉</div>
          <h1>Order Placed Successfully!</h1>
          <p>
            Thank you for shopping with Shimmer Diva! Your order #{orderId} has been
            confirmed and will be dispatched within 2-3 business days.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/shop">
              <button className="btn-dark">Continue Shopping</button>
            </Link>
            <Link to="/">
              <button className="btn-ghost">Back to Home</button>
            </Link>
          </div>
          <div style={{
            marginTop: 40,
            padding: '20px 32px',
            background: 'var(--cream)',
            borderRadius: 'var(--radius)',
            fontSize: 14,
            color: 'var(--text-muted)',
            lineHeight: 1.8,
            textAlign: 'left',
            maxWidth: 400,
          }}>
            <div><strong>Order ID:</strong> #{orderId}</div>
            <div><strong>Payment:</strong> {
              paymentMethod === 'card' ? 'Credit/Debit Card' :
              paymentMethod === 'upi' ? 'UPI' :
              paymentMethod === 'netbanking' ? 'Net Banking' : 'Cash on Delivery'
            }</div>
            <div><strong>Amount Paid:</strong> ₹{completedTotal.toLocaleString()}</div>
            <div style={{ marginTop: 8, color: '#2e7d32', fontWeight: 500 }}>
              ✓ Confirmation sent to {address.email}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const err = (field: string) =>
    errors[field] ? (
      <span style={{ fontSize: 11, color: '#c62828', marginTop: 2 }}>{errors[field]}</span>
    ) : null

  return (
    <div className="container">
      <div className="checkout-page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
          <div>
            <h1 className="checkout-title">Checkout</h1>
            <p className="checkout-subtitle">Complete your order securely</p>
          </div>
          <Link to="/cart" style={{ fontSize: 14, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Edit cart
          </Link>
        </div>

        <form onSubmit={handlePlaceOrder}>
          <div className="checkout-layout">
            {/* ── Left: Form ── */}
            <div>
              <div className="checkout-form-card">
                {/* Step 1 – Address */}
                <div className="checkout-section">
                  <div className="checkout-section-title">
                    <span className="checkout-step-num">1</span>
                    Delivery Address
                  </div>
                  <div className="form-row" style={{ marginBottom: 14 }}>
                    <div className="checkout-field">
                      <label className="checkout-label">Full Name *</label>
                      <input
                        className="checkout-input"
                        placeholder="Priya Sharma"
                        value={address.fullName}
                        onChange={(e) => setAddr('fullName', e.target.value)}
                      />
                      {err('fullName')}
                    </div>
                    <div className="checkout-field">
                      <label className="checkout-label">Mobile Number *</label>
                      <input
                        className="checkout-input"
                        placeholder="9876543210"
                        maxLength={10}
                        value={address.phone}
                        onChange={(e) => setAddr('phone', e.target.value.replace(/\D/g, ''))}
                      />
                      {err('phone')}
                    </div>
                  </div>

                  <div className="checkout-field" style={{ marginBottom: 14 }}>
                    <label className="checkout-label">Email Address *</label>
                    <input
                      className="checkout-input"
                      type="email"
                      placeholder="priya@example.com"
                      value={address.email}
                      onChange={(e) => setAddr('email', e.target.value)}
                    />
                    {err('email')}
                  </div>

                  <div className="checkout-field" style={{ marginBottom: 14 }}>
                    <label className="checkout-label">Street Address *</label>
                    <input
                      className="checkout-input"
                      placeholder="Flat / House No., Street, Locality"
                      value={address.street}
                      onChange={(e) => setAddr('street', e.target.value)}
                    />
                    {err('street')}
                  </div>

                  <div className="form-row cols-3" style={{ marginBottom: 14 }}>
                    <div className="checkout-field">
                      <label className="checkout-label">City *</label>
                      <input
                        className="checkout-input"
                        placeholder="Mumbai"
                        value={address.city}
                        onChange={(e) => setAddr('city', e.target.value)}
                      />
                      {err('city')}
                    </div>
                    <div className="checkout-field">
                      <label className="checkout-label">State *</label>
                      <select
                        className="checkout-input"
                        value={address.state}
                        onChange={(e) => setAddr('state', e.target.value)}
                        style={{ cursor: 'pointer' }}
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {err('state')}
                    </div>
                    <div className="checkout-field">
                      <label className="checkout-label">PIN Code *</label>
                      <input
                        className="checkout-input"
                        placeholder="400001"
                        maxLength={6}
                        value={address.zipCode}
                        onChange={(e) => setAddr('zipCode', e.target.value.replace(/\D/g, ''))}
                      />
                      {err('zipCode')}
                    </div>
                  </div>
                </div>

                {/* Step 2 – Payment */}
                <div className="checkout-section">
                  <div className="checkout-section-title">
                    <span className="checkout-step-num">2</span>
                    Payment Method
                  </div>

                  <div className="payment-methods">
                    {([
                      { value: 'card', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay', icon: '💳' },
                      { value: 'upi', label: 'UPI', sub: 'GPay, PhonePe, Paytm', icon: '📱' },
                      { value: 'netbanking', label: 'Net Banking', sub: 'All major banks', icon: '🏦' },
                      { value: 'cod', label: 'Cash on Delivery', sub: 'Pay when delivered', icon: '💵' },
                    ] as { value: PaymentMethod; label: string; sub: string; icon: string }[]).map((m) => (
                      <label
                        key={m.value}
                        className={`payment-method${paymentMethod === m.value ? ' selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={m.value}
                          checked={paymentMethod === m.value}
                          onChange={() => setPaymentMethod(m.value)}
                        />
                        <span style={{ fontSize: 20 }}>{m.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div className="payment-method-label">{m.label}</div>
                        </div>
                        <span className="payment-method-sub">{m.sub}</span>
                      </label>
                    ))}
                  </div>

                  {/* Card fields */}
                  {paymentMethod === 'card' && (
                    <div style={{ marginTop: 4 }}>
                      <div className="checkout-field card-number-field" style={{ marginBottom: 14 }}>
                        <label className="checkout-label">Card Number *</label>
                        <input
                          className="checkout-input"
                          placeholder="1234 5678 9012 3456"
                          value={card.number}
                          onChange={(e) => setCardField('number', formatCard(e.target.value))}
                          inputMode="numeric"
                        />
                        <div className="card-icons">
                          <span className="card-icon">💳</span>
                        </div>
                        {err('cardNumber')}
                      </div>

                      <div className="checkout-field" style={{ marginBottom: 14 }}>
                        <label className="checkout-label">Name on Card *</label>
                        <input
                          className="checkout-input"
                          placeholder="PRIYA SHARMA"
                          value={card.name}
                          onChange={(e) => setCardField('name', e.target.value.toUpperCase())}
                        />
                        {err('cardName')}
                      </div>

                      <div className="form-row">
                        <div className="checkout-field">
                          <label className="checkout-label">Expiry *</label>
                          <input
                            className="checkout-input"
                            placeholder="MM / YY"
                            value={card.expiry}
                            onChange={(e) => setCardField('expiry', formatExpiry(e.target.value))}
                            inputMode="numeric"
                          />
                          {err('expiry')}
                        </div>
                        <div className="checkout-field">
                          <label className="checkout-label">CVV *</label>
                          <input
                            className="checkout-input"
                            placeholder="•••"
                            maxLength={4}
                            type="password"
                            value={card.cvv}
                            onChange={(e) => setCardField('cvv', e.target.value.replace(/\D/g, ''))}
                            inputMode="numeric"
                          />
                          {err('cvv')}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* UPI */}
                  {paymentMethod === 'upi' && (
                    <div className="checkout-field" style={{ marginTop: 4 }}>
                      <label className="checkout-label">UPI ID *</label>
                      <input
                        className="checkout-input"
                        placeholder="yourname@upi"
                        value={upi}
                        onChange={(e) => setUpi(e.target.value)}
                      />
                      {err('upi')}
                    </div>
                  )}

                  {/* Net banking */}
                  {paymentMethod === 'netbanking' && (
                    <div className="checkout-field" style={{ marginTop: 4 }}>
                      <label className="checkout-label">Select Bank *</label>
                      <select className="checkout-input">
                        <option value="">Choose your bank</option>
                        {['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank', 'Bank of Baroda', 'Canara Bank', 'Other'].map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* COD note */}
                  {paymentMethod === 'cod' && (
                    <div style={{ marginTop: 4, padding: '12px 16px', background: 'var(--cream)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-muted)' }}>
                      💵 Cash on Delivery is available for orders up to ₹5,000. Extra ₹40 COD handling fee applies.
                    </div>
                  )}

                  <div className="security-note" style={{ marginTop: 20 }}>
                    <span>🔒</span>
                    Your payment information is encrypted with 256-bit SSL security
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right: Order Summary ── */}
            <div>
              <div className="order-summary">
                <div className="order-summary-header">Order Summary</div>

                <div className="order-summary-items">
                  {items.map((item) => (
                    <div key={`${item.itemId}-${item.variantId ?? ''}`} className="order-item">
                      <div className="order-item-img">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)', fontSize: 22 }}>💎</div>
                        )}
                        <span className="order-item-qty-badge">{item.quantity}</span>
                      </div>
                      <div className="order-item-info">
                        <div className="order-item-name">{item.name}</div>
                        {item.variantInfo && (
                          <div className="order-item-variant">{item.variantInfo}</div>
                        )}
                      </div>
                      <div className="order-item-price">
                        ₹{((item.discountPrice ?? item.price) * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-summary-totals">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="summary-row">
                    <span>Shipping</span>
                    <span>
                      {shipping === 0 ? (
                        <span style={{ color: '#2e7d32', fontWeight: 600 }}>FREE</span>
                      ) : `₹${shipping}`}
                    </span>
                  </div>
                  {paymentMethod === 'cod' && (
                    <div className="summary-row">
                      <span>COD Fee</span>
                      <span>₹40</span>
                    </div>
                  )}
                  <div className="summary-row total">
                    <span>Total</span>
                    <span>₹{(total + (paymentMethod === 'cod' ? 40 : 0)).toLocaleString()}</span>
                  </div>

                  {paymentError && (
                    <div style={{
                      padding: '12px 16px',
                      background: '#ffebee',
                      color: '#c62828',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 13,
                      marginBottom: 16,
                      border: '1px solid #ef5350',
                    }}>
                      ⚠️ {paymentError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="place-order-btn"
                    disabled={placing}
                  >
                    {placing ? (
                      <>
                        <div style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)', borderTop: '2px solid #000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        Processing…
                      </>
                    ) : (
                      <>🔒 Place Order · ₹{(total + (paymentMethod === 'cod' ? 40 : 0)).toLocaleString()}</>
                    )}
                  </button>

                  <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12, lineHeight: 1.6 }}>
                    By placing this order, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
