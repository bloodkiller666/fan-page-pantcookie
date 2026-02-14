'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
import Link from 'next/link';
import { FiImage, FiTarget, FiInfo, FiTwitter } from 'react-icons/fi';
import ImageCarousel from '../components/home/ImageCarousel';
import Hero from '../components/home/Hero';
import { useLanguage } from '../context/LanguageContext';
import WeeklyCalendar from '../components/home/WeeklyCalendar';
import YoutubeShorts from '../components/social/YoutubeShorts';
import { FiYoutube } from 'react-icons/fi';

const Home = () => {
    const { t } = useLanguage();
    const [showInteractiveCalendar, setShowInteractiveCalendar] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLElement>(null);
    const carouselRef = useRef<HTMLElement>(null);
    const featuresRef = useRef<HTMLElement>(null);
    const socialRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {

            gsap.from(containerRef.current, { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out' });
            gsap.from(calendarRef.current, {
                y: 50,
                opacity: 0,
                duration: 1,
                scrollTrigger: {
                    trigger: calendarRef.current,
                    start: 'top 80%',
                    end: 'bottom 20%',
                    toggleActions: 'play none none reverse'
                }
            });

            // Carousel Section Parallax/Reveal
            gsap.from(carouselRef.current, {
                y: 50,
                opacity: 0,
                duration: 1,
                scrollTrigger: {
                    trigger: carouselRef.current,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse'
                }
            });

            gsap.from(featuresRef.current, {
                y: 50,
                opacity: 0,
                duration: 1,
                scrollTrigger: {
                    trigger: featuresRef.current,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse'
                }
            });

            gsap.from(socialRef.current, {
                y: 50,
                opacity: 0,
                duration: 1,
                scrollTrigger: {
                    trigger: socialRef.current,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse'
                }
            });

        }, containerRef);
        return () => ctx.revert();
    }, []);

    const features = [
        {
            title: t('nav.multimedia'),
            description: t('home.features.multimediaDesc'),
            icon: FiImage,
            link: '/multimedia',
            color: 'from-primary-pink to-primary-pink-light',
            image: '/Fotos/ShuraHiwa RnC by Parkiranhonda.png'
        },
        {
            title: t('nav.games'),
            description: t('home.features.gamesDesc'),
            icon: FiTarget,
            link: '/games',
            color: 'from-primary-blue to-primary-blue-light',
            image: '/Fotos/by toba_ww 1.png'
        },
        {
            title: t('nav.about'),
            description: t('home.features.aboutDesc'),
            icon: FiInfo,
            link: '/about',
            color: 'from-purple-500 to-pink-500',
            image: '/Fotos/Tanabata1_by_higashibara_n.png'
        }
    ];

    return (
        <div ref={containerRef} className="min-h-screen bg-pattern transition-colors duration-300">
            <Hero />

            <section ref={calendarRef} className="py-24 bg-[var(--poke-bg)] border-y-4 border-black relative overflow-hidden">
                <div className="container mx-auto px-4 text-center">
                    <div className="inline-block px-6 py-2 rounded-xl border-4 border-black bg-pokemon-yellow text-black text-xs uppercase tracking-[0.2em] font-black mb-8 shadow-[4px_4px_0px_0px_black]">
                        {t('home.heroBadge') || 'Schedule Updates'}
                    </div>
                    <h2 className="text-4xl md:text-7xl font-black neon-text-pink mb-12 uppercase italic tracking-tighter">
                        {t('home.weeklyCalendar')}
                    </h2>
                    <div
                        className="max-w-4xl mx-auto relative p-1 bg-pokemon-yellow rounded-2xl shadow-[8px_8px_0px_0px_black] overflow-hidden hover:scale-[1.01] transition-transform duration-500 cursor-pointer border-4 border-black"
                        onClick={() => setShowInteractiveCalendar(!showInteractiveCalendar)}
                    >
                        {!showInteractiveCalendar ? (
                            <>
                                <img
                                    src=""
                                    alt={t('home.weeklyCalendar')}
                                    className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                                    <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 text-white font-black uppercase tracking-widest text-xs">
                                        Haz click aquí
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="bg-white/90 dark:bg-black/90 backdrop-blur-3xl animate-fade-in">
                                <WeeklyCalendar />
                                <div className="p-6 text-center border-t-4 border-black bg-pokemon-yellow">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowInteractiveCalendar(false);
                                        }}
                                        className="text-xs font-black uppercase tracking-[0.3em] text-pokemon-blue hover:scale-110 transition-transform"
                                    >
                                        [ Cerrar Calendario ]
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Carousel Section */}
            <section ref={carouselRef} className="py-24 container mx-auto px-4 relative">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
                        Mejores <span className="neon-text-blue">Momentos</span>
                    </h2>
                    <p className="text-lg text-gray-500 dark:text-gray-400 mt-4 max-w-2xl mx-auto uppercase tracking-widest text-xs font-bold">
                        {t('home.specialMomentsDesc')}
                    </p>
                </div>
                <div className="max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-[12px_12px_0px_0px_black] border-4 border-black">
                    <ImageCarousel />
                </div>
            </section>

            {/* Features Section */}
            <section ref={featuresRef} className="py-24 bg-white/50 dark:bg-black/20 backdrop-blur-sm border-t border-white/5">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-6xl font-black neon-text-pink uppercase italic tracking-tighter">
                            {t('home.exploreContent')}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <Link
                                    key={index}
                                    href={feature.link}
                                    className="poke-card group relative h-96 overflow-hidden transition-all duration-500 transform hover:-translate-y-4"
                                >
                                    {/* Background Image */}
                                    <div className="absolute inset-0">
                                        <img
                                            src={feature.image}
                                            alt={feature.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80" />
                                        <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} mix-blend-color opacity-40`} />
                                    </div>

                                    {/* HUD Elements */}
                                    <div className="absolute top-4 right-4 flex gap-1.5">
                                        <div className="w-3 h-3 bg-pokemon-yellow border-2 border-black rounded-full" />
                                        <div className="w-3 h-3 bg-pokemon-pink border-2 border-black rounded-full" />
                                    </div>

                                    {/* Content */}
                                    <div className="relative p-8 h-full flex flex-col justify-end text-white">
                                        <div className="p-6 rounded-xl bg-black/40 border-4 border-black backdrop-blur-sm group-hover:border-pokemon-pink transition-all">
                                            <Icon className="w-10 h-10 mb-4 text-pokemon-blue" />
                                            <h3 className="text-2xl font-black mb-2 uppercase tracking-tighter italic">{feature.title}</h3>
                                            <p className="text-gray-200 text-xs font-medium uppercase tracking-widest leading-relaxed">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Social Section */}
            <section ref={socialRef} className="py-24 bg-[#0a0a0a] border-t-4 border-black relative overflow-hidden">
                <div className="container mx-auto px-4 text-center">
                    <div className="mb-12">
                        <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter italic flex items-center justify-center gap-4">
                            <FiYoutube className="text-red-600" />
                            Últimas <span className="text-red-600">Novedades</span>
                        </h2>
                        <p className="text-gray-400 mt-4 text-sm font-bold uppercase tracking-widest">
                            Sigue a @ShuraHiwa en YouTube
                        </p>
                    </div>
                    
                    <div className="max-w-4xl mx-auto bg-black rounded-xl border-4 border-gray-800 overflow-hidden shadow-[0_0_20px_rgba(255,0,0,0.3)] p-8">
                        <YoutubeShorts />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
