// src/routes/api/feedback/+server.js
import Database from 'better-sqlite3';

const db = new Database('database.sqlite', { verbose: console.log });

export async function POST({ request }) {
  const data = await request.json();
  
  try {
    const stmt = db.prepare(`
      INSERT INTO feedback (unique_id, customer_name, rating, feedback_text)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(
      data.uniqueId,
      data.customerName,
      data.rating,
      data.feedback
    );

    return new Response(JSON.stringify({ success: true }));
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
}