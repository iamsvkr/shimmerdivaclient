import { useEffect, useState } from 'react'
import { itemsApi } from '../../../api/items'
import type { Item } from '../../../api/items'
import ItemForm from './ItemForm'
import ImageManager from './ImageManager'

export default function ItemsList() {
  const [items, setItems] = useState<Item[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [managingImages, setManagingImages] = useState<Item | null>(null)

  const PAGE_SIZE = 20

  const load = async (p = page) => {
    setLoading(true)
    setError('')
    try {
      const res = await itemsApi.getPublicAll({ page: p, size: PAGE_SIZE })
      setItems(res?.content ?? [])
      setTotal(res?.totalElements ?? 0)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [page])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this item?')) return
    try {
      await itemsApi.delete(id)
      load()
    } catch (err) {
      alert((err as Error).message)
    }
  }

  const handleSaved = () => {
    setShowForm(false)
    setEditing(null)
    load()
  }

  const handleImageUpdate = async () => {
    // Refresh just the one item to update image list
    if (!managingImages) return
    try {
      const res = await itemsApi.getPublicAll({ page, size: PAGE_SIZE })
      const updated = res?.content?.find((i) => i.id === managingImages.id)
      if (updated) setManagingImages(updated)
      setItems(res?.content ?? [])
    } catch {}
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Items ({total})</h1>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true) }}>
          + Add Item
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading">Loading…</div>
        ) : items.length === 0 ? (
          <div className="empty-state">No items found.</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Material</th>
                  <th>Price</th>
                  <th>Discount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      {item.tags && (
                        <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{item.tags}</div>
                      )}
                    </td>
                    <td>{item.category ?? '—'}</td>
                    <td>{item.material ?? '—'}</td>
                    <td>₹{item.price?.toLocaleString()}</td>
                    <td>{item.discountPrice ? `₹${item.discountPrice.toLocaleString()}` : '—'}</td>
                    <td>
                      <span className={`badge ${item.active ? 'badge-green' : 'badge-red'}`}>
                        {item.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => { setEditing(item); setShowForm(true) }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setManagingImages(item)}
                        >
                          Images
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
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

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-secondary btn-sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Prev
          </button>
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}

      {showForm && (
        <ItemForm
          item={editing}
          onSave={handleSaved}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {managingImages && (
        <ImageManager
          item={managingImages}
          onClose={() => setManagingImages(null)}
          onUpdate={handleImageUpdate}
        />
      )}
    </div>
  )
}
