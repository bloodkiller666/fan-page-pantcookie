'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLanguage } from '../../context/LanguageContext';

gsap.registerPlugin(ScrollTrigger);

import { splitText } from '../../utils/animations';

const Hero = () => {
    const { t } = useLanguage();
    const [isMounted, setIsMounted] = useState(false);
    const heroRef = useRef<HTMLElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const subtitleRef = useRef<HTMLParagraphElement>(null);
    const bgRef = useRef<HTMLVideoElement>(null);

    // Cloudflare R2 Video Loop
    const bgVideo = 'https://pub-ed644fbc43ed4c4788d9c013963a7b8e.r2.dev/%E3%80%90%20PancitoMerge%20%E3%80%91Cozy%20Game%20mexicanoooo%20%F0%9F%A5%90%E2%9D%A4%EF%B8%8F_%F0%9F%A9%B9%20-%20Shura%20Hiwa%20Ch.%20(720p%2C%20h264%2C%20youtube).mp4';

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        const ctx = gsap.context(() => {
            const runAnimations = () => {
                // Remove any existing opacity:0 style if set in JSX to prevent being stuck
                if (titleRef.current) titleRef.current.style.opacity = '1';
                if (subtitleRef.current) subtitleRef.current.style.opacity = '1';

                // OceanX Style Title Animation
                if (titleRef.current) {
                    const chars = splitText(titleRef.current);
                    gsap.fromTo(chars,
                        {
                            opacity: 0,
                            filter: 'blur(20px)',
                            scale: 1.2,
                            y: 20
                        },
                        {
                            opacity: 1,
                            filter: 'blur(0px)',
                            scale: 1,
                            y: 0,
                            duration: 1.2,
                            stagger: 0.05,
                            ease: 'power4.out',
                        }
                    );

                    gsap.fromTo(titleRef.current,
                        { letterSpacing: '0.2em' },
                        { letterSpacing: '-0.02em', duration: 1.5, ease: 'power4.out' }
                    );
                }

                if (subtitleRef.current) {
                    gsap.from(subtitleRef.current, {
                        y: 30,
                        opacity: 0,
                        duration: 1,
                        ease: 'power3.out',
                        delay: 0.5
                    });
                }
            };

            // Check if we should wait for loading screen
            const handleLoadingComplete = () => runAnimations();
            window.addEventListener('loading_complete', handleLoadingComplete);

            // If loading was already done (verified by session storage), run immediately
            if (sessionStorage.getItem('loading_done_v2')) {
                // Small timeout to ensure splitText finds the text after t() provides it
                setTimeout(runAnimations, 100);
            }

            // Parallax Effect for Background
            gsap.to(bgRef.current, {
                yPercent: 30,
                ease: 'none',
                scrollTrigger: {
                    trigger: heroRef.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true
                }
            });

            return () => window.removeEventListener('loading_complete', handleLoadingComplete);
        }, heroRef);

        return () => ctx.revert();
    }, [isMounted, t]);

    return (
        <section
            ref={heroRef}
            className="relative min-h-screen flex items-center justify-center text-white overflow-hidden py-20"
        >
            <video
                ref={bgRef}
                className="absolute inset-0 z-0 w-full h-full object-cover scale-105"
                autoPlay
                loop
                muted
                playsInline
                style={{
                    filter: 'brightness(0.6) contrast(1.1)'
                }}
            >
                <source src={bgVideo} type="video/mp4" />
            </video>

            <div className="absolute inset-0 bg-pattern opacity-10 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-black/20 via-transparent to-black/20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-1/2 to-transparent pointer-events-none opacity-80" />

            <div className="container mx-auto px-4 text-center relative z-10">
                <div className="inline-block px-6 py-2 rounded-xl border-4 border-black bg-pokemon-yellow text-black text-xs uppercase tracking-[0.2em] font-black mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    {t('home.heroBadge')}
                </div>

                <h1
                    ref={titleRef}
                    className="hero-title text-5xl md:text-7xl lg:text-8xl font-black mb-8 neon-text-pink tracking-tighter uppercase italic leading-[0.9] max-w-[15ch] md:max-w-[20ch] mx-auto"
                    style={{ opacity: isMounted ? 1 : 0 }}
                >
                    {t('home.heroTitle')}
                </h1>

                <p
                    ref={subtitleRef}
                    className="text-xl md:text-3xl mb-12 max-w-4xl mx-auto text-gray-300 font-medium uppercase tracking-widest leading-relaxed"
                    style={{ opacity: isMounted ? 1 : 0 }}
                >
                    {t('home.heroSubtitle')}
                </p>
            </div>

            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2">
                <div className="w-8 h-12 border-4 border-black rounded-full flex justify-center p-1 bg-white shadow-[4px_4px_0px_0px_black]">
                    <div className="w-1.5 h-3 bg-pokemon-pink rounded-full animate-bounce" />
                </div>
            </div>
        </section>
    );
};

export default Hero;
