import { LayoutGrid, Upload, Search, MapPin, DatabaseBackup } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import itLogo from '../../../resources/it-logo.png'

export default function Layout({ children }) {
  const location = useLocation() // gives current URL path

  const navLinks = [
    { to: '/', icon: <LayoutGrid size={18} />, label: 'Dashboard' },
    { to: '/search', icon: <Search size={18} />, label: 'Search Records' },
    { to: '/upload', icon: <Upload size={18} />, label: 'Upload Document' },
    { to: '/locations', icon: <MapPin size={18} />, label: 'Manage Locations' },
    { to: '/export', icon: <DatabaseBackup size={18} />, label: 'Backup/Export' }
  ]

  return (
    <div className="flex h-screen max-h-screen overflow-y-auto bg-gray-100">
      {/* Sidebar */}
      <aside className="w-60 bg-white h-screen overflow-y-auto fixed border-r border-gray-200 flex flex-col">
        {/* Logo Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-800 rounded-lg flex items-center justify-center text-white p-1">
              <img src={itLogo} alt="logo" />
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
                  ${isActive ? 'bg-emerald-700 text-white font-medium' : 'text-gray-700 hover:bg-gray-100'}
                `}
              >
                {link.icon}
                <span className="text-sm">{link.label}</span>
              </Link>
            )
          })}
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
