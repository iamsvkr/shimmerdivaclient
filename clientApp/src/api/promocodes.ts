import { api } from './client'

export type DiscountType = 'PERCENTAGE' | 'FLAT'

export interface PromoCode {
  id: number
  code: string
  description?: string
  discountType: DiscountType
  discountValue: number
  minOrderAmount?: number
  maxDiscountAmount?: number
  usageLimit?: number
  usageCount?: number
  validFrom: string
  validUntil: string
  isActive?: boolean
}

export interface PromoCodeRequest {
  code: string
  description?: string
  discountType: DiscountType
  discountValue: number
  minOrderAmount?: number
  maxDiscountAmount?: number
  usageLimit?: number
  validFrom: string
  validUntil: string
}

export const promoCodesApi = {
  getAll: () => api.get<PromoCode[]>('/api/v1/admin/promocodes'),
  create: (data: PromoCodeRequest) => api.post<PromoCode>('/api/v1/admin/promocodes', data),
  update: (id: number, data: Partial<PromoCodeRequest>) =>
    api.put<PromoCode>(`/api/v1/admin/promocodes/${id}`, data),
}
