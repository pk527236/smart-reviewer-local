// src/routes/api/feedback/+server.js
import { query } from '$lib/server/db.js';

export async function POST({ request }) {
  const data = await request.json();
  
  try {
    const queryText = `
      INSERT INTO feedback (unique_id, customer_name, rating, feedback_text)
      VALUES ($1, $2, $3, $4)
    `;
    
    await query(queryText, [
      data.uniqueId,
      data.customerName,
      data.rating,
      data.feedback
    ]);
    
    return new Response(JSON.stringify({ success: true }));
  } catch (error) {
    console.error('Feedback submission error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
}