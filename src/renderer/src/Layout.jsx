import {
  LayoutGrid,
  Upload,
  Search,
  MapPin,
  DatabaseBackup,
  FileChartColumn,
  ChevronDown,
  ChevronUp,
  Settings
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import logo from '../../../resources/icon.png'

export default function Layout({ children }) {
  const location = useLocation() // current URL
  const [settingsOpen, setSettingsOpen] = useState(false) // toggle for settings submenu

  const navLinks = [
    { to: '/', icon: <LayoutGrid size={18} />, label: 'Dashboard' },
    { to: '/search', icon: <Search size={18} />, label: 'Search Records' },
    { to: '/upload', icon: <Upload size={18} />, label: 'Upload Record' },
    { to: '/reports', icon: <FileChartColumn size={18} />, label: 'Reports' }
  ]

  const settingsLinks = [
    { to: '/locations', icon: <MapPin size={18} />, label: 'Manage Locations' },
    { to: '/export', icon: <DatabaseBackup size={18} />, label: 'Backup/Export' }
  ]

  return (
    <div className="flex h-screen max-h-screen overflow-y-auto bg-gray-100">
      {/* Sidebar */}
      <aside className="w-60 bg-white h-screen overflow-y-auto fixed border-r border-gray-200 flex flex-col">
        {/* Logo Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 flex items-center justify-center text-white">
              <img src={logo} alt="logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Edulife</h1>
              <p className="text-xs text-gray-500">Document System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors
                  ${isActive ? 'bg-emerald-700 text-white font-medium' : 'font-medium text-gray-700 hover:bg-gray-100'}
                `}
              >
                {link.icon}
                <span className="text-sm">{link.label}</span>
              </Link>
            )
          })}

          {/* Settings Section */}
          <div>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <span className="flex items-center gap-3">
                <Settings size={18} />
                <span className="text-sm font-medium text-gray-700">Settings</span>
              </span>
              {settingsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {settingsOpen && (
              <div className="mt-1 ml-6 flex flex-col space-y-1">
                {settingsLinks.map((link) => {
                  const isActive = location.pathname === link.to
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors
                        ${isActive ? 'bg-emerald-700 text-white font-medium' : 'text-gray-700 hover:bg-gray-100'}
                      `}
                    >
                      {link.icon}
                      <span className="text-sm">{link.label}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">Version 1.0 • Secure Storage</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 bg-gray-100 ml-60">{children}</main>
    </div>
  )
}
