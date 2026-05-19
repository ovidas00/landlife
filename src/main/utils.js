import { app } from 'electron'
import { join, parse } from 'node:path'
import fsp from 'node:fs/promises'
import fs from 'node:fs'
import Seven from 'node-7z'
import { path7za } from '7zip-bin'
import os from 'node:os'
import Database from 'better-sqlite3'
import PDFDocument from 'pdfkit'
import { writeToStream } from '@fast-csv/format'
import ExcelJS from 'exceljs'
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  WidthType,
  AlignmentType,
  PageOrientation,
  TableLayoutType
} from 'docx'
import { getDB } from './db'

export function getDocumentFolder() {
  let folder

  if (process.platform === 'win32') {
    const exeFolder = join(parse(app.getPath('exe')).root, 'LandLifeFiles')

    try {
      fs.mkdirSync(exeFolder, { recursive: true })
      folder = exeFolder
    } catch {
      folder = join(
        process.env.LOCALAPPDATA || join(app.getPath('home'), 'AppData', 'Local'),
        app.getName()
      )
      fs.mkdirSync(folder, { recursive: true })
    }
  } else if (process.platform === 'darwin') {
    folder = join(app.getPath('home'), 'Library', 'Application Support', app.getName())
    fs.mkdirSync(folder, { recursive: true })
  } else {
    folder = join(app.getPath('home'), '.local', 'share', app.getName())
    fs.mkdirSync(folder, { recursive: true })
  }

  return folder
}

async function countFiles(dir) {
  let count = 0
  const list = await fsp.readdir(dir)
  for (const item of list) {
    const fullPath = join(dir, item)
    const stat = await fsp.stat(fullPath)
    if (stat.isDirectory()) {
      count += await countFiles(fullPath)
    } else {
      count++
    }
  }
  return count
}

export async function backupFolder(sourceDir, outputArchive, password = null, webContents) {
  const bin = app.isPackaged
    ? join(
        process.resourcesPath,
        'app.asar.unpacked',
        'node_modules',
        path7za.slice(path7za.indexOf('node_modules') + 'node_modules'.length + 1)
      )
    : path7za

  const options = {
    $bin: bin,
    $progress: true,
    password: password || undefined
  }

  // DOCUMENTS ONLY (NO DB)
  const documentsPath = join(sourceDir, 'documents')
  const items = [documentsPath]

  const totalFiles = await countFiles(documentsPath)

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
      console.log(`Backup complete! Archive saved at: ${outputArchive}`)
      resolve()
    })

    archive.on('error', async (err) => {
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
        path7za.slice(path7za.indexOf('node_modules') + 'node_modules'.length + 1)
      )
    : path7za

  const options = {
    $bin: bin,
    $progress: true,
    password: password || undefined
  }

  const db = getDB() // db instance

  const rows = await db.execute({
    sql: `
      SELECT file_path
      FROM document_files df
      JOIN documents d ON d.id = df.document_id
      WHERE d.upazila_id = ?
    `,
    args: [upazilaId]
  })

  const fileList = rows.rows.map((r) => r.file_path)

  if (!fileList.length) {
    throw new Error('No files found for this upazila')
  }

  // total for progress
  const totalFiles = fileList.length

  return new Promise((resolve, reject) => {
    const archive = Seven.add(outputArchive, fileList, options)

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
      console.log(`Backup complete! Archive saved at: ${outputArchive}`)
      resolve()
    })

    archive.on('error', async (err) => {
      console.error('Backup failed:', err)
      reject(err)
    })
  })
}

export function exportToPDF({ tableData = [], columnWidths = [], outDir }) {
  return new Promise((resolve) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, left: 50, right: 50, bottom: 50 },
        layout: 'portrait'
      })

      doc.registerFont(
        'IBMPlexSans-Regular',
        join(app.getAppPath(), 'resources/IBMPlexSans-Regular.ttf')
      )

      doc.registerFont(
        'NotoSansBengali-Regular',
        join(app.getAppPath(), 'resources/NotoSansBengali-Regular.ttf')
      )

      const stream = fs.createWriteStream(outDir)
      doc.pipe(stream)
      doc.font('IBMPlexSans-Regular')

      // Generated date
      const now = new Date()
      doc
        .fontSize(9)
        .fillColor('#555555')
        .text(
          'Generated: ' +
            now.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }),
          { align: 'right' }
        )
        .moveDown(0.2)

      // Table
      if (tableData.length) {
        doc
          .moveDown(2)
          .font('NotoSansBengali-Regular')
          .fontSize(10)
          .text(`Total Items (${tableData.length - 1})`)
          .moveDown(0.5)

        doc.fontSize(10).table({
          defaultStyle: { border: 0.5 },
          rowStyles: (i) => (i === 0 ? { backgroundColor: 'black', textColor: 'white' } : {}),
          columnStyles: columnWidths,
          data: tableData
        })
      }

      doc.end()

      stream.on('finish', () => resolve(true))
      stream.on('error', (err) => {
        console.error('Stream error:', err)
        resolve(false)
      })
    } catch (err) {
      console.error('PDF generation error:', err)
      resolve(false)
    }
  })
}

export function exportToCSV({ data = [], outDir }) {
  return new Promise((resolve, reject) => {
    if (!data.length) return resolve(false)

    const ws = fs.createWriteStream(outDir)

    writeToStream(ws, data, {
      headers: true
    })
      .on('finish', () => resolve(true))
      .on('error', (err) => {
        console.error('CSV export failed:', err)
        reject(err)
      })
  })
}

export async function exportToExcel({ data = [], outDir }) {
  try {
    if (!data.length) return false

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Documents')

    // Add columns from object keys
    const columns = Object.keys(data[0]).map((key) => ({
      header: key, // will be column header
      key,
      width: 20 // default width, adjust as needed
    }))

    sheet.columns = columns

    // Add rows
    data.forEach((row) => {
      sheet.addRow(row)
    })

    // Optional: style header
    const headerRow = sheet.getRow(1)
    headerRow.font = { bold: true }
    headerRow.alignment = { horizontal: 'center' }

    sheet.columns.forEach((col) => {
      let maxLength = col.header.length
      col.eachCell({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? cell.value.toString() : ''
        maxLength = Math.max(maxLength, cellValue.length)
      })
      col.width = maxLength + 2 // add some padding
    })

    // Save file
    await workbook.xlsx.writeFile(outDir)

    return true
  } catch (err) {
    console.error('Excel export failed:', err)
    return false
  }
}

export async function exportToWord({ data = [], outDir }) {
  try {
    if (!data.length) return false

    // Create table rows
    const headers = Object.keys(data[0])
    const tableRows = []

    // Header row
    const headerRow = new TableRow({
      children: headers.map(
        (h) =>
          new TableCell({
            children: [
              new Paragraph({
                text: h,
                bold: true,
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 }
              })
            ]
          })
      )
    })

    tableRows.push(headerRow)

    // Data rows
    data.forEach((row) => {
      const tr = new TableRow({
        children: headers.map(
          (h) =>
            new TableCell({
              children: [
                new Paragraph({
                  text: row[h]?.toString() || '',
                  spacing: { after: 50 }
                })
              ]
            })
        )
      })

      tableRows.push(tr)
    })

    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: {
                orientation: PageOrientation.LANDSCAPE
              }
            }
          },
          children: [
            new Paragraph({
              text: 'Documents',
              heading: 'Heading1',
              alignment: AlignmentType.CENTER,
              border: {
                bottom: {
                  color: 'auto',
                  space: 1,
                  value: 'single',
                  size: 6
                }
              },
              spacing: {
                after: 300
              }
            }),
            new Table({
              rows: tableRows,
              width: {
                size: 100,
                type: WidthType.PERCENTAGE
              },
              layout: TableLayoutType.AUTOFIT
            })
          ]
        }
      ]
    })

    // Write file
    const buffer = await Packer.toBuffer(doc)
    await fsp.writeFile(outDir, buffer)

    return true
  } catch (err) {
    console.error('Word export failed:', err)
    return false
  }
}
