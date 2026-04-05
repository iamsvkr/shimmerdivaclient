import { useEffect, useState } from 'react'
import { stockApi } from '../../../api/stock'
import type { StockItem, UpdateStockRequest } from '../../../api/stock'

export default function StockList() {
  const [stock, setStock] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [editing, setEditing] = useState<StockItem | null>(null)
  const [form, setForm] = useState<UpdateStockRequest>({ quantity: 0 })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await stockApi.getAll(lowOnly)
      setStock(data ?? [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [lowOnly])

  const openEdit = (item: StockItem) => {
    setEditing(item)
    setForm({ quantity: item.quantity, restockDate: item.restockDate ?? '' })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    setSaving(true)
    try {
      await stockApi.update(editing.variantId, {
        quantity: form.quantity,
        restockDate: form.restockDate || undefined,
      })
      setEditing(null)
      load()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Stock Management</h1>
      </div>

      <div className="filters">
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
          <input
            type="checkbox"
            style={{ width: 'auto' }}
            checked={lowOnly}
            onChange={(e) => setLowOnly(e.target.checked)}
          />
          Show low stock only
        </label>
        <button className="btn btn-secondary btn-sm" onClick={load}>
          Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading">Loading…</div>
        ) : stock.length === 0 ? (
          <div className="empty-state">No stock data found.</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Variant</th>
                  <th>Quantity</th>
                  <th>Restock Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((item) => (
                  <tr key={item.variantId}>
                    <td><strong>{item.itemName}</strong></td>
                    <td>{item.variantInfo ?? '—'}</td>
                    <td>
                      <span
                        className={`badge ${item.quantity === 0 ? 'badge-red' : item.quantity < 5 ? 'badge-orange' : 'badge-green'}`}
                      >
                        {item.quantity}
                      </span>
                    </td>
                    <td>
                      {item.restockDate
                        ? new Date(item.restockDate).toLocaleDateString()
                        : '—'}
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2 className="modal-title">
              Update Stock — {editing.itemName}
              {editing.variantInfo ? ` (${editing.variantInfo})` : ''}
            </h2>
            <form onSubmit={handleSave}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label>Quantity *</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: parseInt(e.target.value, 10) }))}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label>Restock Date</label>
                <input
                  type="date"
                  value={form.restockDate ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, restockDate: e.target.value }))}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
