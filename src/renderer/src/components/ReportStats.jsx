import { FileText } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ReportStats({ filters = {} }) {
  const [stats, setStats] = useState([])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await window.api.getReportState(filters)

        setStats([
          {
            label: 'Total Records',
            value: data.totalDocuments,
            subtitle: 'Registered records',
            icon: FileText,
            color: 'emerald',
            bgColor: 'bg-emerald-50',
            iconColor: 'text-emerald-700',
            borderColor: 'border-l-emerald-700'
          },
          {
            label: 'Usable Records',
            value: data.usableRecords,
            subtitle: 'Records ready to use',
            icon: FileText,
            color: 'emerald',
            bgColor: 'bg-emerald-50',
            iconColor: 'text-emerald-700',
            borderColor: 'border-l-emerald-700'
          },
          {
            label: 'Unusable Records',
            value: data.unusableRecords,
            subtitle: 'Records with issues',
            icon: FileText,
            color: 'red',
            bgColor: 'bg-red-50',
            iconColor: 'text-red-700',
            borderColor: 'border-l-red-700'
          },
          {
            label: 'Moderately Usable',
            value: data.moderateRecords,
            subtitle: 'Needs verification',
            icon: FileText,
            color: 'yellow',
            bgColor: 'bg-yellow-50',
            iconColor: 'text-yellow-700',
            borderColor: 'border-l-yellow-700'
          },
          {
            label: 'Not Found Records',
            value: data.notFoundRecords,
            subtitle: 'Missing documents',
            icon: FileText,
            color: 'gray',
            bgColor: 'bg-gray-100',
            iconColor: 'text-gray-700',
            borderColor: 'border-l-gray-700'
          }
        ])
      } catch (err) {
        console.error('Failed to load report stats:', err)
        setStats([])
      }
    }

    fetchStats()
  }, [filters]) // refetch whenever filters change

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div
            key={index}
            className={`bg-white rounded-lg border border-gray-300 shadow-sm overflow-hidden p-3 flex items-center gap-3`}
          >
            <div
              className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}
            >
              <Icon size={18} className={stat.iconColor} />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
