import { api } from './client'

export interface Material {
  id: number
  name: string
  description?: string
  active: boolean
}

export interface MaterialRequest {
  name: string
  description?: string
  isActive?: boolean
}

export const materialsApi = {
  getAll: () => api.get<Material[]>('/api/v1/admin/materials'),
  create: (data: MaterialRequest) => api.post<Material>('/api/v1/admin/materials', data),
  update: (id: number, data: MaterialRequest) =>
    api.put<Material>(`/api/v1/admin/materials/${id}`, data),
}
