import { NextResponse } from 'next/server';
import { performSync } from '@/utils/social';
import { rateLimit, getIP } from '@/utils/rateLimit';
import { isAdmin } from '@/lib/adminAuth';

export async function POST(req: Request) {
    if (!rateLimit(`sync:${getIP(req)}`, 5, 60_000).success) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        return NextResponse.json(await performSync());
    } catch (error) {
        console.error('Sync error:', error);
        return NextResponse.json({ success: false, error: 'Sync failed' }, { status: 500 });
    }
}
