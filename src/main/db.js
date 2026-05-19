import { createClient } from '@libsql/client'

let db

export function getDB() {
  if (!db) {
    db = createClient({
      url: 'libsql://app-ovidas.aws-ap-south-1.turso.io',
      authToken:
        'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzkxNjE3MTMsImlkIjoiMDE5ZTNlNDktOWEwMS03MDIxLTllMGMtYjI2ODdhYjc1YzJhIiwicmlkIjoiMWUyZTg5Y2EtNTM4OC00M2E1LWE2ZWQtYjQxZjZjNGFkOWMxIn0.ZaG_5e0TVZGpEsQNxIy1Y8qleF-f0JigX2L_pzELQlotxHet9-HfSB4PIcMF8nZ2Wu5s8I5Wvix3luhbQysyCw'
    })
  }

  return db
}

// Run this once on app start
export async function initDB() {
  const db = getDB()

  // Enable foreign keys (important for SQLite-based engines)
  await db.execute(`PRAGMA foreign_keys = ON`)

  // Upazilas
  await db.execute(`
    CREATE TABLE IF NOT EXISTS upazilas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `)

  // Mouzas
  await db.execute(`
    CREATE TABLE IF NOT EXISTS mouzas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      upazila_id INTEGER NOT NULL,
      FOREIGN KEY (upazila_id) REFERENCES upazilas(id) ON DELETE CASCADE
    )
  `)

  // Volumes
  await db.execute(`
    CREATE TABLE IF NOT EXISTS volumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      upazila_id INTEGER NOT NULL,
      FOREIGN KEY (upazila_id) REFERENCES upazilas(id) ON DELETE CASCADE
    )
  `)

  // Documents
  await db.execute(`
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
  `)

  // Document files
  await db.execute(`
    CREATE TABLE IF NOT EXISTS document_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    )
  `)

  // -------- Indexes --------

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_mouzas_upazila_id
    ON mouzas(upazila_id)
  `)

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_volumes_upazila_id
    ON volumes(upazila_id)
  `)

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_documents_location
    ON documents(upazila_id, mouza_id, volume_id)
  `)

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_documents_previous_document_id
    ON documents(previous_document_id)
  `)

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_document_files_document_id
    ON document_files(document_id)
  `)
}
