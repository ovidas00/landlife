import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'

let db

export function getDB() {
  if (!db) {
    const dbPath = path.join(app.getPath('userData'), 'app.db')
    db = new Database(dbPath)

    // Enable foreign keys (important!)
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

    // Moujas table (linked to upazila)
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
  }

  return db
}
