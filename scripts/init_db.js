// Load environment variables from .env file
import 'dotenv/config'; // This auto-loads the .env

import pkg from 'pg';
const { Pool } = pkg;

// Create a connection pool using environment variables
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT), // Ensure it's treated as number
});

// Function to initialize the database
async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        unique_id UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
        owner_name VARCHAR(255),
        property_name VARCHAR(255),
        property_address TEXT,
        google_map_link TEXT,
        contact_number VARCHAR(20),
        custom_feedback_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        unique_id UUID NOT NULL,
        customer_name VARCHAR(255),
        rating INTEGER NOT NULL,
        feedback_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (unique_id) REFERENCES users(unique_id)
      );

      CREATE TABLE IF NOT EXISTS business_auth (
        id SERIAL PRIMARY KEY,
        business_id INTEGER NOT NULL UNIQUE,
        username VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        first_login BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS daily_analytics (
       id SERIAL PRIMARY KEY,
       unique_id UUID NOT NULL,
       analytics_date DATE NOT NULL DEFAULT CURRENT_DATE,
       qr_scans INTEGER DEFAULT 0,
       google_redirects INTEGER DEFAULT 0,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (unique_id) REFERENCES users(unique_id),
       UNIQUE(unique_id, analytics_date)
       );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_business_username ON business_auth(username);
      CREATE INDEX IF NOT EXISTS idx_business_id ON business_auth(business_id);
      CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(analytics_date);
      CREATE INDEX IF NOT EXISTS idx_daily_analytics_unique_id ON daily_analytics(unique_id);
    `);

    await client.query('COMMIT');
    console.log('✅ Database initialized successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the initialization function
initializeDatabase().catch(console.error);

// Export the pool for other modules to use
export default pool;
