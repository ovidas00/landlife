import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'node:path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { getDB } from './db'
import fs from 'node:fs'
import { backupFolder, getDocumentFolder } from './utils'

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
      nodeIntegration: false,
      backgroundThrottling: false,
      spellcheck: false,
      webgl: false
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

ipcMain.handle('delete-upazila', (event, upazilaId) => {
  const db = getDB()
  db.prepare('DELETE FROM upazilas WHERE id = ?').run(upazilaId)

  return { success: true }
})

ipcMain.handle('add-mouza', (event, name, upazilaId) => {
  const db = getDB()
  db.prepare('INSERT INTO mouzas (name, upazila_id) VALUES (?, ?)').run(name, upazilaId)

  return { success: true }
})

ipcMain.handle('get-mouzas', (event, upazilaId) => {
  const db = getDB()
  return db.prepare('SELECT * FROM mouzas WHERE upazila_id = ?').all(upazilaId)
})

ipcMain.handle('delete-mouza', (event, mouzaId) => {
  const db = getDB()
  db.prepare('DELETE FROM mouzas WHERE id = ?').run(mouzaId)

  return { success: true }
})

ipcMain.handle('add-volume', (event, name, upazilaId) => {
  const db = getDB()
  db.prepare('INSERT INTO volumes (name, upazila_id) VALUES (?, ?)').run(name, upazilaId)

  return { success: true }
})

ipcMain.handle('delete-volume', (event, volumeId) => {
  const db = getDB()
  db.prepare('DELETE FROM volumes WHERE id = ?').run(volumeId)

  return { success: true }
})

ipcMain.handle('get-volumes', async (event, upazilaId) => {
  const db = getDB()
  return db.prepare('SELECT * FROM volumes WHERE upazila_id = ?').all(upazilaId)
})

ipcMain.handle('upload-document', async (event, payload) => {
  const db = getDB()

  const { upazilaId, mouzaId, volumeId, khatianNo, dagNo, holdingNo, docType, remarks, files } =
    payload

  // folder to store PDFs
  const baseDir = join(getDocumentFolder(), 'documents')
  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true })

  // create document record
  const result = db
    .prepare(
      `
      INSERT INTO documents
      (upazila_id, mouza_id, volume_id, khatian_no, dag_no, holding_no, doc_type, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .run(upazilaId, mouzaId, volumeId, khatianNo, dagNo, holdingNo, docType, remarks)

  const documentId = result.lastInsertRowid

  // save files (skip if none — allowed for "not_found")
  const fileStmt = db.prepare(`
    INSERT INTO document_files (document_id, file_name, file_path)
    VALUES (?, ?, ?)
  `)

  for (const file of files || []) {
    const filename = `${Date.now()}-${file.name}`
    const filePath = join(baseDir, filename)

    fs.writeFileSync(filePath, Buffer.from(file.buffer))

    fileStmt.run(documentId, file.name, filePath)
  }

  return { success: true, documentId }
})

ipcMain.handle('get-documents', async (event, filters = {}) => {
  const db = getDB()

  const { upazilaId, mouzaId, volumeId, docType, searchQuery, page = 1, pageSize = 50 } = filters

  const offset = (page - 1) * pageSize

  const conditions = []
  const params = []

  // Upazila filter
  if (upazilaId) {
    conditions.push('d.upazila_id = ?')
    params.push(upazilaId)
  }

  // Mouza filter
  if (mouzaId) {
    conditions.push('d.mouza_id = ?')
    params.push(mouzaId)
  }

  // Volume filter
  if (volumeId) {
    conditions.push('d.volume_id = ?')
    params.push(volumeId)
  }

  // Document type filter
  if (docType) {
    conditions.push('d.doc_type = ?')
    params.push(docType)
  }

  // Search filter
  if (searchQuery) {
    const q = `%${searchQuery.toLowerCase()}%`
    conditions.push(`
      (
        LOWER(d.khatian_no) LIKE ?
        OR LOWER(d.dag_no) LIKE ?
        OR LOWER(d.holding_no) LIKE ?
      )
    `)
    params.push(q, q, q)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Fetch documents with pagination
  const documents = db
    .prepare(
      `
    SELECT 
      d.id,
      d.upazila_id,
      d.mouza_id,
      d.volume_id,
      d.khatian_no,
      d.dag_no,
      d.holding_no,
      d.doc_type,
      d.remarks,
      d.created_at,
      d.updated_at,
      u.name AS upazilaName,
      m.name AS mouzaName,
      v.name AS volumeName,
      COALESCE(f.files, '') AS files
    FROM documents d
    LEFT JOIN upazilas u ON d.upazila_id = u.id
    LEFT JOIN mouzas m ON d.mouza_id = m.id
    LEFT JOIN volumes v ON d.volume_id = v.id
    LEFT JOIN (
      SELECT document_id,
        GROUP_CONCAT(id || '::' || file_name || '::' || file_path, '|') AS files
      FROM document_files
      GROUP BY document_id
    ) f ON f.document_id = d.id
    ${whereClause}
    ORDER BY d.id DESC
    LIMIT ? OFFSET ?
  `
    )
    .all(...params, pageSize, offset)

  // Map files
  const result = documents.map((doc) => {
    const files = doc.files
      ? doc.files.split('|').map((str) => {
          const [id, file_name, file_path] = str.split('::')
          return { id: parseInt(id), file_name, file_path }
        })
      : []

    return { ...doc, files }
  })

  // Optional: total count for frontend pagination
  const total = db
    .prepare(`SELECT COUNT(*) as count FROM documents d ${whereClause}`)
    .get(...params).count

  return { data: result, total, page, pageSize }
})

ipcMain.handle('delete-document', async (event, documentId) => {
  const db = getDB()

  const files = db
    .prepare(`SELECT file_path FROM document_files WHERE document_id = ?`)
    .all(documentId)

  for (const file of files) {
    if (fs.existsSync(file.file_path)) {
      try {
        fs.unlinkSync(file.file_path)
      } catch (err) {
        console.error(`Failed to delete file ${file.file_path}:`, err)
      }
    }
  }

  db.prepare(`DELETE FROM document_files WHERE document_id = ?`).run(documentId)

  db.prepare(`DELETE FROM documents WHERE id = ?`).run(documentId)

  return { success: true }
})

ipcMain.handle('open-file', async (event, filePath) => {
  if (!filePath) return
  await shell.openPath(filePath) // opens PDF in default system app
})

ipcMain.handle('get-dashboard-state', async () => {
  const db = getDB()

  // Total documents
  const totalDocuments = db.prepare(`SELECT COUNT(*) AS count FROM documents`).get().count

  // Total upazilas
  const totalUpazilas = db.prepare(`SELECT COUNT(*) AS count FROM upazilas`).get().count

  // Document count by type
  const docTypeCounts = db
    .prepare(
      `
      SELECT
        SUM(CASE WHEN doc_type = 'usable' THEN 1 ELSE 0 END) AS usable,
        SUM(CASE WHEN doc_type = 'unusable' THEN 1 ELSE 0 END) AS unusable,
        SUM(CASE WHEN doc_type = 'moderate' THEN 1 ELSE 0 END) AS moderate,
        SUM(CASE WHEN doc_type = 'not_found' THEN 1 ELSE 0 END) AS not_found
      FROM documents
    `
    )
    .get()

  // Document count by upazila
  const docsByUpazila = db
    .prepare(
      `
      SELECT u.name AS upazila, COUNT(d.id) AS documentCount
      FROM upazilas u
      LEFT JOIN documents d ON d.upazila_id = u.id
      GROUP BY u.id
      ORDER BY u.name
    `
    )
    .all()

  return {
    totalUpazilas,
    totalDocuments,
    usableRecords: docTypeCounts.usable ?? 0,
    unusableRecords: docTypeCounts.unusable ?? 0,
    moderateRecords: docTypeCounts.moderate ?? 0,
    notFoundRecords: docTypeCounts.not_found ?? 0,
    docsByUpazila
  }
})

ipcMain.handle('get-report-state', async (event, filters = {}) => {
  const db = getDB()

  const { upazilaId, mouzaId, volumeId, docType } = filters

  // Build WHERE conditions dynamically
  const conditions = []
  const params = {}

  if (upazilaId) {
    conditions.push('d.upazila_id = @upazilaId')
    params.upazilaId = upazilaId
  }
  if (mouzaId) {
    conditions.push('d.mouza_id = @mouzaId')
    params.mouzaId = mouzaId
  }
  if (volumeId) {
    conditions.push('d.volume_id = @volumeId')
    params.volumeId = volumeId
  }
  if (docType) {
    conditions.push('d.doc_type = @docType')
    params.docType = docType
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  // Total documents
  const totalDocuments = db
    .prepare(`SELECT COUNT(*) AS count FROM documents d ${whereClause}`)
    .get(params).count

  // Document count by type
  const docTypeCounts = db
    .prepare(
      `
      SELECT
        SUM(CASE WHEN doc_type = 'usable' THEN 1 ELSE 0 END) AS usable,
        SUM(CASE WHEN doc_type = 'unusable' THEN 1 ELSE 0 END) AS unusable,
        SUM(CASE WHEN doc_type = 'moderate' THEN 1 ELSE 0 END) AS moderate,
        SUM(CASE WHEN doc_type = 'not_found' THEN 1 ELSE 0 END) AS not_found
      FROM documents d
      ${whereClause}
      `
    )
    .get(params)

  return {
    totalDocuments,
    usableRecords: docTypeCounts.usable ?? 0,
    unusableRecords: docTypeCounts.unusable ?? 0,
    moderateRecords: docTypeCounts.moderate ?? 0,
    notFoundRecords: docTypeCounts.not_found ?? 0
  }
})

ipcMain.handle('start-backup', async (event, password = null) => {
  const sourceDir = getDocumentFolder()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outputArchive = join(app.getPath('downloads'), `landlife-archive-${timestamp}.7z`)

  try {
    await backupFolder(sourceDir, outputArchive, password)
    return { success: true }
  } catch (err) {
    console.error('Backup failed in main process:', err)
    throw err
  }
})
