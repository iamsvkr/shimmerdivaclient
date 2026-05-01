import { api } from './client'

export interface StockItem {
  itemVariantId: number
  itemId: number
  itemName: string
  variantInfo?: string
  quantity: number
  restockDate?: string
}

export interface UpdateStockRequest {
  quantity: number
  restockDate?: string
}

export const stockApi = {
  getAll: (lowStock?: boolean) => {
    const query = lowStock ? '?lowStock=true' : ''
    return api.get<StockItem[]>(`/api/v1/stock${query}`, false)
  },
  update: (variantId: number, data: UpdateStockRequest) =>
    api.put<StockItem>(`/api/v1/admin/stock/${variantId}`, data),
}
