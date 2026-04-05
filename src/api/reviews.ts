import { api } from './client'

export interface Review {
  id: number
  itemId: number
  itemName?: string
  userEmail?: string
  rating: number
  title?: string
  comment: string
  approved: boolean
  createdAt: string
}

export const reviewsApi = {
  getPending: () => api.get<Review[]>('/api/v1/admin/reviews'),
  approve: (id: number, approved: boolean) =>
    api.put<Review>(`/api/v1/admin/reviews/${id}/approve?approved=${approved}`),
}
