import { useEffect, useState } from 'react'
import { ordersApi } from '../../../api/orders'
import type { Order, OrderStatus, PaymentStatus } from '../../../api/orders'

const ORDER_STATUSES: OrderStatus[] = [
  'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED',
]

const PAYMENT_STATUSES: PaymentStatus[] = ['PENDING', 'PAID', 'COMPLETED', 'FAILED', 'REFUNDED']

const statusBadge = (s: OrderStatus) => {
  const map: Record<OrderStatus, string> = {
    PENDING: 'badge-orange',
    CONFIRMED: 'badge-blue',
    PROCESSING: 'badge-blue',
    SHIPPED: 'badge-blue',
    DELIVERED: 'badge-green',
    CANCELLED: 'badge-red',
  }
  return map[s] ?? 'badge-gray'
}

const paymentBadge = (s: PaymentStatus) => {
  const map: Record<PaymentStatus, string> = {
    PENDING: 'badge-orange',
    PAID: 'badge-green',
    COMPLETED: 'badge-green',
    FAILED: 'badge-red',
    REFUNDED: 'badge-gray',
  }
  return map[s] ?? 'badge-gray'
}

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [filterStatus, setFilterStatus] = useState<OrderStatus | ''>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState<number | null>(null)
  const [editOrder, setEditOrder] = useState<Order | null>(null)
  const [newOrderStatus, setNewOrderStatus] = useState<OrderStatus>('PENDING')
  const [newPaymentStatus, setNewPaymentStatus] = useState<PaymentStatus | ''>('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await ordersApi.getAll(filterStatus || undefined)
      const orders = Array.isArray(res) ? res : []
      setOrders(orders)
      setTotal(orders.length)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filterStatus])

  const openEdit = (order: Order) => {
    setEditOrder(order)
    setNewOrderStatus(order.status)
    setNewPaymentStatus(order.paymentStatus)
  }

  const handleUpdateStatus = async () => {
    if (!editOrder) return
    setUpdating(editOrder.id)
    try {
      await ordersApi.updateStatus(editOrder.id, {
        orderStatus: newOrderStatus,
        paymentStatus: newPaymentStatus || undefined,
      })
      setEditOrder(null)
      load()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Orders ({total})</h1>
      </div>

      <div className="filters">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as OrderStatus | '')}>
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button className="btn btn-secondary btn-sm" onClick={load}>
          Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">No orders found.</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Order Status</th>
                  <th>Payment</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>
                      <div>{order.shippingAddress.line1}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {order.shippingAddress.city}, {order.shippingAddress.state}
                      </div>
                    </td>
                    <td>
                      ₹{order.finalAmount?.toLocaleString()}
                      {order.discountAmount > 0 && (
                        <div style={{ fontSize: 11, color: '#2e7d32' }}>
                          -{order.discountAmount?.toLocaleString()} off
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${statusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${paymentBadge(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(order)}>
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editOrder && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2 className="modal-title">Update Order #{editOrder.id}</h2>
            <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #eee' }}>
              <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
                <strong>Shipping to:</strong> {editOrder.shippingAddress.line1}, {editOrder.shippingAddress.city}, {editOrder.shippingAddress.state} {editOrder.shippingAddress.pincode}
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: 12, color: '#666' }}>
                <strong>Items:</strong> {editOrder.items.length} item{editOrder.items.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label>Order Status</label>
              <select
                value={newOrderStatus}
                onChange={(e) => setNewOrderStatus(e.target.value as OrderStatus)}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label>Payment Status</label>
              <select
                value={newPaymentStatus}
                onChange={(e) => setNewPaymentStatus(e.target.value as PaymentStatus | '')}
              >
                <option value="">— Unchanged —</option>
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setEditOrder(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={updating === editOrder.id}
                onClick={handleUpdateStatus}
              >
                {updating === editOrder.id ? 'Saving…' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
