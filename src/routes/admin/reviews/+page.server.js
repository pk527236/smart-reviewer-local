
import { query } from '$lib/server/db';
import path from 'path';

export async function load() {
    try {
        const sql = `
          SELECT
            f.*,
            u.property_name
          FROM feedback f
          JOIN users u ON f.unique_id = u.unique_id
          ORDER BY f.created_at DESC
        `;
        
        const result = await query(sql, []);
        
        return { 
          reviews: result.rows 
        };
      } catch (error) {
        console.error('Error fetching reviews:', error);
        return { 
          reviews: [],
          error: 'Failed to load reviews'
        };
      }
  }