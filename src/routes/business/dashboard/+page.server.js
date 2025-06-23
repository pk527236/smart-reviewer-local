// File: smart-reviewer/src/routes/business/dashboard/+page.server.js

import { query } from '$lib/server/db.js';

export async function load({ locals }) {
  if (!locals.businessId) {
    return {
      status: 302,
      redirect: '/business/login'
    };
  }

  const normalizeDate = (d) => {
  const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
  const istDate = new Date(new Date(d).getTime() + istOffset);
  return istDate.toISOString().split('T')[0];
};

  try {
    // Business Name
    const businessQuery = `
      SELECT u.property_name
      FROM users u
      JOIN business_auth ba ON ba.business_id = u.id
      WHERE u.id = $1
    `;
    const businessResult = await query(businessQuery, [locals.businessId]);

    if (!businessResult.rows.length) {
      return { status: 302, redirect: '/business/login' };
    }

    const business = businessResult.rows[0];

    // Reviews
    const reviewsQuery = `
      SELECT f.*, u.unique_id
      FROM feedback f
      JOIN users u ON f.unique_id = u.unique_id
      WHERE u.id = $1
      ORDER BY f.created_at DESC
    `;
    const reviewsResult = await query(reviewsQuery, [locals.businessId]);
    const reviews = reviewsResult.rows;

    // Daily Reviews
    const dailyReviewsQuery = `
      SELECT DATE(f.created_at) as date, COUNT(*) as count
      FROM feedback f
      JOIN users u ON f.unique_id = u.unique_id
      WHERE u.id = $1
      AND f.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(f.created_at)
      ORDER BY date ASC
    `;
    const dailyReviewsResult = await query(dailyReviewsQuery, [locals.businessId]);
    const dailyReviews = dailyReviewsResult.rows.map(({ date, count }) => ({
      date: normalizeDate(date),
      count: parseInt(count)
    }));

    // QR Scans
    const dailyQRScansQuery = `
      SELECT da.analytics_date as date, COALESCE(SUM(da.qr_scans), 0) as count
      FROM daily_analytics da
      JOIN users u ON da.unique_id = u.unique_id
      WHERE u.id = $1
      AND da.analytics_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY da.analytics_date
      ORDER BY da.analytics_date ASC
    `;
    const qrScansResult = await query(dailyQRScansQuery, [locals.businessId]);
    const dailyQRScans = qrScansResult.rows.map(({ date, count }) => ({
      date: normalizeDate(date),
      count: parseInt(count)
    }));

    // Google Redirects
    const dailyGoogleRedirectsQuery = `
      SELECT da.analytics_date as date, COALESCE(SUM(da.google_redirects), 0) as count
      FROM daily_analytics da
      JOIN users u ON da.unique_id = u.unique_id
      WHERE u.id = $1
      AND da.analytics_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY da.analytics_date
      ORDER BY da.analytics_date ASC
    `;
    const googleRedirectsResult = await query(dailyGoogleRedirectsQuery, [locals.businessId]);
    const dailyGoogleRedirects = googleRedirectsResult.rows.map(({ date, count }) => ({
      date: normalizeDate(date),
      count: parseInt(count)
    }));

    return {
      reviews,
      businessName: business.property_name,
      dailyReviews,
      dailyQRScans,
      dailyGoogleRedirects
    };
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    return {
      status: 500,
      error: new Error('Failed to load dashboard data')
    };
  }
}
