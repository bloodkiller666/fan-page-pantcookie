import { NextResponse } from 'next/server';
import { performSync } from '../../../../utils/social';

export async function POST(req: Request) {
    const authHeader = req.headers.get('Authorization');
    const adminApiKey = process.env.ADMIN_API_KEY || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
    
    if (!authHeader || authHeader !== `Bearer ${adminApiKey}`) {
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




