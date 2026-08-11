import { Folder, Save, Database, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { showSuccess } from '../utils/toast'

export default function SettingsPage() {
  const [currentPath, setCurrentPath] = useState('')
  const [newPath, setNewPath] = useState('')

  const [currentDatabaseUrl, setCurrentDatabaseUrl] = useState('')
  const [newDatabaseUrl, setNewDatabaseUrl] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await window.api.getConfig()

        const documentPath = config.documentPath || ''
        const databaseUrl = config.databaseUrl || ''

        setCurrentPath(documentPath)
        setNewPath(documentPath)

        setCurrentDatabaseUrl(databaseUrl)
        setNewDatabaseUrl(databaseUrl)
      } catch (err) {
        console.error('Failed to load config:', err)
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [])

  const handleBrowse = async () => {
    try {
      const selected = await window.api.selectFolder()

      if (selected) {
        setNewPath(selected)
      }
    } catch (err) {
      console.error('Folder selection failed:', err)
    }
  }

  const handleSave = async () => {
    if (!newPath || !newDatabaseUrl) return

    try {
      setSaving(true)

      await window.api.saveConfig({
        documentPath: newPath,
        databaseUrl: newDatabaseUrl
      })

      setCurrentPath(newPath)
      setCurrentDatabaseUrl(newDatabaseUrl)

      showSuccess('Settings saved')
    } catch (err) {
      console.error('Failed to save config:', err)
    } finally {
      setSaving(false)
    }
  }

  const isUnchanged = newPath === currentPath && newDatabaseUrl === currentDatabaseUrl

  return (
    <div className="bg-gray-100 p-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>

          <p className="text-gray-600">Configure your document storage and database connection.</p>
        </div>

        {/* Settings Card */}
        <div className="bg-white rounded shadow-xs border border-gray-200 p-6 space-y-8">
          {/* Document Storage */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Folder size={18} className="text-gray-700" />

              <h2 className="text-base font-semibold text-gray-900">Document Storage</h2>
            </div>

            {/* Current Path */}
            <div>
              <label className="text-sm text-gray-600">Current Location</label>

              <div className="mt-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-800 break-all">
                {loading ? 'Loading...' : currentPath || 'Not set'}
              </div>
            </div>

            {/* New Path */}
            <div className="mt-5">
              <label className="text-sm text-gray-600">New Location</label>

              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newPath}
                  readOnly
                  placeholder="Select folder..."
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />

                <button
                  onClick={handleBrowse}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm flex items-center gap-2"
                >
                  <Folder size={16} />
                  Browse
                </button>
              </div>
            </div>
          </div>

          {/* Database */}
          <div className="border-t border-gray-200 pt-8">
            <div className="flex items-center gap-2 mb-4">
              <Database size={18} className="text-gray-700" />

              <h2 className="text-base font-semibold text-gray-900">Database</h2>
            </div>

            {/* Current Database URL */}
            <div>
              <label className="text-sm text-gray-600">Current Database URL</label>

              <div className="mt-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-800 break-all font-mono">
                {loading ? 'Loading...' : currentDatabaseUrl || 'Not set'}
              </div>
            </div>

            {/* New Database URL */}
            <div className="mt-5">
              <label className="text-sm text-gray-600">MySQL Database URL</label>

              <input
                type="text"
                value={newDatabaseUrl}
                onChange={(e) => setNewDatabaseUrl(e.target.value)}
                placeholder="mysql://username:password@localhost:3306/database"
                disabled={loading}
                className="mt-2 w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono bg-white disabled:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />

              <p className="mt-2 text-xs text-gray-500">
                Example: mysql://root:password@localhost:3306/landlife
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="flex gap-2 text-xs text-gray-500 border-t border-gray-200 pt-6">
            <TriangleAlert className="text-orange-500 shrink-0" size={14} />

            <span>
              Changing the document location affects where new documents are saved and where
              existing documents are accessed. The database URL controls which MySQL database the
              application connects to.
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleSave}
              disabled={saving || loading || isUnchanged || !newPath || !newDatabaseUrl}
              className={`px-5 py-2 rounded text-sm font-medium flex items-center gap-2 ${
                saving || loading || isUnchanged || !newPath || !newDatabaseUrl
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              <Save size={16} />

              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
