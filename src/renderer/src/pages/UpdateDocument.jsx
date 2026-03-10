import { Upload, X, File, Delete, Trash, Trash2 } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom' // assuming you use React Router
import Breadcrumb from '../components/Breadcrumb'
import { showError, showSuccess } from '../utils/toast'
import ConfirmModal from '../components/ConfirmModal'

export default function UpdateDocument() {
  const location = useLocation()
  const navigate = useNavigate()
  const documentId = location.state?.documentId
  const [upazilas, setUpazilas] = useState([])
  const [mouzas, setMouzas] = useState([])
  const [volumes, setVolumes] = useState([])

  const [selectedUpazila, setSelectedUpazila] = useState('')
  const [mouza, setMouza] = useState('')
  const [volume, setVolume] = useState('')
  const [khatianNo, setKhatianNo] = useState('')
  const [dagNo, setDagNo] = useState('')
  const [holdingNo, setHoldingNo] = useState('')
  const [docType, setDocType] = useState('usable')
  const [remarks, setRemarks] = useState('')
  const [files, setFiles] = useState([]) // new files to upload
  const [existingFiles, setExistingFiles] = useState([]) // files already uploaded
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const fileInputRef = useRef(null)
  const isNotFound = docType === 'not_found'

  const loadUpazilas = async () => {
    const data = await window.api.getUpazilas()
    setUpazilas(data)
  }

  const loadMouzas = async (upazilaId) => {
    const data = await window.api.getMouzas(upazilaId)
    setMouzas(data)
  }

  const loadVolumes = async (upazilaId) => {
    const data = await window.api.getVolumes(upazilaId)
    setVolumes(data)
  }

  const loadDocument = async () => {
    if (!documentId) return
    const doc = await window.api.getDocumentById(documentId)

    setSelectedUpazila(doc.upazila_id)
    setMouza(doc.mouza_id)
    setVolume(doc.volume_id)
    setKhatianNo(doc.khatian_no || '')
    setDagNo(doc.dag_no || '')
    setHoldingNo(doc.holding_no || '')
    setDocType(doc.doc_type || 'usable')
    setRemarks(doc.remarks || '')
    setExistingFiles(doc.files || [])
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      loadUpazilas()
      loadDocument()
    })
  }, [])

  useEffect(() => {
    Promise.resolve().then(() => {
      if (selectedUpazila) {
        loadMouzas(selectedUpazila)
        loadVolumes(selectedUpazila)
        setMouza((prev) => prev) // keep selection if possible
        setVolume((prev) => prev)
      }
    })
  }, [selectedUpazila])

  const handleFiles = (fileList) => {
    if (isNotFound) return
    const selected = Array.from(fileList)
    setFiles((prev) => [...prev, ...selected])
  }

  const onFileChange = (e) => handleFiles(e.target.files)

  const onDrop = (e) => {
    e.preventDefault()
    if (isNotFound) return
    handleFiles(e.dataTransfer.files)
  }

  const removeNewFile = (index) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const removeExistingFile = (id) => {
    setExistingFiles(existingFiles.filter((f) => f.id !== id))
  }

  const submitDocument = async () => {
    if (!selectedUpazila || !mouza || !volume) {
      showError('Please select location')
      return
    }

    if (!isNotFound && !files.length && !existingFiles.length) {
      showError('Please upload at least one document')
      return
    }

    setLoading(true)

    const payload = {
      id: documentId,
      upazilaId: selectedUpazila,
      mouzaId: mouza,
      volumeId: volume,
      khatianNo,
      dagNo,
      holdingNo,
      docType,
      remarks,
      newFiles: files, // files added in this session
      existingFiles // files to keep
    }

    try {
      const result = await window.api.updateDocument(payload)

      if (result?.success) {
        showSuccess('Document updated successfully')
      } else {
        showError('Update failed')
      }
    } catch (err) {
      console.error(err)
      showError('Update failed')
    }

    setLoading(false)
  }

  return (
    <>
      {/* Confirm modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          try {
            const result = await window.api.deleteDocument(documentId)

            if (result?.success) {
              showSuccess('Document deleted successfully')
              navigate('/search')
            } else {
              showError('Failed to delete document')
            }
          } catch (err) {
            console.error(err)
            showError('Failed to delete document')
          }
        }}
      />

      <div className="bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <Breadcrumb />

          <div className="flex items-center justify-between">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-grey-900 mb-3">Edit Document</h1>
              <p className="text-gray-600">Edit and update existing land document details.</p>
            </div>

            <button
              onClick={() => setConfirmOpen(true)}
              className="w-fit bg-red-600 text-white py-2 px-3 rounded flex items-center gap-3 hover:bg-red-700 font-bold"
            >
              <Trash2 size={20} />
              <span>Delete</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT */}
            <div className="space-y-6">
              <div className="bg-white border-2 border-gray-200 shadow-xs overflow-hidden">
                <div className="h-1 bg-emerald-700"></div>

                <div className="p-6 space-y-4">
                  <h2 className="text-xl font-bold text-emerald-800">Location Details</h2>

                  <div>
                    <label className="block mb-2 font-medium">Upazila *</label>
                    <select
                      value={selectedUpazila}
                      onChange={(e) => setSelectedUpazila(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      <option value="">Select Upazila</option>
                      {upazilas.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 font-medium">Mouza *</label>
                    <select
                      value={mouza}
                      onChange={(e) => setMouza(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      <option value="">Select Mouza</option>
                      {mouzas.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 font-medium">Volume *</label>
                    <select
                      value={volume}
                      onChange={(e) => setVolume(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      <option value="">Select Volume</option>
                      {volumes.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-gray-200 shadow-xs overflow-hidden">
                <div className="h-1 bg-emerald-700"></div>

                <div className="p-6 space-y-4">
                  <h2 className="text-xl font-bold text-emerald-800">Land Records</h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block mb-2 font-medium">Khatian No</label>
                      <input
                        type="text"
                        placeholder="Enter Khatian"
                        value={khatianNo}
                        onChange={(e) => setKhatianNo(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 font-medium">Holding No</label>
                      <input
                        type="text"
                        placeholder="Enter Holding"
                        value={holdingNo}
                        onChange={(e) => setHoldingNo(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 font-medium">Plot No</label>
                      <input
                        type="text"
                        placeholder="Enter Plot"
                        value={dagNo}
                        onChange={(e) => setDagNo(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 font-medium">Document Type *</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      <option value="usable">Usable Records</option>
                      <option value="unusable">Unusable Records</option>
                      <option value="moderate">Moderately Usable</option>
                      <option value="not_found">Not Found Records</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 font-medium">Remarks</label>
                    <input
                      type="text"
                      placeholder="Enter Extra Info"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="bg-white shadow-xs border-2 border-gray-200 overflow-hidden">
              <div className="bg-emerald-700 h-1"></div>

              <div className="p-6">
                <h2 className="text-xl font-bold text-emerald-800 mb-4">Document Scans</h2>

                {/* upload area */}
                <div
                  onClick={() => !isNotFound && fileInputRef.current.click()}
                  onDrop={onDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center border-gray-300 transition
                  ${isNotFound ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-emerald-50'}`}
                >
                  <Upload size={28} className="mx-auto text-gray-500" />
                  <p className="mt-4 text-gray-600">
                    {isNotFound ? 'Documents not required' : 'Click or drop PDFs here'}
                  </p>

                  <input
                    type="file"
                    multiple
                    accept=".pdf"
                    hidden
                    ref={fileInputRef}
                    onChange={onFileChange}
                  />
                </div>

                {/* existing files */}
                {existingFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {existingFiles.map((f) => (
                      <div key={f.id} className="flex justify-between bg-gray-100 p-2 rounded">
                        <div className="flex items-center gap-2">
                          <File size={20} />
                          <span>{f.file_name}</span>
                        </div>
                        <button onClick={() => removeExistingFile(f.id)}>
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* new files */}
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex justify-between bg-gray-100 p-2 rounded">
                        <div className="flex items-center gap-2">
                          <File size={20} />
                          <span>{f.name}</span>
                        </div>
                        <button onClick={() => removeNewFile(i)}>
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={submitDocument}
                  disabled={loading}
                  className="mt-6 w-full bg-emerald-700 text-white py-3 rounded hover:bg-emerald-800 disabled:opacity-50 font-bold"
                >
                  {loading ? 'Updating...' : 'Update Document'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
