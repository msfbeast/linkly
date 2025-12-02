export const config = {
    runtime: 'edge',
};

export default function handler(request: Request) {
    return new Response(
        JSON.stringify({
            QSTASH_TOKEN: !!process.env.QSTASH_TOKEN,
            QSTASH_URL: !!process.env.QSTASH_URL,
            NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
            NODE_ENV: process.env.NODE_ENV,
        }),
        {
            status: 200,
            headers: {
                'content-type': 'application/json',
            },
        }
    );
}
