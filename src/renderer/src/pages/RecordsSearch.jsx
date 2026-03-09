import { Search, FileText, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import FilesModal from '../components/FilesModal'
import RecordInfoModal from '../components/InfoModal'

export default function RecordsSearch() {
  const [upazilas, setUpazilas] = useState([])
  const [mouzas, setMouzas] = useState([])
  const [volumes, setVolumes] = useState([])
  const [selectedUpazila, setSelectedUpazila] = useState('')
  const [selectedMouza, setSelectedMouza] = useState('')
  const [selectedVolume, setSelectedVolume] = useState('')
  const [selectedDocType, setSelectedDocType] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [currentFiles, setCurrentFiles] = useState([])

  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [total, setTotal] = useState(0)

  const searchTimeout = useRef(null)

  // Load upazilas
  useEffect(() => {
    const loadUpazilas = async () => {
      const data = await window.api.getUpazilas()
      setUpazilas(data)
    }
    loadUpazilas()
  }, [])

  // Load mouzas on upazila change
  useEffect(() => {
    const loadData = async () => {
      if (!selectedUpazila) {
        setMouzas([])
        setVolumes([])
        setSelectedMouza('')
        return
      }

      const [mouzaData, volumeData] = await Promise.all([
        window.api.getMouzas(selectedUpazila),
        window.api.getVolumes(selectedUpazila)
      ])

      setMouzas(mouzaData)
      setVolumes(volumeData)
      setSelectedMouza('')
      setSelectedVolume('')
    }

    loadData()
  }, [selectedUpazila])

  // Immediate fetch on mount or filter/page change
  useEffect(() => {
    loadDocuments()
  }, [selectedUpazila, selectedMouza, selectedVolume, selectedDocType, page])

  // Debounced fetch only for search input
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)

    if (!searchQuery) {
      loadDocuments()
      return
    }

    searchTimeout.current = setTimeout(() => {
      setPage(1)
      loadDocuments()
    }, 300)

    return () => clearTimeout(searchTimeout.current)
  }, [searchQuery])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const filters = { page, pageSize }
      if (selectedDocType) filters.docType = selectedDocType
      if (searchQuery) filters.searchQuery = searchQuery
      if (selectedUpazila) filters.upazilaId = selectedUpazila
      if (selectedMouza) filters.mouzaId = selectedMouza
      if (selectedVolume) filters.volumeId = selectedVolume

      const res = await window.api.getDocuments(filters)
      const docs = res?.data ?? res

      const formatted = docs.map((doc) => ({
        id: doc.id,
        doc_type: doc.doc_type,
        remarks: doc.remarks,
        upazila: doc.upazilaName,
        mouza: doc.mouzaName,
        volume: doc.volumeName,
        khatian: doc.khatian_no,
        dag: doc.dag_no,
        holding: doc.holding_no,
        fileCount: doc.files?.length || 0,
        files: doc.files,
        created_at: doc.created_at,
        updated_at: doc.updated_at
      }))

      setRecords(formatted)
      setTotal(res.total ?? formatted.length)
    } catch (err) {
      console.error('Failed to load documents:', err)
      setRecords([])
      setTotal(0)
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
    usable: 'Usable',
    unusable: 'Unusable',
    moderate: 'Moderate',
    not_found: 'Not Found'
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <>
      <FilesModal files={currentFiles} isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      <RecordInfoModal
        record={selectedRecord}
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        onDelete={() => {
          loadDocuments()
        }}
      />

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

          {/* Filters */}
          <div className="bg-white border-2 border-gray-200 shadow-xs overflow-hidden mb-6">
            <div className="h-1 bg-emerald-700"></div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Upazila */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Upazila (উপজেলা)
                  </label>
                  <select
                    value={selectedUpazila}
                    onChange={(e) => setSelectedUpazila(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  >
                    <option value="">All Upazilas</option>
                    {upazilas.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mouza */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Mouza (মৌজা)
                  </label>
                  <select
                    value={selectedMouza}
                    onChange={(e) => setSelectedMouza(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  >
                    <option value="">All Mouzas</option>
                    {mouzas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Volume */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Volume (ভলিউম)
                  </label>
                  <select
                    value={selectedVolume}
                    onChange={(e) => setSelectedVolume(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  >
                    <option value="">All Volumes</option>
                    {volumes.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Document Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Document Type
                  </label>
                  <select
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value)}
                    className="w-full px-4 py-2.5 border whitespace-nowrap border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
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
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white border border-gray-200 shadow-xs overflow-hidden">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold">#</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold">Upazila / Mouza</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold">
                    Khatian / Holding / Plot
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold">Volume</th>
                  {/* New column */}
                  <th className="text-left px-6 py-4 text-sm font-semibold">Record Type</th>
                  {/* <th className="text-left px-6 py-4 text-sm font-semibold">Remarks</th> */}
                  <th className="text-right px-6 py-4 text-sm font-semibold">Files & Action</th>
                </tr>
              </thead>

              <tbody>
                {!loading && records.length > 0 ? (
                  records.map((record) => (
                    <tr key={record.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-3 font-semibold">{record.id}</td>
                      <td className="px-6 py-3">
                        <p className="font-semibold">{record.upazila}</p>
                        <p className="text-sm text-gray-600">{record.mouza}</p>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-1 flex-wrap items-center">
                          {record.khatian || record.holding || record.dag ? (
                            <>
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
                                  <span className="font-medium text-gray-600">P:</span>
                                  {record.dag}
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400 text-sm">N/A</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-3">
                        <span className="text-sm">{record.volume || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-5">
                        {record.doc_type ? (
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${docTypeColors[record.doc_type]}`}
                          >
                            {docTypeLabels[record.doc_type]}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      {/* <td className="px-6 py-5">
                        {record.remarks ? (
                          <span className="text-sm">{record.remarks}</span>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td> */}
                      <td className="px-6 py-3 gap-2">
                        {/* Files button */}
                        <div className="flex gap-2 items-center justify-end">
                          <button
                            className="inline-flex items-center gap-2 px-2 py-2 border border-gray-300 rounded text-sm whitespace-nowrap"
                            onClick={() => {
                              setCurrentFiles(record.files)
                              setModalOpen(true)
                            }}
                          >
                            <FileText size={16} />
                            Files ({record.fileCount})
                          </button>
                          {/* Info icon button */}
                          <button
                            className="p-2 border border-gray-300 rounded hover:bg-gray-100"
                            onClick={() => {
                              setSelectedRecord(record)
                              setInfoModalOpen(true)
                            }}
                          >
                            <Info size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      {loading ? 'Loading records...' : 'No records found!'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
              <div className="flex justify-end items-center gap-2 p-4 border-gray-200">
                <button
                  className="p-2 rounded-full bg-gray-200 disabled:opacity-50"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="p-2 rounded-full bg-gray-200 disabled:opacity-50"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
