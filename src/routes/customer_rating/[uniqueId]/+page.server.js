import Database from 'better-sqlite3';
import { error } from '@sveltejs/kit';
import path from 'path';

export async function load({ params }) {
    // await new Promise(resolve => setTimeout(resolve, 10000));
    let db;
    try {
        // Use an absolute path to your database file
        const dbPath = path.resolve('database.sqlite');
        db = new Database(dbPath);

        const stmt = db.prepare(`
            SELECT 
                unique_id as uniqueId,
                owner_name as ownerName,
                property_name as propertyName,
                property_address as propertyAddress,
                google_map_link as googleMapLink,
                contact_number as contactNumber,
                custom_feedback_message as customFeedbackMessage
            FROM users 
            WHERE unique_id = ?
        `);

        const user = stmt.get(params.uniqueId);

        if (!user) {
            throw error(404, {
                message: 'Company not found'
            });
        }

        return {
            user
        };
    } catch (err) {
        console.error('Database error:', err);
        throw error(500, {
            message: 'Failed to load company details'
        });
    } finally {
        if (db) db.close();
    }
}