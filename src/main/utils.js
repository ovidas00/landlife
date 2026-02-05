import { app } from 'electron'
import { join } from 'node:path'
import fs from 'node:fs'
import Seven from 'node-7z'
import { path7za } from '7zip-bin'

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

export function backupFolder(sourceDir, outputArchive, password = null) {
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

    const items = fs.readdirSync(sourceDir).map((f) => join(sourceDir, f))
    const archive = Seven.add(outputArchive, items, options)

    archive.on('end', () => {
      console.log(`Backup complete! Archive saved at: ${outputArchive}`)
      resolve()
    })

    archive.on('error', (err) => {
      console.error('Backup failed:', err)
      reject(err)
    })
  })
}
