import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { showError, showSuccess } from '../utils/toast'

export default function BackupModalRegional({ isOpen, onClose, upazilaId }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ processed: 0, total: 0, percent: 0 })

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    // Subscribe to progress events
    const handler = (p) => setProgress(p)
    window.api.onBackupProgress(handler)
    return () => window.api.onBackupProgress(() => {})
  }, [])

  if (!isOpen) return null

  const handleStartBackup = async () => {
    setError('')

    // Validate password: either empty or at least 6 chars
    const pwd = password.trim() || null
    if (pwd && pwd.length < 6) {
      setError('Password must be at least 6 characters or left empty.')
      return
    }

    try {
      setLoading(true)
      const res = await window.api.startBackupRegional(pwd, upazilaId)
      setProgress({ processed: 0, total: 0, percent: 0 })
      setLoading(false)
      setPassword('')
      setError('')
      onClose()
      if (res?.success) {
        showSuccess('Backup successful')
      } else {
        showError('Backup failed')
      }
    } catch (err) {
      setLoading(false)
      setError('Backup failed. See console for details.')
      console.error(err)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => {
        if (!loading) {
          onClose()
        }
      }}
    >
      <div
        className="bg-white rounded overflow-hidden shadow-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4 px-6 py-4 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Start Backup</h2>
          <button
            onClick={() => {
              if (!loading) {
                onClose()
              }
            }}
            className="p-2 rounded hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-6 pt-0">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Password (optional)</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              placeholder="Enter password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            {error && <p className="text-red-500 mt-1 text-sm">{error}</p>}
          </div>

          {loading && (
            <div className="space-y-1">
              <div className="text-sm text-gray-700">
                Backing up... {progress.processed || 0}/{progress.total || 0} files (
                {progress.percent || 0}%)
              </div>
              <progress
                value={progress.processed}
                max={progress.total}
                className="w-full h-2 rounded overflow-hidden"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 font-medium">
            <button
              className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="px-6 py-2 bg-emerald-700 text-white rounded hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleStartBackup}
              disabled={loading}
            >
              {loading ? 'Backing up...' : 'Start Backup'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
