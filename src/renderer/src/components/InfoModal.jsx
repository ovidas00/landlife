import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function RecordInfoModal({ record = null, isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !record) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose} // clicking on backdrop closes modal
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside modal
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Record Info ({record.id})</h2>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium text-gray-700">Document Type:</span>{' '}
              <span className="text-gray-900">{record.doc_type}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Volume:</span>{' '}
              <span className="text-gray-900">{record.volume}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Upazila:</span>{' '}
              <span className="text-gray-900">{record.upazila}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Mouza:</span>{' '}
              <span className="text-gray-900">{record.mouza}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Khatian:</span>{' '}
              <span className="text-gray-900">{record.khatian}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Dag:</span>{' '}
              <span className="text-gray-900">{record.dag}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Holding:</span>{' '}
              <span className="text-gray-900">{record.holding}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Remarks:</span>{' '}
              <span className="text-gray-900">{record.remarks || '-'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Registered At:</span>{' '}
              <span className="text-gray-900">
                {new Date(record.created_at).toLocaleDateString('en-US', {
                  day: '2-digit',
                  month: 'short',
                  year: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Last Modified:</span>{' '}
              <span className="text-gray-900">
                {new Date(record.updated_at).toLocaleDateString('en-US', {
                  day: '2-digit',
                  month: 'short',
                  year: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
