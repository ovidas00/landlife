import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { getDB } from './db'
import fs from 'node:fs'

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.maximize()
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.edulife.landlife')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('add-upazilla', async (event, name) => {
  const db = getDB()
  const stmt = db.prepare('INSERT INTO upazilas (name) VALUES (?)')
  stmt.run(name)

  return { success: true }
})

ipcMain.handle('get-upazilas', async () => {
  const db = getDB()
  const stmt = db.prepare('SELECT * FROM upazilas')
  const rows = stmt.all()

  return rows
})

ipcMain.handle('add-mouja', (event, name, upazilaId) => {
  const db = getDB()
  db.prepare('INSERT INTO moujas (name, upazila_id) VALUES (?, ?)').run(name, upazilaId)

  return { success: true }
})

ipcMain.handle('get-moujas', (event, upazilaId) => {
  const db = getDB()
  return db.prepare('SELECT * FROM moujas WHERE upazila_id = ?').all(upazilaId)
})

ipcMain.handle('upload-document', async (event, payload) => {
  const db = getDB()

  const { upazilaId, moujaId, khatianNo, dagNo, holdingNo, owners, files } = payload

  // folder to store PDFs
  const baseDir = join(app.getPath('userData'), 'documents')
  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true })

  // create document record
  const result = db
    .prepare(
      `
    INSERT INTO documents
    (upazila_id, mouja_id, khatian_no, dag_no, holding_no)
    VALUES (?, ?, ?, ?, ?)
  `
    )
    .run(upazilaId, moujaId, khatianNo, dagNo, holdingNo)

  const documentId = result.lastInsertRowid

  // insert owners
  const ownerStmt = db.prepare(`
    INSERT INTO document_owners (document_id, name)
    VALUES (?, ?)
  `)

  for (const owner of owners) {
    ownerStmt.run(documentId, owner)
  }

  // save files
  const fileStmt = db.prepare(`
    INSERT INTO document_files (document_id, file_name, file_path)
    VALUES (?, ?, ?)
  `)

  for (const file of files) {
    const filename = `${Date.now()}-${file.name}`
    const filePath = join(baseDir, filename)

    fs.writeFileSync(filePath, Buffer.from(file.buffer))

    fileStmt.run(documentId, file.name, filePath)
  }

  return { success: true, documentId }
})
