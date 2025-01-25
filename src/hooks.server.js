import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const PUBLIC_PATHS = ['/business/login', '/api/auth/login'];

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    const path = event.url.pathname;
    
    // Skip auth check for public paths
    if (PUBLIC_PATHS.includes(path)) {
        return await resolve(event);
    }

    // Check authentication for protected routes
    if (path.startsWith('/business/')) {
        const token = event.cookies.get('businessToken');
        console.log('Checking token for protected route:', !!token);

        if (!token) {
            console.log('No token found, redirecting to login');
            return new Response(null, { 
                status: 303, 
                headers: { Location: '/business/login' } 
            });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            event.locals.businessId = decoded.businessId;
            event.locals.businessName = decoded.propertyName;
            console.log('Token verified, proceeding to protected route');
        } catch (err) {
            console.error('Token verification failed:', err);
            return new Response(null, { 
                status: 303, 
                headers: { Location: '/business/login' } 
            });
        }
    }

    return await resolve(event);
}