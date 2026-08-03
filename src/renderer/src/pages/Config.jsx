import { Folder, Save, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { showSuccess } from '../utils/toast'

export default function SettingsPage() {
  const [currentPath, setCurrentPath] = useState('')
  const [newPath, setNewPath] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await window.api.getConfig()
        const path = config.documentPath || ''
        setCurrentPath(path)
        setNewPath(path)
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
    if (!newPath) return

    try {
      setSaving(true)
      await window.api.saveConfig({ documentPath: newPath })
      setCurrentPath(newPath)
      showSuccess('Location saved')
    } catch (err) {
      console.error('Failed to save config:', err)
    } finally {
      setSaving(false)
    }
  }

  const isUnchanged = newPath === currentPath

  return (
    <div className="bg-gray-100 p-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Configure where document files are stored on your system.</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded shadow-xs border border-gray-200 p-6 space-y-6">
          {/* Current Path */}
          <div>
            <label className="text-sm text-gray-600">Current Location</label>

            <div className="mt-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-800 break-all">
              {loading ? 'Loading...' : currentPath || 'Not set'}
            </div>
          </div>

          {/* New Path */}
          <div>
            <label className="text-sm text-gray-600">New Location</label>

            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newPath}
                readOnly
                placeholder="Select folder..."
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50"
              />

              <button
                onClick={handleBrowse}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm flex items-center gap-2"
              >
                <Folder size={16} />
                Browse
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500 flex gap-1">
            <TriangleAlert className="text-orange-500" size={14} />
            <span>
              Changing this location will determine where new documents are saved and where existing
              documents are accessed.
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving || isUnchanged || !newPath}
              className={`px-5 py-2 rounded text-sm font-medium flex items-center gap-2 ${
                saving || isUnchanged || !newPath
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
