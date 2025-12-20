import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export const initDb = async () => {
  if (db) return db;

  const dbPath = path.resolve(__dirname, '../../data/database.sqlite');

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS panneaux (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      imageUrl TEXT NOT NULL,
      comment TEXT,
      author TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Database initialized at', dbPath);
  return db;
};

export const getDb = async () => {
  if (!db) await initDb();
  return db!;
};
