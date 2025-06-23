import { json } from '@sveltejs/kit';
import { query } from '$lib/server/db.js';

export async function POST({ request }) {
  try {
    const { uniqueId } = await request.json();
    
    if (!uniqueId) {
      return json({ error: 'uniqueId is required' }, { status: 400 });
    }

    // Upsert daily analytics - increment google_redirects or create new record
    const upsertQuery = `
      INSERT INTO daily_analytics (unique_id, analytics_date, qr_scans, google_redirects)
      VALUES ($1, CURRENT_DATE, 0, 1)
      ON CONFLICT (unique_id, analytics_date)
      DO UPDATE SET 
        google_redirects = daily_analytics.google_redirects + 1,
        updated_at = CURRENT_TIMESTAMP
    `;
    
    await query(upsertQuery, [uniqueId]);
    
    return json({ success: true });
  } catch (error) {
    console.error('Error tracking Google redirect:', error);
    return json({ error: 'Failed to track Google redirect' }, { status: 500 });
  }
}