import { FileText, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import FilesModal from '../components/FilesModal'
import ReportStats from '../components/ReportStats'

export default function ReportsPage() {
  const [upazilas, setUpazilas] = useState([])
  const [moujas, setMoujas] = useState([])
  const [selectedUpazila, setSelectedUpazila] = useState('')
  const [selectedMouja, setSelectedMouja] = useState('')
  const [selectedDocType, setSelectedDocType] = useState('')
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [currentFiles, setCurrentFiles] = useState([])

  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [total, setTotal] = useState(0)

  // Load upazilas
  useEffect(() => {
    const loadUpazilas = async () => {
      const data = await window.api.getUpazilas()
      setUpazilas(data)
    }
    loadUpazilas()
  }, [])

  // Load moujas on upazila change
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

  // Fetch documents on filter/page change
  useEffect(() => {
    loadDocuments()
  }, [selectedUpazila, selectedMouja, selectedDocType, page])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const filters = { page, pageSize }
      if (selectedDocType) filters.docType = selectedDocType
      if (selectedUpazila) filters.upazilaId = selectedUpazila
      if (selectedMouja) filters.moujaId = selectedMouja

      const res = await window.api.getDocuments(filters)
      const docs = res?.data ?? res

      const formatted = docs.map((doc) => ({
        id: doc.id,
        doc_type: doc.doc_type,
        remarks: doc.remarks,
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

  const exportRecords = () => {
    console.log('Exporting records...', records)
  }

  return (
    <>
      <FilesModal files={currentFiles} isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      <div className="bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Reports</h1>
              <p className="text-gray-600">Generate and export land document reports instantly.</p>
            </div>
            {/* Export Button */}
            <button
              onClick={exportRecords}
              className="inline-flex items-center gap-2 px-6 py-2 border-2 border-gray-300 text-gray-600 bg-white rounded-lg shadow hover:bg-gray-200 transition"
            >
              <Download size={16} />
              Export
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden mb-6">
            <div className="h-1 bg-gradient-to-r from-emerald-600 to-orange-500"></div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    Mouza (মৌজা)
                  </label>
                  <select
                    value={selectedMouja}
                    onChange={(e) => setSelectedMouja(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  >
                    <option value="">All Mouzas</option>
                    {moujas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    <option value="usable">Usable Records</option>
                    <option value="unusable">Unusable Records</option>
                    <option value="moderate">Moderately Usable</option>
                    <option value="not_found">Not Found Records</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <ReportStats />

          {/* Results Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold">Serial</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold">Upazila / Mouza</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold">
                    Khatian / Holding / Dag
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold">Record Type</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold">Remarks</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold">Files</th>
                </tr>
              </thead>

              <tbody>
                {!loading && records.length > 0 ? (
                  records.map((record) => (
                    <tr key={record.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-3 font-semibold">{record.id}</td>
                      <td className="px-6 py-3">
                        <p className="font-semibold">{record.upazila}</p>
                        <p className="text-sm text-gray-600">{record.mouja}</p>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-1 flex-wrap items-center">
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
                        {record.remarks ? (
                          <span className="text-sm">{record.remarks}</span>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <button
                          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm whitespace-nowrap"
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
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      {loading ? 'Loading records...' : 'No records found!'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
              <div className="flex justify-end items-center gap-2 p-4 border-t border-gray-200">
                <button
                  className="p-2 border rounded-lg disabled:opacity-50"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="p-2 border rounded-lg disabled:opacity-50"
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
