// Shared by the proxy, API routes and client components: no Node-only APIs here.

export const EVENT = {
    /**
     * First instant of the event: 18 Dec 2026 00:00 in Lima (UTC-5).
     * Peru is one hour ahead of Mexico City, so the event opens when it is already the 18th
     * for the Peruvian side and everyone shares one clock. Override with NEXT_PUBLIC_EVENT_START.
     */
    startsAt: process.env.NEXT_PUBLIC_EVENT_START || '2026-12-18T00:00:00-05:00',
    /** Optional end (ISO). Empty = the event mode stays on after the 18th. */
    endsAt: process.env.NEXT_PUBLIC_EVENT_END || '',

    /** Signed, httpOnly cookie that switches a single browser into event mode for rehearsals (?ensayo=KEY). */
    previewCookie: 'evento_ensayo',
    /** Readable companion so the interface can follow. It grants nothing: the server only trusts the signed one. */
    previewUiCookie: 'evento_ensayo_ui',
    /** localStorage flag: the intro modals are shown once. */
    introSeenKey: 'evento_intro_visto',

    /** Sections closed while the event runs. Home, Games, legal pages and admin stay open. */
    lockedRoutes: ['/chat', '/mensajes', '/multimedia', '/about'],
    /** Games closed while the event runs. */
    lockedGames: ['puzzle', 'trivia', 'shuraRun'],
    /** The one game that opens. */
    openGame: 'examen',
    /** Endpoints that must refuse to work while their section is closed. */
    lockedApi: ['/api/chat', '/api/upload', '/api/moderate-message'],
} as const;

export function isEventActive(now: number = Date.now(), preview = false): boolean {
    if (preview) return true;
    const start = Date.parse(EVENT.startsAt);
    if (Number.isNaN(start) || now < start) return false;
    if (EVENT.endsAt) {
        const end = Date.parse(EVENT.endsAt);
        if (!Number.isNaN(end) && now >= end) return false;
    }
    return true;
}

export const isLockedRoute = (path: string) => EVENT.lockedRoutes.some((r) => path === r || path.startsWith(`${r}/`));
export const isLockedGame = (id: string) => (EVENT.lockedGames as readonly string[]).includes(id);
export const isLockedApi = (path: string) => EVENT.lockedApi.some((r) => path === r || path.startsWith(`${r}/`));
