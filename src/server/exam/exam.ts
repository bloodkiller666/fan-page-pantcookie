import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import raw from './questions.json';
import { Exam, examSchema } from './schema';

/**
 * The answer key lives here, on the server. Nothing in this folder is imported by client code,
 * and the signed token below never carries the key, so it is not in the browser bundle,
 * the network tab or the page source.
 *
 * To keep the key out of the repository too, set EXAM_JSON_BASE64 (the same JSON, base64-encoded)
 * in the host's environment variables: it takes priority over questions.json.
 */
let cached: Exam | null = null;

export function loadExam(): Exam {
    if (cached) return cached;
    const encoded = process.env.EXAM_JSON_BASE64;
    const source = encoded ? JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')) : raw;
    cached = examSchema.parse(source);
    return cached;
}

const secret = () => {
    const value = process.env.EXAM_TOKEN_SECRET || process.env.ADMIN_JWT_SECRET;
    if (!value || value.length < 32) throw new Error('EXAM_TOKEN_SECRET (or ADMIN_JWT_SECRET) must be set with 32+ characters.');
    return new TextEncoder().encode(value);
};

export interface ExamTicket {
    /** Question ids in the order they were asked. */
    order: string[];
    startedAt: number;
}

export async function signTicket(ticket: ExamTicket): Promise<string> {
    return new SignJWT({ order: ticket.order, startedAt: ticket.startedAt })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('45m')
        .sign(secret());
}

export async function readTicket(token: string): Promise<ExamTicket | null> {
    try {
        const { payload } = await jwtVerify(token, secret());
        if (!Array.isArray(payload.order) || typeof payload.startedAt !== 'number') return null;
        return { order: payload.order as string[], startedAt: payload.startedAt };
    } catch {
        return null;
    }
}

export function shuffle<T>(items: readonly T[]): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}
