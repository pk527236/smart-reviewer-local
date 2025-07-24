import { query, withTransaction } from '$lib/server/db.js';

// Add a new user
export async function POST({ request }) {
  const userData = await request.json();
  
  try {
    // Use transaction helper function
    return await withTransaction(async (client) => {
      // First, get the next unique_id
      // const uniqueIdQuery = `
      //   SELECT COALESCE(MAX(unique_id), 1000) + 1 AS next_id FROM users
      // `;
      // const uniqueIdResult = await client.query(uniqueIdQuery);
      // const uniqueId = uniqueIdResult.rows[0].next_id;
      
      // Insert the user
      const userQuery = `
        INSERT INTO users (
          owner_name, property_name, property_address, 
          google_map_link, contact_number, custom_feedback_message
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;
      
      const userResult = await client.query(userQuery, [
        // uniqueId,
        userData.ownerName,
        userData.propertyName,
        userData.propertyAddress,
        userData.googleMapLink,
        userData.contactNumber,
        userData.customFeedbackMessage
      ]);
      
      const userId = userResult.rows[0].id;
      
      // Insert the business auth data
      const authQuery = `
        INSERT INTO business_auth (
          business_id, username, password_hash
        )
        VALUES ($1, $2, $3)
      `;
      
      await client.query(authQuery, [
        userId,
        userData.username,
        userData.password  // This is already hashed from the frontend
      ]);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          id: userId 
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    });
  } catch (error) {
    console.error('Error inserting user:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }), 
      { status: 500 }
    );
  }
}

// Fetch all users with review counts
export async function GET() {
  try {
    const queryText = `
      SELECT 
        users.*,
        business_auth.username,
        COUNT(feedback.id) as review_count
      FROM users
      LEFT JOIN business_auth ON users.id = business_auth.business_id
      LEFT JOIN feedback ON users.unique_id = feedback.unique_id
      GROUP BY users.id, business_auth.username
      ORDER BY users.id DESC
    `;
    
    const result = await query(queryText);
    
    const users = result.rows.map(user => ({
      id: user.id,
      uniqueId: user.unique_id,
      ownerName: user.owner_name,
      propertyName: user.property_name,
      propertyAddress: user.property_address,
      googleMapLink: user.google_map_link,
      contactNumber: user.contact_number,
      customFeedbackMessage: user.custom_feedback_message,
      username: user.username,
      reviewCount: user.review_count
    }));
    
    return new Response(JSON.stringify(users),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching users:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }), 
      { status: 500 }
    );
  }
}

// Edit a user
export async function PUT({ request }) {
  const userData = await request.json();
  
  try {
    return await withTransaction(async (client) => {
      // Update users table
      const userQuery = `
        UPDATE users
        SET owner_name = $1, property_name = $2, property_address = $3,
            google_map_link = $4, contact_number = $5, custom_feedback_message = $6
        WHERE id = $7
      `;
      
      await client.query(userQuery, [
        userData.ownerName,
        userData.propertyName,
        userData.propertyAddress,
        userData.googleMapLink,
        userData.contactNumber,
        userData.customFeedbackMessage,
        userData.id
      ]);
      
      // Update business_auth if password or username changed
      if (userData.username || userData.password) {
        // In PostgreSQL, we need to handle this differently than SQLite's COALESCE approach
        // since we can't mix parameters and column references in COALESCE
        
        if (userData.username && userData.password) {
          const authQuery = `
            UPDATE business_auth 
            SET username = $1, password_hash = $2
            WHERE business_id = $3
          `;
          await client.query(authQuery, [
            userData.username,
            userData.password,
            userData.id
          ]);
        } else if (userData.username) {
          const authQuery = `
            UPDATE business_auth 
            SET username = $1
            WHERE business_id = $2
          `;
          await client.query(authQuery, [
            userData.username,
            userData.id
          ]);
        } else if (userData.password) {
          const authQuery = `
            UPDATE business_auth 
            SET password_hash = $1
            WHERE business_id = $2
          `;
          await client.query(authQuery, [
            userData.password,
            userData.id
          ]);
        }
      }
      
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }), 
      { status: 500 }
    );
  }
}

// Delete a user

export async function DELETE({ request }) {
  const { id } = await request.json();
  
  try {
    return await withTransaction(async (client) => {
      // Get the unique_id first
      const userQuery = 'SELECT unique_id FROM users WHERE id = $1';
      const userResult = await client.query(userQuery, [id]);
      
      if (userResult.rows.length > 0) {
        const uniqueId = userResult.rows[0].unique_id;
        
        // Delete in the correct order to avoid foreign key constraint violations
        
        // 1. Delete daily analytics entries first
        await client.query('DELETE FROM daily_analytics WHERE unique_id = $1', [uniqueId]);
        
        // 2. Delete feedback entries
        await client.query('DELETE FROM feedback WHERE unique_id = $1', [uniqueId]);
        
        // 3. Delete business auth entry
        await client.query('DELETE FROM business_auth WHERE business_id = $1', [id]);
        
        // 4. Finally, delete the user
        await client.query('DELETE FROM users WHERE id = $1', [id]);
      }
      
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }), 
      { status: 500 }
    );
  }
}