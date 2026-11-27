'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { MdArrowForward, MdHome, MdLock } from 'react-icons/md';
import { useLanguage } from '../context/LanguageContext';
import { useTransition } from '../context/TransitionContext';
import RevealTitle from '../components/ui/RevealTitle';
import script from '../data/eventScript.json';

const SECTION_KEYS: Record<string, string> = {
    '/chat': 'nav.chat',
    '/mensajes': 'nav.mensajes',
    '/multimedia': 'nav.multimedia',
    '/about': 'nav.about',
};

/** Shown when a section is closed for the event. The server redirects here; this page only explains. */
export default function Cerrado({ from }: { from: string }) {
    const { t } = useLanguage();
    const { transitionTo } = useTransition();
    const rootRef = useRef<HTMLDivElement>(null);
    const key = SECTION_KEYS[from];

    useEffect(() => {
        const mm = gsap.matchMedia();
        mm.add('(prefers-reduced-motion: no-preference)', () => {
            gsap.from('.lock-plate', { scale: 0.4, rotate: -14, opacity: 0, duration: 0.8, ease: 'back.out(2)' });
            gsap.to('.lock-plate', { rotate: 3, duration: 1.6, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 0.8 });
            gsap.from('.lock-in', { y: 28, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out', delay: 0.25, clearProps: 'transform,opacity' });
        }, rootRef);
        return () => mm.revert();
    }, []);

    const go = (e: React.MouseEvent, path: string) => {
        e.preventDefault();
        transitionTo(path);
    };

    return (
        <div ref={rootRef} className="flex min-h-[calc(100svh-var(--nav-h))] flex-col">
            {/* Caution tape */}
            <div aria-hidden className="h-8 border-b-[3px] border-[var(--ink)] [background:repeating-linear-gradient(-45deg,var(--yellow)_0_22px,var(--ink)_22px_44px)]" />

            <div className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col items-start justify-center gap-10 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:gap-16">
                <div className="lock-plate flex h-44 w-44 shrink-0 items-center justify-center border-[3px] border-[var(--ink)] bg-[var(--pink)] text-[var(--ink)] shadow-[10px_10px_0_var(--shadow)] sm:h-56 sm:w-56" aria-hidden>
                    <MdLock className="text-[7rem] sm:text-[9rem]" />
                </div>

                <div>
                    <RevealTitle as="h1" className="font-display text-[clamp(2.8rem,8vw,6rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em]">
                        {script.ui.closedTitle}
                    </RevealTitle>
                    <p className="lock-in mt-6 max-w-[48ch] text-xl font-medium leading-relaxed">{script.ui.closedBody}</p>
                    {key && <p className="lock-in mt-4 font-display text-lg font-bold uppercase tracking-[0.1em] text-[var(--muted)]">{t(key)}</p>}

                    <div className="lock-in mt-10 flex flex-wrap gap-4">
                        <Link href="/games" onClick={(e) => go(e, '/games')} className="btn btn--yellow !px-8 !py-4 !text-lg">
                            {script.ui.closedCta}
                            <MdArrowForward className="text-2xl" aria-hidden />
                        </Link>
                        <Link href="/" onClick={(e) => go(e, '/')} className="btn btn--ghost !py-4">
                            <MdHome className="text-2xl" aria-hidden />
                            {script.ui.closedHome}
                        </Link>
                    </div>
                </div>
            </div>

            <div aria-hidden className="h-8 border-t-[3px] border-[var(--ink)] [background:repeating-linear-gradient(-45deg,var(--yellow)_0_22px,var(--ink)_22px_44px)]" />
        </div>
    );
}
