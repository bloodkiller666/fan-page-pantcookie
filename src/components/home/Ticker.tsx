'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLanguage } from '../../context/LanguageContext';

gsap.registerPlugin(ScrollTrigger);

/**
 * Marquee band. It drifts on its own, speeds up with scroll velocity and
 * flips direction when the visitor scrolls back up.
 */
export default function Ticker() {
    const { t } = useLanguage();
    const bandRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);

    const words = [t('nav.games'), t('nav.multimedia'), t('nav.chat'), t('nav.mensajes'), 'ShuraHiwa', 'pantcake'];

    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;

        const mm = gsap.matchMedia();
        mm.add('(prefers-reduced-motion: no-preference)', () => {
            const drift = gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });

            const st = ScrollTrigger.create({
                trigger: bandRef.current,
                start: 'top bottom',
                end: 'bottom top',
                onToggle: (self) => (self.isActive ? drift.resume() : drift.pause()),
                onUpdate: (self) => {
                    const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 350, 6);
                    gsap.to(drift, { timeScale: self.direction * boost, duration: 0.25, overwrite: true });
                    gsap.to(drift, { timeScale: self.direction, duration: 0.9, delay: 0.25, overwrite: false });
                },
            });

            return () => {
                st.kill();
                drift.kill();
            };
        }, bandRef);

        return () => mm.revert();
    }, []);

    // Two copies so the loop at -50% is seamless
    const strip = [0, 1].map((copy) => (
        <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
            {words.concat(words).map((word, i) => (
                <span key={`${copy}-${i}`} className="flex items-center">
                    <span className="px-6 font-display text-3xl font-bold uppercase tracking-tight sm:text-5xl">{word}</span>
                    <span className="h-4 w-4 rotate-45 bg-[var(--pink)] sm:h-5 sm:w-5" />
                </span>
            ))}
        </div>
    ));

    return (
        <div
            ref={bandRef}
            className="relative overflow-hidden border-b-[3px] border-[var(--line)] bg-[var(--yellow)] py-4 text-[var(--ink)] [--line:var(--ink)]"
        >
            <div ref={trackRef} className="flex w-max will-change-transform">
                {strip}
            </div>
        </div>
    );
}
