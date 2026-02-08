import { MapPin, List, Check, Archive } from 'lucide-react'
import { useEffect, useState } from 'react'
import ConfirmModal from '../components/ConfirmModal'
import { showError, showSuccess } from '../utils/toast'

export default function Locations() {
  const [upazila, setUpazila] = useState('')
  const [mouzaName, setMouzaName] = useState('')
  const [selectedUpazila, setSelectedUpazila] = useState(null)
  const [selectedUpazilaVolume, setSelectedUpazilaVolume] = useState(null)
  const [upazilas, setUpazilas] = useState([])
  const [mouzas, setMouzas] = useState([])
  const [volumeName, setVolumeName] = useState('')
  const [volumes, setVolumes] = useState([])
  const [confirmUpazila, setConfirmUpazila] = useState(false)
  const [confirmMouza, setConfirmMouza] = useState(false)
  const [confirmVolume, setConfirmVolume] = useState(false)
  const [selectedUpazilaId, setSelectedUpazilaId] = useState(null)
  const [selectedMouzaId, setSelectedMouzaId] = useState(null)
  const [selectedVolumeId, setSelectedVolumeId] = useState(null)

  const loadUpazilas = async () => {
    const data = await window.api.getUpazilas()
    setUpazilas(data)

    if (data.length > 0) {
      setSelectedUpazila(data[0].id)
      setSelectedUpazilaVolume(data[0].id)
    }
  }

  const loadMouzas = async (upazilaId) => {
    const data = await window.api.getMouzas(upazilaId)
    setMouzas(data)
  }

  const loadVolumes = async (upazilaId) => {
    const data = await window.api.getVolumes(upazilaId)
    setVolumes(data)
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      loadUpazilas()
    })
  }, [])

  useEffect(() => {
    Promise.resolve().then(() => {
      if (selectedUpazila) {
        loadMouzas(selectedUpazila)
      }
    })
  }, [selectedUpazila])

  useEffect(() => {
    Promise.resolve().then(() => {
      if (selectedUpazilaVolume) {
        loadVolumes(selectedUpazilaVolume)
      }
    })
  }, [selectedUpazilaVolume])

  return (
    <>
      {/* Confirm models */}
      <ConfirmModal
        isOpen={confirmUpazila}
        onCancel={() => setConfirmUpazila(false)}
        onConfirm={async () => {
          try {
            const result = await window.api.deleteUpazila(selectedUpazilaId)

            if (result?.success) {
              loadUpazilas()
              showSuccess('Upazila deleted')
            } else {
              showError('Failed to delete upazila')
            }
          } catch (err) {
            console.error(err)
            showError('Failed to delete upazila')
          } finally {
            setConfirmUpazila(false)
          }
        }}
      />

      <ConfirmModal
        isOpen={confirmMouza}
        onCancel={() => setConfirmMouza(false)}
        onConfirm={async () => {
          try {
            const result = await window.api.deleteMouza(selectedMouzaId)

            if (result?.success) {
              loadMouzas(selectedUpazila)
              showSuccess('Mouza deleted')
            } else {
              showError('Failed to delete mouza')
            }
          } catch (err) {
            console.error(err)
            showError('Failed to delete mouza')
          } finally {
            setConfirmMouza(false)
          }
        }}
      />

      <ConfirmModal
        isOpen={confirmVolume}
        onCancel={() => setConfirmVolume(false)}
        onConfirm={async () => {
          try {
            const result = await window.api.deleteVolume(selectedVolumeId)

            if (result?.success) {
              loadVolumes(selectedUpazila)
              showSuccess('Volume deleted')
            } else {
              showError('Failed to delete volume')
            }
          } catch (err) {
            console.error(err)
            showError('Failed to delete volume')
          } finally {
            setConfirmVolume(false)
          }
        }}
      />

      <div className="bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Manage Locations</h1>
            <p className="text-gray-600">
              Configure administrative boundaries for document sorting.
            </p>
          </div>

          {/* Cards Container */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add Upazila Card */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
              {/* Card Header with colored border */}
              <div className="h-1 bg-emerald-700"></div>

              <div className="p-6">
                {/* Title */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <MapPin size={18} className="text-gray-700" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Add Upazila</h2>
                </div>

                <p className="text-sm text-gray-600 mb-6">
                  Register a new Upazila (district subdivision).
                </p>

                {/* Input Form */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upazila Name
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="e.g. Gazipur"
                      value={upazila}
                      onChange={(e) => setUpazila(e.target.value)}
                      className="flex-1 min-w-0 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                    />
                    <button
                      className="px-6 py-2 bg-emerald-700 text-white font-medium rounded-lg hover:bg-emerald-800 transition-colors"
                      onClick={async () => {
                        if (upazila) {
                          try {
                            const result = await window.api.addUpazila(upazila)

                            if (result?.success) {
                              loadUpazilas()
                              setUpazila('')
                              showSuccess('Upazila added')
                            } else {
                              showError(result?.message || 'Failed to add upazila')
                            }
                          } catch (err) {
                            console.error(err)
                            showError('Failed to add upazila')
                          }
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Existing Upazilas */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Existing Upazilas ({upazilas.length || 0})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {upazilas.map((item, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm border border-gray-200 cursor-pointer"
                        onClick={() => {
                          setSelectedUpazilaId(item.id)
                          setConfirmUpazila(true)
                        }}
                      >
                        <Check size={14} className="text-gray-600" />
                        <span>{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Add Mouza Card */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
              {/* Card Header with colored border */}
              <div className="h-1 bg-emerald-700"></div>

              <div className="p-6">
                {/* Title */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <List size={18} className="text-gray-700" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Add Mouza</h2>
                </div>

                <p className="text-sm text-gray-600 mb-6">
                  Add specific Mouzas within a selected Upazila.
                </p>

                {/* Select Parent Upazila */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Parent Upazila
                  </label>
                  <select
                    value={selectedUpazila || ''}
                    onChange={(e) => setSelectedUpazila(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {upazilas.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mouza Name Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mouza Name</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="e.g. Ward 01"
                      value={mouzaName}
                      onChange={(e) => setMouzaName(e.target.value)}
                      className="flex-1 min-w-0 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                    />
                    <button
                      className="px-6 py-2 bg-emerald-700 text-white rounded-lg"
                      onClick={async () => {
                        if (mouzaName && selectedUpazila) {
                          try {
                            const result = await window.api.addMouza(mouzaName, selectedUpazila)

                            if (result?.success) {
                              setMouzaName('')
                              loadMouzas(selectedUpazila)
                              showSuccess('Mouza added')
                            } else {
                              showError(result?.message || 'Failed to add mouza')
                            }
                          } catch (err) {
                            console.error(err)
                            showError('Failed to add mouza')
                          }
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Mouzas in Dhamrai */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Mouzas ({mouzas.length})
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {mouzas.map((m) => (
                      <div
                        key={m.id}
                        className="px-3 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm border border-orange-200 cursor-pointer"
                        onClick={() => {
                          setSelectedMouzaId(m.id)
                          setConfirmMouza(true)
                        }}
                      >
                        {m.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Add Volume Card */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
              {/* Card Header with colored border */}
              <div className="h-1 bg-emerald-700"></div>

              <div className="p-6">
                {/* Title */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Archive size={18} className="text-gray-700" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Add Volume</h2>
                </div>

                <p className="text-sm text-gray-600 mb-6">Add Volumes under a selected Upazila.</p>

                {/* Select Upazila */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Upazila
                  </label>
                  <select
                    value={selectedUpazilaVolume || ''}
                    onChange={(e) => setSelectedUpazilaVolume(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {upazilas.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Volume Name Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Volume Name
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="e.g. Volume A"
                      value={volumeName}
                      onChange={(e) => setVolumeName(e.target.value)}
                      className="flex-1 min-w-0 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                    />
                    <button
                      className="px-6 py-2 bg-emerald-700 text-white rounded-lg"
                      onClick={async () => {
                        if (volumeName && selectedUpazilaVolume) {
                          try {
                            const result = await window.api.addVolume(
                              volumeName,
                              selectedUpazilaVolume
                            )

                            if (result?.success) {
                              setVolumeName('')
                              loadVolumes(selectedUpazilaVolume)
                              showSuccess('Volume added')
                            } else {
                              showError(result?.message || 'Failed to add volume')
                            }
                          } catch (err) {
                            console.error(err)
                            showError('Failed to add volume')
                          }
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Existing Volumes */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Volumes ({volumes.length})
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {volumes.map((v) => (
                      <div
                        key={v.id}
                        className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-200 cursor-pointer"
                        onClick={() => {
                          setSelectedVolumeId(v.id)
                          setConfirmVolume(true)
                        }}
                      >
                        {v.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
