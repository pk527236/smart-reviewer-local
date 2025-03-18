import { query } from '$lib/server/db.js';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
  // await new Promise(resolve => setTimeout(resolve, 10000));
  
  try {
    const queryText = `
      SELECT
        unique_id as "uniqueId",
        owner_name as "ownerName",
        property_name as "propertyName",
        property_address as "propertyAddress", 
        google_map_link as "googleMapLink",
        contact_number as "contactNumber",
        custom_feedback_message as "customFeedbackMessage"
      FROM users
      WHERE unique_id = $1
    `;
    
    const result = await query(queryText, [params.uniqueId]);
    
    if (!result.rows.length) {
      throw error(404, {
        message: 'Company not found'
      });
    }
    
    const user = result.rows[0];
    
    return {
      user
    };
  } catch (err) {
    console.error('Database error:', err);
    throw error(500, {
      message: 'Failed to load company details'
    });
  }
}