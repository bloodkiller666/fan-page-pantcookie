'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLanguage } from '../context/LanguageContext';
import LoadingScreen from '../components/ui/LoadingScreen';
import Hero from '../components/home/Hero';
import SocialStats from '../components/home/SocialStats';
import WeeklyCalendar from '../components/home/WeeklyCalendar';
import YouTubeFeedComponent from '../components/home/YouTubeFeedComponent';
import UpdateModal from '../components/home/UpdateModal';
import HeartsEffect from '../components/ui/HeartsEffect';
import { FiYoutube, FiImage, FiTarget, FiInfo, FiMessageSquare, FiMail } from 'react-icons/fi';
import { splitText, blurReveal } from '../utils/animations';
import { useTransition } from '../context/TransitionContext';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
    const { t, language } = useLanguage();
    const { transitionTo } = useTransition();
    const [isLoading, setIsLoading] = useState(true);
    const [showInteractiveCalendar, setShowInteractiveCalendar] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const calendarSectionRef = useRef<HTMLElement>(null);
    const calendarTitleRef = useRef<HTMLHeadingElement>(null);
    const calendarContainerRef = useRef<HTMLDivElement>(null);
    const featuresRef = useRef<HTMLElement>(null);
    const exploreTitleRef = useRef<HTMLHeadingElement>(null);
    const socialRef = useRef<HTMLElement>(null);

    useEffect(() => {
        // 1. Verificamos si ya existe la marca en el navegador
        const hasVisited = localStorage.getItem('shakegang_onboarding_done');

        if (hasVisited) {
            // Si ya entró antes, quitamos el loading de inmediato
            setIsLoading(false);
        } else {
            // Si es nuevo, dejamos que el LoadingScreen haga su trabajo
            const handleLoadingComplete = () => {
                localStorage.setItem('shakegang_onboarding_done', 'true');
                setIsLoading(false);
            };

            window.addEventListener('loading_complete', handleLoadingComplete);
            return () => window.removeEventListener('loading_complete', handleLoadingComplete);
        }
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const ctx = gsap.context(() => {
            // A. Hero Entry Animation
            const heroTitle = document.querySelector('.hero-title');
            if (heroTitle) {
                const chars = splitText(heroTitle as HTMLElement);
                gsap.from(chars, {
                    y: 100,
                    opacity: 0,
                    stagger: 0.02,
                    duration: 1,
                    ease: "power4.out",
                    delay: 0.8
                });
            }

            // B. Blur Reveal for Titles
            if (exploreTitleRef.current) {
                blurReveal(exploreTitleRef.current);
            }

            if (calendarTitleRef.current) {
                blurReveal(calendarTitleRef.current);
            }

            // C. Revealer Effect for Feature Images
            const featureCards = gsap.utils.toArray('.feature-card');
            featureCards.forEach((card: any) => {
                const revealer = card.querySelector('.revealer');
                const img = card.querySelector('img');

                if (revealer && img) {
                    const tl = gsap.timeline({
                        scrollTrigger: {
                            trigger: card,
                            start: 'top 80%',
                        }
                    });

                    tl.fromTo(revealer,
                        { scaleX: 0, transformOrigin: 'left' },
                        { scaleX: 1, duration: 0.6, ease: 'expo.inOut' }
                    )
                        .set(img, { opacity: 1 })
                        .to(revealer, { scaleX: 0, transformOrigin: 'right', duration: 0.6, ease: 'expo.inOut' });
                }
            });

            // Weekly Calendar Animation (simplified to use blurReveal)
            if (calendarSectionRef.current) {
                gsap.to(calendarContainerRef.current, {
                    opacity: 1,
                    scale: 1,
                    duration: 1,
                    ease: 'power4.out',
                    scrollTrigger: {
                        trigger: calendarSectionRef.current,
                        start: 'top 40%',
                    }
                });
            }

            // "Últimas Novedades" Advanced Reveal Effect
            const novedadesTitle = socialRef.current?.querySelector('h2');
            const novedadesIcon = socialRef.current?.querySelector('.fi-youtube-icon');
            const novedadesSubtitle = socialRef.current?.querySelector('p');

            if (novedadesTitle) {
                const wordSpans = splitText(novedadesTitle as HTMLElement, 'words');

                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: socialRef.current,
                        start: 'top 80%',
                    }
                });

                if (novedadesIcon) {
                    tl.from(novedadesIcon, {
                        scale: 0,
                        rotation: -45,
                        filter: "blur(10px) brightness(2)",
                        duration: 0.8,
                        ease: "back.out(1.7)"
                    });
                }

                tl.from(wordSpans, {
                    x: 100,
                    skewX: -30,
                    opacity: 0,
                    duration: 1,
                    stagger: 0.1,
                    ease: "back.out(1.5)",
                }, "-=0.4");

                if (novedadesSubtitle) {
                    tl.from(novedadesSubtitle, {
                        opacity: 0,
                        y: 20,
                        letterSpacing: "0em",
                        duration: 1,
                        ease: "expo.out"
                    }, "-=0.6");
                }
            }

        }, containerRef);
        return () => ctx.revert();
    }, [isLoading, language, t]);

    const handleNav = (e: any, path: string) => {
        e.preventDefault();
        transitionTo(path);
    };

    const features = [
        {
            title: t('nav.multimedia'),
            description: t('home.features.multimediaDesc'),
            icon: FiImage,
            link: '/multimedia',
            color: 'border-primary-pink text-primary-pink shadow-[0_0_20px_rgba(255,46,151,0.2)]',
            image: 'https://pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev/ShuraHiwa%20RnC%20by%20Parkiranhonda.png'
        },
        {
            title: t('nav.games'),
            description: t('home.features.gamesDesc'),
            icon: FiTarget,
            link: '/games',
            color: 'border-primary-blue text-primary-blue shadow-[0_0_20px_rgba(46,151,255,0.2)]',
            image: 'https://pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev/by%20toba_ww%201.png'
        },
        {
            title: t('nav.chat'),
            description: t('home.features.chatDesc'),
            icon: FiMessageSquare,
            link: '/chat',
            color: 'border-cyan-400 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]',
            image: 'https://pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev/ShuraHiwas_Summer_2025.jpg'
        },
        {
            title: t('nav.mensajes'),
            description: t('home.features.messagesDesc'),
            icon: FiMail,
            link: '/mensajes',
            color: 'border-amber-400 text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.2)]',
            image: 'https://pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev/Recording-2026-03-20-21-04-03.png'
        },
        {
            title: t('nav.about'),
            description: t('home.features.aboutDesc'),
            icon: FiInfo,
            link: '/about',
            color: 'border-purple-500 text-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.2)]',
            image: 'https://pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev/Tanabata1_by_higashibara_n.png'
        }
    ];

    return (
        <>
            {isLoading && <LoadingScreen />}

            <div
                ref={containerRef}
                className={`min-h-screen bg-black transition-opacity duration-700 ${isLoading ? 'opacity-0' : 'opacity-100'
                    }`}
            >
                <HeartsEffect />
                <Hero />
                <SocialStats />

                {/* Calendar Section */}
                <section ref={calendarSectionRef} className="py-20 bg-[#050505] border-y-4 border-black relative overflow-hidden min-h-screen flex flex-col items-center">
                    <div className="container mx-auto px-4 text-center h-full flex flex-col items-center">
                        <div className="relative z-20 mb-16 h-24 flex items-center justify-center">
                            <h2
                                ref={calendarTitleRef}
                                className="text-4xl md:text-8xl font-black text-white uppercase italic tracking-tighter"
                            >
                                {t('home.weeklyCalendar')}
                            </h2>
                        </div>

                        <div
                            ref={calendarContainerRef}
                            className="opacity-0 scale-95 max-w-5xl mx-auto w-full relative z-10"
                        >
                            <div
                                className="relative p-1 bg-gradient-to-br from-white/10 to-transparent rounded-2xl shadow-[0_0_50px_rgba(255,46,151,0.1)] overflow-hidden cursor-pointer border border-white/10"
                                onClick={() => setShowInteractiveCalendar(!showInteractiveCalendar)}
                            >
                                {!showInteractiveCalendar ? (
                                    <>
                                        <img
                                            src="https://pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev/ShuraHiwa%20Weekly%20Schedule.jpg"
                                            alt={t('home.weeklyCalendar')}
                                            className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity"
                                            onError={(e) => {
                                                e.currentTarget.src = "https://placehold.co/1200x800/222/FF2E97?text=Weekly+Schedule";
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="bg-primary-pink/20 backdrop-blur-md px-10 py-4 rounded-full border-2 border-primary-pink text-white font-black uppercase tracking-[0.3em] text-sm animate-pulse">
                                                Visualizar Calendario Interactivo
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="bg-black/95 backdrop-blur-3xl">
                                        <WeeklyCalendar />
                                        <div className="p-8 text-center border-t border-white/10 bg-black">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowInteractiveCalendar(false);
                                                }}
                                                className="text-sm font-black uppercase tracking-[0.5em] text-primary-pink hover:scale-110 transition-transform"
                                            >
                                                [ Regresar ]
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section ref={featuresRef} className="py-32 bg-black">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-32">
                            <h2
                                ref={exploreTitleRef}
                                className="text-4xl md:text-6xl lg:text-7xl font-black text-white uppercase italic tracking-tighter leading-none"
                            >
                                {t('home.exploreContent')}
                            </h2>
                        </div>

                        <div className="space-y-32">
                            {features.map((feature, index) => {
                                const Icon = feature.icon;
                                const isEven = index % 2 === 0;
                                return (
                                    <div
                                        key={index}
                                        className={`feature-card flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 md:gap-24`}
                                    >
                                        <Link
                                            href={feature.link}
                                            className="w-full md:w-3/5 group relative h-[50vh] overflow-hidden rounded-3xl border border-white/10 bg-white/5"
                                            onClick={(e) => handleNav(e, feature.link)}
                                        >
                                            <div className="revealer absolute inset-0 bg-primary-pink z-10 scale-x-0" />
                                            <img
                                                src={feature.image}
                                                alt={feature.title}
                                                className="w-full h-full object-cover opacity-0 transition-transform duration-1000 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                                            <div className="absolute bottom-6 left-6 flex items-center gap-4">
                                                <div className={`p-4 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 ${feature.color}`}>
                                                    <Icon className="w-8 h-8" />
                                                </div>
                                                <h3 className="text-3xl font-black text-white italic uppercase">{feature.title}</h3>
                                            </div>
                                        </Link>

                                        <div className="feature-text w-full md:w-2/5 space-y-6">
                                            <div className="flex items-center gap-4 text-xs font-black uppercase tracking-[1em] text-primary-pink">
                                                <div className="w-12 h-1 bg-primary-pink" />
                                                Sección {index + 1}
                                            </div>
                                            <h3 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter">
                                                {feature.title}
                                            </h3>
                                            <p className="text-gray-400 text-lg md:text-xl font-medium leading-relaxed uppercase tracking-wider">
                                                {feature.description}
                                            </p>
                                            <Link
                                                href={feature.link}
                                                className={`inline-flex items-center gap-4 px-8 py-4 rounded-xl bg-white text-black font-black uppercase tracking-widest hover:bg-primary-pink hover:text-white transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,46,151,0.3)] hover:-translate-y-1`}
                                                onClick={(e) => handleNav(e, feature.link)}
                                            >
                                                Explorar Ahora
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section ref={socialRef} className="py-32 bg-[#050505] border-t border-white/5 perspective-1000">
                    <div className="container mx-auto px-6 md:px-4 text-center">
                        <div className="mb-20">
                            <h2 className="text-3xl md:text-6xl font-black text-white uppercase tracking-tight italic flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 w-full max-w-7xl mx-auto">
                                <FiYoutube className="fi-youtube-icon text-red-600 drop-shadow-[0_0_20px_rgba(255,0,0,0.5)] shrink-0 text-5xl md:text-7xl" />
                                <span className="text-center md:text-left leading-none">
                                    Últimas <span className="text-red-600">Novedades</span>
                                </span>
                            </h2>
                            <p className="text-gray-500 mt-6 text-base font-black uppercase tracking-[0.5em]">
                                Contenido exclusivo de @ShuraHiwa
                            </p>
                        </div>

                        {!isLoading && <YouTubeFeedComponent />}
                    </div>
                </section>
                <UpdateModal parentLoading={isLoading} />
            </div>
        </>
    );
}