import { NextRequest, NextResponse } from 'next/server';
import { EVENT, isEventActive, isLockedApi, isLockedGame, isLockedRoute } from './lib/event';
import { createPreviewToken, isValidPreviewToken } from './lib/previewToken';

/**
 * Event mode. The server decides what is closed, so hiding a link is never the only protection:
 *  - closed sections redirect to /cerrado
 *  - closed games redirect back to the games menu
 *  - closed endpoints answer 423
 * Rehearsal: open any page with ?ensayo=<EVENT_PREVIEW_KEY> to switch ONLY your browser into
 * event mode, and ?ensayo=off to leave it.
 */
export async function proxy(req: NextRequest) {
    const { nextUrl } = req;
    const key = process.env.EVENT_PREVIEW_KEY;

    const rehearsal = nextUrl.searchParams.get('ensayo');
    if (rehearsal) {
        const clean = nextUrl.clone();
        clean.searchParams.delete('ensayo');
        const res = NextResponse.redirect(clean);
        if (rehearsal === 'off') {
            res.cookies.delete(EVENT.previewCookie);
            res.cookies.delete(EVENT.previewUiCookie);
        } else if (key && rehearsal === key) {
            const options = { path: '/', maxAge: 60 * 60 * 8, sameSite: 'lax', secure: nextUrl.protocol === 'https:' } as const;
            res.cookies.set(EVENT.previewCookie, await createPreviewToken(key), { ...options, httpOnly: true });
            res.cookies.set(EVENT.previewUiCookie, '1', options);
        }
        return res;
    }

    const preview = await isValidPreviewToken(req.cookies.get(EVENT.previewCookie)?.value, key);
    const res = route(req, isEventActive(Date.now(), preview));
    // A hand-made interface cookie is removed before the page can read it
    if (!preview && req.cookies.has(EVENT.previewUiCookie)) res.cookies.delete(EVENT.previewUiCookie);
    return res;
}

function route(req: NextRequest, active: boolean): NextResponse {
    const { nextUrl } = req;
    const path = nextUrl.pathname;

    if (!active) {
        // Before the event nobody should find the closed-section page or the new game's API
        if (path === '/cerrado') return NextResponse.redirect(new URL('/', req.url));
        if (path.startsWith('/api/exam')) return NextResponse.json({ error: 'not_found' }, { status: 404 });
        return NextResponse.next();
    }

    if (isLockedApi(path)) {
        return NextResponse.json({ error: 'event_locked' }, { status: 423 });
    }

    if (isLockedRoute(path)) {
        const to = new URL('/cerrado', req.url);
        to.searchParams.set('de', path);
        return NextResponse.redirect(to);
    }

    if (path === '/games') {
        const game = nextUrl.searchParams.get('game');
        if (game && isLockedGame(game)) {
            const to = new URL('/games', req.url);
            to.searchParams.set('bloqueado', game);
            return NextResponse.redirect(to);
        }
    }

    return NextResponse.next();
}

export const config = {
    // Everything except Next internals and static files
    matcher: ['/((?!_next/|favicon\\.ico|audio/|music_category\\.png|.*\\.(?:png|jpg|jpeg|gif|webp|svg|mp3|wav|mp4|woff2?)$).*)'],
};
