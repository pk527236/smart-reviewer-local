export async function POST({ cookies }) {
    cookies.delete('businessToken', { path: '/' });
    
    return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
    });
}