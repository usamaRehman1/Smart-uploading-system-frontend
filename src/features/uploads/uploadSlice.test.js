import { describe, expect, it } from 'vitest'
import {
  addUpload,
  removeUpload,
  setUploads,
  uploadProgressUpdated,
  uploadCompleted,
  uploadFailed,
  uploadReducer,
} from './uploadSlice'

describe('upload reducer', () => {
  it('adds a new upload and tracks progress', () => {
    const state = uploadReducer({ items: [] }, addUpload({
      id: '1',
      name: 'project-plan.pdf',
      size: '2.4 MB',
      type: 'PDF',
    }))

    expect(state.items).toHaveLength(1)
    expect(state.items[0].status).toBe('queued')

    const updated = uploadReducer(state, uploadProgressUpdated({ id: '1', progress: 65 }))
    expect(updated.items[0].progress).toBe(65)

    const completed = uploadReducer(updated, uploadCompleted({ id: '1' }))
    expect(completed.items[0].status).toBe('completed')
  })

  it('marks an upload as failed when the backend rejects it', () => {
    const state = uploadReducer({ items: [] }, addUpload({
      id: '3',
      name: 'report.csv',
      size: '1.2 MB',
      type: 'CSV',
    }))

    const next = uploadReducer(state, uploadFailed({ id: '3', error: 'Server unavailable' }))
    expect(next.items[0].status).toBe('failed')
    expect(next.items[0].error).toBe('Server unavailable')
  })

  it('replaces the upload list with server data', () => {
    const next = uploadReducer({ items: [] }, setUploads([
      {
        id: 'server-1',
        name: 'saved-file.pdf',
        size: '2.0 MB',
        type: 'PDF',
        status: 'completed',
        progress: 100,
      },
    ]))

    expect(next.items).toHaveLength(1)
    expect(next.items[0].name).toBe('saved-file.pdf')
  })

  it('removes an upload from the list', () => {
    const state = uploadReducer({ items: [] }, addUpload({
      id: '2',
      name: 'images.zip',
      size: '8.1 MB',
      type: 'ZIP',
    }))

    const next = uploadReducer(state, removeUpload('2'))
    expect(next.items).toHaveLength(0)
  })
})
