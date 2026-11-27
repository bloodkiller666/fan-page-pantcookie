import { NextRequest, NextResponse } from 'next/server';
import { EVENT, isEventActive, isLockedApi, isLockedGame, isLockedRoute } from './lib/event';

/**
 * Event mode. The server decides what is closed, so hiding a link is never the only protection:
 *  - closed sections redirect to /cerrado
 *  - closed games redirect back to the games menu
 *  - closed endpoints answer 423
 * Rehearsal: open any page with ?ensayo=<EVENT_PREVIEW_KEY> to switch ONLY your browser into
 * event mode, and ?ensayo=off to leave it.
 */
export function middleware(req: NextRequest) {
    const { nextUrl } = req;

    const rehearsal = nextUrl.searchParams.get('ensayo');
    if (rehearsal) {
        const clean = nextUrl.clone();
        clean.searchParams.delete('ensayo');
        const res = NextResponse.redirect(clean);
        const key = process.env.EVENT_PREVIEW_KEY;
        if (rehearsal === 'off') {
            res.cookies.delete(EVENT.previewCookie);
        } else if (key && rehearsal === key) {
            res.cookies.set(EVENT.previewCookie, '1', { path: '/', maxAge: 60 * 60 * 8, sameSite: 'lax' });
        }
        return res;
    }

    const preview = req.cookies.get(EVENT.previewCookie)?.value === '1';
    const active = isEventActive(Date.now(), preview);
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
