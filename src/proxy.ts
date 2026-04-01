import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Common bots and scrapers that shouldn't access the app
const BLOCKED_USER_AGENTS = [
    'SemrushBot',
    'AhrefsBot',
    'MJ12bot',
    'DotBot',
    'Rogerbot',
    'Exabot',
];

export function proxy(request: NextRequest) {
    const userAgent = request.headers.get('user-agent') || '';
    
    // 1. User-Agent Filtering Shield
    if (BLOCKED_USER_AGENTS.some(bot => userAgent.includes(bot))) {
        return new NextResponse('Bot Access Denied', { status: 403 });
    }

    // 2. CSRF Shield (Basic)
    // Check if POST/PUT/DELETE requests come from the same origin
    if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
        const origin = request.headers.get('origin');
        const host = request.headers.get('host');
        
        // In production, ensure origin matches the host
        if (process.env.NODE_ENV === 'production' && origin && !origin.includes(host || '')) {
            return new NextResponse('Invalid Origin - CSRF Shield Active', { status: 403 });
        }
    }

    const response = NextResponse.next();

    // 3. Dynamic Security Headers (Supplemental)
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
