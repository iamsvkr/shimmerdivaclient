import { useEffect, useState } from 'react'
import { promoCodesApi } from '../../../api/promocodes'
import type { PromoCode, PromoCodeRequest, DiscountType } from '../../../api/promocodes'

const now = () => new Date().toISOString().slice(0, 16)
const oneMonth = () => {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 16)
}

const emptyForm = (): PromoCodeRequest => ({
  code: '',
  description: '',
  discountType: 'PERCENTAGE',
  discountValue: 10,
  validFrom: now(),
  validUntil: oneMonth(),
})

export default function PromoCodesList() {
  const [codes, setCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<PromoCode | null>(null)
  const [form, setForm] = useState<PromoCodeRequest>(emptyForm())
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await promoCodesApi.getAll()
      setCodes(data ?? [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  const openEdit = (code: PromoCode) => {
    setEditing(code)
    setForm({
      code: code.code,
      description: code.description ?? '',
      discountType: code.discountType,
      discountValue: code.discountValue,
      minOrderAmount: code.minOrderAmount,
      maxDiscountAmount: code.maxDiscountAmount,
      usageLimit: code.usageLimit,
      validFrom: code.validFrom?.slice(0, 16) ?? now(),
      validUntil: code.validUntil?.slice(0, 16) ?? oneMonth(),
    })
    setShowForm(true)
  }

  const set = (field: keyof PromoCodeRequest, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await promoCodesApi.update(editing.id, form)
      } else {
        await promoCodesApi.create(form)
      }
      setShowForm(false)
      load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Promo Codes</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          + Add Promo Code
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading">Loading…</div>
        ) : codes.length === 0 ? (
          <div className="empty-state">No promo codes yet.</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Usage</th>
                  <th>Valid Until</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.code}</strong>{c.description && <div style={{ fontSize: 11, color: '#888' }}>{c.description}</div>}</td>
                    <td><span className="badge badge-blue">{c.discountType}</span></td>
                    <td>
                      {c.discountType === 'PERCENTAGE'
                        ? `${c.discountValue}%`
                        : `₹${c.discountValue}`}
                      {c.maxDiscountAmount && (
                        <div style={{ fontSize: 11, color: '#888' }}>max ₹{c.maxDiscountAmount}</div>
                      )}
                    </td>
                    <td>{c.minOrderAmount ? `₹${c.minOrderAmount}` : '—'}</td>
                    <td>
                      {c.usageCount ?? 0}
                      {c.usageLimit ? ` / ${c.usageLimit}` : ''}
                    </td>
                    <td>
                      {new Date(c.validUntil) < new Date() ? (
                        <span className="badge badge-red">Expired</span>
                      ) : (
                        new Date(c.validUntil).toLocaleDateString()
                      )}
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 600 }}>
            <h2 className="modal-title">{editing ? 'Edit Promo Code' : 'Add Promo Code'}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Code *</label>
                  <input
                    required
                    value={form.code}
                    onChange={(e) => set('code', e.target.value.toUpperCase())}
                    placeholder="e.g. DIVA20"
                  />
                </div>
                <div className="form-group">
                  <label>Discount Type *</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => set('discountType', e.target.value as DiscountType)}
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <input
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    placeholder="Internal note"
                  />
                </div>
                <div className="form-group">
                  <label>Discount Value *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={0.01}
                    value={form.discountValue}
                    onChange={(e) => set('discountValue', parseFloat(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label>Min Order Amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.minOrderAmount ?? ''}
                    onChange={(e) =>
                      set('minOrderAmount', e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Max Discount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.maxDiscountAmount ?? ''}
                    onChange={(e) =>
                      set('maxDiscountAmount', e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Usage Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={form.usageLimit ?? ''}
                    onChange={(e) =>
                      set('usageLimit', e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    placeholder="Unlimited"
                  />
                </div>
                <div className="form-group">
                  <label>Valid From *</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.validFrom}
                    onChange={(e) => set('validFrom', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Valid Until *</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.validUntil}
                    onChange={(e) => set('validUntil', e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
