import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'

let db

export function getDB() {
  if (!db) {
    const dbPath = path.join(app.getPath('userData'), 'app.db')
    db = new Database(dbPath)

    // Enable foreign keys
    db.pragma('foreign_keys = ON')

    // Upazilas table
    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS upazilas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `
    ).run()

    // Moujas table
    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS moujas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        upazila_id INTEGER NOT NULL,
        FOREIGN KEY (upazila_id) REFERENCES upazilas(id) ON DELETE CASCADE
      )
    `
    ).run()

    // Volumes table
    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS volumes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        upazila_id INTEGER NOT NULL,
        FOREIGN KEY (upazila_id) REFERENCES upazilas(id) ON DELETE CASCADE
      )
    `
    ).run()

    // Documents table (updated)
    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        upazila_id INTEGER NOT NULL,
        mouja_id INTEGER NOT NULL,
        volume_id INTEGER NOT NULL,
        khatian_no TEXT,
        dag_no TEXT,
        holding_no TEXT,
        doc_type TEXT,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (upazila_id) REFERENCES upazilas(id) ON DELETE CASCADE,
        FOREIGN KEY (mouja_id) REFERENCES moujas(id) ON DELETE CASCADE,
        FOREIGN KEY (volume_id) REFERENCES volumes(id) ON DELETE CASCADE
      )
    `
    ).run()

    // Document files table
    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS document_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id INTEGER NOT NULL,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
      )
    `
    ).run()
  }

  return db
}
