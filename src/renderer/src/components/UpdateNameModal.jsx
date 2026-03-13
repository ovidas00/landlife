import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

export default function UpdateNameModal({
  isOpen,
  title = 'Update Name',
  initialValue = '',
  onConfirm,
  onCancel,
  onDelete
}) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setName(initialValue || '')
    setError('')
  }, [isOpen, initialValue])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const handleUpdate = async () => {
    const value = name.trim()

    if (!value) {
      setError('Name is required.')
      return
    }

    try {
      setLoading(true)
      await onConfirm(value)
      setLoading(false)
      setName('')
      setError('')
      onCancel()
    } catch (err) {
      setLoading(false)
      setError('Update failed.')
      console.error(err)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded overflow-hidden shadow-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4 px-6 py-4 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onCancel} className="p-2 rounded hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 p-6 pt-0">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Name</label>

            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />

            {error && <p className="text-red-500 mt-1 text-sm">{error}</p>}
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-2 font-medium">
            <button
              className="px-4 py-2 rounded bg-gray-50 text-red-600 border border-red-200 hover:bg-red-50"
              onClick={onDelete}
              disabled={loading}
            >
              Delete
            </button>

            <div className="flex gap-3">
              <button
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 bg-emerald-700 text-white rounded hover:bg-emerald-800"
                onClick={handleUpdate}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
