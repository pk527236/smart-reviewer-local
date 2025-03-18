import pkg from 'pg';
const { Pool } = pkg;

// Create a new pool instance
let pool;

// Check if we're in a development environment
const dev = process.env.NODE_ENV === 'development';

export function getPool() {
  if (!pool) {
    // Use single connection string approach
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Apply SSL settings based on environment
      // In production environments, SSL is often required
      ssl: !dev ? { rejectUnauthorized: false } : false
    });
    
    // Add event listeners for connection issues
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      // Don't exit process in production, but log the error
      if (dev) {
        process.exit(-1);
      }
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