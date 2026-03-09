import { FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import icon from '../../../../resources/kgc-logo.png?asset'

export default function Dashboard() {
  const [stats, setStats] = useState([])
  const [upazilas, setUpazilas] = useState([])
  const [selectedUpazilaId, setSelectedUpazilaId] = useState(null)
  const [upazilaStats, setUpazilaStats] = useState([])

  // Hoisted function
  function updateUpazilaStats(upazila, total) {
    const percent = (value) => {
      if (!total) return 0
      return ((value / total) * 100).toFixed(1)
    }

    setUpazilaStats([
      {
        label: 'Total Records',
        value: upazila.totalDocuments,
        subtitle: `Registered records`,
        percent: percent(upazila.totalDocuments),
        icon: FileText,
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-700',
        borderColor: 'border-l-blue-700'
      },
      {
        label: 'Usable Records',
        value: upazila.usableRecords,
        subtitle: `Records ready to use`,
        percent: percent(upazila.usableRecords),
        icon: FileText,
        bgColor: 'bg-emerald-50',
        iconColor: 'text-emerald-700',
        borderColor: 'border-l-emerald-700'
      },
      {
        label: 'Unusable Records',
        value: upazila.unusableRecords,
        subtitle: `Records with issues`,
        percent: percent(upazila.unusableRecords),
        icon: FileText,
        bgColor: 'bg-red-50',
        iconColor: 'text-red-700',
        borderColor: 'border-l-red-700'
      },
      {
        label: 'Moderately Usable',
        value: upazila.moderateRecords,
        subtitle: `Needs verification`,
        percent: percent(upazila.moderateRecords),
        icon: FileText,
        bgColor: 'bg-yellow-50',
        iconColor: 'text-yellow-700',
        borderColor: 'border-l-yellow-700'
      },
      {
        label: 'Not Found Records',
        value: upazila.notFoundRecords,
        subtitle: `Missing documents`,
        percent: percent(upazila.notFoundRecords),
        icon: FileText,
        bgColor: 'bg-gray-100',
        iconColor: 'text-gray-700',
        borderColor: 'border-l-gray-700'
      }
    ])
  }

  useEffect(() => {
    const getDashboard = async () => {
      try {
        const data = await window.api.getDashboardState()
        const total = data.totalDocuments || 0

        const percent = (value) => {
          if (!total) return 0
          return ((value / total) * 100).toFixed(1)
        }

        setStats([
          {
            label: 'Total Records',
            value: total,
            subtitle: 'Registered records',
            icon: FileText,
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-700',
            borderColor: 'border-l-blue-700'
          },
          {
            label: 'Usable Records',
            value: data.usableRecords,
            percent: percent(data.usableRecords),
            subtitle: 'Records ready to use',
            icon: FileText,
            bgColor: 'bg-emerald-50',
            iconColor: 'text-emerald-700',
            borderColor: 'border-l-emerald-700'
          },
          {
            label: 'Unusable Records',
            value: data.unusableRecords,
            percent: percent(data.unusableRecords),
            subtitle: 'Records with issues',
            icon: FileText,
            bgColor: 'bg-red-50',
            iconColor: 'text-red-700',
            borderColor: 'border-l-red-700'
          },
          {
            label: 'Moderately Usable',
            value: data.moderateRecords,
            percent: percent(data.moderateRecords),
            subtitle: 'Needs verification',
            icon: FileText,
            bgColor: 'bg-yellow-50',
            iconColor: 'text-yellow-700',
            borderColor: 'border-l-yellow-700'
          },
          {
            label: 'Not Found Records',
            value: data.notFoundRecords,
            percent: percent(data.notFoundRecords),
            subtitle: 'Missing documents',
            icon: FileText,
            bgColor: 'bg-gray-100',
            iconColor: 'text-gray-700',
            borderColor: 'border-l-gray-700'
          }
        ])

        const upazilasList = await window.api.getUpazilas()
        setUpazilas(upazilasList)

        // Default to first upazila
        if (data.docsByUpazila?.length) {
          setSelectedUpazilaId(data.docsByUpazila[0].id)
          updateUpazilaStats(data.docsByUpazila[0], total)
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
        setStats([])
        setUpazilas([])
        setUpazilaStats([])
      }
    }

    getDashboard()
  }, [])

  const handleUpazilaChange = async (e) => {
    const id = parseInt(e.target.value)
    setSelectedUpazilaId(id)

    try {
      const data = await window.api.getDashboardState()
      const total = data.totalDocuments || 0
      const selected = data.docsByUpazila.find((u) => u.id === id)
      if (selected) updateUpazilaStats(selected, total)
    } catch (err) {
      console.error('Failed to update upazila stats:', err)
    }
  }

  return (
    <div className="bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <img src={icon} alt="Logo" className="w-18 h-18 object-contain" />
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Khagrachari Hill District</h1>
            <p className="text-gray-600">
              Comprehensive view of land document records and upazila-level distribution.
            </p>
          </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className={`bg-white border border-gray-200 ${stat.borderColor} border-l-4 shadow-xs`}
              >
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-medium text-gray-600">{stat.label}</h3>
                    <div
                      className={`w-8 h-8 ${stat.bgColor} rounded-md flex items-center justify-center`}
                    >
                      <Icon size={14} className={stat.iconColor} />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-gray-900 leading-tight">
                    {stat.value}
                    {stat.percent && (
                      <span className="text-sm text-gray-500 ml-2">({stat.percent}%)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{stat.subtitle}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Upazila Distribution */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Upazila Distribution</h2>
          <div className="flex items-center gap-3">
            <p className="text-gray-800">Upazila:</p>
            <select
              className="border border-gray-300 rounded px-3 py-1 text-gray-700"
              value={selectedUpazilaId || ''}
              onChange={handleUpazilaChange}
            >
              {upazilas.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Upazila Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {upazilaStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className={`bg-white border border-gray-200 ${stat.borderColor} border-l-4 shadow-xs`}
              >
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-medium text-gray-600">{stat.label}</h3>
                    <div
                      className={`w-8 h-8 ${stat.bgColor} rounded-md flex items-center justify-center`}
                    >
                      <Icon size={14} className={stat.iconColor} />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-gray-900 leading-tight">
                    {stat.value}
                    {stat.percent && (
                      <span className="text-sm text-gray-500 ml-2">({stat.percent}%)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{stat.subtitle}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
