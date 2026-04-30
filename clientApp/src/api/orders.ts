import { api } from './client'
import type { PageResponse } from './items'

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
export type PaymentStatus = 'PENDING' | 'PAID' | 'COMPLETED' | 'FAILED' | 'REFUNDED'

export interface ShippingAddress {
  id: number
  line1: string
  line2: string
  city: string
  state: string
  pincode: string
  country: string
  phone: string | null
  default: boolean
}

export interface OrderItem {
  orderItemId: number
  itemId: number
  itemName: string
  variantLabel: string
  sku: string
  quantity: number
  priceAtPurchase: number
  subtotal: number
}

export interface Order {
  id: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  subtotalAmount: number
  discountAmount: number
  finalAmount: number
  promoCodeUsed: string | null
  shippingAddress: ShippingAddress
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export interface UpdateOrderStatusRequest {
  orderStatus: OrderStatus
  paymentStatus?: PaymentStatus
}

export const ordersApi = {
  getAll: (status?: OrderStatus) => {
    const query = status ? `?status=${status}` : ''
    return api.get<Order[]>(`/api/v1/admin/orders${query}`)
  },
  updateStatus: (id: number, data: UpdateOrderStatusRequest) =>
    api.put<Order>(`/api/v1/admin/orders/${id}`, data),
}
