export const config = {
    runtime: 'edge',
};

export default function handler(request: Request) {
    return new Response('Hello from Edge Function!', { status: 200 });
}
