import mysql from 'mysql2/promise'

let db

export async function getDB() {
  if (!db) {
    db = await mysql.createPool('mysql://dbadmin:StrongPassword%23123@db.gamerchoice.bd:3306/app')
  }

  return db
}
