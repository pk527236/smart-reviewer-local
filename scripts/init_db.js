// Import the PostgreSQL client library
import { Pool } from 'pg';

// Create a connection pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'database_name', // Update with your database name
  password: 'password',      // Update with your password
  port: 5432,                // Default PostgreSQL port
});

// Function to initialize the database
async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    // Create tables with PostgreSQL syntax
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
      
      -- Business authentication table with first_login column
      CREATE TABLE IF NOT EXISTS business_auth (
        id SERIAL PRIMARY KEY,
        business_id INTEGER NOT NULL UNIQUE,
        username VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        first_login BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Create indexes - PostgreSQL has a slightly different syntax
    await client.query(`
      -- Add indexes for performance
      CREATE INDEX IF NOT EXISTS idx_business_username ON business_auth(username);
      CREATE INDEX IF NOT EXISTS idx_business_id ON business_auth(business_id);
    `);

    // Commit the transaction
    await client.query('COMMIT');
    console.log('Database initialized successfully.');
  } catch (error) {
    // If there's an error, roll back changes
    await client.query('ROLLBACK');
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    // Release the client back to the pool
    client.release();
  }
}

// Run the initialization function
initializeDatabase().catch(console.error);

// Export the pool for use in other parts of the application
export default pool;