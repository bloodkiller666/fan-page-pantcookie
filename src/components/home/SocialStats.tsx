'use client';
import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrambleText } from '../../utils/animations';

gsap.registerPlugin(ScrollTrigger);

export default function SocialStats() {
    const [subscribers, setSubscribers] = useState<number | null>(null);
    const [twitchFollowers, setTwitchFollowers] = useState<number>(22003);
    const [discordMembers, setDiscordMembers] = useState<number>(1058);
    const [tiktokFollowers, setTiktokFollowers] = useState<number>(17550);
    const [twitterFollowers, setTwitterFollowers] = useState<number>(17570);

    const sectionRef = useRef<HTMLElement>(null);
    const cardsContainerRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const narrativeRef = useRef<HTMLParagraphElement>(null);

    const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';
    const CHANNEL_ID = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID || '';
    const DISCORD_INVITE_CODE = "UxvGN36qhX";

    useEffect(() => {
        const fetchYoutubeStats = async () => {
            if (!API_KEY || !CHANNEL_ID) return;
            try {
                const res = await fetch(
                    `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${CHANNEL_ID}&key=${API_KEY}`
                );
                const data = await res.json();
                if (data.items && data.items.length > 0) {
                    const stats = data.items[0].statistics;
                    setSubscribers(parseInt(stats.subscriberCount));
                }
            } catch (e) { console.error("Error fetching YouTube stats:", e); }
        };

        const fetchDiscordStats = async () => {
            try {
                const res = await fetch(`https://discord.com/api/v10/invites/${DISCORD_INVITE_CODE}?with_counts=true`);
                const data = await res.json();
                if (data.approximate_member_count) {
                    setDiscordMembers(data.approximate_member_count);
                }
            } catch (e) { console.error("Error fetching Discord stats:", e); }
        };

        const fetchTwitchStats = async () => {
            try {
                const res = await fetch('/api/twitch/stats');
                const data = await res.json();
                if (data.total) {
                    setTwitchFollowers(data.total);
                }
            } catch (e) { console.error("Error fetching Twitch stats:", e); }
        };

        fetchYoutubeStats();
        fetchDiscordStats();
        fetchTwitchStats();

        // 4. Auto-sync (Background)
        const triggerAutoSync = async () => {
            try {
                // We just "poke" the endpoint, it will decide if a sync is needed.
                await fetch('/api/social/auto-sync');
            } catch (e) {
                // Silently fail as this is a background task
            }
        };
        triggerAutoSync();
    }, [API_KEY, CHANNEL_ID]);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const cards = gsap.utils.toArray('.stat-card');
            
            // 1. Efecto Pin y Scroll Horizontal
            if (cardsContainerRef.current && sectionRef.current) {
                gsap.to(cardsContainerRef.current, {
                    x: () => -((cardsContainerRef.current as HTMLElement).offsetWidth - window.innerWidth),
                    ease: "none",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        pin: true,
                        start: "top top",
                        end: () => `+=${(cardsContainerRef.current as HTMLElement).offsetWidth}`,
                        scrub: 1,
                        snap: {
                            snapTo: 1 / (cards.length - 1), // Ajustado para que la última tarjeta quede centrada
                            duration: { min: 0.2, max: 0.5 },
                            delay: 0.1,
                            ease: "power2.inOut"
                        },
                        invalidateOnRefresh: true
                    }
                });

                // 2. Efecto Parallax en el título
                gsap.to(titleRef.current, {
                    yPercent: 30,
                    ease: "none",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top top",
                        end: "bottom top",
                        scrub: true
                    }
                });

                // 3. Animación de los contadores
                const counters = document.querySelectorAll('.stat-number');
                counters.forEach(counter => {
                    const targetValue = parseInt(counter.getAttribute('data-target') || '0');
                    
                    gsap.to(counter, {
                        innerText: targetValue,
                        duration: 2,
                        snap: { innerText: 1 },
                        scrollTrigger: {
                            trigger: counter,
                            start: "top 90%",
                            toggleActions: "play none none reverse"
                        },
                        ease: "power4.out",
                        onUpdate: function() {
                            counter.innerHTML = Math.ceil(Number(this.targets()[0].innerText)).toLocaleString();
                        }
                    });
                });

                // 4. Scramble para la narrativa
                if (narrativeRef.current) {
                    scrambleText(narrativeRef.current, "SYSTEM.v2026 // ESTABILIZANDO LA MATRIX DE LA SHAKEGANG...", 3);
                }

                // 5. Brillo al pasar el mouse por iconos
                const icons = document.querySelectorAll('.social-icon');
                icons.forEach(icon => {
                    icon.addEventListener('mouseenter', () => {
                        gsap.to(icon, {
                            filter: "drop-shadow(0 0 20px currentColor)",
                            scale: 1.2,
                            duration: 0.3
                        });
                    });
                    icon.addEventListener('mouseleave', () => {
                        gsap.to(icon, {
                            filter: "drop-shadow(0 0 0px currentColor)",
                            scale: 1,
                            duration: 0.3
                        });
                    });
                });
            }
        }, sectionRef);
        return () => ctx.revert();
    }, [subscribers, discordMembers, twitchFollowers]);

    const stats = [
        {
            platform: 'YouTube',
            icon: 'hn-youtube',
            count: subscribers || 18900,
            label: 'Suscriptores',
            color: 'text-red-600',
            glow: 'shadow-[0_0_30px_rgba(220,38,38,0.15)]',
            message: '¡Gracias por el increíble apoyo! Superamos los 18,900 suscriptores.'
        },
        {
            platform: 'Twitch',
            icon: 'hn-twitch',
            count: twitchFollowers,
            label: 'Seguidores',
            color: 'text-purple-600',
            glow: 'shadow-[0_0_30px_rgba(147,51,234,0.15)]',
            message: '¡ShakeGang a tope! Gracias por acompañarme en cada directo.'
        },
        {
            platform: 'Discord',
            icon: 'hn-discord',
            count: discordMembers,
            label: 'Miembros',
            color: 'text-indigo-600',
            glow: 'shadow-[0_0_30px_rgba(79,70,229,0.15)]',
            message: 'Nuestra casa digital sigue creciendo. ¡Gracias por ser parte de la familia!'
        },
        {
            platform: 'TikTok',
            icon: 'hn-tiktok',
            count: tiktokFollowers,
            label: 'Seguidores',
            color: 'text-gray-100',
            glow: 'shadow-[0_0_30px_rgba(243,244,246,0.15)]',
            message: '¡La energía es de otro nivel! Gracias por compartir cada locura.'
        },
        {
            platform: 'Twitter',
            icon: 'hn-twitter',
            count: twitterFollowers,
            label: 'Seguidores',
            color: 'text-blue-400',
            glow: 'shadow-[0_0_30px_rgba(96,165,250,0.15)]',
            message: '¡Gracias por estar siempre conectados y al tanto de todo!'
        }
    ];

    return (
        <section ref={sectionRef} className="social-section relative w-full bg-black py-0 overflow-hidden">
            {/* Capa de Título y Narrativa (PROTAGONISTA) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 px-4 pointer-events-none">
                <h2 ref={titleRef} className="text-[15vw] font-black text-white/5 uppercase tracking-tighter select-none leading-none -mb-10">
                    COMUNIDAD
                </h2>
                <p ref={narrativeRef} className="text-gray-600 font-mono text-xs md:text-sm uppercase tracking-[0.3em] max-w-lg mt-6">
                    {/* Se rellena con scramble */}
                </p>
            </div>

            {/* Capa de Tarjetas (SCROLLABLE) */}
            <div 
                ref={cardsContainerRef}
                className="relative z-20 flex flex-nowrap gap-12 px-[10vw] h-screen items-center"
                style={{ width: 'fit-content' }}
            >
                {/* Intro Slide */}
                <div className="stat-card min-w-[40vw] flex flex-col items-center justify-center p-12 text-center">
                    <h2 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-white mb-4">
                        SHAKE<span className="text-primary-pink">GANG</span>
                    </h2>
                    <div className="w-24 h-1 bg-primary-pink mt-4" />
                </div>

                {stats.map((stat, index) => (
                    <div 
                        key={index}
                        className={`stat-card min-w-[80vw] md:min-w-[35vw] p-8 md:p-12 rounded-[2rem] bg-gradient-to-br from-white/10 to-transparent border border-white/10 backdrop-blur-xl flex flex-col items-center gap-8 text-center ${stat.glow} transition-all duration-500`}
                    >
                        <div className={`social-icon text-7xl ${stat.color} transition-all duration-300`}>
                            <i className={`hn ${stat.icon}`} />
                        </div>
                        
                        <div className="space-y-4">
                            <h3 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter leading-none font-mono">
                                <span className="stat-number" data-target={stat.count}>0</span>
                            </h3>
                            <p className="text-xl font-bold uppercase tracking-[0.4em] text-gray-500">
                                {stat.label}
                            </p>
                        </div>

                        <p className="text-lg md:text-xl font-medium text-gray-400 mt-4 max-w-sm">
                            {stat.message}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
