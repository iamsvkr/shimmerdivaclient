import { api } from './client'
import type { PageResponse } from './items'

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'

export interface OrderItem {
  id: number
  itemName: string
  quantity: number
  price: number
  variantInfo?: string
}

export interface Order {
  id: number
  userEmail?: string
  orderStatus: OrderStatus
  paymentStatus: PaymentStatus
  subtotal: number
  discount: number
  finalAmount: number
  promoCode?: string
  createdAt: string
  items?: OrderItem[]
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
}

export interface UpdateOrderStatusRequest {
  orderStatus: OrderStatus
  paymentStatus?: PaymentStatus
}

export const ordersApi = {
  getAll: (status?: OrderStatus) => {
    const query = status ? `?status=${status}` : ''
    return api.get<PageResponse<Order>>(`/api/v1/admin/orders${query}`)
  },
  updateStatus: (id: number, data: UpdateOrderStatusRequest) =>
    api.put<Order>(`/api/v1/admin/orders/${id}/status`, data),
}
