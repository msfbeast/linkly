export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    const urlObj = new URL(request.url);
    const targetUrl = urlObj.searchParams.get('url');

    if (!targetUrl) {
        return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        // Fetch and automatically follow redirects
        const response = await fetch(targetUrl, {
            method: 'GET',
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            }
        });

        return new Response(JSON.stringify({ url: response.url }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=86400',
            }
        });
    } catch (error) {
        console.error('Error resolving URL:', error);
        // Fallback to the original URL if resolving fails
        return new Response(JSON.stringify({ url: targetUrl, error: 'Failed to resolve redirect' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
