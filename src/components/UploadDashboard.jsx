import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { UploadCloud, Sparkles, CheckCircle2, FileUp, Trash2, ArrowRight, AlertCircle } from 'lucide-react'
import { addUpload, removeUpload, setUploads, uploadCompleted, uploadFailed, uploadProgressUpdated } from '../features/uploads/uploadSlice'

const API_URL = 'https://smart-uploading-system-backend-production.up.railway.app/api/upload'

const formatBytes = (size) => {
  if (typeof size === 'number') {
    const units = ['B', 'KB', 'MB', 'GB']
    let value = size
    let unitIndex = 0
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024
      unitIndex += 1
    }
    return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
  }

  return size
}

function UploadDashboard() {
  const dispatch = useDispatch()
  const uploads = useSelector((state) => state.uploads.items)
  const [dragActive, setDragActive] = useState(false)

  const summary = useMemo(() => {
    const completed = uploads.filter((item) => item.status === 'completed').length
    const uploading = uploads.filter((item) => item.status === 'uploading').length
    const queued = uploads.filter((item) => item.status === 'queued').length
    return { completed, uploading, queued }
  }, [uploads])

  const refreshUploads = async () => {
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load uploads')
      }

      const data = await response.json()
      const list = Array.isArray(data) ? data : data?.files || data?.uploads || []
      const normalizedUploads = Array.isArray(list)
        ? list.map((item, index) => ({
            id: item._id || item.id || `${item.originalName || item.name || item.filename || item.fileName || 'upload'}-${index}`,
            name: item.originalName || item.name || item.filename || item.fileName || 'Unnamed file',
            size: item.size || item.fileSize || formatBytes(item.sizeBytes || 0),
            type: item.type || item.fileType || (item.originalName ? item.originalName.split('.').pop()?.toUpperCase() || 'FILE' : 'FILE'),
            status: item.status === 'uploaded' ? 'completed' : item.status || 'completed',
            progress: 100,
            cloudinaryUrl: item.cloudinaryUrl || '',
            localPath: item.localPath || '',
            createdAt: item.createdAt || '',
          }))
        : []

      dispatch(setUploads(normalizedUploads))
    } catch (error) {
      console.error('Unable to sync uploads:', error)
    }
  }

  useEffect(() => {
    refreshUploads()
  }, [])

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList)
    const uploadIds = []

    files.forEach((file, index) => {
      const id = `${file.name}-${Date.now()}-${index}`
      uploadIds.push(id)
      dispatch(addUpload({
        id,
        name: file.name,
        size: formatBytes(file.size),
        type: file.type.split('/')[1]?.toUpperCase() || 'FILE',
      }))
    })

    for (const [index, file] of files.entries()) {
      const id = uploadIds[index]

      dispatch(uploadProgressUpdated({ id, progress: 5 }))

      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(API_URL, {
          method: 'POST',
          body: formData,
          headers: {
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          const errorText = await response.text().catch(() => '')
          const message = errorText || `Upload failed with status ${response.status}`
          throw new Error(message)
        }

        dispatch(uploadProgressUpdated({ id, progress: 100 }))
        dispatch(uploadCompleted({ id }))
        await refreshUploads()
      } catch (error) {
        const message = error?.message || 'Upload failed'
        dispatch(uploadFailed({ id, error: message }))
      }
    }
  }

  const onDrop = (event) => {
    event.preventDefault()
    setDragActive(false)
    if (event.dataTransfer.files?.length) {
      handleFiles(event.dataTransfer.files)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_40%),linear-gradient(135deg,_#07111f_0%,_#111827_100%)] p-4 text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-blue-950/40 backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-sm font-medium text-cyan-200">
                <Sparkles size={16} />
                Smart file uploading system
              </div>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Upload, organize, and ship files with confidence.
              </h1>
              <p className="text-base text-slate-300 sm:text-lg">
                A sleek workspace for drag-and-drop uploads, live progress, and instant delivery-ready status updates.
              </p>
            </div>
            <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-3">
              <div>
                <p className="text-2xl font-semibold text-white">{summary.completed}</p>
                <p className="text-sm text-slate-400">Completed</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">{summary.uploading}</p>
                <p className="text-sm text-slate-400">Uploading</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">{summary.queued}</p>
                <p className="text-sm text-slate-400">Queued</p>
              </div>
            </div>
          </div>
        </header>

        <main className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">
            <div
              onDragOver={(event) => {
                event.preventDefault()
                setDragActive(true)
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
              className={`rounded-3xl border-2 border-dashed p-8 text-center transition-all ${dragActive ? 'border-cyan-400 bg-cyan-500/10' : 'border-slate-700 bg-slate-950/60'}`}
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
                <UploadCloud size={30} />
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-white">Drop files here</h2>
              <p className="mt-2 text-sm text-slate-400">
                Supports documents, archives, images, and more. Smart routing will be enabled in the backend phase.
              </p>
              <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-2 font-medium text-slate-900 transition hover:-translate-y-0.5">
                <FileUp size={16} />
                Choose files
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(event) => event.target.files && handleFiles(event.target.files)}
                />
              </label>
              <p className="mt-3 text-xs uppercase tracking-[0.25em] text-slate-500">
                Sending to {API_URL}
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {uploads.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{item.name}</p>
                      <p className="mt-1 text-sm text-slate-400">{item.size} • {item.type}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => dispatch(removeUpload(item.id))}
                      className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all ${item.status === 'completed' ? 'bg-emerald-400' : 'bg-cyan-400'}`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className={`font-medium ${item.status === 'completed' ? 'text-emerald-400' : item.status === 'failed' ? 'text-rose-400' : 'text-cyan-300'}`}>
                      {item.status === 'completed' ? 'Ready to send' : item.status === 'failed' ? 'Upload failed' : item.status === 'uploading' ? 'Uploading' : 'Queued'}
                    </span>
                    <span className="text-slate-400">{item.progress}%</span>
                  </div>
                  {item.error ? (
                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                      <AlertCircle size={16} className="mt-0.5" />
                      <span>{item.error}</span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-emerald-400" size={18} />
                <h3 className="text-lg font-semibold text-white">What this UI includes</h3>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-2"><ArrowRight size={16} className="mt-0.5" /> Responsive hero dashboard with immersive visuals.</li>
                <li className="flex items-start gap-2"><ArrowRight size={16} className="mt-0.5" /> Drag-and-drop upload surface and file selection.</li>
                <li className="flex items-start gap-2"><ArrowRight size={16} className="mt-0.5" /> Redux Toolkit state for uploads, progress, and completion.</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-5">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-200">Next step</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Backend integration</h3>
              <p className="mt-2 text-sm text-slate-300">
                When you’re ready, I can connect this UI to a Node.js/Express or Laravel backend for real uploads and storage.
              </p>
            </div>
          </aside>
        </main>
      </div>
    </div>
  )
}

export default UploadDashboard
