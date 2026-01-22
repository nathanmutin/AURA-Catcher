import mariadb from 'mariadb';

const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost', // In dev mode, use localhost
  port: 3306, // Default mariadb port
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5
});

export const initDb = async () => {
  let conn;
  try {
    conn = await pool.getConnection();

    // Create users table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create panneaux table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS panneaux (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        comment TEXT,
        author_id INT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id)
      )
    `);

    // Create images table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fileNameOriginal VARCHAR(255) NOT NULL,
        fileNameSmall VARCHAR(255) NOT NULL,
        panneau_id INT NOT NULL,
        author_id INT,
        main_image BOOLEAN NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (panneau_id) REFERENCES panneaux(id),
        FOREIGN KEY (author_id) REFERENCES users(id)
      )
    `);

    console.log('Database initialized');
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

export const getPool = () => {
  return pool;
};
