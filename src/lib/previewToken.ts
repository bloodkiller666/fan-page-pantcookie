// Proof that a browser entered the rehearsal with the real key. Web Crypto only, so it runs in any runtime.

const MESSAGE = new TextEncoder().encode('evento-ensayo-v1');

const hmacKey = (secret: string) =>
    crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

/** Cookie value for a given EVENT_PREVIEW_KEY. Changing the key revokes every rehearsal. */
export async function createPreviewToken(secret: string): Promise<string> {
    const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), MESSAGE);
    return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function isValidPreviewToken(token: string | undefined, secret: string | undefined): Promise<boolean> {
    if (!secret || !token || !/^[0-9a-f]{64}$/.test(token)) return false;
    const signature = Uint8Array.from(token.match(/../g)!, (h) => parseInt(h, 16));
    return crypto.subtle.verify('HMAC', await hmacKey(secret), signature, MESSAGE);
}
