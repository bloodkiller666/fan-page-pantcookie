import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { timingSafeEqual } from 'node:crypto';

export const ADMIN_COOKIE = 'admin_token';
export const ADMIN_SESSION_SECONDS = 2 * 60 * 60;

function getSecret(): Uint8Array {
    const secret = process.env.ADMIN_JWT_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error('ADMIN_JWT_SECRET must be set (min. 32 characters).');
    }
    return new TextEncoder().encode(secret);
}

export function passwordMatches(input: string): boolean {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) throw new Error('ADMIN_PASSWORD is not configured.');
    const a = Buffer.from(input);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
}

export async function createAdminToken(): Promise<string> {
    return new SignJWT({ role: 'admin' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${ADMIN_SESSION_SECONDS}s`)
        .sign(getSecret());
}

/** True when the request carries a valid admin session cookie. */
export async function isAdmin(): Promise<boolean> {
    try {
        const token = (await cookies()).get(ADMIN_COOKIE)?.value;
        if (!token) return false;
        const { payload } = await jwtVerify(token, getSecret());
        return payload.role === 'admin';
    } catch {
        return false;
    }
}
