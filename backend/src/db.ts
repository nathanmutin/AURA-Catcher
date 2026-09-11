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
        email VARCHAR(255),
        is_admin BOOLEAN NOT NULL DEFAULT false,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Le droit admin ne s'accorde qu'en SQL, volontairement :
    //   UPDATE users SET is_admin = true WHERE username = 'natmut';

    // Un panneau, c'est une identité et deux fenêtres sur son historique :
    // sa première révision (auteur et date de création) et la révision
    // courante (position, commentaire, types). Aucun état mutable ici — il
    // n'existe donc aucun endroit où écrire un état qui contredirait
    // l'historique.
    //
    // Pas de clé étrangère sur les deux pointeurs : panneau_revisions
    // référence déjà panneaux, l'ajouter dans l'autre sens créerait un cycle
    // (et les colonnes doivent rester nullables, la révision n'existant pas
    // encore au moment d'insérer le panneau). Les deux pointeurs valent
    // MIN(id) et MAX(id) des révisions du panneau : une requête suffit à
    // vérifier qu'ils n'ont pas dérivé.
    await conn.query(`
      CREATE TABLE IF NOT EXISTS panneaux (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_revision_id INT,
        current_revision_id INT
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

    // Create panel_types table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS panel_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        points INT NOT NULL DEFAULT 10
      )
    `);

    // Insert default types
    await conn.query(`
      INSERT IGNORE INTO panel_types (name, points) VALUES
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

    // Historique : l'état COMPLET du panneau après chaque écriture, création
    // comprise (changedFields NULL). Stocker l'état plutôt qu'un delta rend la
    // restauration triviale et sans ambiguïté — un commentaire NULL veut dire
    // "vide à cette révision", jamais "champ non modifié".
    await conn.query(`
      CREATE TABLE IF NOT EXISTS panneau_revisions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        panneau_id INT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        comment TEXT,
        changedFields VARCHAR(64),
        restoredFrom INT,
        editor_id INT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (panneau_id) REFERENCES panneaux(id) ON DELETE CASCADE,
        FOREIGN KEY (editor_id) REFERENCES users(id),
        INDEX idx_panneau_revisions_panneau (panneau_id, id)
      )
    `);

    // Les types d'une révision. Un type est toujours une ligne référençant
    // panel_types : restaurer une version, c'est un INSERT ... SELECT, sans
    // sérialisation intermédiaire.
    await conn.query(`
      CREATE TABLE IF NOT EXISTS panneau_revision_types (
        revision_id INT NOT NULL,
        type_id INT NOT NULL,
        PRIMARY KEY (revision_id, type_id),
        FOREIGN KEY (revision_id) REFERENCES panneau_revisions(id) ON DELETE CASCADE,
        FOREIGN KEY (type_id) REFERENCES panel_types(id)
      )
    `);

    // Demandes de vérification d'email en attente (liens à usage unique).
    // On ne stocke jamais le token en clair, seulement son hash SHA-256 :
    // même en cas de fuite de la base, les liens ne sont pas réutilisables.
    await conn.query(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        tokenHash VARCHAR(64) NOT NULL UNIQUE,
        expiresAt DATETIME NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tokens longue durée délivrés à un appareil après vérification de
    // l'email : un même utilisateur peut avoir plusieurs appareils vérifiés.
    await conn.query(`
      CREATE TABLE IF NOT EXISTS device_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        tokenHash VARCHAR(64) NOT NULL UNIQUE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        lastUsedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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

// Acquiert une connexion, exécute fn, puis la relâche systématiquement
// (même en cas d'erreur) — évite de répéter ce pattern dans chaque service.
export async function withConnection<T>(fn: (conn: mariadb.Connection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    return await fn(conn);
  } finally {
    conn.release();
  }
}

// Comme withConnection, mais englobe fn dans une transaction : commit si fn
// réussit, rollback automatique si elle lève une erreur.
export async function withTransaction<T>(fn: (conn: mariadb.Connection) => Promise<T>): Promise<T> {
  return withConnection(async (conn) => {
    await conn.beginTransaction();
    try {
      const result = await fn(conn);
      await conn.commit();
      return result;
    } catch (err) {
      await conn.rollback();
      throw err;
    }
  });
}

export const getOrCreateUser = async (conn: mariadb.Connection, username: string | undefined): Promise<number | null> => {
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
    'INSERT INTO users (username) VALUES (?)',
    [trimmedUsername]
  );
  return parseInt(userRes.insertId.toString());
};
