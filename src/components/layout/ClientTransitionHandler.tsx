'use client';
import React, { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from '../../context/TransitionContext';
import ShakeGangRevealer from '../ui/ShakeGangRevealer';

// Isolated so that reading search params only suspends this leaf, not the whole page.
function RouteChangeWatcher() {
    const { revealerRef } = useTransition();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Trigger animateOut whenever the pathname OR searchParams change
        const timer = setTimeout(() => {
            revealerRef.current?.animateOut();
        }, 300);

        return () => clearTimeout(timer);
    }, [pathname, searchParams, revealerRef]);

    return null;
}

export default function ClientTransitionHandler({ children }: { children: React.ReactNode }) {
    const { revealerRef } = useTransition();

    return (
        <>
            <ShakeGangRevealer ref={revealerRef} />
            <Suspense fallback={null}>
                <RouteChangeWatcher />
            </Suspense>
            {children}
        </>
    );
}
