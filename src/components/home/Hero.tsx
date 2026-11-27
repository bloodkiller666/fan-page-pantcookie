'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MdKeyboardArrowDown, MdMovie, MdSportsEsports } from 'react-icons/md';
import { useLanguage } from '../../context/LanguageContext';
import { useTransition } from '../../context/TransitionContext';

gsap.registerPlugin(ScrollTrigger);

// Cloudflare R2 video loop shown inside the CRT bezel
const SCREEN_VIDEO =
    'https://pub-ed644fbc43ed4c4788d9c013963a7b8e.r2.dev/%E3%80%90%20PancitoMerge%20%E3%80%91Cozy%20Game%20mexicanoooo%20%F0%9F%A5%90%E2%9D%A4%EF%B8%8F_%F0%9F%A9%B9%20-%20Shura%20Hiwa%20Ch.%20(720p%2C%20h264%2C%20youtube).mp4';

const NAV_OFFSET = 72;

const Hero = () => {
    const { t } = useLanguage();
    const { transitionTo } = useTransition();
    const [ready, setReady] = useState(false);
    const rootRef = useRef<HTMLElement>(null);

    // Play the entrance once the first-visit loading screen (if any) has finished.
    useEffect(() => {
        if (localStorage.getItem('shakegang_onboarding_done')) {
            setReady(true);
            return;
        }
        const onDone = () => setReady(true);
        window.addEventListener('loading_complete', onDone);
        return () => window.removeEventListener('loading_complete', onDone);
    }, []);

    // Scroll choreography. Transforms and opacity only; scrubbed, so it costs nothing at rest.
    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        const mm = gsap.matchMedia();

        mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
            const tl = gsap.timeline({
                defaults: { ease: 'none' },
                scrollTrigger: {
                    trigger: root,
                    start: `top top+=${NAV_OFFSET}`,
                    end: () => `+=${Math.round(window.innerHeight * 0.85)}`,
                    pin: true,
                    scrub: 0.6,
                    anticipatePin: 1,
                    invalidateOnRefresh: true,
                },
            });

            tl.to('.hero__copy', { y: -140, opacity: 0, duration: 0.7 }, 0)
                .to('.hero__screen-scroll', { scale: 1.5, x: () => -window.innerWidth * 0.11, duration: 1 }, 0)
                .to('.hero__dots', { y: -160, duration: 1 }, 0)
                .to('.hero__hint', { opacity: 0, duration: 0.15 }, 0);

            // Gentle pointer parallax (fine pointers only), kept off the scrubbed properties
            let cleanupPointer: (() => void) | undefined;
            if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
                const rot = gsap.quickTo('.hero__screen-tilt', 'rotation', { duration: 0.8, ease: 'power3' });
                const lift = gsap.quickTo('.hero__screen-tilt', 'y', { duration: 0.8, ease: 'power3' });
                const onMove = (e: PointerEvent) => {
                    const nx = e.clientX / window.innerWidth - 0.5;
                    const ny = e.clientY / window.innerHeight - 0.5;
                    rot(nx * 3);
                    lift(ny * 14);
                };
                window.addEventListener('pointermove', onMove, { passive: true });
                cleanupPointer = () => window.removeEventListener('pointermove', onMove);
            }

            return () => cleanupPointer?.();
        });

        // Phones and tablets: no pin, just a light drift as the hero leaves
        mm.add('(max-width: 1023px) and (prefers-reduced-motion: no-preference)', () => {
            gsap.to('.hero__copy', {
                y: -50,
                ease: 'none',
                scrollTrigger: { trigger: root, start: 'top top+=72', end: 'bottom top', scrub: true },
            });
            gsap.to('.hero__dots', {
                y: -80,
                ease: 'none',
                scrollTrigger: { trigger: root, start: 'top top+=72', end: 'bottom top', scrub: true },
            });
        });

        return () => mm.revert();
    }, []);

    const go = (e: React.MouseEvent, path: string) => {
        e.preventDefault();
        transitionTo(path);
    };

    return (
        <section
            ref={rootRef}
            className={`hero relative overflow-hidden border-b-[3px] border-[var(--line)] bg-[var(--pink)] text-[var(--ink)] [--shadow:var(--ink)] ${ready ? 'is-ready' : ''}`}
        >
            {/* Printed-halftone ground */}
            <div
                aria-hidden
                className="hero__dots pointer-events-none absolute -inset-x-0 -top-10 bottom-0 opacity-[0.18]"
                style={{
                    backgroundImage: 'radial-gradient(var(--ink) 1.4px, transparent 1.6px)',
                    backgroundSize: '14px 14px',
                    maskImage: 'linear-gradient(100deg, transparent 35%, #000 100%)',
                    WebkitMaskImage: 'linear-gradient(100deg, transparent 35%, #000 100%)',
                }}
            />

            <div className="relative mx-auto grid min-h-[calc(100svh-var(--nav-h))] max-w-[1400px] items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:py-20">
                <div className="hero__copy will-change-transform">
                    <h1 className="font-display text-[clamp(2.6rem,7.2vw,6rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em]">
                        <span className="block overflow-hidden pb-[0.08em]">
                            <span className="hero__line-inner block">{t('home.heroTitle')}</span>
                        </span>
                    </h1>

                    <p className="hero__rise mt-8 max-w-[52ch] text-lg font-semibold leading-relaxed sm:text-xl">
                        {t('home.heroSubtitle')}
                    </p>

                    <div className="hero__rise mt-10 flex flex-wrap gap-4" style={{ animationDelay: '0.12s' }}>
                        <Link href="/games" onClick={(e) => go(e, '/games')} className="btn btn--yellow">
                            <MdSportsEsports className="text-2xl" aria-hidden />
                            {t('home.heroGames')}
                        </Link>
                        <Link href="/multimedia" onClick={(e) => go(e, '/multimedia')} className="btn btn--ghost">
                            <MdMovie className="text-2xl" aria-hidden />
                            {t('home.heroMultimedia')}
                        </Link>
                    </div>
                </div>

                {/* CRT bezel with the stream loop. Three layers: entrance > pointer tilt > scroll scale. */}
                <div className="hero__screen relative mx-auto w-full max-w-[560px] lg:mx-0 lg:justify-self-end">
                    <div className="hero__screen-tilt will-change-transform">
                        <div className="hero__screen-scroll will-change-transform">
                            <span className="tag tag--cyan absolute -left-2 -top-4 z-10 -rotate-3 shadow-[3px_3px_0_var(--ink)] sm:-left-5">
                                {t('home.heroBadge')}
                            </span>
                            <div className="bezel shadow-[10px_10px_0_var(--ink)]">
                                <div className="bezel__screen aspect-[4/3] bg-black">
                                    <video
                                        className="h-full w-full object-cover"
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        preload="metadata"
                                        aria-hidden
                                    >
                                        <source src={SCREEN_VIDEO} type="video/mp4" />
                                    </video>
                                </div>
                                <div className="mt-3 flex items-center justify-between px-1">
                                    <span className="h-3 w-24 bg-[var(--surface-2)] opacity-20" aria-hidden />
                                    <span className="flex gap-2" aria-hidden>
                                        <span className="h-3 w-3 rounded-full bg-[var(--pink)]" />
                                        <span className="h-3 w-3 rounded-full bg-[var(--yellow)]" />
                                        <span className="h-3 w-3 rounded-full bg-[var(--cyan)]" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="hero__hint pointer-events-none absolute inset-x-0 bottom-6 hidden flex-col items-center gap-1 lg:flex" aria-hidden>
                <span className="score text-[0.6rem]">{t('home.scroll')}</span>
                <MdKeyboardArrowDown className="hero__arrow text-3xl" />
            </div>

            <div className="pins absolute inset-x-0 bottom-0" aria-hidden />

            <style jsx>{`
                .hero__line-inner,
                .hero__rise,
                .hero__screen {
                    opacity: 0;
                }
                .is-ready .hero__line-inner {
                    animation: hero-line 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }
                .is-ready .hero__rise {
                    animation: hero-rise 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.35s forwards;
                }
                .is-ready .hero__screen {
                    animation: hero-pop 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.2s forwards;
                }
                .hero__arrow {
                    animation: hero-bob 1.4s ease-in-out infinite;
                }
                @keyframes hero-line {
                    from { transform: translateY(105%); opacity: 1; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes hero-rise {
                    from { transform: translateY(18px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes hero-pop {
                    from { transform: translate(16px, 16px) rotate(1.5deg); opacity: 0; }
                    to { transform: translate(0, 0) rotate(0); opacity: 1; }
                }
                @keyframes hero-bob {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(6px); }
                }
                @media (prefers-reduced-motion: reduce) {
                    .hero__line-inner, .hero__rise, .hero__screen { opacity: 1; }
                }
            `}</style>
        </section>
    );
};

export default Hero;
