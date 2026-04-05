import { useEffect, useState } from 'react'
import { reviewsApi } from '../../../api/reviews'
import type { Review } from '../../../api/reviews'

const stars = (rating: number) => '★'.repeat(rating) + '☆'.repeat(5 - rating)

export default function ReviewsList() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await reviewsApi.getPending()
      setReviews(data ?? [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleApprove = async (id: number, approved: boolean) => {
    setProcessing(id)
    try {
      await reviewsApi.approve(id, approved)
      load()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Pending Reviews</h1>
        <button className="btn btn-secondary btn-sm" onClick={load}>
          Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading">Loading…</div>
        ) : reviews.length === 0 ? (
          <div className="empty-state">No pending reviews. All caught up!</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Customer</th>
                  <th>Rating</th>
                  <th>Review</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.id}>
                    <td><strong>{review.itemName ?? `Item #${review.itemId}`}</strong></td>
                    <td>{review.userEmail ?? '—'}</td>
                    <td>
                      <span style={{ color: '#e65100', fontSize: 13 }}>{stars(review.rating)}</span>
                    </td>
                    <td style={{ maxWidth: 300 }}>
                      {review.title && <strong style={{ display: 'block', fontSize: 13 }}>{review.title}</strong>}
                      <span style={{ fontSize: 13, color: '#555' }}>{review.comment}</span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn btn-success btn-sm"
                          disabled={processing === review.id}
                          onClick={() => handleApprove(review.id, true)}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={processing === review.id}
                          onClick={() => handleApprove(review.id, false)}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
