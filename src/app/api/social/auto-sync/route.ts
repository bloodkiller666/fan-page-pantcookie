import { NextResponse } from 'next/server';
import { performSync } from '../../../../utils/social';

export async function GET() {
    try {
        const result = await performSync();
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Auto-sync error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Unknown auto-sync error'
        }, { status: 500 });
    }
}
