import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = value.trim();
            if (key.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseKey = value.trim();
        }
    });
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase environment variables not found.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const BASE_URL = 'https://linkly.ai'; // Replace with actual domain or env var

async function generateSitemap() {
    console.log('Generating sitemap...');

    const staticRoutes = [
        '/',
        '/login',
        '/register',
        '/pricing', // If exists
        '/features', // If exists
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Add static routes
    staticRoutes.forEach(route => {
        xml += `  <url>
    <loc>${BASE_URL}${route}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>
`;
    });

    // Fetch Bio Profiles
    const { data: profiles, error: profilesError } = await supabase
        .from('bio_profiles')
        .select('handle, updated_at');

    if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
    } else {
        profiles.forEach(profile => {
            xml += `  <url>
    <loc>${BASE_URL}/p/${profile.handle}</loc>
    <lastmod>${new Date(profile.updated_at).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
`;
        });
    }

    // Fetch Storefronts (users with products)
    const { data: products, error: productsError } = await supabase
        .from('products')
        .select('user_id, slug, created_at');

    if (productsError) {
        console.error('Error fetching products:', productsError);
    } else if (products) {
        // Group products by user to find active storefronts
        const userIdsWithProducts = new Set(products.map(p => p.user_id));

        // Re-fetch profiles with user_id
        const { data: profilesWithId, error: profilesIdError } = await supabase
            .from('bio_profiles')
            .select('user_id, handle');

        if (!profilesIdError && profilesWithId) {
            const userIdToHandle = new Map(profilesWithId.map(p => [p.user_id, p.handle]));

            // Add Storefront URLs
            userIdsWithProducts.forEach(userId => {
                const handle = userIdToHandle.get(userId);
                if (handle) {
                    xml += `  <url>
    <loc>${BASE_URL}/store/${handle}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`;
                }
            });

            // Add Product Page URLs
            products.forEach(product => {
                if (product.slug) {
                    xml += `  <url>
    <loc>${BASE_URL}/store/product/${product.slug}</loc>
    <lastmod>${new Date(product.created_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
                }
            });
        }
    }

    xml += `</urlset>`;

    const publicDir = path.resolve(__dirname, '../public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir);
    }

    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml);
    console.log('Sitemap generated successfully at public/sitemap.xml');
}

generateSitemap().catch(console.error);
