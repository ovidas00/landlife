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

let db

// This method will be called when Electron has finished
app.whenReady().then(async () => {
  db = await getDB()
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

/* Upazila */
ipcMain.handle('add-upazilla', async (event, name) => {
  const normalizedName = name.trim()

  if (!normalizedName) {
    return { success: false, message: 'Name is required' }
  }

  const [exists] = await db.query('SELECT 1 FROM upazilas WHERE LOWER(name) = LOWER(?) LIMIT 1', [
    normalizedName
  ])

  if (exists.length > 0) {
    return { success: false, message: 'Upazila already exists' }
  }

  await db.query('INSERT INTO upazilas (name) VALUES (?)', [normalizedName])

  return { success: true }
})

ipcMain.handle('get-upazilas', async () => {
  const [rows] = await db.query('SELECT * FROM upazilas')

  return rows
})

ipcMain.handle('update-upazila', async (event, { id, name }) => {
  const normalizedName = name.trim()

  if (!normalizedName) {
    return { success: false, message: 'Name is required' }
  }

  const [exists] = await db.query(
    'SELECT 1 FROM upazilas WHERE LOWER(name) = LOWER(?) AND id != ? LIMIT 1',
    [normalizedName, id]
  )

  if (exists.length > 0) {
    return { success: false, message: 'Upazila already exists' }
  }

  await db.query('UPDATE upazilas SET name = ? WHERE id = ?', [normalizedName, id])

  return { success: true }
})

ipcMain.handle('delete-upazila', async (event, upazilaId) => {
  await db.query('DELETE FROM upazilas WHERE id = ?', [upazilaId])

  return { success: true }
})

/* Mouza */
ipcMain.handle('add-mouza', async (event, name, upazilaId) => {
  const normalizedName = name.trim()

  if (!normalizedName) {
    return { success: false, message: 'Name is required' }
  }

  const [rows] = await db.query(
    `
    SELECT 1
    FROM mouzas
    WHERE LOWER(name) = LOWER(?) AND upazila_id = ?
    LIMIT 1
    `,
    [normalizedName, upazilaId]
  )

  if (rows.length > 0) {
    return { success: false, message: 'Mouza already exists in this upazila' }
  }

  await db.query(
    `
    INSERT INTO mouzas (name, upazila_id)
    VALUES (?, ?)
    `,
    [normalizedName, upazilaId]
  )

  return { success: true }
})

ipcMain.handle('get-mouzas', async (event, upazilaId) => {
  const [rows] = await db.query('SELECT * FROM mouzas WHERE upazila_id = ?', [upazilaId])

  return rows
})

ipcMain.handle('update-mouza', async (event, { id, name, upazilaId }) => {
  const normalizedName = name.trim()

  if (!normalizedName) {
    return { success: false, message: 'Name is required' }
  }

  const [rows] = await db.query(
    `
    SELECT 1
    FROM mouzas
    WHERE LOWER(name) = LOWER(?) AND upazila_id = ? AND id != ?
    LIMIT 1
    `,
    [normalizedName, upazilaId, id]
  )

  if (rows.length > 0) {
    return { success: false, message: 'Mouza already exists in this upazila' }
  }

  await db.query(
    `
    UPDATE mouzas
    SET name = ?, upazila_id = ?
    WHERE id = ?
    `,
    [normalizedName, upazilaId, id]
  )

  return { success: true }
})

ipcMain.handle('delete-mouza', async (event, mouzaId) => {
  await db.query('DELETE FROM mouzas WHERE id = ?', [mouzaId])

  return { success: true }
})

/* Volume */
ipcMain.handle('add-volume', async (event, name, upazilaId) => {
  const normalizedName = name.trim()

  if (!normalizedName) {
    return { success: false, message: 'Name is required' }
  }

  const [rows] = await db.query(
    `
    SELECT 1
    FROM volumes
    WHERE LOWER(name) = LOWER(?) AND upazila_id = ?
    LIMIT 1
    `,
    [normalizedName, upazilaId]
  )

  if (rows.length > 0) {
    return { success: false, message: 'Volume already exists in this upazila' }
  }

  await db.query(
    `
    INSERT INTO volumes (name, upazila_id)
    VALUES (?, ?)
    `,
    [normalizedName, upazilaId]
  )

  return { success: true }
})

ipcMain.handle('get-volumes', async (event, upazilaId) => {
  const [rows] = await db.query('SELECT * FROM volumes WHERE upazila_id = ?', [upazilaId])

  return rows
})

ipcMain.handle('update-volume', async (event, { id, name, upazilaId }) => {
  const normalizedName = name.trim()

  if (!normalizedName) {
    return { success: false, message: 'Name is required' }
  }

  const [rows] = await db.query(
    `
    SELECT 1
    FROM volumes
    WHERE LOWER(name) = LOWER(?) AND upazila_id = ? AND id != ?
    LIMIT 1
    `,
    [normalizedName, upazilaId, id]
  )

  if (rows.length > 0) {
    return { success: false, message: 'Volume already exists in this upazila' }
  }

  await db.query(
    `
    UPDATE volumes
    SET name = ?, upazila_id = ?
    WHERE id = ?
    `,
    [normalizedName, upazilaId, id]
  )

  return { success: true }
})

ipcMain.handle('delete-volume', async (event, volumeId) => {
  await db.query('DELETE FROM volumes WHERE id = ?', [volumeId])

  return { success: true }
})

/* Documents */
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
  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true })

  // Prevent invalid cycle
  if (previousDocumentId && nextDocumentId && previousDocumentId === nextDocumentId) {
    return { success: false, message: 'Previous and next document cannot be the same' }
  }

  // isValidPosition
  async function isValidPosition(previousId, nextId) {
    if (!previousId || !nextId) return true

    let [rows] = await db.execute('SELECT id, next_document_id FROM documents WHERE id = ?', [
      previousId
    ])

    let current = rows[0]
    const visited = new Set()

    while (current) {
      if (visited.has(current.id)) return false
      visited.add(current.id)

      if (current.id === nextId) return true

      if (!current.next_document_id) break

      const [nextRows] = await db.execute(
        'SELECT id, next_document_id FROM documents WHERE id = ?',
        [current.next_document_id]
      )

      current = nextRows[0]
    }

    return false
  }

  // Validate sequence
  if (previousDocumentId && nextDocumentId) {
    const valid = await isValidPosition(previousDocumentId, nextDocumentId)
    if (!valid) {
      return {
        success: false,
        message: 'Invalid sequence: previous document must come before next document in the chain'
      }
    }
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    // Insert document
    const [result] = await connection.execute(
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
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
      ]
    )

    const documentId = result.insertId

    // Update previous document
    if (previousDocumentId) {
      await connection.execute(`UPDATE documents SET next_document_id = ? WHERE id = ?`, [
        documentId,
        previousDocumentId
      ])
    }

    //  Update next document
    if (nextDocumentId) {
      await connection.execute(`UPDATE documents SET previous_document_id = ? WHERE id = ?`, [
        documentId,
        nextDocumentId
      ])
    }

    // Insert files
    for (const file of files || []) {
      const filename = `${Date.now()}-${file.name}`
      const filePath = join(baseDir, filename)

      fs.writeFileSync(filePath, Buffer.from(file.buffer))

      await connection.execute(
        `
        INSERT INTO document_files (document_id, file_name, file_path)
        VALUES (?, ?, ?)
        `,
        [documentId, file.name, filePath]
      )
    }

    await connection.commit()
    connection.release()

    return { success: true, documentId }
  } catch (err) {
    await connection.rollback()
    connection.release()

    console.error('Error uploading document:', err)
    return { success: false, message: 'Failed to upload document' }
  }
})

ipcMain.handle('get-documents', async (event, filters = {}) => {
  const { upazilaId, mouzaId, volumeId, docType, searchQuery, page = 1, pageSize = 10 } = filters

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

  const query = `
    WITH RECURSIVE down_chain (root_id, next_id, path) AS (
      SELECT id AS root_id, next_document_id, CONCAT('|', id, '|') AS path
      FROM documents
      WHERE next_document_id IS NOT NULL

      UNION ALL

      SELECT dc.root_id, d.next_document_id, CONCAT(dc.path, d.id, '|')
      FROM down_chain dc
      JOIN documents d ON dc.next_id = d.id
      WHERE d.next_document_id IS NOT NULL
        AND LOCATE(CONCAT('|', d.id, '|'), dc.path) = 0
    )

    SELECT 
      d.*,
      u.name AS upazilaName,
      m.name AS mouzaName,
      v.name AS volumeName,
      COALESCE(f.files, '') AS files,
      COUNT(dc.next_id) AS relation_count

    FROM documents d
    LEFT JOIN upazilas u ON d.upazila_id = u.id
    LEFT JOIN mouzas m ON d.mouza_id = m.id
    LEFT JOIN volumes v ON d.volume_id = v.id

    LEFT JOIN (
      SELECT 
        document_id,
        GROUP_CONCAT(CONCAT(id, '::', file_name, '::', file_path) SEPARATOR '|') AS files
      FROM document_files
      GROUP BY document_id
    ) f ON f.document_id = d.id

    LEFT JOIN down_chain dc ON dc.root_id = d.id

    ${whereClause}

    GROUP BY d.id
    ORDER BY d.id DESC
    LIMIT ? OFFSET ?
  `

  const [documents] = await db.query(query, [...params, pageSize, offset])

  // Parse files
  const result = documents.map((doc) => {
    const files = doc.files
      ? doc.files.split('|').map((str) => {
          const [id, file_name, file_path] = str.split('::')
          return { id: Number(id), file_name, file_path }
        })
      : []

    return { ...doc, files }
  })

  // total count
  const [countRows] = await db.query(
    `SELECT COUNT(*) as count FROM documents d ${whereClause}`,
    params
  )

  const total = countRows[0].count

  return { data: result, total, page, pageSize }
})

ipcMain.handle('get-document-by-id', async (event, documentId) => {
  if (!documentId) throw new Error('Document ID is required')

  const [rows] = await db.execute(
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
      SELECT 
        document_id,
        GROUP_CONCAT(CONCAT(id, '::', file_name, '::', file_path) SEPARATOR '|') AS files
      FROM document_files
      GROUP BY document_id
    ) f ON f.document_id = d.id
    WHERE d.id = ?
    `,
    [documentId]
  )

  const doc = rows[0]

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
    const [prevRows] = await db.execute(
      `
      SELECT id, khatian_no, dag_no, holding_no
      FROM documents
      WHERE id = ?
      `,
      [doc.previous_document_id]
    )
    previousDocument = prevRows[0] || null
  }

  // Fetch next document
  let nextDocument = null
  if (doc.next_document_id) {
    const [nextRows] = await db.execute(
      `
      SELECT id, khatian_no, dag_no, holding_no
      FROM documents
      WHERE id = ?
      `,
      [doc.next_document_id]
    )
    nextDocument = nextRows[0] || null
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

  // isValidPosition
  async function isValidPosition(previousId, nextId) {
    if (!previousId || !nextId) return true

    let [rows] = await db.execute('SELECT id, next_document_id FROM documents WHERE id = ?', [
      previousId
    ])

    let current = rows[0]
    const visited = new Set()

    while (current) {
      if (visited.has(current.id)) return false
      visited.add(current.id)

      if (current.id === nextId) return true

      if (!current.next_document_id) break

      const [nextRows] = await db.execute(
        'SELECT id, next_document_id FROM documents WHERE id = ?',
        [current.next_document_id]
      )

      current = nextRows[0]
    }

    return false
  }

  // Validations
  if (previousDocumentId && nextDocumentId && previousDocumentId === nextDocumentId) {
    return { success: false, message: 'Previous and next document cannot be the same' }
  }

  if (previousDocumentId === id || nextDocumentId === id) {
    return {
      success: false,
      message: 'Previous or next document cannot be the same as the current document'
    }
  }

  if (previousDocumentId && nextDocumentId) {
    const valid = await isValidPosition(previousDocumentId, nextDocumentId)
    if (!valid) {
      return {
        success: false,
        message: 'Invalid sequence: previous document must come before next document'
      }
    }
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    // Fetch old previous & next
    const [oldRows] = await connection.execute(
      'SELECT previous_document_id, next_document_id FROM documents WHERE id = ?',
      [id]
    )

    const oldDoc = oldRows[0]
    const oldPrev = oldDoc?.previous_document_id
    const oldNext = oldDoc?.next_document_id

    // Update main document
    await connection.execute(
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
        updated_at = NOW()
      WHERE id = ?
      `,
      [
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
      ]
    )

    // Fix old neighbors
    if (oldPrev && oldPrev !== previousDocumentId) {
      await connection.execute(`UPDATE documents SET next_document_id = ? WHERE id = ?`, [
        oldNext || null,
        oldPrev
      ])
    }

    if (oldNext && oldNext !== nextDocumentId) {
      await connection.execute(`UPDATE documents SET previous_document_id = ? WHERE id = ?`, [
        oldPrev || null,
        oldNext
      ])
    }

    // Update new neighbors
    if (previousDocumentId) {
      await connection.execute(`UPDATE documents SET next_document_id = ? WHERE id = ?`, [
        id,
        previousDocumentId
      ])
    }

    if (nextDocumentId) {
      await connection.execute(`UPDATE documents SET previous_document_id = ? WHERE id = ?`, [
        id,
        nextDocumentId
      ])
    }

    // Handle files

    // Existing file IDs to keep
    const keepIds = existingFiles.map((f) => f.id)

    // Get all files
    const [allFiles] = await connection.execute(
      `SELECT * FROM document_files WHERE document_id = ?`,
      [id]
    )

    const filesToDelete = allFiles.filter((f) => !keepIds.includes(f.id))

    for (const f of filesToDelete) {
      const path = join(getDocumentFolder(), 'documents', basename(f.file_path))

      try {
        if (fs.existsSync(path)) fs.unlinkSync(path)
      } catch {
        // ignore
      }

      await connection.execute(`DELETE FROM document_files WHERE id = ?`, [f.id])
    }

    // Insert new files
    for (const file of newFiles) {
      const filename = `${Date.now()}-${file.name}`
      const filePath = join(baseDir, filename)

      fs.writeFileSync(filePath, Buffer.from(file.buffer))

      await connection.execute(
        `
        INSERT INTO document_files (document_id, file_name, file_path)
        VALUES (?, ?, ?)
        `,
        [id, file.name, filePath]
      )
    }

    await connection.commit()
    connection.release()

    return { success: true, documentId: id }
  } catch (err) {
    await connection.rollback()
    connection.release()

    console.error('Error updating document:', err)
    return { success: false, message: 'Failed to update document' }
  }
})

ipcMain.handle('delete-document', async (event, documentId) => {
  if (!documentId) {
    return { success: false, message: 'Document ID is required' }
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    // Get files
    const [files] = await connection.execute(
      `SELECT file_path FROM document_files WHERE document_id = ?`,
      [documentId]
    )

    // Delete files from disk
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

    // Delete DB records
    await connection.execute(`DELETE FROM document_files WHERE document_id = ?`, [documentId])

    await connection.execute(`DELETE FROM documents WHERE id = ?`, [documentId])

    await connection.commit()
    connection.release()

    return { success: true }
  } catch (err) {
    await connection.rollback()
    connection.release()

    console.error('Error deleting document:', err)
    return { success: false, message: 'Failed to delete document' }
  }
})

ipcMain.handle('open-file', async (event, filePath) => {
  if (!filePath) return
  const path = join(getDocumentFolder(), 'documents', basename(filePath))
  await shell.openPath(path) // opens PDF in default system app
})

ipcMain.handle('get-dashboard-state', async () => {
  // Total documents
  const [totalDocsRows] = await db.query(`SELECT COUNT(*) AS count FROM documents`)
  const totalDocuments = totalDocsRows[0].count

  // Total upazilas
  const [totalUpazilaRows] = await db.query(`SELECT COUNT(*) AS count FROM upazilas`)
  const totalUpazilas = totalUpazilaRows[0].count

  // Document count by type
  const [docTypeRows] = await db.query(`
    SELECT
      SUM(CASE WHEN doc_type = 'usable' THEN 1 ELSE 0 END) AS usable,
      SUM(CASE WHEN doc_type = 'unusable' THEN 1 ELSE 0 END) AS unusable,
      SUM(CASE WHEN doc_type = 'moderate' THEN 1 ELSE 0 END) AS moderate,
      SUM(CASE WHEN doc_type = 'not_found' THEN 1 ELSE 0 END) AS not_found
    FROM documents
  `)

  const docTypeCounts = docTypeRows[0]

  // Dashboard stats by upazila
  const [docsByUpazila] = await db.query(`
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
  `)

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

  // Recursive CTE to traverse the document chain safely
  const chain = db
    .prepare(
      `
WITH RECURSIVE document_tree(
    id, khatian_no, holding_no, dag_no, volume_id, next_document_id, path
) AS (
    -- Start from the root document
    SELECT id, khatian_no, holding_no, dag_no, volume_id, next_document_id, printf('|%d|', id) AS path
    FROM documents
    WHERE id = ?

    UNION ALL

    -- Follow next_document_id only if not already visited
    SELECT d.id, d.khatian_no, d.holding_no, d.dag_no, d.volume_id, d.next_document_id, dt.path || d.id || '|'
    FROM document_tree dt
    JOIN documents d ON dt.next_document_id = d.id
    WHERE instr(dt.path, printf('|%d|', d.id)) = 0
)
SELECT dt.id, dt.khatian_no, dt.holding_no, dt.dag_no, v.name AS volumeName
FROM document_tree dt
LEFT JOIN volumes v ON dt.volume_id = v.id
  `
    )
    .all(rootId)

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
          d.doc_type
            ? d.doc_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
            : 'N/A'
        ])
      ]

      const success = await exportToPDF({
        tableData,
        columnWidths: [45, '*', 60, 60, 75, 50, 55, 55],
        outDir: filePath
      })

      return { success }
    }
  } catch (err) {
    console.error('Export failed:', err)
    return { success: false }
  }
})

ipcMain.handle('export-document-tree', async (event, rootId) => {
  if (!rootId) throw new Error('Document ID is required')

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  const defaultName = `document-tree-${rootId}-${timestamp}.pdf`

  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Save document tree',
    defaultPath: join(app.getPath('downloads'), defaultName)
  })

  if (canceled || !filePath) return { success: false }

  // Recursive query to get the chain
  const documents = db
    .prepare(
      `
WITH RECURSIVE document_tree(
    id,
    upazila_id,
    mouza_id,
    volume_id,
    khatian_no,
    holding_no,
    dag_no,
    doc_type,
    remarks,
    created_at,
    updated_at,
    next_document_id,
    path
) AS (
    SELECT
        id,
        upazila_id,
        mouza_id,
        volume_id,
        khatian_no,
        holding_no,
        dag_no,
        doc_type,
        remarks,
        created_at,
        updated_at,
        next_document_id,
        printf('|%d|', id)
    FROM documents
    WHERE id = ?

    UNION ALL

    SELECT
        d.id,
        d.upazila_id,
        d.mouza_id,
        d.volume_id,
        d.khatian_no,
        d.holding_no,
        d.dag_no,
        d.doc_type,
        d.remarks,
        d.created_at,
        d.updated_at,
        d.next_document_id,
        dt.path || d.id || '|'
    FROM document_tree dt
    JOIN documents d ON dt.next_document_id = d.id
    WHERE instr(dt.path, printf('|%d|', d.id)) = 0
)

SELECT
  dt.*,
  u.name AS upazilaName,
  m.name AS mouzaName,
  v.name AS volumeName
FROM document_tree dt
LEFT JOIN upazilas u ON dt.upazila_id = u.id
LEFT JOIN mouzas m ON dt.mouza_id = m.id
LEFT JOIN volumes v ON dt.volume_id = v.id
ORDER BY dt.id
`
    )
    .all(rootId)

  if (!documents.length) {
    return { success: false, message: 'No related documents found.' }
  }

  // Format for PDF
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
      d.doc_type ? d.doc_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'N/A'
    ])
  ]

  try {
    const success = await exportToPDF({
      tableData,
      columnWidths: [45, '*', 60, 60, 75, 50, 55, 55],
      outDir: filePath
    })

    return { success }
  } catch (err) {
    console.error('Export failed:', err)
    return { success: false }
  }
})
