import { FileText, TrendingUp, MapPin, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function Dashboard() {
  const [stats, setStats] = useState([])
  const [regions, setRegions] = useState([])

  useEffect(() => {
    const getStats = async () => {
      try {
        const data = await window.api.getDashboardState()

        // Update stats cards
        setStats([
          {
            label: 'Upazilas',
            value: data.totalUpazilas,
            subtitle: 'Registered regions',
            icon: MapPin,
            color: 'orange',
            bgColor: 'bg-orange-50',
            iconColor: 'text-orange-600',
            borderColor: 'border-l-orange-500'
          },
          {
            label: 'Total Documents',
            value: data.totalDocuments,
            subtitle: 'Registered records',
            icon: FileText,
            color: 'emerald',
            bgColor: 'bg-emerald-50',
            iconColor: 'text-emerald-700',
            borderColor: 'border-l-emerald-700'
          },
          {
            label: 'Total Files',
            value: data.totalFiles,
            subtitle: 'Uploaded PDFs',
            icon: TrendingUp,
            color: 'gray',
            bgColor: 'bg-gray-100',
            iconColor: 'text-gray-700',
            borderColor: 'border-l-gray-700'
          },
          {
            label: 'Unique Owners',
            value: data.uniqueOwners,
            subtitle: 'Property holders',
            icon: Users,
            color: 'cyan',
            bgColor: 'bg-cyan-50',
            iconColor: 'text-cyan-600',
            borderColor: 'border-l-cyan-500'
          }
        ])

        // Update regional distribution
        setRegions(
          data.docsByUpazila.map((r) => ({
            name: r.upazila,
            count: r.documentCount
          }))
        )
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
        setStats([])
        setRegions([])
      }
    }

    getStats()
  }, [])

  return (
    <div className="bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
          <p className="text-gray-600">
            Comprehensive view of your land document records and regional distribution.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className={`bg-white rounded-xl border-2 border-gray-200 ${stat.borderColor} border-l-4 shadow-sm overflow-hidden`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">{stat.label}</h3>
                    <div
                      className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}
                    >
                      <Icon size={20} className={stat.iconColor} />
                    </div>
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-gray-900 mb-1">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.subtitle}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Regional Distribution */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Regional Distribution</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regions.map((region, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Top border accent */}
                <div className="h-1 bg-emerald-700"></div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{region.name}</h3>
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                      {region.count}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText size={16} />
                    <span>Documents registered</span>
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
