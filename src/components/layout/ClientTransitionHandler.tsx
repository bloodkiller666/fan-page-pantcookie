'use client';
import React, { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from '../../context/TransitionContext';
import ShakeGangRevealer from '../ui/ShakeGangRevealer';

export default function ClientTransitionHandler({ children }: { children: React.ReactNode }) {
    const { revealerRef } = useTransition();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Trigger animateOut whenever the pathname OR searchParams change
        const timer = setTimeout(() => {
            if (revealerRef.current) {
                revealerRef.current.animateOut();
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [pathname, searchParams, revealerRef]);

    return (
        <>
            <ShakeGangRevealer ref={revealerRef} />
            {children}
        </>
    );
}
