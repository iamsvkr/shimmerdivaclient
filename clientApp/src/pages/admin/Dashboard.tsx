import { useEffect, useState } from 'react'
import { itemsApi } from '../../api/items'
import { ordersApi } from '../../api/orders'
import { reviewsApi } from '../../api/reviews'
import { stockApi } from '../../api/stock'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalItems: 0,
    pendingOrders: 0,
    pendingReviews: 0,
    lowStockItems: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [items, orders, reviews, lowStock] = await Promise.allSettled([
          itemsApi.getPublicAll({ size: 1 }),
          ordersApi.getAll('PENDING'),
          reviewsApi.getPending(),
          stockApi.getAll(true),
        ])
        setStats({
          totalItems:
            items.status === 'fulfilled' ? items.value?.totalElements ?? 0 : 0,
          pendingOrders:
            orders.status === 'fulfilled' ? (orders.value?.length ?? 0) : 0,
          pendingReviews:
            reviews.status === 'fulfilled' ? (reviews.value?.length ?? 0) : 0,
          lowStockItems:
            lowStock.status === 'fulfilled' ? (lowStock.value?.length ?? 0) : 0,
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      {loading ? (
        <div className="loading">Loading…</div>
      ) : (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalItems}</div>
            <div className="stat-label">Total Items</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.pendingOrders}</div>
            <div className="stat-label">Pending Orders</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.pendingReviews}</div>
            <div className="stat-label">Pending Reviews</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: stats.lowStockItems > 0 ? '#c62828' : undefined }}>
              {stats.lowStockItems}
            </div>
            <div className="stat-label">Low Stock Variants</div>
          </div>
        </div>
      )}

      <div className="card">
        <p style={{ color: '#888', fontSize: 14 }}>
          Welcome to the Shimmer Diva admin panel. Use the sidebar to manage your jewelry catalog,
          orders, promo codes, and more.
        </p>
      </div>
    </div>
  )
}
