'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MdArrowForward, MdForum, MdInfo, MdMail, MdPhotoLibrary, MdSportsEsports } from 'react-icons/md';
import type { IconType } from 'react-icons';
import { useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTransition } from '../../context/TransitionContext';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import RevealTitle from '../ui/RevealTitle';

gsap.registerPlugin(ScrollTrigger);

const R2 = 'https://pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev';

interface Destination {
    path: string;
    title: string;
    description: string;
    Icon: IconType;
    tone: 'pink' | 'blue' | 'cyan' | 'yellow' | 'plain';
    image: string;
}

export default function Destinations() {
    const { t, language } = useLanguage();
    const { transitionTo } = useTransition();
    const rootRef = useRef<HTMLElement>(null);

    const items: Destination[] = [
        { path: '/multimedia', title: t('nav.multimedia'), description: t('home.features.multimediaDesc'), Icon: MdPhotoLibrary, tone: 'pink', image: `${R2}/ShuraHiwa-RnC-by-Parkiranhonda.webp` },
        { path: '/games', title: t('nav.games'), description: t('home.features.gamesDesc'), Icon: MdSportsEsports, tone: 'blue', image: `${R2}/1115_sin_titulo_20240914183653_1.webp` },
        { path: '/chat', title: t('nav.chat'), description: t('home.features.chatDesc'), Icon: MdForum, tone: 'cyan', image: `${R2}/ShuraHiwas_Summer_2025.jpg` },
        { path: '/mensajes', title: t('nav.mensajes'), description: t('home.features.messagesDesc'), Icon: MdMail, tone: 'yellow', image: `${R2}/Recording-2026-03-20-21-04-03.png` },
        { path: '/about', title: t('nav.about'), description: t('home.features.aboutDesc'), Icon: MdInfo, tone: 'plain', image: `${R2}/Tanabata1_by_higashibara_n.webp` },
    ];

    useScrollReveal(rootRef, [language]);

    // Image wipe-in plus a slow parallax drift inside each frame
    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        const mm = gsap.matchMedia();
        mm.add('(prefers-reduced-motion: no-preference)', () => {
            root.querySelectorAll<HTMLElement>('.dest__frame').forEach((frame) => {
                gsap.fromTo(
                    frame,
                    { clipPath: 'inset(0 100% 0 0)' },
                    {
                        clipPath: 'inset(0 0% 0 0)',
                        duration: 1,
                        ease: 'expo.inOut',
                        scrollTrigger: { trigger: frame, start: 'top 85%', once: true },
                    }
                );
                const img = frame.querySelector('.dest__img');
                if (img) {
                    gsap.fromTo(
                        img,
                        { yPercent: -7 },
                        {
                            yPercent: 7,
                            ease: 'none',
                            scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true },
                        }
                    );
                }
            });
        }, root);
        return () => mm.revert();
    }, []);

    const go = (e: React.MouseEvent, path: string) => {
        e.preventDefault();
        transitionTo(path);
    };

    return (
        <section ref={rootRef} className="border-b-[3px] border-[var(--line)] py-24 sm:py-32">
            <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
                <RevealTitle className="font-display text-[clamp(2.4rem,6.5vw,5.5rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em]">
                    {t('home.exploreContent')}
                </RevealTitle>
                <p data-reveal className="mt-5 max-w-[56ch] text-lg font-medium text-[var(--muted)]">
                    {t('home.exploreContentDesc')}
                </p>

                <div className="mt-20 space-y-24 sm:space-y-32">
                    {items.map(({ path, title, description, Icon, tone, image }, i) => (
                        <article key={path} className="grid items-center gap-8 lg:grid-cols-12 lg:gap-14">
                            <Link
                                href={path}
                                onClick={(e) => go(e, path)}
                                aria-label={title}
                                className={`group block lg:col-span-7 ${i % 2 ? 'lg:order-2' : ''}`}
                            >
                                <div className="cart-shell is-interactive">
                                    <div className={`cart ${tone === 'plain' ? '' : `cart--${tone}`}`}>
                                        <div className="cart__face">
                                            <div className="dest__frame relative aspect-[16/10] overflow-hidden bg-[var(--surface-2)]">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={image}
                                                    alt=""
                                                    loading="lazy"
                                                    className="dest__img absolute inset-x-0 -top-[8%] h-[116%] w-full object-cover"
                                                />
                                                <span className="absolute left-4 top-4 flex h-14 w-14 items-center justify-center border-[3px] border-[var(--ink)] bg-[var(--yellow)] text-[var(--ink)] shadow-[3px_3px_0_var(--ink)]">
                                                    <Icon className="text-3xl" aria-hidden />
                                                </span>
                                            </div>
                                            <div className="pins" aria-hidden />
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            <div className="lg:col-span-5">
                                <RevealTitle as="h3" className="font-display text-[clamp(2.2rem,5vw,4.2rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em]">
                                    {title}
                                </RevealTitle>
                                <p data-reveal className="mt-5 max-w-[44ch] text-lg font-medium leading-relaxed text-[var(--muted)]">
                                    {description}
                                </p>
                                <div data-reveal className="mt-8">
                                    <Link href={path} onClick={(e) => go(e, path)} className="btn">
                                        {t('home.explore')}
                                        <MdArrowForward className="text-2xl" aria-hidden />
                                    </Link>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
