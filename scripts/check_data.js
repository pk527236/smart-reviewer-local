// check-data.js
import { query } from './src/lib/server/db.js';

async function checkData() {
  try {
    console.log('Connecting to PostgreSQL database...');
    const result = await query('SELECT * FROM users');
    console.log('Users found:', result.rows.length);
    console.log('First few users:', result.rows.slice(0, 3));
    
    // Check other tables as needed
    const feedbackResult = await query('SELECT COUNT(*) FROM feedback');
    console.log('Total feedback entries:', feedbackResult.rows[0].count);
    
    console.log('Database check completed successfully!');
  } catch (error) {
    console.error('Database check failed:', error);
  } finally {
    // We don't need to close the connection because the pool handles it
    process.exit(0);
  }
}

// Run the check
checkData();