import { Database, Download, FileText, Files, HardDrive } from 'lucide-react'
import BackupModal from '../components/BackupModal'
import { useEffect, useState } from 'react'

export default function ExportPage() {
  const [backupOpen, setBackupOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const [totalStats, setTotalStats] = useState({
    documents: 0,
    files: 0
  })

  const [upazilas, setUpazilas] = useState([])

  useEffect(() => {
    const loadStats = async () => {
      try {
        const state = await window.api.getBackupState()
        setTotalStats(state.totalStats)
        setUpazilas(state.upazilas)
      } catch (err) {
        console.error('Failed to load backup stats:', err)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  return (
    <>
      <BackupModal isOpen={backupOpen} onClose={() => setBackupOpen(false)} />

      <div className="bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Export & Backup</h1>
            <p className="text-gray-600">
              Create backups of land document records and export data by region.
            </p>
          </div>

          {/* Full Backup Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-5 flex items-center justify-between gap-6">
              {/* Left */}
              <div className="flex items-center gap-4 flex-1">
                <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Database size={18} className="text-emerald-700" />
                </div>

                <div>
                  <h2 className="font-semibold text-gray-900">Full System Backup</h2>
                  <p className="text-sm text-gray-600">
                    Complete archive of all documents and files
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm">
                <span className="text-gray-600">
                  <span className="font-semibold text-gray-900">
                    {loading ? '...' : totalStats.documents}
                  </span>{' '}
                  Docs
                </span>

                <span className="text-gray-600">
                  <span className="font-semibold text-gray-900">
                    {loading ? '...' : totalStats.files}
                  </span>{' '}
                  Files
                </span>
              </div>

              {/* Button */}
              <button
                onClick={() => setBackupOpen(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
              >
                <Download size={16} />
                Backup
              </button>
            </div>
          </div>

          {/* Regional Backups */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Regional Backups</h2>
            <p className="text-gray-600 mb-6">Export data for individual regions.</p>

            <div className="space-y-4">
              {upazilas.map((upazila, index) => {
                const hasData = upazila.documents > 0 || upazila.files > 0

                return (
                  <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-6 flex-1">
                        <h3
                          className={`text-xl font-bold ${hasData ? 'text-gray-900' : 'text-gray-400'}`}
                        >
                          {upazila.name}
                        </h3>

                        <span className={`text-sm ${hasData ? 'text-gray-600' : 'text-gray-400'}`}>
                          {upazila.documents} Documents
                        </span>

                        <span className={`text-sm ${hasData ? 'text-gray-600' : 'text-gray-400'}`}>
                          {upazila.files} Files
                        </span>
                      </div>

                      <button
                        disabled={!hasData}
                        className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 ${
                          hasData
                            ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Download size={16} />
                        Backup
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
