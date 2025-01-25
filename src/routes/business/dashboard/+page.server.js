import Database from 'better-sqlite3';

export async function load({ locals }) {
    if (!locals.businessId) {
        return {
            status: 302,
            redirect: '/business/login'
        };
    }

    const db = new Database('database.sqlite');

    try {
        // Get business name
        const businessStmt = db.prepare(`
            SELECT 
                u.property_name
            FROM users u
            JOIN business_auth ba ON ba.business_id = u.id
            WHERE u.id = ?
        `);
        const business = businessStmt.get(locals.businessId);

        if (!business) {
            return {
                status: 302,
                redirect: '/business/login'
            };
        }

        // Get reviews for this business
        const reviewsStmt = db.prepare(`
            SELECT f.*, u.unique_id
            FROM feedback f
            JOIN users u ON f.unique_id = u.unique_id
            WHERE u.id = ?
            ORDER BY f.created_at DESC
        `);
        const reviews = reviewsStmt.all(locals.businessId);

        // Get daily review counts for the last 30 days (filtered by company ID)
        const dailyReviewsStmt = db.prepare(`
            SELECT 
                DATE(f.created_at) as date,
                COUNT(*) as count
            FROM feedback f
            JOIN users u ON f.unique_id = u.unique_id
            WHERE u.id = ? 
            AND f.created_at >= datetime('now', '-30 days')
            GROUP BY DATE(f.created_at)
            ORDER BY date ASC
        `);
        const dailyReviews = dailyReviewsStmt.all(locals.businessId);

        return {
            reviews,
            businessName: business.property_name,
            dailyReviews
        };
    } finally {
        db.close();
    }
}
