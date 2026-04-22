import { NextResponse } from 'next/server';

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

const store: RateLimitStore = {};

/**
 * Simple memory-based rate limiter for Next.js API Routes.
 * @param ip The identifier (usually IP address)
 * @param limit Max requests allowed in the window
 * @param windowMs Window size in milliseconds
 */
export function rateLimit(ip: string, limit: number = 10, windowMs: number = 60000) {
    const now = Date.now();
    
    if (!store[ip] || now > store[ip].resetTime) {
        store[ip] = {
            count: 1,
            resetTime: now + windowMs
        };
        return { success: true, remaining: limit - 1 };
    }
    
    store[ip].count++;
    
    if (store[ip].count > limit) {
        return { success: false, remaining: 0 };
    }
    
    return { success: true, remaining: limit - store[ip].count };
}

export function getIP(req: Request) {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(/, /)[0] : '127.0.0.1';
    return ip;
}
