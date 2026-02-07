import { Database, Download, FileText, Files, HardDrive } from 'lucide-react'
import BackupModal from '../components/BackupModal'
import { useState } from 'react'

export default function ExportPage() {
  const [backupOpen, setBackupOpen] = useState(false)

  // Overall stats
  const totalStats = {
    documents: 1,
    files: 1
  }

  // Upazila data with their stats
  const upazilas = [
    { name: 'Savar', documents: 0, files: 0 },
    { name: 'Dhamrai', documents: 1, files: 1 },
    { name: 'Keraniganj', documents: 0, files: 0 },
    { name: 'fdfd', documents: 0, files: 0 },
    { name: 'dfdfd', documents: 0, files: 0 }
  ]

  return (
    <>
      {/* Backup modal */}
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
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
            {/* Header with gradient */}
            <div className="h-1 bg-emerald-600"></div>

            <div className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Database size={24} className="text-emerald-700" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Full System Backup</h2>
                  <p className="text-gray-600">
                    Download a complete backup of all documents, files, and metadata from all
                    regions.
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                      <FileText size={20} className="text-gray-700" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Total Documents</p>
                      <p className="text-2xl font-bold text-gray-900">{totalStats.documents}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                      <Files size={20} className="text-gray-700" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Total Files</p>
                      <p className="text-2xl font-bold text-gray-900">{totalStats.files}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Backup Button */}
              <button
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-3"
                onClick={() => {
                  setBackupOpen(true)
                }}
              >
                <Download size={20} />
                <span>Download Full Backup</span>
              </button>
            </div>
          </div>

          {/* Regional Backups Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Regional Backups</h2>
            <p className="text-gray-600 mb-6">
              Export data for individual regions. Only regions with documents can be backed up.
            </p>

            <div className="space-y-4">
              {upazilas.map((upazila, index) => {
                const hasData = upazila.documents > 0 || upazila.files > 0

                return (
                  <div
                    key={index}
                    className={`bg-white rounded-lg shadow-sm overflow-hidden ${
                      hasData ? 'border-gray-200' : 'border-gray-100'
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        {/* Left side - Name and Stats */}
                        <div className="flex items-center gap-6 flex-1">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                hasData ? 'bg-emerald-50' : 'bg-gray-50'
                              }`}
                            >
                              <HardDrive
                                size={20}
                                className={hasData ? 'text-emerald-700' : 'text-gray-400'}
                              />
                            </div>
                            <h3
                              className={`text-xl font-bold ${hasData ? 'text-gray-900' : 'text-gray-400'}`}
                            >
                              {upazila.name}
                            </h3>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <FileText
                                size={16}
                                className={hasData ? 'text-gray-600' : 'text-gray-400'}
                              />
                              <span
                                className={`text-sm ${hasData ? 'text-gray-600' : 'text-gray-400'}`}
                              >
                                <span className="font-semibold">{upazila.documents}</span> Documents
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Files
                                size={16}
                                className={hasData ? 'text-gray-600' : 'text-gray-400'}
                              />
                              <span
                                className={`text-sm ${hasData ? 'text-gray-600' : 'text-gray-400'}`}
                              >
                                <span className="font-semibold">{upazila.files}</span> Files
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right side - Backup Button */}
                        <button
                          disabled={!hasData}
                          className={`px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                            hasData
                              ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <Download size={18} />
                          <span>Backup</span>
                        </button>
                      </div>
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
