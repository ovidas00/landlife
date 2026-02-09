const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  addUpazila: (name) => ipcRenderer.invoke('add-upazilla', name),
  getUpazilas: () => ipcRenderer.invoke('get-upazilas'),
  deleteUpazila: (upazilaId) => ipcRenderer.invoke('delete-upazila', upazilaId),

  addMouza: (name, upazilaId) => ipcRenderer.invoke('add-mouza', name, upazilaId),
  getMouzas: (upazilaId) => ipcRenderer.invoke('get-mouzas', upazilaId),
  deleteMouza: (mouzaId) => ipcRenderer.invoke('delete-mouza', mouzaId),

  addVolume: (name, upazilaId) => ipcRenderer.invoke('add-volume', name, upazilaId),
  getVolumes: (upazilaId) => ipcRenderer.invoke('get-volumes', upazilaId),
  deleteVolume: (volumeId) => ipcRenderer.invoke('delete-volume', volumeId),

  uploadDocument: async (data) => {
    const files = await Promise.all(
      data.files.map(async (f) => ({
        name: f.name,
        buffer: await f.arrayBuffer()
      }))
    )

    return ipcRenderer.invoke('upload-document', {
      ...data,
      files
    })
  },
  getDocuments: (filters = {}) => ipcRenderer.invoke('get-documents', filters),
  getDocumentById: (documentId) => ipcRenderer.invoke('get-document-by-id', documentId),
  updateDocument: async ({ newFiles = [], existingFiles = [], ...rest }) => {
    const filesWithBuffer = await Promise.all(
      newFiles.map(async (f) => ({
        name: f.name,
        buffer: await f.arrayBuffer()
      }))
    )

    return ipcRenderer.invoke('update-document', {
      ...rest,
      newFiles: filesWithBuffer,
      existingFiles
    })
  },
  deleteDocument: (documentId) => ipcRenderer.invoke('delete-document', documentId),
  openFile: (fileUrl) => ipcRenderer.invoke('open-file', fileUrl),

  getDashboardState: () => ipcRenderer.invoke('get-dashboard-state'),
  getReportState: (filters = {}) => ipcRenderer.invoke('get-report-state', filters),

  startBackup: (password = null) => ipcRenderer.invoke('start-backup', password),
  startBackupRegional: (password = null, upazilaId) =>
    ipcRenderer.invoke('start-backup-regional', { password, upazilaId }),
  onBackupProgress: (callback) =>
    ipcRenderer.on('backup-progress', (event, progress) => callback(progress)),
  getBackupState: () => ipcRenderer.invoke('get-backup-state')
})
