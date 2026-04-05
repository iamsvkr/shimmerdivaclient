import { api } from './client'

export interface Category {
  id: number
  name: string
  description?: string
  active: boolean
}

export interface CategoryRequest {
  name: string
  description?: string
  isActive?: boolean
}

export const categoriesApi = {
  getAll: () => api.get<Category[]>('/api/v1/admin/categories'),
  create: (data: CategoryRequest) => api.post<Category>('/api/v1/admin/categories', data),
  update: (id: number, data: CategoryRequest) =>
    api.put<Category>(`/api/v1/admin/categories/${id}`, data),
}
