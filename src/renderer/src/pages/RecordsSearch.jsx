import { Search, FileText } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import FilesModal from '../components/FilesModal'

export default function RecordsSearch() {
  const [upazilas, setUpazilas] = useState([])
  const [moujas, setMoujas] = useState([])
  const [selectedUpazila, setSelectedUpazila] = useState('')
  const [selectedMouja, setSelectedMouja] = useState('')
  const [selectedDocType, setSelectedDocType] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [currentFiles, setCurrentFiles] = useState([])

  const searchTimeout = useRef(null)

  // Load all upazilas on mount
  useEffect(() => {
    const loadUpazilas = async () => {
      const data = await window.api.getUpazilas()
      setUpazilas(data)
    }
    loadUpazilas()
  }, [])

  // Load moujas whenever upazila changes
  useEffect(() => {
    const loadMoujas = async () => {
      if (!selectedUpazila) {
        setMoujas([])
        setSelectedMouja('')
        return
      }
      const data = await window.api.getMoujas(selectedUpazila)
      setMoujas(data)
      setSelectedMouja('')
    }
    loadMoujas()
  }, [selectedUpazila])

  // Load documents whenever filters or searchQuery changes
  useEffect(() => {
    // Debounce search to reduce backend calls
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      loadDocuments()
    }, 300) // 300ms delay
  }, [selectedUpazila, selectedMouja, searchQuery, selectedDocType])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const filters = {}
      if (selectedDocType) filters.docType = selectedDocType
      if (searchQuery) filters.searchQuery = searchQuery

      if (selectedUpazila) filters.upazilaId = selectedUpazila
      if (selectedMouja) filters.moujaId = selectedMouja

      const res = await window.api.getDocuments(filters)
      const docs = res?.data ?? res

      const formatted = docs.map((doc) => ({
        id: doc.id,
        doc_type: doc.doc_type,
        upazila: doc.upazilaName,
        mouja: doc.moujaName,
        khatian: doc.khatian_no,
        dag: doc.dag_no,
        holding: doc.holding_no,
        owner: doc.owners?.join(', ') || '—',
        fileCount: doc.files?.length || 0,
        files: doc.files
      }))

      setRecords(formatted)
    } catch (err) {
      console.error('Failed to load documents:', err)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  const docTypeColors = {
    usable: 'bg-emerald-100 text-emerald-800',
    unusable: 'bg-red-100 text-red-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    not_found: 'bg-gray-100 text-gray-800'
  }
  const docTypeLabels = {
    usable: 'Usable Records',
    unusable: 'Unusable Records',
    moderate: 'Moderately Usable',
    not_found: 'Not Found Records'
  }

  return (
    <>
      {/* Files modal */}
      <FilesModal files={currentFiles} isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      <div className="bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Records Search</h1>
              <p className="text-gray-600">
                Filter and find land documents instantly from the secure archive.
              </p>
            </div>
          </div>

          {/* Filter Card */}
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden mb-6">
            <div className="h-1 bg-gradient-to-r from-emerald-600 to-orange-500"></div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Upazila */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Upazila (উপজেলা)
                  </label>
                  <select
                    value={selectedUpazila}
                    onChange={(e) => setSelectedUpazila(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  >
                    <option value="">All Upazilas</option>
                    {upazilas.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mouja */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Mouja (মৌজা)
                  </label>
                  <select
                    value={selectedMouja}
                    onChange={(e) => setSelectedMouja(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  >
                    <option value="">All Moujas</option>
                    {moujas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Document Type
                  </label>
                  <select
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  >
                    <option value="">All Type</option>
                    <option value="usable">Usable Records</option>
                    <option value="unusable">Unusable Records</option>
                    <option value="moderate">Moderately Usable</option>
                    <option value="not_found">Not Found Records</option>
                  </select>
                </div>

                {/* Search */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Search Details
                  </label>
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="search"
                      placeholder="Khatian, Holding or Dag..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold w-1/12">Serial</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold w-3/12">
                    Upazila / Mouja
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold w-3/12">
                    Khatian / Holding / Dag
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold w-2/12">Doc Type</th>

                  <th className="text-left px-6 py-4 text-sm font-semibold w-3/12">Files</th>
                </tr>
              </thead>

              <tbody>
                {!loading && records.length > 0 ? (
                  records.map((record, index) => (
                    <tr key={record.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-5 font-semibold">{index + 1}</td>
                      <td className="px-6 py-5">
                        <p className="font-semibold">{record.upazila}</p>
                        <p className="text-sm text-gray-600">{record.mouja}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex gap-1 flex-wrap">
                          {record.khatian && (
                            <div className="inline-flex gap-2 px-2.5 py-1 bg-gray-100 rounded text-sm">
                              <span className="font-medium text-gray-600">K:</span>
                              {record.khatian}
                            </div>
                          )}
                          {record.holding && (
                            <div className="inline-flex gap-2 px-2.5 py-1 bg-gray-100 rounded text-sm">
                              <span className="font-medium text-gray-600">H:</span>
                              {record.holding}
                            </div>
                          )}
                          {record.dag && (
                            <div className="inline-flex gap-2 px-2.5 py-1 bg-gray-100 rounded text-sm">
                              <span className="font-medium text-gray-600">D:</span>
                              {record.dag}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {record.doc_type ? (
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${docTypeColors[record.doc_type]}`}
                          >
                            {docTypeLabels[record.doc_type]}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <button
                          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm"
                          onClick={() => {
                            setCurrentFiles(record.files)
                            setModalOpen(true)
                          }}
                        >
                          <FileText size={16} />
                          Files ({record.fileCount})
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      {loading ? 'Loading documents...' : 'No documents found!'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
