'use client';
import { RefObject, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll reveals for everything inside `scope`:
 *  - `[data-reveal-line]`: title text slides up out of its overflow mask
 *  - `[data-reveal]`: element rises and fades in, staggered with its neighbours
 * Only transform and opacity are animated, and nothing runs for reduced-motion users.
 * `deps` should include whatever re-renders the content (e.g. the language).
 */
export function useScrollReveal(scope: RefObject<HTMLElement | null>, deps: unknown[] = []) {
    useEffect(() => {
        const root = scope.current;
        if (!root) return;

        const mm = gsap.matchMedia();
        mm.add('(prefers-reduced-motion: no-preference)', () => {
            root.querySelectorAll<HTMLElement>('[data-reveal-line]').forEach((el) => {
                gsap.from(el, {
                    yPercent: 115,
                    duration: 0.9,
                    ease: 'expo.out',
                    scrollTrigger: { trigger: el.parentElement, start: 'top 90%', once: true },
                });
            });

            const items = root.querySelectorAll<HTMLElement>('[data-reveal]');
            if (items.length) {
                gsap.set(items, { opacity: 0, y: 36 });
                ScrollTrigger.batch(items, {
                    start: 'top 90%',
                    once: true,
                    onEnter: (batch) =>
                        gsap.to(batch, {
                            opacity: 1,
                            y: 0,
                            duration: 0.7,
                            ease: 'power3.out',
                            stagger: 0.08,
                            overwrite: true,
                            // hand transforms back to CSS so hover states keep working
                            clearProps: 'transform,opacity',
                        }),
                });
            }
        }, root);

        return () => mm.revert();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}
