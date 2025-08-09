import pkg from 'pg';
const { Pool } = pkg;

// Create a new pool instance
let pool;

// Check if we're in a development environment
const dev = process.env.NODE_ENV === 'development';

// Create SSL configuration based on environment variables
function getSslConfig() {
  // Check various SSL-related environment variables
  const sslMode = process.env.PGSSLMODE?.toLowerCase();
  const pgSsl = process.env.PGSSL?.toLowerCase();
  const dbSsl = process.env.DATABASE_SSL?.toLowerCase();
  
  // If any of these explicitly disable SSL, return false
  if (sslMode === 'disable' || pgSsl === 'false' || dbSsl === 'false') {
    console.log('🔒 SSL disabled via environment variables');
    return false;
  }
  
  // If in development, likely no SSL needed
  if (dev) {
    console.log('🔒 SSL disabled for development environment');
    return false;
  }
  
  // If connecting to localhost or local services, likely no SSL needed
  const host = process.env.PGHOST?.toLowerCase();
  if (host && (host.includes('localhost') || host.includes('127.0.0.1') || host.endsWith('-service'))) {
    console.log('🔒 SSL disabled for local/service connections');
    return false;
  }
  
  // For production with external databases, enable SSL but don't reject unauthorized
  console.log('🔒 SSL enabled with rejectUnauthorized: false');
  return {
    rejectUnauthorized: false
  };
}

// Create database configuration
function getDatabaseConfig() {
  // If DATABASE_URL is provided, use it
  if (process.env.DATABASE_URL) {
    console.log('📊 Using DATABASE_URL for connection');
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: getSslConfig()
    };
  }
  
  // Otherwise, use individual environment variables
  console.log('📊 Using individual environment variables for connection');
  return {
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: Number(process.env.PGPORT) || 5432,
    ssl: getSslConfig(),
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
    maxUses: 7500, // Close (and replace) a connection after it has been used this many times
  };
}

export function getPool() {
  if (!pool) {
    const config = getDatabaseConfig();
    console.log('🔌 Creating database pool with config:', {
      ...config,
      password: config.password ? '[HIDDEN]' : undefined,
      connectionString: config.connectionString ? '[HIDDEN]' : undefined
    });
    
    pool = new Pool(config);
    
    // Add event listeners for connection issues
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      // Don't exit process in production, but log the error
      if (dev) {
        process.exit(-1);
      }
    });

    // Test connection on pool creation
    pool.connect()
      .then(client => {
        console.log('✅ Database pool connection test successful');
        client.release();
      })
      .catch(err => {
        console.error('❌ Database pool connection test failed:', err.message);
      });
  }
  
  return pool;
}

export async function query(text, params) {
  const pool = getPool();
  const start = Date.now();
  
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log for debugging in dev mode
    if (dev) {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    
    return res;
  } catch (error) {
    console.error('Database query error:', error.message);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  }
}

// Helper function for transactions
export async function withTransaction(callback) {
  const client = await getPool().connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Function to test database connection (for health checks)
export async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    const pool = getPool();
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
}