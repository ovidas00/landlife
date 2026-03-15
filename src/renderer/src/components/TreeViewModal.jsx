import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function TreeViewModal({ tree = [], isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const renderNode = (node, index) => {
    return (
      <div key={node.id} className="flex items-start gap-3 border-l-2 border-gray-300 pl-4 py-2">
        <div className="w-2 h-2 mt-2 bg-emerald-600 rounded-full" />

        <div className="bg-gray-50 border border-gray-200 rounded p-3 w-full">
          <div className="text-sm font-semibold text-gray-800 mb-1">Document #{node.id}</div>

          <div className="grid grid-cols-4 text-sm text-gray-700 gap-2">
            <div>
              <span className="font-medium">Khatian:</span> {node.khatian_no || '-'}
            </div>

            <div>
              <span className="font-medium">Holding:</span> {node.holding_no || '-'}
            </div>

            <div>
              <span className="font-medium">Plot:</span> {node.dag_no || '-'}
            </div>

            <div>
              <span className="font-medium">Volume:</span> {node.volumeName || '-'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded shadow-lg w-full max-w-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}

        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Document Tree</h2>

          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* Body */}

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {tree.length === 0 ? (
            <div className="text-gray-500 text-sm">No tree data available</div>
          ) : (
            <div className="space-y-2">{tree.map(renderNode)}</div>
          )}
        </div>
      </div>
    </div>
  )
}
