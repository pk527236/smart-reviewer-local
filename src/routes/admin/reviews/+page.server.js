
import Database from 'better-sqlite3';
import path from 'path';

export async function load() {
    const db = new Database(path.resolve('database.sqlite'));
    
    try {
        const stmt = db.prepare(`
            SELECT 
                f.*,
                u.property_name 
            FROM feedback f
            JOIN users u ON f.unique_id = u.unique_id
            ORDER BY f.created_at DESC
        `);

        const reviews = stmt.all();
        return { reviews };
    } finally {
        db.close();
    }
}