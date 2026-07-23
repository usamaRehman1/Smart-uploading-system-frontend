import { configureStore } from '@reduxjs/toolkit'
import uploadReducer from '../features/uploads/uploadSlice'

export const store = configureStore({
  reducer: {
    uploads: uploadReducer,
  },
})
