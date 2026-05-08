import { api } from './client'

export interface UserActivity {
    sessionId?: string
    activityType?: string
    referenceId?: number
    referenceType?: string
    metadata?: string
}

export interface LogActivityResponse {
  success: boolean
  message: string
  data?: UserActivity
}

export const activityApi = {
  logUserActivity: (data: UserActivity) =>
    api.post<LogActivityResponse>(`/api/v1/activity`, data, false),
}
