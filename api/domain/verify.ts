
import { VercelRequest, VercelResponse } from '@vercel/node';
import { promises as dns } from 'dns';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { domain } = req.query;

    if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ error: 'Domain parameter is required' });
    }

    try {
        // Resolve CNAME records
        const cnames = await dns.resolveCname(domain);

        // Check if any CNAME points to our target
        const target = 'cname.vercel-dns.com';
        const isVerified = cnames.some(record => record.toLowerCase() === target.toLowerCase());

        return res.status(200).json({
            verified: isVerified,
            domain,
            records: cnames,
            target
        });

    } catch (error: any) {
        console.error(`DNS Verification failed for ${domain}:`, error);

        // Differentiate between "No Record" and "Server Error"
        if (error.code === 'ENODATA' || error.code === 'ENOTFOUND') {
            return res.status(200).json({
                verified: false,
                domain,
                error: 'No CNAME record found',
                code: error.code
            });
        }

        return res.status(500).json({
            error: 'Failed to verify DNS',
            details: error.message
        });
    }
}
