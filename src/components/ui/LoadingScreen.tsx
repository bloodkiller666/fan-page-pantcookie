'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

const LOGO = 'https://pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev/Shura%20HiwaLogo%206.png';

/**
 * First-visit console boot: a cartridge slots in, the HUD bar fills, then the
 * whole screen scrolls away upward (the "auto-scroll" reveal of the page).
 * One GSAP timeline drives everything; counter and bar are written straight to
 * the DOM so React never re-renders during the 100 ticks.
 */
export default function LoadingScreen() {
    const [visible, setVisible] = useState(true);
    const rootRef = useRef<HTMLDivElement>(null);
    const counterRef = useRef<HTMLSpanElement>(null);
    const barRef = useRef<HTMLDivElement>(null);
    const statusRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const state = { pct: 0 };

        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                onComplete: () => {
                    setVisible(false);
                    window.dispatchEvent(new Event('loading_complete'));
                },
            });

            // Cartridge drops into the slot
            tl.from('.boot-cart', { y: -140, opacity: 0, duration: 0.7, ease: 'bounce.out' });
            tl.from('.boot-slot', { scaleX: 0, duration: 0.4, ease: 'power3.out' }, 0);

            // Counter + segmented bar
            tl.to(state, {
                pct: 100,
                duration: reduce ? 0.4 : 2.2,
                ease: 'power1.inOut',
                onUpdate: () => {
                    const v = Math.round(state.pct);
                    if (counterRef.current) counterRef.current.textContent = String(v).padStart(3, '0');
                    barRef.current?.style.setProperty('--v', String(v));
                    if (statusRef.current) statusRef.current.textContent = v < 100 ? 'LOADING' : 'READY';
                },
            }, '-=0.2');

            // Ready blink, then the screen scrolls up and away
            tl.to('.boot-ready', { opacity: 1, duration: 0.01 });
            tl.to('.boot-ready', { opacity: 0.2, duration: 0.12, repeat: 5, yoyo: true, ease: 'steps(1)' });
            tl.to(rootRef.current, { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, '+=0.1');
        }, rootRef);

        return () => ctx.revert();
    }, []);

    if (!visible) return null;

    return (
        <div
            ref={rootRef}
            role="status"
            aria-label="Loading"
            className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#180917] text-[#fde0f6] [--line:#fde0f6] [--shadow:var(--pink)]"
        >
            <div className="boot-cart cart-shell">
                <div className="cart">
                    <div className="cart__face w-[min(78vw,320px)] bg-[var(--surface)] p-5 text-[var(--text)]" style={{ background: '#261325' }}>
                        <div className="relative aspect-square w-full overflow-hidden border-[3px] border-[#fde0f6] bg-[var(--pink)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={LOGO} alt="" className="h-full w-full object-cover" />
                        </div>
                        <p className="mt-4 text-center font-display text-xl font-bold uppercase tracking-tight">
                            Shake<span className="text-[var(--pink)]">-</span>Gang
                        </p>
                    </div>
                </div>
                <div className="pins" aria-hidden />
            </div>

            <div className="boot-slot mt-2 h-3 w-[min(86vw,380px)] origin-center border-[3px] border-[#fde0f6] bg-black" aria-hidden />

            <div className="mt-10 w-[min(86vw,380px)]">
                <div ref={barRef} className="hud-bar hud-bar--cyan" style={{ ['--v' as string]: 0 }} />
                <div className="mt-4 flex items-end justify-between">
                    <p ref={statusRef} className="score text-[0.7rem] text-[var(--cyan)]">LOADING</p>
                    <span className="score text-2xl text-[var(--yellow)]">
                        <span ref={counterRef}>000</span>%
                    </span>
                </div>
            </div>

            <p className="boot-ready score absolute bottom-[12vh] text-xs text-[var(--pink)] opacity-0 sm:text-sm">PRESS START</p>
        </div>
    );
}
