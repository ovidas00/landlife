import mysql from 'mysql2/promise'
import { getStore } from './store'

let db

const DEFAULT_DATABASE_URL = 'mysql://landlife_user:LandlifeDB%23123@db.iamovi.com/landlife'

export async function getDB() {
  if (!db) {
    const store = await getStore()

    const databaseUrl = store.get('databaseUrl') || DEFAULT_DATABASE_URL

    try {
      const pool = mysql.createPool(databaseUrl)

      // Test the connection
      const connection = await pool.getConnection()
      connection.release()

      db = pool
    } catch {
      console.warn('Invalid/unreachable database URL, falling back to default database')

      db = mysql.createPool(DEFAULT_DATABASE_URL)
    }
  }

  return db
}
