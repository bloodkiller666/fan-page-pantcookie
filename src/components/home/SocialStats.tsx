'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLanguage } from '../../context/LanguageContext';

gsap.registerPlugin(ScrollTrigger);

const NAV_OFFSET = 72;
const GROUP = { useGrouping: 'always' } as const;
const DISCORD_INVITE_CODE = 'UxvGN36qhX';

type Tone = 'pink' | 'blue' | 'cyan' | 'yellow' | 'plain';

interface Stat {
    platform: string;
    icon: string;
    count: number;
    label: string;
    tone: Tone;
}

export default function SocialStats() {
    const { t, language } = useLanguage();
    const [subscribers, setSubscribers] = useState<number | null>(null);
    // Fallbacks shown until live data arrives (TikTok and X are not fetched live).
    const [twitchFollowers, setTwitchFollowers] = useState(22003);
    const [discordMembers, setDiscordMembers] = useState(1058);
    const tiktokFollowers = 17550;
    const twitterFollowers = 17570;

    const sectionRef = useRef<HTMLElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const numRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const counted = useRef<boolean[]>([]);

    const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';
    const CHANNEL_ID = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID || '';

    useEffect(() => {
        const fetchYoutubeStats = async () => {
            if (!API_KEY || !CHANNEL_ID) return;
            try {
                const res = await fetch(
                    `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${CHANNEL_ID}&key=${API_KEY}`
                );
                const data = await res.json();
                if (data.items?.length > 0) setSubscribers(parseInt(data.items[0].statistics.subscriberCount));
            } catch (e) {
                console.error('Error fetching YouTube stats:', e);
            }
        };

        const fetchDiscordStats = async () => {
            try {
                const res = await fetch(`https://discord.com/api/v10/invites/${DISCORD_INVITE_CODE}?with_counts=true`);
                const data = await res.json();
                if (data.approximate_member_count) setDiscordMembers(data.approximate_member_count);
            } catch (e) {
                console.error('Error fetching Discord stats:', e);
            }
        };

        const fetchTwitchStats = async () => {
            try {
                const res = await fetch('/api/twitch/stats');
                const data = await res.json();
                if (data.total) setTwitchFollowers(data.total);
            } catch (e) {
                console.error('Error fetching Twitch stats:', e);
            }
        };

        fetchYoutubeStats();
        fetchDiscordStats();
        fetchTwitchStats();

        // Background daily sync: the endpoint decides whether anything needs doing.
        fetch('/api/social/auto-sync').catch(() => {});
    }, [API_KEY, CHANNEL_ID]);

    const stats: Stat[] = useMemo(
        () => [
            { platform: 'YouTube', icon: 'hn-youtube', count: subscribers || 18900, label: t('home.subscribers'), tone: 'pink' },
            { platform: 'Twitch', icon: 'hn-twitch', count: twitchFollowers, label: t('home.followers'), tone: 'blue' },
            { platform: 'Discord', icon: 'hn-discord', count: discordMembers, label: t('home.members'), tone: 'cyan' },
            { platform: 'TikTok', icon: 'hn-tiktok', count: tiktokFollowers, label: t('home.followers'), tone: 'yellow' },
            { platform: 'X', icon: 'hn-twitter', count: twitterFollowers, label: t('home.followers'), tone: 'plain' },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [subscribers, twitchFollowers, discordMembers, language]
    );

    const statsRef = useRef(stats);
    statsRef.current = stats;

    // Numbers are written imperatively so GSAP and React never fight over a text node.
    useEffect(() => {
        numRefs.current.forEach((el, i) => {
            if (el && (counted.current[i] === undefined || counted.current[i])) {
                el.textContent = stats[i].count.toLocaleString(language, GROUP);
            }
        });
    }, [stats, language]);

    useEffect(() => {
        const section = sectionRef.current;
        const track = trackRef.current;
        const stage = stageRef.current;
        if (!section || !track || !stage) return;

        const countUp = (i: number) => {
            const el = numRefs.current[i];
            if (!el || counted.current[i] !== undefined) return;
            counted.current[i] = false;
            const proxy = { v: 0 };
            gsap.to(proxy, {
                v: statsRef.current[i].count,
                duration: 1.6,
                ease: 'power3.out',
                onUpdate: () => {
                    el.textContent = Math.round(proxy.v).toLocaleString(document.documentElement.lang || 'es', GROUP);
                },
                onComplete: () => {
                    counted.current[i] = true;
                    el.textContent = statsRef.current[i].count.toLocaleString(document.documentElement.lang || 'es', GROUP);
                },
            });
        };

        const mm = gsap.matchMedia();

        // Desktop: pinned horizontal run through the cartridges
        mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
            const distance = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth);

            const run = gsap.to(track, {
                x: () => -distance(),
                ease: 'none',
                scrollTrigger: {
                    trigger: stage,
                    start: `top top+=${NAV_OFFSET}`,
                    end: () => `+=${distance()}`,
                    pin: true,
                    scrub: 0.6,
                    anticipatePin: 1,
                    invalidateOnRefresh: true,
                    onUpdate: (self) => stage.style.setProperty('--run', String(Math.round(self.progress * 100))),
                },
            });

            gsap.to('.stats__ghost', {
                x: () => -distance() * 0.35,
                ease: 'none',
                scrollTrigger: {
                    trigger: stage,
                    start: `top top+=${NAV_OFFSET}`,
                    end: () => `+=${distance()}`,
                    scrub: true,
                    invalidateOnRefresh: true,
                },
            });

            gsap.utils.toArray<HTMLElement>('.stat-card').forEach((card, i) => {
                gsap.from(card.querySelector('.cart-shell'), {
                    y: 70,
                    rotate: i % 2 ? 3 : -3,
                    opacity: 0,
                    duration: 0.8,
                    ease: 'power3.out',
                    scrollTrigger: { trigger: card, containerAnimation: run, start: 'left 92%', once: true },
                });
                if (i > 0) {
                    ScrollTrigger.create({
                        trigger: card,
                        containerAnimation: run,
                        start: 'left 85%',
                        once: true,
                        onEnter: () => countUp(i - 1),
                    });
                }
            });
        });

        // Phones and tablets: plain vertical stack with staggered entrances
        mm.add('(max-width: 1023px)', () => {
            const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            gsap.utils.toArray<HTMLElement>('.stat-card').forEach((card, i) => {
                if (!reduce) {
                    gsap.from(card, {
                        y: 50,
                        opacity: 0,
                        duration: 0.7,
                        ease: 'power3.out',
                        scrollTrigger: { trigger: card, start: 'top 90%', once: true },
                    });
                }
                if (i > 0) {
                    ScrollTrigger.create({ trigger: card, start: 'top 85%', once: true, onEnter: () => countUp(i - 1) });
                }
            });
        });

        return () => mm.revert();
    }, []);

    const toneClass: Record<Tone, string> = {
        pink: 'cart--pink',
        blue: 'cart--blue',
        cyan: 'cart--cyan',
        yellow: 'cart--yellow',
        plain: '',
    };

    return (
        <section ref={sectionRef} className="relative overflow-hidden border-b-[3px] border-[var(--line)] bg-[var(--bg)]">
            <div ref={stageRef} className="relative lg:flex lg:h-[calc(100svh-var(--nav-h))] lg:items-center" style={{ ['--run' as string]: 0 }}>
                {/* Oversized ghost word behind the run */}
                <p
                    aria-hidden
                    className="stats__ghost pointer-events-none absolute left-[4vw] top-1/2 hidden -translate-y-1/2 select-none whitespace-nowrap font-display text-[24vw] font-bold uppercase leading-none text-[var(--surface-2)] lg:block"
                >
                    PANTCAKE
                </p>

                <div
                    ref={trackRef}
                    className="relative z-10 flex flex-col gap-10 px-4 py-20 sm:px-6 lg:w-max lg:flex-row lg:items-center lg:gap-14 lg:px-[8vw] lg:py-0"
                >
                    <div className="stat-card shrink-0 lg:w-[34vw]">
                        <h2 className="font-display text-[clamp(3rem,8vw,7rem)] font-bold uppercase leading-[0.9] tracking-[-0.02em]">
                            {t('home.communityTitle')}
                        </h2>
                        <div className="mt-6 flex gap-2" aria-hidden>
                            <span className="h-3 w-16 bg-[var(--pink)]" />
                            <span className="h-3 w-8 bg-[var(--blue)]" />
                            <span className="h-3 w-4 bg-[var(--cyan)]" />
                        </div>
                    </div>

                    {stats.map((stat, i) => (
                        <div key={stat.platform} className="stat-card shrink-0 lg:w-[26vw] lg:max-w-[420px]">
                            <div className="cart-shell">
                                <div className={`cart ${toneClass[stat.tone]}`}>
                                    <div className="cart__face flex flex-col gap-8 p-7 sm:p-9">
                                        <div className="flex items-center justify-between">
                                            <span className="font-display text-xl font-bold uppercase tracking-wide">{stat.platform}</span>
                                            <i className={`hn ${stat.icon} text-5xl`} aria-hidden />
                                        </div>
                                        <p className="score text-[clamp(1.6rem,3.2vw,2.6rem)] leading-none">
                                            <span ref={(el) => { numRefs.current[i] = el; }}>{stat.count.toLocaleString('es', GROUP)}</span>
                                        </p>
                                        <p className="font-display text-lg font-semibold uppercase tracking-[0.08em]">{stat.label}</p>
                                    </div>
                                    <div className="pins" aria-hidden />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Run progress, HUD style */}
                <div className="absolute inset-x-[8vw] bottom-8 z-10 hidden lg:block" aria-hidden>
                    <div className="hud-bar hud-bar--cyan" style={{ ['--v' as string]: 'var(--run)' }} />
                </div>
            </div>
        </section>
    );
}
