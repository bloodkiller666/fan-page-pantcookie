import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { ADMIN_COOKIE, ADMIN_SESSION_SECONDS, createAdminToken, passwordMatches } from '@/lib/adminAuth';
import { getIP, rateLimit } from '@/utils/rateLimit';

const LoginSchema = z.object({ password: z.string().min(1).max(200) });

export async function POST(request: Request) {
    // Brute-force protection: 5 attempts per minute per IP
    if (!rateLimit(`login:${getIP(request)}`, 5, 60_000).success) {
        return NextResponse.json({ success: false, message: 'Too many attempts' }, { status: 429 });
    }

    try {
        const parsed = LoginSchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
        }

        if (!passwordMatches(parsed.data.password)) {
            return NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 });
        }

        const token = await createAdminToken();
        (await cookies()).set(ADMIN_COOKIE, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: ADMIN_SESSION_SECONDS,
            path: '/',
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
