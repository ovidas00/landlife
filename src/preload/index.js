const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  addUpazila: (name) => ipcRenderer.invoke('add-upazilla', name),
  getUpazilas: () => ipcRenderer.invoke('get-upazilas'),

  addMouja: (name, upazilaId) => ipcRenderer.invoke('add-mouja', name, upazilaId),
  getMoujas: (upazilaId) => ipcRenderer.invoke('get-moujas', upazilaId)
})
