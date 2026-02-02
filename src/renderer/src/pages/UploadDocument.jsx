import { Upload, Plus } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

export default function UploadDocument() {
  const [upazilas, setUpazilas] = useState([])
  const [moujas, setMoujas] = useState([])
  const [selectedUpazila, setSelectedUpazila] = useState('')
  const [mouja, setMouja] = useState('')
  const [khatianNo, setKhatianNo] = useState('')
  const [dagNo, setDagNo] = useState('')
  const [owners, setOwners] = useState([''])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)

  const fileInputRef = useRef(null)

  const addOwner = () => setOwners([...owners, ''])

  const updateOwner = (index, value) => {
    const newOwners = [...owners]
    newOwners[index] = value
    setOwners(newOwners)
  }

  const loadUpazilas = async () => {
    const data = await window.api.getUpazilas()
    setUpazilas(data)
  }

  const loadMoujas = async (upazilaId) => {
    const data = await window.api.getMoujas(upazilaId)
    setMoujas(data)
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      loadUpazilas()
    })
  }, [])

  useEffect(() => {
    Promise.resolve().then(() => {
      if (selectedUpazila) {
        loadMoujas(selectedUpazila)
        setMouja('')
      }
    })
  }, [selectedUpazila])

  // 📁 handle file select
  const handleFiles = (fileList) => {
    const selected = Array.from(fileList)
    setFiles((prev) => [...prev, ...selected])
  }

  const onFileChange = (e) => handleFiles(e.target.files)

  const onDrop = (e) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  // 🚀 submit
  const submitDocument = async () => {
    if (!selectedUpazila || !mouja) {
      alert('Please select location')
      return
    }

    setLoading(true)

    const payload = {
      upazilaId: selectedUpazila,
      moujaId: mouja,
      khatianNo,
      dagNo,
      owners: owners.filter((o) => o.trim() !== ''),
      files
    }

    try {
      await window.api.uploadDocument(payload)

      alert('Document uploaded successfully')

      // reset form
      setKhatianNo('')
      setDagNo('')
      setOwners([''])
      setFiles([])
    } catch (err) {
      console.error(err)
      alert('Upload failed')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-emerald-800 mb-3">Upload Document</h1>
          <p className="text-gray-600">Register new land documents to the secure archive.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT */}
          <div className="space-y-6">
            {/* Location */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
              <div className="h-1 bg-emerald-700"></div>

              <div className="p-6 space-y-4">
                <h2 className="text-xl font-bold text-emerald-800">Location Details</h2>

                <select
                  value={selectedUpazila}
                  onChange={(e) => setSelectedUpazila(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent rounded-lg"
                >
                  <option value="">Select Upazila</option>
                  {upazilas.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>

                <select
                  value={mouja}
                  onChange={(e) => setMouja(e.target.value)}
                  disabled={!selectedUpazila}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent rounded-lg"
                >
                  <option value="">Select Mouja</option>
                  {moujas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Records */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm shadow-sm overflow-hidden">
              <div className="h-1 bg-emerald-700"></div>

              <div className="p-6 space-y-4">
                <h2 className="text-xl font-bold text-emerald-800">Land Records</h2>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    placeholder="Khatian No"
                    value={khatianNo}
                    onChange={(e) => setKhatianNo(e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent rounded-lg"
                  />
                  <input
                    placeholder="Dag No"
                    value={dagNo}
                    onChange={(e) => setDagNo(e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label>Owner Name(s)</label>
                    <button onClick={addOwner} className="text-emerald-700 flex gap-1">
                      <Plus size={16} /> Add
                    </button>
                  </div>

                  {owners.map((owner, i) => (
                    <input
                      key={i}
                      placeholder={`Owner ${i + 1}`}
                      value={owner}
                      onChange={(e) => updateOwner(i, e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent rounded-lg mb-2"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 shadow-sm overflow-hidden">
            <div className="h-1 bg-gray-200"></div>

            <div className="p-6">
              <h2 className="text-xl font-bold text-emerald-800 mb-4">Document Scans</h2>

              <div
                onClick={() => fileInputRef.current.click()}
                onDrop={onDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer border-gray-300 hover:bg-emerald-50"
              >
                <Upload size={28} className="mx-auto text-gray-500" />
                <p className="mt-4 text-gray-600">Click or drop PDFs here</p>

                <input
                  type="file"
                  multiple
                  accept=".pdf"
                  hidden
                  ref={fileInputRef}
                  onChange={onFileChange}
                />
              </div>

              {/* file list */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex justify-between bg-gray-100 p-2 rounded">
                      <span>{f.name}</span>
                      <button onClick={() => removeFile(i)}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={submitDocument}
                disabled={loading}
                className="mt-6 w-full bg-emerald-700 text-white py-3 rounded-lg hover:bg-emerald-800 disabled:opacity-50"
              >
                {loading ? 'Uploading...' : 'Submit Document'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
