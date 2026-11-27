'use client';
import { useEffect, useState } from 'react';
import { EVENT, isEventActive } from './event';

/**
 * Whether event mode is on for this visitor. Resolved after mount so the server HTML and the
 * first client render agree. The server (middleware) is the authority for what is locked;
 * this only drives what the interface shows.
 */
export function useEvent() {
    const [state, setState] = useState({ ready: false, active: false });

    useEffect(() => {
        const preview = document.cookie.split('; ').some((c) => c === `${EVENT.previewCookie}=1`);
        setState({ ready: true, active: isEventActive(Date.now(), preview) });
    }, []);

    return state;
}
