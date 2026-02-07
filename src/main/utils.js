import { app } from 'electron'
import { join } from 'node:path'
import fs from 'node:fs'
import Seven from 'node-7z'
import { path7za } from '7zip-bin'
import os from 'node:os'

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

    // Add all files in sourceDir except app.db
    const items = fs
      .readdirSync(sourceDir)
      .filter((f) => f !== 'app.db')
      .map((f) => join(sourceDir, f))

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
      fs.rmdirSync(tempDir)
      resolve()
    })

    archive.on('error', (err) => {
      console.error('Backup failed:', err)
      if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath)
      if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir)
      reject(err)
    })
  })
}
