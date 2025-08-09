// Load environment variables from .env file
import 'dotenv/config'; // This auto-loads the .env

import pkg from 'pg';
const { Pool } = pkg;

// Create SSL configuration based on environment variables
const sslConfig = () => {
  // Check various SSL-related environment variables
  const sslMode = process.env.PGSSLMODE?.toLowerCase();
  const pgSsl = process.env.PGSSL?.toLowerCase();
  const dbSsl = process.env.DATABASE_SSL?.toLowerCase();
  
  // If any of these explicitly disable SSL, return false
  if (sslMode === 'disable' || pgSsl === 'false' || dbSsl === 'false') {
    return false;
  }
  
  // If in development or NODE_ENV suggests no SSL needed
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    return false;
  }
  
  // If connecting to localhost or local services, likely no SSL needed
  const host = process.env.PGHOST?.toLowerCase();
  if (host && (host.includes('localhost') || host.includes('127.0.0.1') || host.endsWith('-service'))) {
    return false;
  }
  
  // For production with external databases, enable SSL but don't reject unauthorized
  return {
    rejectUnauthorized: false
  };
};

// Create a connection pool using environment variables
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT) || 5432, // Ensure it's treated as number with default
  ssl: sslConfig(), // Use the SSL configuration function
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  maxUses: 7500, // Close (and replace) a connection after it has been used this many times
});

// Function to test database connection
async function testConnection() {
  let client;
  try {
    console.log('🔌 Testing database connection...');
    console.log(`📊 Connection config: Host=${process.env.PGHOST}, DB=${process.env.PGDATABASE}, SSL=${JSON.stringify(sslConfig())}`);
    
    client = await pool.connect();
    await client.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  } finally {
    if (client) client.release();
  }
}

// Function to initialize the database with retry logic
async function initializeDatabase(maxRetries = 5) {
  let retries = 0;
  
  while (retries < maxRetries) {
    let client;
    try {
      console.log(`🚀 Initializing database (attempt ${retries + 1}/${maxRetries})...`);
      
      // Test connection first
      const connectionSuccess = await testConnection();
      if (!connectionSuccess) {
        throw new Error('Database connection test failed');
      }

      client = await pool.connect();
      
      // Start transaction
      await client.query('BEGIN');

      // Create tables with IF NOT EXISTS to make it idempotent
      console.log('📋 Creating tables...');
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
          FOREIGN KEY (unique_id) REFERENCES users(unique_id) ON DELETE CASCADE,
          UNIQUE(unique_id, analytics_date)
        );
      `);

      // Create indexes with IF NOT EXISTS
      console.log('🔍 Creating indexes...');
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_business_username ON business_auth(username);
        CREATE INDEX IF NOT EXISTS idx_business_id ON business_auth(business_id);
        CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(analytics_date);
        CREATE INDEX IF NOT EXISTS idx_daily_analytics_unique_id ON daily_analytics(unique_id);
        CREATE INDEX IF NOT EXISTS idx_users_unique_id ON users(unique_id);
        CREATE INDEX IF NOT EXISTS idx_feedback_unique_id ON feedback(unique_id);
        CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
      `);

      // Commit transaction
      await client.query('COMMIT');
      
      console.log('✅ Database initialized successfully.');
      return true;
      
    } catch (error) {
      console.error(`❌ Error initializing database (attempt ${retries + 1}):`, error.message);
      
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('❌ Error during rollback:', rollbackError.message);
        }
      }
      
      retries++;
      if (retries >= maxRetries) {
        console.error(`❌ Database initialization failed after ${maxRetries} attempts`);
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = Math.pow(2, retries) * 1000; // 2s, 4s, 8s, 16s
      console.log(`⏳ Waiting ${waitTime/1000}s before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
    } finally {
      if (client) client.release();
    }
  }
}

// Function to verify database schema
async function verifyDatabaseSchema() {
  let client;
  try {
    console.log('🔍 Verifying database schema...');
    client = await pool.connect();
    
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const expectedTables = ['users', 'feedback', 'business_auth', 'daily_analytics'];
    const existingTables = result.rows.map(row => row.table_name);
    
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.error(`❌ Missing tables: ${missingTables.join(', ')}`);
      return false;
    }
    
    console.log('✅ All required tables exist:', existingTables.join(', '));
    return true;
    
  } catch (error) {
    console.error('❌ Error verifying database schema:', error.message);
    return false;
  } finally {
    if (client) client.release();
  }
}

// Function to gracefully close the database pool
async function closeDatabasePool() {
  try {
    console.log('🔒 Closing database connection pool...');
    await pool.end();
    console.log('✅ Database pool closed successfully');
  } catch (error) {
    console.error('❌ Error closing database pool:', error.message);
  }
}

// Handle process termination gracefully
process.on('SIGTERM', async () => {
  console.log('📤 Received SIGTERM, closing database connections...');
  await closeDatabasePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📤 Received SIGINT, closing database connections...');
  await closeDatabasePool();
  process.exit(0);
});

// Main initialization function
async function main() {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Verify schema
    const schemaValid = await verifyDatabaseSchema();
    if (!schemaValid) {
      throw new Error('Database schema verification failed');
    }
    
    console.log('🎉 Database setup completed successfully!');
    
    // If this file is run directly (not imported), close the pool and exit
    if (import.meta.url === `file://${process.argv[1]}`) {
      await closeDatabasePool();
      process.exit(0);
    }
    
  } catch (error) {
    console.error('💥 Database setup failed:', error.message);
    await closeDatabasePool();
    process.exit(1);
  }
}

// Auto-initialize when file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Export the pool and utility functions for other modules to use
export default pool;
export { initializeDatabase, verifyDatabaseSchema, closeDatabasePool, testConnection };