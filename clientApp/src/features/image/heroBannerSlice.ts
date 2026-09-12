import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { HeroBanner } from '../../api/heroBanners'

export interface ImageState {
  heroBanners: HeroBanner[] | null
}

const initialState: ImageState = {
  heroBanners: null
}

const heroBannerSlice = createSlice({
  name: 'heroBanner',
  initialState,
  reducers: {
    setHeroBanners(state, action: PayloadAction<HeroBanner[]>) {
      state.heroBanners = action.payload
    },
  },
})

export const { setHeroBanners } = heroBannerSlice.actions
export default heroBannerSlice.reducer