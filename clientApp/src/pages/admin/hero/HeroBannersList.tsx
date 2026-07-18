import { useEffect, useState } from 'react'
import { heroBannersApi } from '../../../api/heroBanners'
import type { HeroBanner, HeroBannerRequest } from '../../../api/heroBanners'

const emptyForm = (): HeroBannerRequest => ({
  badgeText: '',
  headingMain: '',
  headingHighlight: '',
  description: '',
  buttonText: '',
  buttonLink: '',
  sortOrder: 0,
  isActive: true,
})

export default function HeroBannersList() {
  const [banners, setBanners] = useState<HeroBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<HeroBanner | null>(null)
  const [form, setForm] = useState<HeroBannerRequest>(emptyForm())
  const [saving, setSaving] = useState(false)

  // Image manager state
  const [expandedBannerId, setExpandedBannerId] = useState<number | null>(null)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [addingImage, setAddingImage] = useState(false)
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await heroBannersApi.getAll()
      setBanners(data ?? [])
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

  const openEdit = (banner: HeroBanner) => {
    setEditing(banner)
    setForm({
      badgeText: banner.badgeText,
      headingMain: banner.headingMain,
      headingHighlight: banner.headingHighlight,
      description: banner.description,
      buttonText: banner.buttonText,
      buttonLink: banner.buttonLink,
      sortOrder: banner.sortOrder,
      isActive: banner.active,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await heroBannersApi.update(editing.id, form)
      } else {
        await heroBannersApi.create(form)
      }
      setShowForm(false)
      load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this hero banner and all its images?')) return
    try {
      await heroBannersApi.delete(id)
      load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleAddImage = async (bannerId: number) => {
    if (!newImageUrl.trim()) return
    setAddingImage(true)
    try {
      await heroBannersApi.addImages(bannerId, [newImageUrl.trim()])
      setNewImageUrl('')
      load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setAddingImage(false)
    }
  }

  const handleDeleteImage = async (bannerId: number, imageId: number) => {
    setDeletingImageId(imageId)
    try {
      await heroBannersApi.deleteImage(bannerId, imageId)
      load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setDeletingImageId(null)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Hero Banners</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          + Add Banner
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading">Loading…</div>
        ) : banners.length === 0 ? (
          <div className="empty-state">No hero banners yet. Add one to replace the default homepage hero.</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Badge</th>
                  <th>Heading</th>
                  <th>Button</th>
                  <th>Images</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((banner) => (
                  <>
                    <tr key={banner.id}>
                      <td style={{ fontWeight: 600 }}>{banner.sortOrder}</td>
                      <td>{banner.badgeText || '—'}</td>
                      <td>
                        <div style={{ maxWidth: 240 }}>
                          <strong>{banner.headingMain || '—'}</strong>
                          {banner.headingHighlight && (
                            <span style={{ color: 'var(--gold, #c9a84c)', marginLeft: 4 }}>
                              [{banner.headingHighlight}]
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{banner.buttonText || '—'}</td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setExpandedBannerId(expandedBannerId === banner.id ? null : banner.id)}
                        >
                          {banner.images.length} image{banner.images.length !== 1 ? 's' : ''} {expandedBannerId === banner.id ? '▲' : '▼'}
                        </button>
                      </td>
                      <td>
                        <span className={`badge ${banner.active ? 'badge-green' : 'badge-red'}`}>
                          {banner.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(banner)}>
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(banner.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>

                    {expandedBannerId === banner.id && (
                      <tr key={`images-${banner.id}`}>
                        <td colSpan={7} style={{ background: 'var(--bg-2, #f8f8f8)', padding: '16px 24px' }}>
                          <div style={{ marginBottom: 12, fontWeight: 600, fontSize: 13 }}>
                            Background Images (rotate in carousel)
                          </div>

                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                            {banner.images.length === 0 && (
                              <span style={{ color: 'var(--text-muted, #999)', fontSize: 13 }}>
                                No images yet — banner will show default gradient.
                              </span>
                            )}
                            {banner.images.map((img) => (
                              <div key={img.id} style={{ position: 'relative' }}>
                                <img
                                  src={img.imageUrl}
                                  alt=""
                                  style={{
                                    width: 120,
                                    height: 80,
                                    objectFit: 'cover',
                                    borderRadius: 6,
                                    border: '1px solid var(--border, #ddd)',
                                  }}
                                />
                                <button
                                  onClick={() => handleDeleteImage(banner.id, img.id)}
                                  disabled={deletingImageId === img.id}
                                  style={{
                                    position: 'absolute',
                                    top: 4,
                                    right: 4,
                                    background: 'rgba(0,0,0,0.65)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: 22,
                                    height: 22,
                                    cursor: 'pointer',
                                    fontSize: 12,
                                    lineHeight: '22px',
                                    textAlign: 'center',
                                    padding: 0,
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>

                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input
                              placeholder="https://example.com/image.jpg"
                              value={newImageUrl}
                              onChange={(e) => setNewImageUrl(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddImage(banner.id)}
                              style={{ flex: 1, maxWidth: 420 }}
                            />
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleAddImage(banner.id)}
                              disabled={addingImage || !newImageUrl.trim()}
                            >
                              {addingImage ? 'Adding…' : '+ Add Image'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 560 }}>
            <h2 className="modal-title">{editing ? 'Edit Hero Banner' : 'Add Hero Banner'}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label>Badge Text</label>
                  <input
                    placeholder="New Collection 2026"
                    value={form.badgeText}
                    onChange={(e) => setForm((f) => ({ ...f, badgeText: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Sort Order</label>
                  <input
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 14 }}>
                <label>Heading *</label>
                <input
                  required
                  placeholder="Where Every Piece Tells a Story"
                  value={form.headingMain}
                  onChange={(e) => setForm((f) => ({ ...f, headingMain: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ marginTop: 14 }}>
                <label>Highlight Word (shown in gold)</label>
                <input
                  placeholder="Story"
                  value={form.headingHighlight}
                  onChange={(e) => setForm((f) => ({ ...f, headingHighlight: e.target.value }))}
                />
                <small style={{ color: 'var(--text-muted, #888)', fontSize: 12 }}>
                  This word/phrase in the heading will be highlighted in gold. Must appear in the heading text above.
                </small>
              </div>

              <div className="form-group" style={{ marginTop: 14 }}>
                <label>Description</label>
                <textarea
                  rows={3}
                  placeholder="Discover our unique jewellery collection…"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
                <div className="form-group">
                  <label>Button Text</label>
                  <input
                    placeholder="Shop Collection →"
                    value={form.buttonText}
                    onChange={(e) => setForm((f) => ({ ...f, buttonText: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Button Link</label>
                  <input
                    placeholder="/shop"
                    value={form.buttonLink}
                    onChange={(e) => setForm((f) => ({ ...f, buttonLink: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 14 }}>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    style={{ width: 'auto' }}
                    checked={form.isActive ?? true}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  />
                  Active (visible on homepage)
                </label>
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
