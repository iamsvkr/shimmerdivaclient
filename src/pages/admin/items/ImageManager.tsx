import { useState } from 'react'
import { itemsApi } from '../../../api/items'
import type { Item } from '../../../api/items'

interface Props {
  item: Item
  onClose: () => void
  onUpdate: () => void
}

export default function ImageManager({ item, onClose, onUpdate }: Props) {
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    setSaving(true)
    setError('')
    try {
      await itemsApi.addImages(item.id, [url.trim()])
      setUrl('')
      onUpdate()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (imageId: number) => {
    if (!confirm('Remove this image?')) return
    try {
      await itemsApi.deleteImage(item.id, imageId)
      onUpdate()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 600 }}>
        <h2 className="modal-title">Manage Images — {item.name}</h2>
        {error && <div className="alert alert-error">{error}</div>}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          {(item.images ?? []).length === 0 && (
            <p style={{ color: '#888', fontSize: 13 }}>No images yet.</p>
          )}
          {(item.images ?? []).map((img) => (
            <div key={img.id} style={{ position: 'relative' }}>
              <img
                src={img.imageUrl}
                alt=""
                style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 6, border: '1px solid #ddd' }}
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
              <button
                onClick={() => handleDelete(img.id)}
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  background: '#c62828',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  cursor: 'pointer',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8 }}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste image URL…"
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '…' : 'Add'}
          </button>
        </form>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
