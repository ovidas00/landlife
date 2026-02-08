import { app } from 'electron'
import { join } from 'node:path'
import fs from 'node:fs'
import Seven from 'node-7z'
import { path7za } from '7zip-bin'
import os from 'node:os'
import Database from 'better-sqlite3'

export function getDocumentFolder() {
  let folder

  if (process.platform === 'win32') {
    folder = join(
      process.env.LOCALAPPDATA || join(app.getPath('home'), 'AppData', 'Local'),
      app.getName()
    )
  } else if (process.platform === 'darwin') {
    folder = join(app.getPath('home'), 'Library', 'Application Support', app.getName())
  } else {
    folder = join(app.getPath('home'), '.local', 'share', app.getName())
  }

  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })
  return folder
}

export async function backupFolder(sourceDir, outputArchive, password = null, webContents) {
  return new Promise((resolve, reject) => {
    let bin

    if (app.isPackaged) {
      const nm = path7za.indexOf('node_modules')
      const relative = path7za.slice(nm + 'node_modules'.length + 1)
      bin = join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', relative)
    } else {
      bin = path7za
    }

    const options = {
      $bin: bin,
      $progress: true,
      password: password || undefined
    }

    // Copy app.db to temp folder
    const dbPath = join(sourceDir, 'app.db')
    const tempDir = join(os.tmpdir(), `backup-temp-${Date.now()}`)
    fs.mkdirSync(tempDir, { recursive: true })
    const tempDbPath = join(tempDir, 'app.db')
    fs.copyFileSync(dbPath, tempDbPath)

    // Recursive function to get all files
    function getAllFiles(dir, exclude = []) {
      let results = []
      const list = fs.readdirSync(dir)
      for (const item of list) {
        if (exclude.includes(item)) continue
        const fullPath = join(dir, item)
        const stat = fs.statSync(fullPath)
        if (stat.isDirectory()) {
          results = results.concat(getAllFiles(fullPath, exclude))
        } else {
          results.push(fullPath)
        }
      }
      return results
    }

    // Add all files in sourceDir except app.db
    const items = getAllFiles(sourceDir, ['app.db'])

    // Include the copied app.db
    items.push(tempDbPath)

    let processedCount = 0
    const totalFiles = items.length

    const archive = Seven.add(outputArchive, items, options)

    archive.on('progress', () => {
      processedCount++
      const percent = ((processedCount / totalFiles) * 100).toFixed(1)
      const progressData = {
        percent: Number(percent),
        processed: processedCount,
        total: totalFiles
      }

      console.log(`Backup progress: ${percent}% (${processedCount}/${totalFiles} files)`)

      if (webContents) {
        webContents.send('backup-progress', progressData)
      }
    })

    archive.on('end', () => {
      console.log(`Backup complete! Archive saved at: ${outputArchive}`)
      // Clean up temp DB
      fs.unlinkSync(tempDbPath)
      fs.rmdirSync(tempDir, { recursive: true })
      resolve()
    })

    archive.on('error', (err) => {
      console.error('Backup failed:', err)
      if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath)
      if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir, { recursive: true })
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
  return new Promise((resolve, reject) => {
    let bin

    if (app.isPackaged) {
      const nm = path7za.indexOf('node_modules')
      const relative = path7za.slice(nm + 'node_modules'.length + 1)
      bin = join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', relative)
    } else {
      bin = path7za
    }

    const options = {
      $bin: bin,
      $progress: true,
      password: password || undefined
    }

    // --- TEMP DB COPY ---
    const dbPath = join(sourceDir, 'app.db')
    const tempDir = join(os.tmpdir(), `backup-temp-${Date.now()}`)
    fs.mkdirSync(tempDir, { recursive: true })

    const tempDbPath = join(tempDir, 'app.db')
    fs.copyFileSync(dbPath, tempDbPath)

    // --- FILTER DB ---
    const tempDb = new Database(tempDbPath)
    tempDb.pragma('foreign_keys = OFF')

    // Atomic filtering transaction
    const tx = tempDb.transaction((upazilaId) => {
      tempDb.prepare(`DELETE FROM documents WHERE upazila_id != ?`).run(upazilaId)
      tempDb.prepare(`DELETE FROM mouzas WHERE upazila_id != ?`).run(upazilaId)
      tempDb.prepare(`DELETE FROM volumes WHERE upazila_id != ?`).run(upazilaId)
      tempDb.prepare(`DELETE FROM upazilas WHERE id != ?`).run(upazilaId)

      tempDb
        .prepare(
          `
    DELETE FROM document_files
    WHERE document_id NOT IN (SELECT id FROM documents)
  `
        )
        .run()
    })

    tx(upazilaId)

    // Integrity check
    const check = tempDb.prepare('PRAGMA integrity_check').get()
    if (check.integrity_check !== 'ok') {
      tempDb.close()
      throw new Error('Filtered DB failed integrity check')
    }

    // Optional: shrink DB file
    tempDb.exec('VACUUM')

    // Re-enable FK for exported DB
    tempDb.pragma('foreign_keys = ON')

    // Get remaining file paths AFTER cleanup
    const rows = tempDb.prepare(`SELECT file_path FROM document_files`).all()

    tempDb.close()

    const filesToInclude = rows.map((r) => r.file_path).filter((p) => fs.existsSync(p))

    // Add filtered DB
    filesToInclude.push(tempDbPath)

    let processedCount = 0
    const totalFiles = filesToInclude.length

    const archive = Seven.add(outputArchive, filesToInclude, options)

    archive.on('progress', () => {
      processedCount++
      const percent = ((processedCount / totalFiles) * 100).toFixed(1)

      const progressData = {
        percent: Number(percent),
        processed: processedCount,
        total: totalFiles
      }

      if (webContents) {
        webContents.send('backup-progress', progressData)
      }
    })

    archive.on('end', () => {
      fs.rmSync(tempDir, { recursive: true, force: true })
      resolve()
    })

    archive.on('error', (err) => {
      fs.rmSync(tempDir, { recursive: true, force: true })
      reject(err)
    })
  })
}
