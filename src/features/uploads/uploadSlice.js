import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  items: [],
}

const uploadSlice = createSlice({
  name: 'uploads',
  initialState,
  reducers: {
    setUploads: (state, action) => {
      state.items = action.payload.map((item) => ({
        ...item,
        status: item.status || 'completed',
        progress: item.progress ?? 100,
      }))
    },
    addUpload: (state, action) => {
      state.items.unshift({
        ...action.payload,
        status: 'queued',
        progress: 0,
      })
    },
    removeUpload: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload)
    },
    uploadProgressUpdated: (state, action) => {
      const item = state.items.find((entry) => entry.id === action.payload.id)
      if (item) {
        item.progress = action.payload.progress
        item.status = action.payload.progress >= 100 ? 'completed' : 'uploading'
      }
    },
    uploadCompleted: (state, action) => {
      const item = state.items.find((entry) => entry.id === action.payload.id)
      if (item) {
        item.progress = 100
        item.status = 'completed'
        item.error = ''
      }
    },
    uploadFailed: (state, action) => {
      const item = state.items.find((entry) => entry.id === action.payload.id)
      if (item) {
        item.status = 'failed'
        item.error = action.payload.error || 'Upload failed'
      }
    },
  },
})

export const {
  setUploads,
  addUpload,
  removeUpload,
  uploadProgressUpdated,
  uploadCompleted,
  uploadFailed,
} = uploadSlice.actions

export const uploadReducer = uploadSlice.reducer
export default uploadReducer
