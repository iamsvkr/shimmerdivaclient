import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface CartItem {
  itemId: number
  variantId?: number
  variantInfo?: string
  name: string
  price: number
  discountPrice?: number
  imageUrl?: string
  quantity: number
}

interface CartState {
  items: CartItem[]
}

const load = (): CartItem[] => {
  try {
    const raw = localStorage.getItem('cart')
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

const save = (items: CartItem[]) => {
  localStorage.setItem('cart', JSON.stringify(items))
}

const initialState: CartState = { items: load() }

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<CartItem>) {
      const key = `${action.payload.itemId}-${action.payload.variantId ?? ''}`
      const existing = state.items.find(
        (i) => `${i.itemId}-${i.variantId ?? ''}` === key,
      )
      if (existing) {
        existing.quantity += action.payload.quantity
      } else {
        state.items.push(action.payload)
      }
      save(state.items)
    },
    updateQuantity(
      state,
      action: PayloadAction<{ itemId: number; variantId?: number; quantity: number }>,
    ) {
      const key = `${action.payload.itemId}-${action.payload.variantId ?? ''}`
      const item = state.items.find((i) => `${i.itemId}-${i.variantId ?? ''}` === key)
      if (item) {
        item.quantity = action.payload.quantity
        if (item.quantity <= 0) {
          state.items = state.items.filter(
            (i) => `${i.itemId}-${i.variantId ?? ''}` !== key,
          )
        }
      }
      save(state.items)
    },
    removeFromCart(
      state,
      action: PayloadAction<{ itemId: number; variantId?: number }>,
    ) {
      const key = `${action.payload.itemId}-${action.payload.variantId ?? ''}`
      state.items = state.items.filter((i) => `${i.itemId}-${i.variantId ?? ''}` !== key)
      save(state.items)
    },
    clearCart(state) {
      state.items = []
      localStorage.removeItem('cart')
    },
  },
})

export const { addToCart, updateQuantity, removeFromCart, clearCart } = cartSlice.actions
export default cartSlice.reducer

export const selectCartCount = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, i) => sum + i.quantity, 0)

export const selectCartTotal = (state: { cart: CartState }) =>
  state.cart.items.reduce(
    (sum, i) => sum + (i.discountPrice ?? i.price) * i.quantity,
    0,
  )
