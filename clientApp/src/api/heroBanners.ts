import { api } from './client'

export interface HeroBannerImage {
  id: number
  imageUrl: string
  sortOrder: number
  active: boolean
}

export interface HeroBanner {
  id: number
  badgeText: string
  headingMain: string
  headingHighlight: string
  description: string
  buttonText: string
  buttonLink: string
  sortOrder: number
  active: boolean
  images: HeroBannerImage[]
}

export interface HeroBannerRequest {
  badgeText?: string
  headingMain?: string
  headingHighlight?: string
  description?: string
  buttonText?: string
  buttonLink?: string
  sortOrder?: number
  isActive?: boolean
}

export const heroBannersApi = {
  // Public
  getActive: () => api.get<HeroBanner[]>('/api/v1/public/hero-banners', false),

  // Admin
  getAll: () => api.get<HeroBanner[]>('/api/v1/admin/hero-banners'),
  create: (data: HeroBannerRequest) => api.post<HeroBanner>('/api/v1/admin/hero-banners', data),
  update: (id: number, data: HeroBannerRequest) =>
    api.put<HeroBanner>(`/api/v1/admin/hero-banners/${id}`, data),
  delete: (id: number) => api.delete<void>(`/api/v1/admin/hero-banners/${id}`),
  addImages: (id: number, imageUrls: string[]) =>
    api.post<HeroBanner>(`/api/v1/admin/hero-banners/${id}/images`, { imageUrls }),
  deleteImage: (bannerId: number, imageId: number) =>
    api.delete<void>(`/api/v1/admin/hero-banners/${bannerId}/images/${imageId}`),
}
