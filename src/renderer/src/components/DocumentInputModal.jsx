import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { showError } from '../utils/toast'

export default function DocumentPickerModal({
  isOpen,
  onClose,
  onSubmit,
  upazilaId,
  mouzaId,
  onClear
}) {
  const [upazilas, setUpazilas] = useState([])
  const [mouzas, setMouzas] = useState([])

  const [formData, setFormData] = useState({
    id: '',
    upazilaId: '',
    mouzaId: '',
    khatianNo: '',
    holdingNo: '',
    plotNo: ''
  })

  useEffect(() => {
    if (upazilaId && mouzaId) {
      setFormData((prev) => ({ ...prev, upazilaId, mouzaId }))
    }
  }, [upazilaId, mouzaId])

  // Load Upazilas
  const loadUpazilas = async () => {
    const data = await window.api.getUpazilas()
    setUpazilas(data)

    if (data.length > 0 && !upazilaId) {
      setFormData((prev) => ({
        ...prev,
        upazilaId: data[0].id
      }))
    }
  }

  // Load Mouzas
  const loadMouzas = async (upazilaId) => {
    const data = await window.api.getMouzas(upazilaId)
    setMouzas(data)

    if (data.length > 0 && !mouzaId) {
      setFormData((prev) => ({
        ...prev,
        mouzaId: data[0].id
      }))
    }
  }

  useEffect(() => {
    loadUpazilas()
  }, [])

  useEffect(() => {
    if (formData.upazilaId) loadMouzas(formData.upazilaId)
  }, [formData.upazilaId])

  if (!isOpen) return null

  const handleSubmit = () => {
    const { id, upazilaId, mouzaId, khatianNo, holdingNo, plotNo } = formData

    // Always require location
    if (!upazilaId || !mouzaId) {
      showError('Please select Upazila and Mouza')
      return
    }

    // If ID exists → send with location
    if (id.trim()) {
      onSubmit({
        id: id.trim(),
        upazilaId,
        mouzaId
      })
      onClose()
      return
    }

    // Otherwise require at least one field
    if (!khatianNo.trim() && !holdingNo.trim() && !plotNo.trim()) {
      showError('Please enter at least Khatian, Holding, or Plot number')
      return
    }

    onSubmit({
      upazilaId,
      mouzaId,
      khatianNo,
      holdingNo,
      plotNo
    })

    // Reset (keep location)
    setFormData({
      id: '',
      upazilaId,
      mouzaId,
      khatianNo: '',
      holdingNo: '',
      plotNo: ''
    })

    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded shadow-lg w-full max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4 px-6 py-4 border-b border-gray-300">
          <h2 className="text-lg font-semibold text-gray-900">Search Document</h2>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-6 pt-0">
          {/* ID Field */}
          <div>
            <label className="block mb-2 font-medium">Document ID</label>
            <input
              type="text"
              placeholder="Enter ID (optional)"
              value={formData.id}
              onChange={(e) => setFormData((prev) => ({ ...prev, id: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Upazila / Mouza */}
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-medium">Upazila</label>
              <select
                value={formData.upazilaId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    upazilaId: e.target.value
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {upazilas.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">Mouza</label>
              <select
                value={formData.mouzaId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    mouzaId: e.target.value
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {mouzas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-2 font-medium">Khatian No</label>
              <input
                type="text"
                placeholder="Enter Khatian"
                value={formData.khatianNo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    khatianNo: e.target.value
                  }))
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">Holding No</label>
              <input
                type="text"
                placeholder="Enter Holding"
                value={formData.holdingNo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    holdingNo: e.target.value
                  }))
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">Plot No</label>
              <input
                type="text"
                placeholder="Enter Plot"
                value={formData.plotNo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    plotNo: e.target.value
                  }))
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end mt-6 gap-3 font-medium">
            <button
              onClick={() => {
                onClear()
                onClose()
              }}
              className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
            >
              Clear
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-emerald-700 text-white rounded hover:bg-emerald-800"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
