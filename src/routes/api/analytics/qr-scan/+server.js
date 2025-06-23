import { json } from '@sveltejs/kit';
import { query } from '$lib/server/db.js';

export async function POST({ request }) {
  try {
    const { uniqueId } = await request.json();
    
    if (!uniqueId) {
      return json({ error: 'uniqueId is required' }, { status: 400 });
    }

    // Upsert daily analytics - increment qr_scans or create new record
    const upsertQuery = `
      INSERT INTO daily_analytics (unique_id, analytics_date, qr_scans, google_redirects)
      VALUES ($1, CURRENT_DATE, 1, 0)
      ON CONFLICT (unique_id, analytics_date)
      DO UPDATE SET 
        qr_scans = daily_analytics.qr_scans + 1,
        updated_at = CURRENT_TIMESTAMP
    `;
    
    await query(upsertQuery, [uniqueId]);
    
    return json({ success: true });
  } catch (error) {
    console.error('Error tracking QR scan:', error);
    return json({ error: 'Failed to track QR scan' }, { status: 500 });
  }
}