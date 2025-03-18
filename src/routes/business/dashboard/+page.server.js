import { query } from '$lib/server/db.js';

export async function load({ locals }) {
  if (!locals.businessId) {
    return {
      status: 302,
      redirect: '/business/login'
    };
  }

  try {
    // Get business name
    const businessQuery = `
      SELECT 
        u.property_name
      FROM users u
      JOIN business_auth ba ON ba.business_id = u.id
      WHERE u.id = $1
    `;
    
    const businessResult = await query(businessQuery, [locals.businessId]);
    
    if (!businessResult.rows.length) {
      return {
        status: 302,
        redirect: '/business/login'
      };
    }
    
    const business = businessResult.rows[0];
    
    // Get reviews for this business
    const reviewsQuery = `
      SELECT f.*, u.unique_id
      FROM feedback f
      JOIN users u ON f.unique_id = u.unique_id
      WHERE u.id = $1
      ORDER BY f.created_at DESC
    `;
    
    const reviewsResult = await query(reviewsQuery, [locals.businessId]);
    const reviews = reviewsResult.rows;
    
    // Get daily review counts for the last 30 days (filtered by company ID)
    const dailyReviewsQuery = `
      SELECT
        DATE(f.created_at) as date,
        COUNT(*) as count
      FROM feedback f
      JOIN users u ON f.unique_id = u.unique_id
      WHERE u.id = $1
      AND f.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(f.created_at)
      ORDER BY date ASC
    `;
    
    const dailyReviewsResult = await query(dailyReviewsQuery, [locals.businessId]);
    const dailyReviews = dailyReviewsResult.rows;
    
    return {
      reviews,
      businessName: business.property_name,
      dailyReviews
    };
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    return {
      status: 500,
      error: new Error('Failed to load dashboard data')
    };
  }
}