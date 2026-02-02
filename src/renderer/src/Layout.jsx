import { LayoutGrid, Upload, Search, MapPin } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export default function Layout({ children }) {
  const location = useLocation() // gives current URL path

  const navLinks = [
    { to: '/', icon: <LayoutGrid size={18} />, label: 'Dashboard' },
    { to: '/upload', icon: <Upload size={18} />, label: 'Upload Document' },
    { to: '/search', icon: <Search size={18} />, label: 'Search Records' },
    { to: '/locations', icon: <MapPin size={18} />, label: 'Manage Locations' }
  ]

  return (
    <div className="flex h-screen max-h-screen overflow-y-auto bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white h-screen overflow-y-auto fixed border-r border-gray-200 flex flex-col">
        {/* Logo Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-800 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">LandLife</h1>
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
      <main className="flex-1 p-8 bg-gray-50 ml-60">{children}</main>
    </div>
  )
}
