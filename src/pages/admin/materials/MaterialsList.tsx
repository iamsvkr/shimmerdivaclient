import { useEffect, useState } from 'react'
import { materialsApi } from '../../../api/materials'
import type { Material, MaterialRequest } from '../../../api/materials'

const emptyForm = (): MaterialRequest => ({ name: '', description: '', isActive: true })

export default function MaterialsList() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Material | null>(null)
  const [form, setForm] = useState<MaterialRequest>(emptyForm())
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await materialsApi.getAll()
      setMaterials(data ?? [])
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

  const openEdit = (mat: Material) => {
    setEditing(mat)
    setForm({ name: mat.name, description: mat.description ?? '', isActive: mat.isActive })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await materialsApi.update(editing.id, form)
      } else {
        await materialsApi.create(form)
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
        <h1 className="page-title">Materials</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          + Add Material
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading">Loading…</div>
        ) : materials.length === 0 ? (
          <div className="empty-state">No materials yet.</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((mat) => (
                  <tr key={mat.id}>
                    <td><strong>{mat.name}</strong></td>
                    <td>{mat.description ?? '—'}</td>
                    <td>
                      <span className={`badge ${mat.isActive ? 'badge-green' : 'badge-red'}`}>
                        {mat.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(mat)}>
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
          <div className="modal">
            <h2 className="modal-title">{editing ? 'Edit Material' : 'Add Material'}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label>Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Gold, Silver, Platinum"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              {editing && (
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      style={{ width: 'auto' }}
                      checked={form.isActive ?? true}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    />
                    Active
                  </label>
                </div>
              )}
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
