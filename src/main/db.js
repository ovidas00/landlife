import Database from 'better-sqlite3'
import { join } from 'node:path'
import { getDocumentFolder } from './utils'

let db

export function getDB() {
  if (!db) {
    const dbPath = join(getDocumentFolder(), 'app.db')
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

    // Mouzas table
    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS mouzas (
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

    // Documents table
    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        upazila_id INTEGER NOT NULL,
        mouza_id INTEGER NOT NULL,
        volume_id INTEGER NOT NULL,

        khatian_no TEXT,
        dag_no TEXT,
        holding_no TEXT,
        doc_type TEXT,
        remarks TEXT,

        previous_document_id INTEGER,
        next_document_id INTEGER,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (upazila_id) REFERENCES upazilas(id) ON DELETE RESTRICT,
        FOREIGN KEY (mouza_id) REFERENCES mouzas(id) ON DELETE RESTRICT,
        FOREIGN KEY (volume_id) REFERENCES volumes(id) ON DELETE RESTRICT,

        FOREIGN KEY (previous_document_id) REFERENCES documents(id) ON DELETE RESTRICT,
        FOREIGN KEY (next_document_id) REFERENCES documents(id) ON DELETE RESTRICT
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

    // -------- Indexes --------

    // mouzas -> upazila
    db.prepare(
      `
      CREATE INDEX IF NOT EXISTS idx_mouzas_upazila_id
      ON mouzas(upazila_id)
    `
    ).run()

    // volumes -> upazila
    db.prepare(
      `
      CREATE INDEX IF NOT EXISTS idx_volumes_upazila_id
      ON volumes(upazila_id)
    `
    ).run()

    // documents location filtering
    db.prepare(
      `
      CREATE INDEX IF NOT EXISTS idx_documents_location
      ON documents(upazila_id, mouza_id, volume_id)
    `
    ).run()

    // document chain lookup
    db.prepare(
      `
      CREATE INDEX IF NOT EXISTS idx_documents_previous_document_id
      ON documents(previous_document_id)
    `
    ).run()

    // document files lookup
    db.prepare(
      `
      CREATE INDEX IF NOT EXISTS idx_document_files_document_id
      ON document_files(document_id)
    `
    ).run()
  }

  return db
}
