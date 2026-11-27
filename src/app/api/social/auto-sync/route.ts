import { NextResponse } from 'next/server';
import { performSync } from '@/utils/social';
import { getIP, rateLimit } from '@/utils/rateLimit';

// Public on purpose: performSync() is idempotent and only writes once per day.
export async function GET(req: Request) {
    if (!rateLimit(`autosync:${getIP(req)}`, 3, 60_000).success) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    try {
        return NextResponse.json(await performSync());
    } catch (error) {
        console.error('Auto-sync error:', error);
        return NextResponse.json({ success: false, error: 'Sync failed' }, { status: 500 });
    }
}
