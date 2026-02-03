import { X, FileText, ExternalLink } from 'lucide-react'

export default function FilesModal({ files = [], isOpen, onClose }) {
  if (!isOpen) return null

  const handleOpenFile = (path) => {
    console.log(path)
    window.api.openFile(path) // use the exposed API from preload
  }

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
          <h2 className="text-lg font-semibold text-gray-900">Document Files</h2>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {files.length === 0 ? (
            <p className="text-gray-500 text-center">No files attached.</p>
          ) : (
            <ul className="space-y-3">
              {files.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-gray-700" />
                    <span className="text-gray-900">{file.file_name}</span>
                  </div>
                  <button
                    onClick={() => handleOpenFile(file.file_path)}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 transition-colors"
                  >
                    <ExternalLink size={14} />
                    Open
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
