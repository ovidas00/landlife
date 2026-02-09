import { app } from 'electron'
import { join, dirname } from 'node:path'
import fs from 'node:fs'
import Seven from 'node-7z'
import { path7za } from '7zip-bin'
import os from 'node:os'
import Database from 'better-sqlite3'

export function getDocumentFolder() {
  const folder = join(dirname(app.getPath('exe'), 'landdata'))
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

    // Only include temp app.db and documents folder
    const documentsPath = join(sourceDir, 'documents')
    const items = [tempDbPath, documentsPath]

    let processedCount = 0
    const totalFiles = 1 + countFiles(documentsPath)

    const archive = Seven.add(outputArchive, items, options)

    archive.on('progress', () => {
      processedCount++
      const percent = ((processedCount / totalFiles) * 100).toFixed(1)
      const progressData = {
        percent: Number(percent),
        processed: processedCount,
        total: totalFiles
      }

      console.log(`Backup progress: ${percent}% (${processedCount}/${totalFiles} items)`)

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
    const filesToInclude = rows.map((r) => r.file_path).filter((p) => fs.existsSync(p))

    // Include filtered DB at root
    filesToInclude.push(tempDbPath)

    const totalFiles = countFilesList(filesToInclude)
    let processedCount = 0

    const archive = Seven.add(outputArchive, filesToInclude, options)

    archive.on('progress', () => {
      processedCount++
      const percent = ((processedCount / totalFiles) * 100).toFixed(1)
      const progressData = {
        percent: Number(percent),
        processed: processedCount,
        total: totalFiles
      }
      if (webContents) webContents.send('backup-progress', progressData)
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

function countFiles(dir) {
  let count = 0
  const list = fs.readdirSync(dir)
  for (const item of list) {
    const fullPath = join(dir, item)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      count += countFiles(fullPath)
    } else {
      count++
    }
  }
  return count
}

function countFilesList(files) {
  let count = 0
  for (const f of files) {
    if (!fs.existsSync(f)) continue
    const stat = fs.statSync(f)
    if (stat.isDirectory()) {
      // recursively count all files in the folder
      count += countFilesList(fs.readdirSync(f).map((i) => join(f, i)))
    } else {
      count++
    }
  }
  return count
}
