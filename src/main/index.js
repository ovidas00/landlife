import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join, basename } from 'node:path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { getDB } from './db'
import fs from 'node:fs'
import {
  backupFolder,
  backupFolderRegional,
  exportToCSV,
  exportToExcel,
  exportToPDF,
  exportToWord,
  getDocumentFolder
} from './utils'

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

const db = getDB() // Initialize db

// This method will be called when Electron has finished
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.edulife.dcoffice')
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
  const normalizedName = name.trim()
  const exists = db
    .prepare('SELECT 1 FROM upazilas WHERE lower(name) = lower(?)')
    .get(normalizedName)

  if (exists) {
    return { success: false, message: 'Upazila already exists' }
  }

  db.prepare('INSERT INTO upazilas (name) VALUES (?)').run(normalizedName)

  return { success: true }
})

ipcMain.handle('get-upazilas', async () => {
  const stmt = db.prepare('SELECT * FROM upazilas')
  const rows = stmt.all()

  return rows
})

ipcMain.handle('update-upazila', async (event, { id, name }) => {
  const normalizedName = name.trim()

  if (!normalizedName) {
    return { success: false, message: 'Name is required' }
  }

  // Check if another upazila already has this name
  const exists = db
    .prepare('SELECT 1 FROM upazilas WHERE lower(name) = lower(?) AND id != ?')
    .get(normalizedName, id)

  if (exists) {
    return { success: false, message: 'Upazila already exists' }
  }

  db.prepare('UPDATE upazilas SET name = ? WHERE id = ?').run(normalizedName, id)

  return { success: true }
})

ipcMain.handle('delete-upazila', (event, upazilaId) => {
  db.prepare('DELETE FROM upazilas WHERE id = ?').run(upazilaId)

  return { success: true }
})

ipcMain.handle('add-mouza', (event, name, upazilaId) => {
  const normalizedName = name.trim()
  const exists = db
    .prepare(
      `
    SELECT 1
    FROM mouzas
    WHERE lower(name) = lower(?) AND upazila_id = ?
  `
    )
    .get(normalizedName, upazilaId)

  if (exists) {
    return { success: false, message: 'Mouza already exists in this upazila' }
  }

  db.prepare(
    `
    INSERT INTO mouzas (name, upazila_id)
    VALUES (?, ?)
  `
  ).run(normalizedName, upazilaId)

  return { success: true }
})

ipcMain.handle('get-mouzas', (event, upazilaId) => {
  return db.prepare('SELECT * FROM mouzas WHERE upazila_id = ?').all(upazilaId)
})

ipcMain.handle('update-mouza', (event, { id, name, upazilaId }) => {
  const normalizedName = name.trim()

  if (!normalizedName) {
    return { success: false, message: 'Name is required' }
  }

  // Check if another mouza in the same upazila has this name
  const exists = db
    .prepare(
      `
      SELECT 1
      FROM mouzas
      WHERE lower(name) = lower(?) AND upazila_id = ? AND id != ?
      `
    )
    .get(normalizedName, upazilaId, id)

  if (exists) {
    return { success: false, message: 'Mouza already exists in this upazila' }
  }

  db.prepare(
    `
    UPDATE mouzas
    SET name = ?, upazila_id = ?
    WHERE id = ?
    `
  ).run(normalizedName, upazilaId, id)

  return { success: true }
})

ipcMain.handle('delete-mouza', (event, mouzaId) => {
  db.prepare('DELETE FROM mouzas WHERE id = ?').run(mouzaId)

  return { success: true }
})

ipcMain.handle('add-volume', (event, name, upazilaId) => {
  const normalizedName = name.trim()
  const exists = db
    .prepare(
      `
      SELECT 1
      FROM volumes
      WHERE lower(name) = lower(?) AND upazila_id = ?
    `
    )
    .get(normalizedName, upazilaId)

  if (exists) {
    return { success: false, message: 'Volume already exists in this upazila' }
  }

  db.prepare(
    `
    INSERT INTO volumes (name, upazila_id)
    VALUES (?, ?)
  `
  ).run(normalizedName, upazilaId)

  return { success: true }
})

ipcMain.handle('get-volumes', async (event, upazilaId) => {
  return db.prepare('SELECT * FROM volumes WHERE upazila_id = ?').all(upazilaId)
})

ipcMain.handle('update-volume', (event, { id, name, upazilaId }) => {
  const normalizedName = name.trim()

  if (!normalizedName) {
    return { success: false, message: 'Name is required' }
  }

  // Check if another volume in the same upazila already has this name
  const exists = db
    .prepare(
      `
      SELECT 1
      FROM volumes
      WHERE lower(name) = lower(?) AND upazila_id = ? AND id != ?
      `
    )
    .get(normalizedName, upazilaId, id)

  if (exists) {
    return { success: false, message: 'Volume already exists in this upazila' }
  }

  // Update the record
  db.prepare(
    `
    UPDATE volumes
    SET name = ?, upazila_id = ?
    WHERE id = ?
    `
  ).run(normalizedName, upazilaId, id)

  return { success: true }
})

ipcMain.handle('delete-volume', (event, volumeId) => {
  db.prepare('DELETE FROM volumes WHERE id = ?').run(volumeId)

  return { success: true }
})

ipcMain.handle('upload-document', async (event, payload) => {
  const {
    upazilaId,
    mouzaId,
    volumeId,
    khatianNo,
    dagNo,
    holdingNo,
    docType,
    remarks,
    files,
    previousDocumentId,
    nextDocumentId
  } = payload

  const baseDir = join(getDocumentFolder(), 'documents')

  // Prevent invalid cycle
  if (previousDocumentId && nextDocumentId && previousDocumentId === nextDocumentId) {
    return { success: false, message: 'Previous and next document cannot be the same' }
  }

  function isValidPosition(previousId, nextId, db) {
    if (!previousId || !nextId) return true // one or both ends are null → always valid

    // Walk the chain from previousId to the end
    let current = db
      .prepare('SELECT id, next_document_id FROM documents WHERE id = ?')
      .get(previousId)
    const visited = new Set()

    while (current) {
      if (visited.has(current.id)) return false // safety against cycles
      visited.add(current.id)

      if (current.id === nextId) return true // previousId comes before nextId → valid

      current = current.next_document_id
        ? db
            .prepare('SELECT id, next_document_id FROM documents WHERE id = ?')
            .get(current.next_document_id)
        : null
    }

    // Reached the end without seeing nextId → invalid
    return false
  }

  // Prevent invalid sequence
  if (previousDocumentId && nextDocumentId) {
    const valid = isValidPosition(previousDocumentId, nextDocumentId, db)
    if (!valid) {
      return {
        success: false,
        message: 'Invalid sequence: previous document must come before next document in the chain'
      }
    }
  }

  try {
    const insertTransaction = db.transaction(() => {
      // Insert the new document
      const result = db
        .prepare(
          `
        INSERT INTO documents
        (
          upazila_id,
          mouza_id,
          volume_id,
          khatian_no,
          dag_no,
          holding_no,
          doc_type,
          remarks,
          previous_document_id,
          next_document_id,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+6 hours'), datetime('now', '+6 hours'))
        `
        )
        .run(
          upazilaId,
          mouzaId,
          volumeId,
          khatianNo,
          dagNo,
          holdingNo,
          docType,
          remarks,
          previousDocumentId || null,
          nextDocumentId || null
        )

      const documentId = result.lastInsertRowid

      // Update the previous document's next_document_id
      if (previousDocumentId) {
        db.prepare(`UPDATE documents SET next_document_id = ? WHERE id = ?`).run(
          documentId,
          previousDocumentId
        )
      }

      // Update the next document's previous_document_id
      if (nextDocumentId) {
        db.prepare(`UPDATE documents SET previous_document_id = ? WHERE id = ?`).run(
          documentId,
          nextDocumentId
        )
      }

      // Save files
      const fileStmt = db.prepare(`
        INSERT INTO document_files (document_id, file_name, file_path)
        VALUES (?, ?, ?)
      `)

      for (const file of files || []) {
        const filename = `${Date.now()}-${file.name}`
        const filePath = join(baseDir, filename)

        const buffer = Buffer.from(file.buffer)

        fs.writeFileSync(filePath, buffer)

        fileStmt.run(documentId, file.name, filePath)
      }

      return documentId
    })

    const documentId = insertTransaction()
    return { success: true, documentId }
  } catch (err) {
    console.error('Error uploading document:', err)
    return { success: false, message: 'Failed to upload document' }
  }
})

ipcMain.handle('get-documents', async (event, filters = {}) => {
  const { upazilaId, mouzaId, volumeId, docType, searchQuery, page = 1, pageSize = 50 } = filters
  const offset = (page - 1) * pageSize

  const conditions = []
  const params = []

  if (upazilaId) {
    conditions.push('d.upazila_id = ?')
    params.push(upazilaId)
  }
  if (mouzaId) {
    conditions.push('d.mouza_id = ?')
    params.push(mouzaId)
  }
  if (volumeId) {
    conditions.push('d.volume_id = ?')
    params.push(volumeId)
  }
  if (docType) {
    conditions.push('d.doc_type = ?')
    params.push(docType)
  }
  if (searchQuery) {
    const q = `%${searchQuery.toLowerCase()}%`
    conditions.push(`(
      LOWER(d.khatian_no) LIKE ?
      OR LOWER(d.dag_no) LIKE ?
      OR LOWER(d.holding_no) LIKE ?
    )`)
    params.push(q, q, q)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Fetch documents
  const documents = db
    .prepare(
      `
      SELECT 
        d.*,
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

  // Build a map for quick lookups
  const docMap = new Map(documents.map((d) => [d.id, { ...d, relation_count: 0 }]))

  // Helper: compute relation_count per chain
  function assignRelationCount() {
    // find all roots in this page (previous_document_id not in map OR null)
    const roots = documents.filter(
      (d) => !d.previous_document_id || !docMap.has(d.previous_document_id)
    )

    for (const root of roots) {
      let chain = []
      let current = docMap.get(root.id)
      while (current) {
        chain.push(current)
        current = current.next_document_id ? docMap.get(current.next_document_id) : null
      }

      // assign descending relation_count
      for (let i = 0; i < chain.length; i++) {
        chain[i].relation_count = chain.length - i - 1
      }
    }
  }

  assignRelationCount()

  // Parse files array
  const result = Array.from(docMap.values()).map((doc) => {
    const files = doc.files
      ? doc.files.split('|').map((str) => {
          const [id, file_name, file_path] = str.split('::')
          return { id: parseInt(id), file_name, file_path }
        })
      : []
    return { ...doc, files }
  })

  // total count
  const total = db
    .prepare(`SELECT COUNT(*) as count FROM documents d ${whereClause}`)
    .get(...params).count

  return { data: result, total, page, pageSize }
})

ipcMain.handle('get-document-by-id', async (event, documentId) => {
  if (!documentId) throw new Error('Document ID is required')

  const doc = db
    .prepare(
      `
      SELECT 
        d.*,
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
      WHERE d.id = ?
      `
    )
    .get(documentId)

  if (!doc) return null

  // Map files
  const files = doc.files
    ? doc.files.split('|').map((str) => {
        const [fileId, file_name, file_path] = str.split('::')
        return { id: parseInt(fileId), file_name, file_path }
      })
    : []

  // Fetch previous document
  let previousDocument = null
  if (doc.previous_document_id) {
    previousDocument = db
      .prepare(
        `
        SELECT id, khatian_no, dag_no, holding_no
        FROM documents
        WHERE id = ?
      `
      )
      .get(doc.previous_document_id)
  }

  // Fetch next document
  let nextDocument = null
  if (doc.next_document_id) {
    nextDocument = db
      .prepare(
        `
        SELECT id, khatian_no, dag_no, holding_no
        FROM documents
        WHERE id = ?
      `
      )
      .get(doc.next_document_id)
  }

  return {
    ...doc,
    files,
    previousDocument,
    nextDocument
  }
})

ipcMain.handle('update-document', async (event, payload) => {
  const {
    id,
    upazilaId,
    mouzaId,
    volumeId,
    khatianNo,
    dagNo,
    holdingNo,
    docType,
    remarks,
    previousDocumentId,
    nextDocumentId,
    newFiles = [],
    existingFiles = []
  } = payload

  if (!id) throw new Error('Document ID is required')

  const baseDir = join(getDocumentFolder(), 'documents')
  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true })

  function isValidPosition(previousId, nextId, db) {
    if (!previousId || !nextId) return true
    let current = db
      .prepare('SELECT id, next_document_id FROM documents WHERE id = ?')
      .get(previousId)
    const visited = new Set()
    while (current) {
      if (visited.has(current.id)) return false
      visited.add(current.id)
      if (current.id === nextId) return true
      current = current.next_document_id
        ? db
            .prepare('SELECT id, next_document_id FROM documents WHERE id = ?')
            .get(current.next_document_id)
        : null
    }
    return false
  }

  if (previousDocumentId && nextDocumentId && previousDocumentId === nextDocumentId) {
    return { success: false, message: 'Previous and next document cannot be the same' }
  }

  if (previousDocumentId && nextDocumentId) {
    const valid = isValidPosition(previousDocumentId, nextDocumentId, db)
    if (!valid) {
      return {
        success: false,
        message: 'Invalid sequence: previous document must come before next document'
      }
    }
  }

  try {
    const updateTransaction = db.transaction(() => {
      // Fetch old previous and next
      const oldDoc = db
        .prepare('SELECT previous_document_id, next_document_id FROM documents WHERE id = ?')
        .get(id)
      const oldPrev = oldDoc.previous_document_id
      const oldNext = oldDoc.next_document_id

      // Update main document info + chain
      db.prepare(
        `
        UPDATE documents SET
          upazila_id = ?,
          mouza_id = ?,
          volume_id = ?,
          khatian_no = ?,
          dag_no = ?,
          holding_no = ?,
          doc_type = ?,
          remarks = ?,
          previous_document_id = ?,
          next_document_id = ?,
          updated_at = datetime('now', '+6 hours')
        WHERE id = ?
      `
      ).run(
        upazilaId,
        mouzaId,
        volumeId,
        khatianNo,
        dagNo,
        holdingNo,
        docType,
        remarks,
        previousDocumentId || null,
        nextDocumentId || null,
        id
      )

      // Fix old neighbors
      if (oldPrev && oldPrev !== previousDocumentId) {
        db.prepare(`UPDATE documents SET next_document_id = ? WHERE id = ?`).run(
          oldNext || null,
          oldPrev
        )
      }
      if (oldNext && oldNext !== nextDocumentId) {
        db.prepare(`UPDATE documents SET previous_document_id = ? WHERE id = ?`).run(
          oldPrev || null,
          oldNext
        )
      }

      // Update new neighbors
      if (previousDocumentId) {
        db.prepare(`UPDATE documents SET next_document_id = ? WHERE id = ?`).run(
          id,
          previousDocumentId
        )
      }
      if (nextDocumentId) {
        db.prepare(`UPDATE documents SET previous_document_id = ? WHERE id = ?`).run(
          id,
          nextDocumentId
        )
      }

      // Handle files
      const keepIds = existingFiles.map((f) => f.id)
      const filesToDelete = db
        .prepare(`SELECT * FROM document_files WHERE document_id = ?`)
        .all(id)
        .filter((f) => !keepIds.includes(f.id))

      for (const f of filesToDelete) {
        try {
          if (fs.existsSync(f.file_path)) fs.unlinkSync(f.file_path)
        } catch {
          // Ignore
        }
        db.prepare(`DELETE FROM document_files WHERE id = ?`).run(f.id)
      }

      const fileStmt = db.prepare(`
        INSERT INTO document_files (document_id, file_name, file_path)
        VALUES (?, ?, ?)
      `)

      for (const file of newFiles || []) {
        const filename = `${Date.now()}-${file.name}`
        const filePath = join(baseDir, filename)

        const buffer = Buffer.from(file.buffer)

        fs.writeFileSync(filePath, buffer)

        fileStmt.run(id, file.name, filePath)
      }

      return id
    })

    const updatedId = updateTransaction()
    return { success: true, documentId: updatedId }
  } catch (err) {
    console.error('Error updating document:', err)
    return { success: false, message: 'Failed to update document' }
  }
})

ipcMain.handle('delete-document', async (event, documentId) => {
  const files = db
    .prepare(`SELECT file_path FROM document_files WHERE document_id = ?`)
    .all(documentId)

  for (const file of files) {
    const path = join(getDocumentFolder(), 'documents', basename(file.file_path))

    if (fs.existsSync(path)) {
      try {
        fs.unlinkSync(path)
      } catch (err) {
        console.error(`Failed to delete file ${path}:`, err)
      }
    }
  }

  db.prepare(`DELETE FROM document_files WHERE document_id = ?`).run(documentId)

  db.prepare(`DELETE FROM documents WHERE id = ?`).run(documentId)

  return { success: true }
})

ipcMain.handle('open-file', async (event, filePath) => {
  if (!filePath) return
  const path = join(getDocumentFolder(), 'documents', basename(filePath))
  await shell.openPath(path) // opens PDF in default system app
})

ipcMain.handle('get-dashboard-state', async () => {
  // Total documents
  const totalDocuments = db.prepare(`SELECT COUNT(*) AS count FROM documents`).get().count

  // Total upazilas
  const totalUpazilas = db.prepare(`SELECT COUNT(*) AS count FROM upazilas`).get().count

  // Document count by type (global)
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

  // Dashboard stats by upazila
  const docsByUpazila = db
    .prepare(
      `
      SELECT
        u.id,
        u.name AS upazila,

        COUNT(d.id) AS totalDocuments,

        SUM(CASE WHEN d.doc_type = 'usable' THEN 1 ELSE 0 END) AS usableRecords,
        SUM(CASE WHEN d.doc_type = 'unusable' THEN 1 ELSE 0 END) AS unusableRecords,
        SUM(CASE WHEN d.doc_type = 'moderate' THEN 1 ELSE 0 END) AS moderateRecords,
        SUM(CASE WHEN d.doc_type = 'not_found' THEN 1 ELSE 0 END) AS notFoundRecords

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

  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Save backup archive',
    defaultPath: join(app.getPath('downloads'), `landlife-archive-${timestamp}.7z`),
    filters: [{ name: '7zip Archive', extensions: ['7z'] }]
  })

  if (canceled || !filePath) {
    return { success: false, canceled: true }
  }

  try {
    await backupFolder(sourceDir, filePath, password, event.sender)
    return { success: true, path: filePath }
  } catch (err) {
    console.error('Backup failed in main process:', err)
    throw err
  }
})

ipcMain.handle('start-backup-regional', async (event, { password = null, upazilaId }) => {
  const sourceDir = getDocumentFolder()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Save backup archive',
    defaultPath: join(app.getPath('downloads'), `landlife-archive-${timestamp}.7z`),
    filters: [{ name: '7zip Archive', extensions: ['7z'] }]
  })

  if (canceled || !filePath) {
    return { success: false, canceled: true }
  }

  try {
    await backupFolderRegional(sourceDir, filePath, password, event.sender, upazilaId)
    return { success: true, path: filePath }
  } catch (err) {
    console.error('Backup failed in main process:', err)
    throw err
  }
})

ipcMain.handle('get-backup-state', async () => {
  // Overall stats
  const totalStats = db
    .prepare(
      `
      SELECT 
        (SELECT COUNT(*) FROM documents) AS documents,
        (SELECT COUNT(*) FROM document_files) AS files
    `
    )
    .get()

  // Per-upazila stats
  const upazilas = db
    .prepare(
      `
      SELECT 
        u.id,
        u.name,
        COUNT(DISTINCT d.id) AS documents,
        COUNT(f.id) AS files
      FROM upazilas u
      LEFT JOIN documents d ON d.upazila_id = u.id
      LEFT JOIN document_files f ON f.document_id = d.id
      GROUP BY u.id
      ORDER BY u.name
    `
    )
    .all()

  return {
    totalStats,
    upazilas
  }
})

ipcMain.handle('find-document', async (event, payload) => {
  const { upazilaId, mouzaId, khatianNo, holdingNo, plotNo } = payload

  if (!upazilaId) throw new Error('Upazila is required')
  if (!mouzaId) throw new Error('Mouza is required')
  if (!khatianNo || !khatianNo.trim()) throw new Error('Khatian No is required')

  const conditions = ['upazila_id = ?', 'mouza_id = ?', 'LOWER(khatian_no) = ?']
  const params = [upazilaId, mouzaId, khatianNo.trim().toLowerCase()]

  if (holdingNo && holdingNo.trim()) {
    conditions.push('LOWER(holding_no) = ?')
    params.push(holdingNo.trim().toLowerCase())
  }

  if (plotNo && plotNo.trim()) {
    conditions.push('LOWER(dag_no) = ?')
    params.push(plotNo.trim().toLowerCase())
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const doc = db
    .prepare(
      `
      SELECT *
      FROM documents
      ${whereClause}
      LIMIT 1
    `
    )
    .get(...params)

  return doc || null
})

ipcMain.handle('get-document-tree', async (event, rootId) => {
  if (!rootId) throw new Error('Document ID is required')

  const chain = []
  let currentId = rootId

  while (currentId) {
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(currentId)

    if (!doc) break

    chain.push(doc)
    currentId = doc.next_document_id // move to next
  }

  return chain
})

ipcMain.handle('export-documents', async (event, filters) => {
  const { format, upazilaId, mouzaId, volumeId, docType, searchQuery, rows } = filters
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  const defaultName =
    format === 'excel'
      ? `documents-${timestamp}.xlsx`
      : format === 'word'
        ? `documents-${timestamp}.docx`
        : format === 'csv'
          ? `documents-${timestamp}.csv`
          : `documents-${timestamp}.pdf`

  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Save documents export',
    defaultPath: join(app.getPath('downloads'), defaultName)
  })

  if (canceled || !filePath) return { success: false }

  // Filters
  const conditions = []
  const params = []

  if (upazilaId) {
    conditions.push('d.upazila_id = ?')
    params.push(upazilaId)
  }
  if (mouzaId) {
    conditions.push('d.mouza_id = ?')
    params.push(mouzaId)
  }
  if (volumeId) {
    conditions.push('d.volume_id = ?')
    params.push(volumeId)
  }
  if (docType) {
    conditions.push('d.doc_type = ?')
    params.push(docType)
  }
  if (searchQuery) {
    const q = `%${searchQuery.toLowerCase()}%`
    conditions.push(`(
      LOWER(d.khatian_no) LIKE ?
      OR LOWER(d.dag_no) LIKE ?
      OR LOWER(d.holding_no) LIKE ?
    )`)
    params.push(q, q, q)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Fetch documents
  const documents = db
    .prepare(
      `
      SELECT 
        d.*,
        u.name AS upazilaName,
        m.name AS mouzaName,
        v.name AS volumeName
      FROM documents d
      LEFT JOIN upazilas u ON d.upazila_id = u.id
      LEFT JOIN mouzas m ON d.mouza_id = m.id
      LEFT JOIN volumes v ON d.volume_id = v.id
      ${whereClause}
      ORDER BY d.id DESC
      LIMIT ${rows}
      `
    )
    .all(...params)

  if (!documents.length) {
    return { success: false, message: 'No data found for selected filters.' }
  }

  const docData = documents.map((d) => ({
    '#': d.id,
    Upazila: d.upazilaName,
    Mouza: d.mouzaName,
    Volume: d.volumeName,
    Khatian: d.khatian_no || 'N/A',
    Holding: d.holding_no || 'N/A',
    Plot: d.dag_no || 'N/A',
    Type: d.doc_type ? d.doc_type.charAt(0).toUpperCase() + d.doc_type.slice(1) : 'N/A',
    Remarks: d.remarks || '',
    'Created At': d.created_at,
    'Last Updated': d.updated_at
  }))

  try {
    if (format === 'csv') {
      const success = await exportToCSV({
        data: docData,
        outDir: filePath
      })

      return { success }
    } else if (format === 'excel') {
      const success = await exportToExcel({ data: docData, outDir: filePath })
      return { success }
    }
    if (format === 'word') {
      const success = await exportToWord({ data: docData, outDir: filePath })
      return { success }
    }
    {
      // PDF export
      const tableData = [
        ['#', 'Upazila', 'Mouza', 'Volume', 'Khatian', 'Holding', 'Plot', 'Type'],
        ...documents.map((d) => [
          d.id,
          d.upazilaName,
          d.mouzaName,
          d.volumeName,
          d.khatian_no || 'N/A',
          d.holding_no || 'N/A',
          d.dag_no || 'N/A',
          d.doc_type.charAt(0).toUpperCase() + d.doc_type.slice(1)
        ])
      ]

      const success = await exportToPDF({
        tableData,
        columnWidths: [40, '*', 60, 60, 60, 50, 55, 55],
        outDir: filePath
      })

      return { success }
    }
  } catch (err) {
    console.error('Export failed:', err)
    return { success: false }
  }
})
