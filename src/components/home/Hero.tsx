'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FiImage, FiTarget } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import { getCloudinaryUrl } from '../../utils/cloudinary';

gsap.registerPlugin(ScrollTrigger);

const Hero = () => {
    const { t } = useLanguage();
    const heroRef = useRef<HTMLElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const subtitleRef = useRef<HTMLParagraphElement>(null);
    const buttonsRef = useRef<HTMLDivElement>(null);
    const bgRef = useRef<HTMLDivElement>(null);

    // Reverted to local file since it couldn't be uploaded to Cloudinary (size limit)
    const bgImage = '/Fotos/SHBD24_2.gif';

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Initial Entrance Animations
            gsap.from(titleRef.current, {
                y: 50,
                opacity: 0,
                duration: 1,
                ease: 'power3.out'
            });

            gsap.from(subtitleRef.current, {
                y: 30,
                opacity: 0,
                duration: 1,
                delay: 0.3,
                ease: 'power3.out'
            });

            if (buttonsRef.current) {
                gsap.fromTo(buttonsRef.current.children,
                    { y: 20, opacity: 0 },
                    {
                        y: 0,
                        opacity: 1,
                        duration: 0.8,
                        delay: 0.6,
                        stagger: 0.2,
                        ease: 'power3.out',
                        clearProps: 'opacity,transform' // Clear inline styles after animation to safeguard CSS hover effects
                    }
                );
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

        }, heroRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={heroRef}
            className="relative min-h-screen flex items-center justify-center text-white overflow-hidden py-20"
        >
            {/* Dynamic Background Image */}
            <div
                ref={bgRef}
                className="absolute inset-0 z-0 scale-105"
                style={{
                    backgroundImage: `url('${bgImage}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'brightness(0.4) contrast(1.2)'
                }}
            />

            {/* Poke-Gamer Accents */}
            <div className="absolute inset-0 bg-pattern opacity-10 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-black/40 via-transparent to-black/40 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[var(--poke-bg)] to-transparent pointer-events-none opacity-80" />

            {/* Content Container */}
            <div className="container mx-auto px-4 text-center relative z-10">
                <div className="inline-block px-6 py-2 rounded-xl border-4 border-black bg-pokemon-yellow text-black text-xs uppercase tracking-[0.2em] font-black mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    {t('home.heroBadge') || 'Pokemon Gamer Mode Active'}
                </div>

                <h1
                    ref={titleRef}
                    className="text-6xl md:text-9xl font-black mb-8 neon-text-pink tracking-tighter uppercase italic leading-tight"
                >
                    {t('home.heroTitle')}
                </h1>

                <p
                    ref={subtitleRef}
                    className="text-lg md:text-2xl mb-12 max-w-2xl mx-auto text-gray-300 font-medium uppercase tracking-widest leading-relaxed"
                >
                    {t('home.heroSubtitle')}
                </p>

                <div
                    ref={buttonsRef}
                    className="flex flex-col sm:flex-row justify-center gap-8 items-center"
                >
                    <Link
                        href="/multimedia"
                        className="poke-button-pink px-12 py-5"
                    >
                        <FiImage className="w-6 h-6" />
                        {t('home.heroMultimedia')}
                    </Link>

                    <Link
                        href="/games"
                        className="poke-button-blue px-12 py-5"
                    >
                        <FiTarget className="w-6 h-6" />
                        {t('home.heroGames')}
                    </Link>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2">
                <div className="w-8 h-12 border-4 border-black rounded-full flex justify-center p-1 bg-white shadow-[4px_4px_0px_0px_black]">
                    <div className="w-1.5 h-3 bg-pokemon-pink rounded-full animate-bounce" />
                </div>
            </div>
        </section>
    );
};

export default Hero;
