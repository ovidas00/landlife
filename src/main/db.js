import mysql from 'mysql2/promise'

let db

export async function getDB() {
  if (!db) {
    db = await mysql.createPool('mysql://dbadmin:StrongPassword%23123@localhost/landlife')
  }

  return db
}
