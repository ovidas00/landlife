const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  addUpazila: (name) => ipcRenderer.invoke('add-upazilla', name),
  getUpazilas: () => ipcRenderer.invoke('get-upazilas'),

  addMouza: (name, upazilaId) => ipcRenderer.invoke('add-mouza', name, upazilaId),
  getMouzas: (upazilaId) => ipcRenderer.invoke('get-mouzas', upazilaId),

  addVolume: (name, upazilaId) => ipcRenderer.invoke('add-volume', name, upazilaId),
  getVolumes: (upazilaId) => ipcRenderer.invoke('get-volumes', upazilaId),

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
  deleteDocument: (documentId) => ipcRenderer.invoke('delete-document', documentId),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),

  getDashboardState: () => ipcRenderer.invoke('get-dashboard-state'),
  getReportState: (filters = {}) => ipcRenderer.invoke('get-report-state', filters)
})
