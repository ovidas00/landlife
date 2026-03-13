import { app } from 'electron'
import { join, parse } from 'node:path'
import fs from 'node:fs/promises'
import Seven from 'node-7z'
import { path7za } from '7zip-bin'
import os from 'node:os'
import Database from 'better-sqlite3'

export async function getDocumentFolder() {
  let folder

  if (process.platform === 'win32') {
    const exeFolder = join(parse(app.getPath('exe')).root, 'LandLifeFiles')
    try {
      await fs.mkdir(exeFolder, { recursive: true })
      folder = exeFolder
    } catch {
      folder = join(
        process.env.LOCALAPPDATA || join(app.getPath('home'), 'AppData', 'Local'),
        app.getName()
      )
      await fs.mkdir(folder, { recursive: true })
    }
  } else if (process.platform === 'darwin') {
    folder = join(app.getPath('home'), 'Library', 'Application Support', app.getName())
    await fs.mkdir(folder, { recursive: true })
  } else {
    folder = join(app.getPath('home'), '.local', 'share', app.getName())
    await fs.mkdir(folder, { recursive: true })
  }

  return folder
}

async function countFiles(dir) {
  let count = 0
  const list = await fs.readdir(dir)
  for (const item of list) {
    const fullPath = join(dir, item)
    const stat = await fs.stat(fullPath)
    if (stat.isDirectory()) {
      count += await countFiles(fullPath)
    } else {
      count++
    }
  }
  return count
}

async function countFilesList(files) {
  let count = 0

  for (const f of files) {
    try {
      const stat = await fs.stat(f)

      if (stat.isDirectory()) {
        // recursively count all files in the folder
        const entries = await fs.readdir(f)
        const fullPaths = entries.map((i) => join(f, i))
        count += await countFilesList(fullPaths)
      } else {
        count++
      }
    } catch {
      // ignore missing files or errors
      continue
    }
  }

  return count
}

export async function backupFolder(sourceDir, outputArchive, password = null, webContents) {
  // Determine 7zip binary
  const bin = app.isPackaged
    ? join(
        process.resourcesPath,
        'app.asar.unpacked',
        'node_modules',
        'node-7z',
        'bin',
        process.platform === 'win32' ? '7z.exe' : '7z'
      )
    : path7za

  const options = {
    $bin: bin,
    $progress: true,
    password: password || undefined
  }

  // TEMP DB COPY
  const tempDir = join(os.tmpdir(), `backup-temp-${Date.now()}`)
  await fs.mkdir(tempDir, { recursive: true })

  const dbPath = join(sourceDir, 'app.db')
  const tempDbPath = join(tempDir, 'app.db')
  await fs.copyFile(dbPath, tempDbPath)

  // DOCUMENTS PATH
  const documentsPath = join(sourceDir, 'documents')
  const items = [tempDbPath, documentsPath]

  const totalFiles = 1 + (await countFiles(documentsPath)) // 1 for DB

  return new Promise((resolve, reject) => {
    const archive = Seven.add(outputArchive, items, options)

    archive.on('progress', (data) => {
      const progressData = {
        percent: data.percent,
        processed: data.fileCount,
        total: totalFiles
      }

      if (webContents) {
        webContents.send('backup-progress', progressData)
      }
    })

    archive.on('end', async () => {
      try {
        await fs.rm(tempDir, { recursive: true, force: true })
      } catch (err) {
        console.error('Failed to clean temp folder:', err)
      }
      console.log(`Backup complete! Archive saved at: ${outputArchive}`)
      resolve()
    })

    archive.on('error', async (err) => {
      try {
        await fs.rm(tempDir, { recursive: true, force: true })
      } catch {
        // Ignore
      }
      console.error('Backup failed:', err)
      reject(err)
    })
  })
}

export async function backupFolderRegional(
  sourceDir,
  outputArchive,
  password = null,
  webContents,
  upazilaId
) {
  // Determine 7zip binary
  const bin = app.isPackaged
    ? join(
        process.resourcesPath,
        'app.asar.unpacked',
        'node_modules',
        'node-7z',
        'bin',
        process.platform === 'win32' ? '7z.exe' : '7z'
      )
    : path7za

  const options = {
    $bin: bin,
    $progress: true,
    password: password || undefined
  }

  // TEMP DB COPY
  const tempDir = join(os.tmpdir(), `backup-temp-${Date.now()}`)
  await fs.mkdir(tempDir, { recursive: true })

  const dbPath = join(sourceDir, 'app.db')
  const tempDbPath = join(tempDir, 'app.db')
  await fs.copyFile(dbPath, tempDbPath)

  // --- FILTER DB ---
  const tempDb = new Database(tempDbPath)
  tempDb.pragma('foreign_keys = OFF')

  const tx = tempDb.transaction((upazilaId) => {
    tempDb.prepare(`DELETE FROM documents WHERE upazila_id != ?`).run(upazilaId)
    tempDb.prepare(`DELETE FROM mouzas WHERE upazila_id != ?`).run(upazilaId)
    tempDb.prepare(`DELETE FROM volumes WHERE upazila_id != ?`).run(upazilaId)
    tempDb.prepare(`DELETE FROM upazilas WHERE id != ?`).run(upazilaId)
    tempDb
      .prepare(
        `DELETE FROM document_files 
           WHERE document_id NOT IN (SELECT id FROM documents)`
      )
      .run()
  })

  tx(upazilaId)

  // --- Integrity check ---
  const check = tempDb.prepare('PRAGMA integrity_check').get()
  if (check.integrity_check !== 'ok') {
    tempDb.close()
    throw new Error('Filtered DB failed integrity check')
  }

  tempDb.exec('VACUUM')
  tempDb.pragma('foreign_keys = ON')

  // --- Get only files for this upazila directly from DB ---
  const rows = tempDb
    .prepare(
      `SELECT df.file_path 
         FROM document_files df 
         JOIN documents d ON df.document_id = d.id 
         WHERE d.upazila_id = ?`
    )
    .all(upazilaId)

  tempDb.close()

  // Only include files that actually exist
  const filesToInclude = (
    await Promise.all(
      rows.map(async (r) => {
        try {
          await fs.access(r.file_path) // throws if file doesn't exist
          return r.file_path
        } catch {
          return null
        }
      })
    )
  ).filter((p) => p !== null)

  // Include filtered DB at root
  filesToInclude.push(tempDbPath)

  const totalFiles = await countFilesList(filesToInclude)

  return new Promise((resolve, reject) => {
    const archive = Seven.add(outputArchive, filesToInclude, options)

    archive.on('progress', (data) => {
      const progressData = {
        percent: data.percent,
        processed: data.fileCount,
        total: totalFiles
      }

      if (webContents) {
        webContents.send('backup-progress', progressData)
      }
    })

    archive.on('end', async () => {
      try {
        await fs.rm(tempDir, { recursive: true, force: true })
      } catch (err) {
        console.error('Failed to clean temp folder:', err)
      }
      console.log(`Backup complete! Archive saved at: ${outputArchive}`)
      resolve()
    })

    archive.on('error', async (err) => {
      try {
        await fs.rm(tempDir, { recursive: true, force: true })
      } catch {
        // Ignore
      }
      console.error('Backup failed:', err)
      reject(err)
    })
  })
}
