import { useState, useEffect } from 'react'
import { itemsApi } from '../../../api/items'
import { categoriesApi } from '../../../api/categories'
import { materialsApi } from '../../../api/materials'
import type { Item, CreateItemRequest, ItemVariant } from '../../../api/items'
import type { Category } from '../../../api/categories'
import type { Material } from '../../../api/materials'

interface Props {
  item?: Item | null
  onSave: () => void
  onCancel: () => void
}

const emptyVariant = (): ItemVariant => ({ size: '', color: '', sku: '' })

export default function ItemForm({ item, onSave, onCancel }: Props) {
  const [categories, setCategories] = useState<Category[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<CreateItemRequest>({
    name: item?.name ?? '',
    description: item?.description ?? '',
    price: item?.price ?? 0,
    discountPrice: item?.discountPrice,
    categoryId: item?.categoryId,
    materialId: item?.materialId,
    tags: item?.tags ?? '',
    variants: item?.variants?.length ? item.variants : [emptyVariant()],
  })

  useEffect(() => {
    Promise.all([categoriesApi.getAll(), materialsApi.getAll()])
      .then(([cats, mats]) => {
        setCategories(cats ?? [])
        setMaterials(mats ?? [])
        setForm((f) => ({
          ...f,
          categoryId: f.categoryId || cats?.find((c) => c.name === item?.category)?.id,
          materialId: f.materialId || mats?.find((m) => m.name === item?.material)?.id,
        }))
      })
      .catch(() => {})
  }, [])

  const set = (field: keyof CreateItemRequest, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }))

  const setVariant = (idx: number, field: keyof ItemVariant, value: string) => {
    const variants = [...(form.variants ?? [])]
    variants[idx] = { ...variants[idx], [field]: value }
    set('variants', variants)
  }

  const addVariant = () => set('variants', [...(form.variants ?? []), emptyVariant()])
  const removeVariant = (idx: number) =>
    set(
      'variants',
      (form.variants ?? []).filter((_, i) => i !== idx),
    )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (item) {
        await itemsApi.update(item.id, form)
      } else {
        await itemsApi.create(form)
      }
      onSave()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  console.log('Form state:', form, item)

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 680 }}>
        <h2 className="modal-title">{item ? 'Edit Item' : 'Add New Item'}</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Gold Nose Ring"
              />
            </div>
            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Product description…"
              />
            </div>
            <div className="form-group">
              <label>Price (₹) *</label>
              <input
                type="number"
                required
                min={0}
                step={0.01}
                value={form.price}
                onChange={(e) => set('price', parseFloat(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label>Discount Price (₹)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.discountPrice ?? ''}
                onChange={(e) =>
                  set('discountPrice', e.target.value ? parseFloat(e.target.value) : undefined)
                }
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                value={form.categoryId ?? ''}
                onChange={(e) => set('categoryId', e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">— None —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Material</label>
              <select
                value={form.materialId ?? ''}
                onChange={(e) => set('materialId', e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">— None —</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group full-width">
              <label>Tags (comma-separated)</label>
              <input
                value={form.tags}
                onChange={(e) => set('tags', e.target.value)}
                placeholder="e.g. bridal, gold, nose"
              />
            </div>
          </div>

          {/* Variants */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ fontWeight: 600 }}>Variants</label>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addVariant}>
                + Add Variant
              </button>
            </div>
            {(form.variants ?? []).map((v, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr auto',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <input
                  placeholder="Size"
                  value={v.size ?? ''}
                  onChange={(e) => setVariant(idx, 'size', e.target.value)}
                />
                <input
                  placeholder="Color"
                  value={v.color ?? ''}
                  onChange={(e) => setVariant(idx, 'color', e.target.value)}
                />
                <input
                  placeholder="SKU"
                  value={v.sku ?? ''}
                  onChange={(e) => setVariant(idx, 'sku', e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-danger btn-sm btn-icon"
                  onClick={() => removeVariant(idx)}
                  title="Remove variant"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : item ? 'Update Item' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
