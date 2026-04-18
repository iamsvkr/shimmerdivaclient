import { api } from './client'

export interface RazorpayOrderResponse {
  id: string
  entity: string
  amount: number
  amount_paid: number
  amount_due: number
  currency: string
  receipt: string
  status: string
  attempts: number
  notes: Record<string, unknown>
  created_at: number
}

export interface PaymentDetails {
  orderId?: number  // Optional: Database Order ID
  amount: number
  currency?: string
  receipt?: string
  notes?: Record<string, unknown>
}

export interface PaymentVerificationPayload {
  razorpayId: string
  razorpayPaymentId: string
  razorpaySignature: string
}

export interface PaymentOrderResponse {
  status: string
  dbOrderId?: number
  razorpayId: string
  amount: number
  currency: string
  receipt: string
  razorpayKeyId: string
  message: string
}

export const paymentApi = {
  /**
   * Create Razorpay order on backend (optional database orderId)
   */
  createOrder: async (details: PaymentDetails): Promise<PaymentOrderResponse> => {
    const payload: Record<string, unknown> = {
      amount: details.amount,
      currency: details.currency || 'INR',
      receipt: details.receipt,
      notes: details.notes,
    }
    if (details.orderId && details.orderId > 0) {
      payload.orderId = details.orderId
    }
    return api.post<PaymentOrderResponse>('/api/payment/create-order', payload)
  },

  /**
   * Verify payment signature after successful payment
   */
  handlePaymentSuccess: async (paymentData: PaymentVerificationPayload): Promise<Record<string, unknown>> => {
    return api.post<Record<string, unknown>>('/api/payment/verify-payment', paymentData)
  },

  /**
   * Get Razorpay public key from backend
   */
  getRazorpayKey: async (): Promise<{ keyId: string }> => {
    return api.get<{ keyId: string }>('/api/payment/key')
  },
}

/**
 * Initialize Razorpay payment on the client side
 * 
 * @param razorpayOrderId - Order ID from Razorpay
 * @param keyId - Razorpay public key
 * @param amount - Payment amount in INR
 * @param email - Customer email
 * @param phone - Customer phone number
 * @param onSuccess - Callback on successful payment
 * @param onError - Callback on payment error
 */
export const initiateRazorpayPayment = (
  razorpayOrderId: string,
  keyId: string,
  amount: number,
  email: string,
  phone: string,
  onSuccess: (response: RazorpayPaymentSuccessResponse) => void,
  onError: (error: unknown) => void,
) => {
  const options = {
    key: keyId,
    amount: amount * 100, // Razorpay expects amount in paise
    currency: 'INR',
    order_id: razorpayOrderId,
    handler(response: RazorpayPaymentSuccessResponse) {
      onSuccess(response)
    },
    prefill: {
      email,
      contact: phone,
    },
    theme: {
      color: '#8B6914', // Shimmer Diva gold theme
    },
    modal: {
      ondismiss() {
        onError(new Error('Payment cancelled by user'))
      },
    },
  }

  // Load Razorpay script if not already loaded
  if (!window.Razorpay) {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => {
      if (window.Razorpay) {
        try {
          new window.Razorpay(options).open()
        } catch (err) {
          onError(err)
        }
      }
    }
    script.onerror = () => {
      onError(new Error('Failed to load Razorpay SDK'))
    }
    document.body.appendChild(script)
  } else {
    try {
      new window.Razorpay(options).open()
    } catch (err) {
      onError(err)
    }
  }
}

export interface RazorpayPaymentSuccessResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

declare global {
  interface Window {
    Razorpay: {
      new (options: unknown): {
        open(): void
        close(): void
      }
    }
  }
}
