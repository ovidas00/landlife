import { useState } from 'react'
import { Database } from 'lucide-react'
import BackupModal from '../components/BackupModal'

export function ExportPage() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <BackupModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      <button
        className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg shadow transition-colors duration-200"
        onClick={() => setModalOpen(true)}
      >
        <Database size={20} />
        Backup
      </button>
    </>
  )
}
