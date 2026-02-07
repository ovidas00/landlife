import { useLocation, Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function Breadcrumb() {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter(Boolean) // split path

  // Map URL segment to a readable name
  const formatName = (name) => {
    return name.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) // capitalize first letter
  }

  return (
    <nav className="flex items-center text-gray-500 text-sm mb-4" aria-label="breadcrumb">
      <Link to="/" className="hover:text-gray-700">
        Dashboard
      </Link>

      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`
        const isLast = index === pathnames.length - 1

        return (
          <span key={to} className="flex items-center">
            <ChevronRight size={16} className="mx-2 text-gray-400" />
            {isLast ? (
              <span className="text-gray-700 font-medium">{formatName(value)}</span>
            ) : (
              <Link to={to} className="hover:text-gray-700">
                {formatName(value)}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
