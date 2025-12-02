export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hasUrl = !!process.env.VITE_SUPABASE_URL;

    return new Response(JSON.stringify({
        hasServiceKey,
        hasUrl,
        timestamp: new Date().toISOString()
    }, null, 2), {
        headers: { 'Content-Type': 'application/json' },
    });
}
