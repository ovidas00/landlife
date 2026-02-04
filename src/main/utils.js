import { app } from 'electron'
import { join } from 'node:path'
import fs from 'node:fs'

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
