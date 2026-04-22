import { NextResponse } from 'next/server';
import { performSync } from '../../../../utils/social';
import { rateLimit, getIP } from '../../../../utils/rateLimit';

export async function POST(req: Request) {
    // 1. Rate Limiting (5 requests per minute per IP for this sensitive route)
    const ip = getIP(req);
    const { success } = rateLimit(ip, 5, 60000);
    
    if (!success) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // 2. Strict Authorization
    const authHeader = req.headers.get('Authorization');
    // NEVER use NEXT_PUBLIC_ variables for critical server-side authorization if they are also exposed to client
    const adminApiKey = process.env.ADMIN_API_KEY;
    
    if (!adminApiKey || !authHeader || authHeader !== `Bearer ${adminApiKey}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await performSync();
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Sync error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Unknown sync error'
        }, { status: 500 });
    }
}




