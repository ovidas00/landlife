import { Search, FileText } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'

export default function RecordsSearch() {
  const [upazilas, setUpazilas] = useState([])
  const [moujas, setMoujas] = useState([])
  const [selectedUpazila, setSelectedUpazila] = useState('')
  const [selectedMouja, setSelectedMouja] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

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
  }, [selectedUpazila, selectedMouja, searchQuery])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const filters = {}
      if (selectedUpazila) filters.upazilaId = selectedUpazila
      if (selectedMouja) filters.moujaId = selectedMouja
      if (searchQuery) filters.searchQuery = searchQuery

      const res = await window.api.getDocuments(filters)
      const docs = res?.data ?? res

      const formatted = docs.map((doc) => ({
        id: doc.id,
        upazila: doc.upazilaName,
        mouja: doc.moujaName,
        khatian: doc.khatian_no,
        dag: doc.dag_no,
        holding: doc.holding_no,
        owner: doc.owners?.join(', ') || '—',
        fileCount: doc.files?.length || 0
      }))

      setRecords(formatted)
    } catch (err) {
      console.error('Failed to load documents:', err)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  return (
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
                    type="text"
                    placeholder="Owner, Khatian, Dag or Holding..."
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
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 px-6 py-4">
              <div className="col-span-3 text-sm font-semibold">Upazila / Mouja</div>
              <div className="col-span-3 text-sm font-semibold">Khatian / Dag / Holding</div>
              <div className="col-span-3 text-sm font-semibold">Owner Name(s)</div>
              <div className="col-span-3 text-sm font-semibold">Files</div>
            </div>
          </div>

          <div>
            {loading && <div className="p-8 text-center text-gray-500">Loading documents...</div>}

            {!loading && records.length === 0 && (
              <div className="p-8 text-center text-gray-500">No records found.</div>
            )}

            {!loading &&
              records.map((record) => (
                <div key={record.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <div className="grid grid-cols-12 gap-4 px-6 py-5 items-center">
                    <div className="col-span-3">
                      <p className="font-semibold">{record.upazila}</p>
                      <p className="text-sm text-gray-600">{record.mouja}</p>
                    </div>

                    <div className="col-span-3 flex gap-1">
                      <div className="inline-flex gap-2 px-2.5 py-1 bg-gray-100 rounded text-sm">
                        <span className="font-medium text-gray-600">K:</span>
                        {record.khatian}
                      </div>
                      <div className="inline-flex gap-2 px-2.5 py-1 bg-gray-100 rounded text-sm">
                        <span className="font-medium text-gray-600">D:</span>
                        {record.dag}
                      </div>
                      {record.holding && (
                        <div className="inline-flex gap-2 px-2.5 py-1 bg-gray-100 rounded text-sm">
                          <span className="font-medium text-gray-600">H:</span>
                          {record.holding}
                        </div>
                      )}
                    </div>

                    <div className="col-span-3">
                      <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm">
                        {record.owner}
                      </span>
                    </div>

                    <div className="col-span-3">
                      <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm">
                        <FileText size={16} />
                        Files ({record.fileCount})
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
