import { CartItem } from "../features/cart/cartSlice"
import { RAKHI_CATEGORY_ID, SHIPPING_FEE, SHIPPING_THRESHOLD, CUSTOMISED_HAMPERS_CATEGORY_ID } from "./Constants"

export function calculateShipping(items: CartItem[], subtotal: number): number {
    // for customised hampers, shipping is 199 regardless the subtotal
    const hasCustomisedHampersItem = items.some((i) => i.categoryId === CUSTOMISED_HAMPERS_CATEGORY_ID)
    if (hasCustomisedHampersItem) {
        return 199
    }
    const hasRakhiItem = items.some((i) => i.categoryId === RAKHI_CATEGORY_ID)
    return hasRakhiItem || subtotal < SHIPPING_THRESHOLD ? SHIPPING_FEE : 0
}