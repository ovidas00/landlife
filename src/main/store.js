let store

export async function getStore() {
  if (!store) {
    const Store = (await import('electron-store')).default
    store = new Store({
      defaults: {
        documentPath: null
      }
    })
  }
  return store
}
