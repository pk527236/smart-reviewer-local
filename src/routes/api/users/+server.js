import Database from 'better-sqlite3';

// Create a single database connection to be reused
const db = new Database('database.sqlite', { verbose: console.log });


// Add a new user
export async function POST({ request }) {
  const userData = await request.json();
  
  try {
    // Start a transaction
    db.prepare('BEGIN').run();

    try {
      // First insert the user
      const userStmt = db.prepare(`
        INSERT INTO users (
          unique_id, owner_name, property_name, property_address, 
          google_map_link, contact_number, custom_feedback_message
        )
        VALUES (
          (SELECT COALESCE(MAX(unique_id), 1000) + 1 FROM users), 
          ?, ?, ?, ?, ?, ?
        )
      `);

      const userResult = userStmt.run(
        userData.ownerName,
        userData.propertyName,
        userData.propertyAddress,
        userData.googleMapLink,
        userData.contactNumber,
        userData.customFeedbackMessage
      );

      // Then insert the business auth data
      const authStmt = db.prepare(`
        INSERT INTO business_auth (
          business_id, username, password_hash
        )
        VALUES (?, ?, ?)
      `);

      authStmt.run(
        userResult.lastInsertRowid,
        userData.username,
        userData.password  // This is already hashed from the frontend
      );

      // Commit the transaction
      db.prepare('COMMIT').run();

      return new Response(
        JSON.stringify({ 
          success: true, 
          id: userResult.lastInsertRowid 
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      // Rollback on error
      db.prepare('ROLLBACK').run();
      throw error;
    }
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
    const stmt = db.prepare(`
      SELECT 
        users.*,
        business_auth.username,
        COUNT(feedback.id) as review_count
      FROM users
      LEFT JOIN business_auth ON users.id = business_auth.business_id
      LEFT JOIN feedback ON users.unique_id = feedback.unique_id
      GROUP BY users.id
      ORDER BY users.id DESC
    `);

    const users = stmt.all().map(user => ({
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
    db.prepare('BEGIN').run();

    // Update users table
    const userStmt = db.prepare(`
      UPDATE users
      SET owner_name = ?, property_name = ?, property_address = ?,
          google_map_link = ?, contact_number = ?, custom_feedback_message = ?
      WHERE id = ?
    `);

    userStmt.run(
      userData.ownerName,
      userData.propertyName,
      userData.propertyAddress,
      userData.googleMapLink,
      userData.contactNumber,
      userData.customFeedbackMessage,
      userData.id
    );

    // Update business_auth if password or username changed
    if (userData.username || userData.password) {
      const authStmt = db.prepare(`
        UPDATE business_auth 
        SET username = COALESCE(?, username),
            password_hash = COALESCE(?, password_hash)
        WHERE business_id = ?
      `);

      authStmt.run(
        userData.username || null,
        userData.password || null,
        userData.id
      );
    }

    db.prepare('COMMIT').run();

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    db.prepare('ROLLBACK').run();
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
    db.prepare('BEGIN').run();

    const user = db.prepare('SELECT unique_id FROM users WHERE id = ?').get(id);
    
    if (user) {
      // Delete business auth entry
      db.prepare('DELETE FROM business_auth WHERE business_id = ?').run(id);
      
      // Delete feedback entries
      db.prepare('DELETE FROM feedback WHERE unique_id = ?').run(user.unique_id);
      
      // Delete user
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
    }

    db.prepare('COMMIT').run();

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    db.prepare('ROLLBACK').run();
    
    console.error('Error deleting user:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }), 
      { status: 500 }
    );
  }
}