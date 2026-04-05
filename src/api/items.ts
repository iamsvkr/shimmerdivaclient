import { api } from './client'

export interface ItemVariant {
  id?: number
  size?: string
  color?: string
  sku?: string
}

export interface ItemImage {
  id: number
  imageUrl: string
}

export interface Item {
  id: number
  name: string
  description?: string
  price: number
  discountPrice?: number
  categoryId?: number
  categoryName?: string
  materialId?: number
  materialName?: string
  tags?: string
  active: boolean
  images?: ItemImage[]
  variants?: ItemVariant[]
  averageRating?: number
  reviewCount?: number
}

export interface CreateItemRequest {
  name: string
  description?: string
  price: number
  discountPrice?: number
  categoryId?: number
  materialId?: number
  tags?: string
  variants?: ItemVariant[]
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export const itemsApi = {
  getAll: (params?: Record<string, string | number>) => {
    const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return api.get<PageResponse<Item>>(`/api/v1/admin/items${query}`)
  },
  getPublicAll: (params?: Record<string, string | number>) => {
    const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return api.get<PageResponse<Item>>(`/api/v1/items${query}`)
  },
  create: (data: CreateItemRequest) => api.post<Item>('/api/v1/admin/items', data),
  update: (id: number, data: Partial<CreateItemRequest>) =>
    api.put<Item>(`/api/v1/admin/items/${id}`, data),
  delete: (id: number) => api.delete<void>(`/api/v1/admin/items/${id}`),
  addImages: (id: number, imageUrls: string[]) =>
    api.post<Item>(`/api/v1/admin/items/${id}/images`, { imageUrls }),
  deleteImage: (itemId: number, imageId: number) =>
    api.delete<void>(`/api/v1/admin/items/${itemId}/images/${imageId}`),
}
