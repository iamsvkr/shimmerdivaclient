import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authApi } from '../../api/auth'
import type { LoginRequest } from '../../api/auth'

interface AuthState {
  token: string | null
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  token: localStorage.getItem('token'),
  loading: false,
  error: null,
}

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const res = await authApi.login(credentials)
      return res.token
    } catch (err) {
      return rejectWithValue((err as Error).message)
    }
  },
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null
      localStorage.removeItem('token')
    },
    clearError(state) {
      state.error = null
    },
    setToken(state, action) {
      state.token = action.payload
      localStorage.setItem('token', action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.token = action.payload
        localStorage.setItem('token', action.payload)
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { logout, clearError, setToken } = authSlice.actions
export default authSlice.reducer
