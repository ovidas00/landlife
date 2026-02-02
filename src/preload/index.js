const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  addUpazila: (name) => ipcRenderer.invoke('add-upazilla', name),
  getUpazilas: () => ipcRenderer.invoke('get-upazilas'),

  addMouja: (name, upazilaId) => ipcRenderer.invoke('add-mouja', name, upazilaId),
  getMoujas: (upazilaId) => ipcRenderer.invoke('get-moujas', upazilaId),

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
  }
})
