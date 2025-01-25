import Database from 'better-sqlite3';

const db = new Database('database.sqlite');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unique_id INTEGER NOT NULL UNIQUE,
    owner_name VARCHAR(255),
    property_name VARCHAR(255),
    property_address TEXT,
    google_map_link TEXT,
    contact_number VARCHAR(20),
    custom_feedback_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unique_id INTEGER NOT NULL,
    customer_name VARCHAR(255),
    rating INTEGER NOT NULL,
    feedback_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unique_id) REFERENCES users(unique_id)
  );

  -- Business authentication table with first_login column
  CREATE TABLE IF NOT EXISTS business_auth (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL UNIQUE,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_login BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES users(id) ON DELETE CASCADE
  );

  
`);

// Create indexes
db.exec(`
  -- Add indexes for performance
  CREATE INDEX IF NOT EXISTS idx_business_username ON business_auth(username);
  CREATE INDEX IF NOT EXISTS idx_business_id ON business_auth(business_id);
`);

console.log('Database initialized successfully.');
db.close();