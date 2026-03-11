import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function ConfirmModal({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  onConfirm,
  onCancel
}) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel} // clicking outside closes modal
    >
      <div
        className="bg-white rounded shadow-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onCancel} className="p-1 rounded hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Message */}
        <p className="text-gray-700 mb-6 px-6">{message}</p>

        {/* Actions */}
        <div className="flex justify-end gap-3 font-medium p-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-gray-200 text-gray-900 hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
