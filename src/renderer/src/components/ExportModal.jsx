import { useEffect, useState } from 'react'
import { FileDown, FileSpreadsheet, FileText, Sheet, X } from 'lucide-react'
import { showError, showSuccess } from '../utils/toast'

export default function ExportModal({ isOpen, onClose, filters = {}, totalRows = 0 }) {
  const [loadingType, setLoadingType] = useState(null)

  const [rowsMode, setRowsMode] = useState('custom')
  const [rowsCount, setRowsCount] = useState(Math.min(50, totalRows))

  const exporting = loadingType !== null

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !exporting) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, exporting])

  useEffect(() => {
    if (totalRows > 0) {
      setRowsCount(Math.min(50, totalRows))
    }
  }, [totalRows])

  if (!isOpen) return null

  const handleExport = async (type) => {
    try {
      setLoadingType(type)

      const rows = rowsMode === 'all' ? totalRows : rowsCount

      const res = await window.api.exportDocuments({
        format: type,
        rows,
        ...filters
      })

      if (res.success) showSuccess('Exported successfully!')
      else showError(`Failed to export${res.message ? `: ${res.message}` : ''}`)
    } catch (err) {
      showError('Export error: ' + err.message)
    } finally {
      setLoadingType(null)
    }
  }

  const Spinner = () => (
    <svg className="animate-spin h-5 w-5 text-gray-600" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path
        d="M22 12a10 10 0 00-10-10"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-75"
      />
    </svg>
  )

  const ExportRow = ({ type, label, children }) => (
    <button
      onClick={() => handleExport(type)}
      disabled={exporting}
      className="flex items-center justify-between w-full px-4 py-3 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex items-center gap-3 text-gray-700">
        {children}
        <span className="font-medium">{label}</span>
      </div>

      {loadingType === type && <Spinner />}
    </button>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={() => {
        if (!exporting) onClose()
      }}
    >
      <div
        className="bg-white rounded shadow-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Export Documents</h2>

          <button
            onClick={() => !exporting && onClose()}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
            disabled={exporting}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Rows selector */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Rows Count</h3>

            {/* Custom */}
            <label className="flex items-center justify-between border border-gray-200 rounded px-4 py-3">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="rows"
                  checked={rowsMode === 'custom'}
                  onChange={() => setRowsMode('custom')}
                />
                <span className="text-gray-700">Custom</span>
              </div>

              <input
                type="number"
                min="1"
                value={rowsCount}
                disabled={rowsMode !== 'custom'}
                onChange={(e) => setRowsCount(Number(e.target.value))}
                className="w-28 px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100"
              />
            </label>

            {/* All */}
            <label className="flex items-center justify-between border border-gray-200 rounded px-4 py-3">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="rows"
                  checked={rowsMode === 'all'}
                  onChange={() => setRowsMode('all')}
                />
                <span className="text-gray-700">All Rows</span>
              </div>

              <input
                type="number"
                value={totalRows}
                disabled={rowsMode !== 'all'}
                readOnly
                className="w-28 px-2 py-1 border rounded disabled:bg-gray-100 border-gray-300"
              />
            </label>
          </div>

          {/* Export options */}
          <div className="space-y-3">
            <ExportRow type="excel" label="Export as Excel">
              <Sheet />
            </ExportRow>

            <ExportRow type="word" label="Export as Word Document">
              <FileText />
            </ExportRow>

            <ExportRow type="csv" label="Export as CSV">
              <FileSpreadsheet />
            </ExportRow>

            <ExportRow type="pdf" label="Export as PDF">
              <FileDown />
            </ExportRow>
          </div>
        </div>
      </div>
    </div>
  )
}
