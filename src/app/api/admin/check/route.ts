import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'shura-run-fortress-secret-123';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('admin_token')?.value;

        if (!token) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        const encoder = new TextEncoder();
        await jwtVerify(token, encoder.encode(JWT_SECRET));

        return NextResponse.json({ authenticated: true });
    } catch (error) {
        console.error('Check auth error:', error);
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }
}
