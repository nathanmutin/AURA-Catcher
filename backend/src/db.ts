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

    // Create panel_types table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS panel_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        points INT NOT NULL DEFAULT 10
      )
    `);

    // Insert default types if empty
    const typesCountRows = await conn.query('SELECT COUNT(*) as count FROM panel_types');
    if (Number(typesCountRows[0].count) === 0) {
      await conn.query(`
        INSERT INTO panel_types (name, points) VALUES
        ('Autre', 1),
        ('Commune', 5),
        ('Lycée', 5),
        ('Sécurité', 5),
        ('VIGI360', 2),
        ('Pub/Bache', 2),
        ('Borne TER', 1),
        ('Borne Oura', 1),
        ('Montagne', 1),
        ('Arrêt de bus', 1)
      `);
    }

    // Create panneaux table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS panneaux (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        comment TEXT,
        author_id INT,
        type_id INT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id),
        FOREIGN KEY (type_id) REFERENCES panel_types(id)
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

export const getOrCreateUser = async (conn: mariadb.Connection, username: string): Promise<number | null> => {
  if (!username || typeof username !== 'string' || username.trim() === '') {
    return null; // Return null for invalid usernames
  }

  const trimmedUsername = username.trim();
  
  // Check if user exists
  const userRows = await conn.query('SELECT id FROM users WHERE username = ?', [trimmedUsername]);
  if (userRows.length > 0) {
    return userRows[0].id;
  }
  
  // Create user if doesn't exist
  const userRes = await conn.query(
    'INSERT INTO users (username, password) VALUES (?, ?)',
    [trimmedUsername, 'placeholder_password']
  );
  return parseInt(userRes.insertId.toString());
};
