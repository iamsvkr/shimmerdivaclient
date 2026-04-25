import { api } from './client'

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  email?: string
}

export const authApi = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/login', data),
  guestCheckout: (email: string) =>
    api.post<AuthResponse>('/api/v1/auth/guest-checkout', { email }),
}
