'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../../context/LanguageContext';
import { useTransition } from '../../context/TransitionContext';
import gsap from 'gsap';
import { ES, US, JP, FR } from 'country-flag-icons/react/3x2';

const PokeballIcon = ({ isDark }: { isDark: boolean }) => (
    <svg viewBox="0 0 100 100" className="w-6 h-6 transition-transform duration-700 group-hover:rotate-[360deg] drop-shadow-[0_0_8px_rgba(253,33,159,0.4)]">
        {/* Base: Blanco en light, morado oscuro en dark */}
        <circle cx="50" cy="50" r="48" fill={isDark ? "#ffffffff" : "#ffffff"} stroke="#000000" strokeWidth="6" />
        {/* Mitad superior: Rosa Pantcookie */}
        <path d="M2 50 A48 48 0 0 1 98 50 Z" fill="#fd219f" stroke="#000000" strokeWidth="6" />
        {/* Cinturón negro */}
        <rect x="2" y="47" width="96" height="6" fill="#000000" />
        {/* Botón central */}
        <circle cx="50" cy="50" r="15" fill={isDark ? "#1a1a1a" : "#ffffff"} stroke="#000000" strokeWidth="6" />
        <circle cx="50" cy="50" r="8" fill="#ffffff" stroke="#000000" strokeWidth="2" className={isDark ? "animate-pulse" : ""} />
        {/* Reflejo de cristal */}
        <path d="M25 25 A30 30 0 0 1 40 15" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
    </svg>
);

const Navbar = () => {
    const { t, setLanguage, language } = useLanguage();
    const { transitionTo } = useTransition();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    const [theme, setTheme] = useState('dark');
    const pathname = usePathname();

    useEffect(() => {
        const stored = localStorage.getItem('theme-mode');
        if (stored) {
            setTheme(stored);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        } else {
            setTheme('light');
        }
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('dark');
        if (theme === 'dark') root.classList.add('dark');
    }, [theme]);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme-mode', newTheme);
    };

    // Nav-link Bounce Animation (One-time per session)
    useEffect(() => {
        if (!sessionStorage.getItem('navBounced')) {
            gsap.fromTo('.nav-char',
                { y: -150, opacity: 0 },
                { y: 0, opacity: 1, duration: 1.5, ease: 'bounce.out', stagger: 0.04 }
            );
            sessionStorage.setItem('navBounced', 'true');
        }
    }, []);

    // Mobile Menu Animation with GSAP
    useEffect(() => {
        if (!mobileMenuRef.current || !overlayRef.current) return;

        if (isMenuOpen) {
            // Open animation
            gsap.to(overlayRef.current, { opacity: 1, display: 'block', duration: 0.3 });
            gsap.to(mobileMenuRef.current, { x: 0, opacity: 1, duration: 0.4, ease: 'power3.out' });

            // Stagger animation for text items
            gsap.fromTo('.mobile-stagger-item',
                { x: 50, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.5, stagger: 0.1, delay: 0.2, ease: 'back.out(1.7)' }
            );
        } else {
            // Close animation
            gsap.to(mobileMenuRef.current, { x: '100%', opacity: 0, duration: 0.3, ease: 'power3.in' });
            gsap.to(overlayRef.current, { opacity: 0, display: 'none', duration: 0.3 });
            gsap.set('.mobile-stagger-item', { opacity: 0, x: 50 }); // Reset for next open
        }
    }, [isMenuOpen]);

    const navLinks = [
        { path: '/', label: t('nav.home'), icon: 'hn-home' },
        {
            path: '/multimedia',
            label: t('nav.multimedia'),
            icon: 'hn-image',
            subItems: [
                { label: t('nav.multimediaPhotos'), path: '/multimedia?tab=images', icon: 'hn-image' },
                { label: t('nav.multimediaVideos'), path: '/multimedia?tab=videos', icon: 'hn-video-camera' },
                { label: t('nav.multimediaCovers'), path: '/multimedia?tab=covers', icon: 'hn-music' },
            ]
        },
        {
            path: '/games',
            label: t('nav.games'),
            icon: 'hn-gaming',
            subItems: [
                { label: t('nav.gamesPuzzle'), path: '/games?game=puzzle', icon: 'hn-gaming' },
                { label: t('nav.gamesTrivia'), path: '/games?game=trivia', icon: 'hn-gaming' },
                { label: t('nav.gamesShuraRun'), path: '/games?game=shuraRun', icon: 'hn-gaming' },
            ]
        },
        { path: '/chat', label: t('nav.chat'), icon: 'hn-message' },
        {
            path: '/mensajes',
            label: t('nav.mensajes'),
            icon: 'hn-envelope',
            subItems: [
                { label: t('nav.mensajesWrite'), path: '/mensajes?view=write', icon: 'hn-edit' },
                { label: t('nav.mensajesRead'), path: '/mensajes?view=read', icon: 'hn-image' },
            ]
        },
        { path: '/about', label: t('nav.about'), icon: 'hn-info-circle' },
    ];

    const handleMouseEnter = (path: string) => {
        if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
        setActiveDropdown(path);
    };

    const handleMouseLeave = () => {
        dropdownTimeoutRef.current = setTimeout(() => {
            setActiveDropdown(null);
        }, 200);
    };

    const handleNav = (e: React.MouseEvent, path: string) => {
        e.preventDefault();
        transitionTo(path);
        setIsMenuOpen(false);
    };

    return (
        <nav className="fixed top-0 left-0 w-full z-[9999] font-orbitron">
            <div className="glass-panel bg-white dark:bg-black/90 px-8 py-0 flex items-center justify-between transition-all duration-300 min-h-[70px] border-b border-black/5 dark:border-[#00f2ff]/20 shadow-lg">

                {/* Logo Section */}
                <Link
                    href="/"
                    className="flex items-center space-x-3 group"
                    onClick={(e) => handleNav(e, '/')}
                >
                    <div className="hidden md:block transition-all duration-500 transform group-hover:-translate-y-1">
                        <h1 className="text-gray-900 dark:text-white text-2xl font-black tracking-tighter italic drop-shadow-holo-glow leading-none group-hover:opacity-90 transition-all duration-500 origin-left group-hover:scale-x-110">
                            SHAKE-<span className="text-[#ff00e5]">GANG</span>
                        </h1>
                        <p className="text-[7px] text-[#009dad] dark:text-[#00f2ff] tracking-[0.3em] uppercase opacity-70 transition-all duration-500 group-hover:tracking-[0.6em] group-hover:opacity-100 origin-left group-hover:scale-x-110">Community Network</p>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <ul className="hidden lg:flex items-center space-x-8 text-sm font-bold tracking-widest text-gray-900 dark:text-white h-full">
                    {navLinks.map((link) => {
                        const safePathname = pathname || '';
                        const active = safePathname === link.path || safePathname.startsWith(link.path + '/') || (link.path !== '/' && safePathname.startsWith(link.path));
                        const actualActive = link.path === '/' ? safePathname === '/' : safePathname.startsWith(link.path);
                        const hasSubMenu = link.subItems && link.subItems.length > 0;
                        const isDropdownOpen = activeDropdown === link.path;

                        return (
                            <li
                                key={link.path}
                                className="relative"
                                onMouseEnter={() => hasSubMenu && handleMouseEnter(link.path)}
                                onMouseLeave={() => hasSubMenu && handleMouseLeave()}
                            >
                                <Link
                                    href={link.path}
                                    className={`nav-link text-sm transition-all duration-300 hover:text-[#00f2ff] flex items-center gap-2 py-4 ${actualActive ? 'text-[#00a0b0] dark:text-[#00f2ff] border-b-2 border-[#00a0b0] dark:border-[#00f2ff]' : 'text-gray-900 dark:text-white border-b-2 border-transparent hover:border-[#00f2ff]/30'}`}
                                    onClick={(e) => handleNav(e, link.path)}
                                >
                                    <span className="flex">
                                        {link.label.toUpperCase().split('').map((char: string, i: number) => (
                                            <span key={i} className="nav-char inline-block">{char === ' ' ? '\u00A0' : char}</span>
                                        ))}
                                    </span>
                                    {hasSubMenu && <i className={`hn hn-chevron-down transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />}
                                </Link>

                                {/* Dropdown Menu */}
                                {hasSubMenu && isDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-[2px] w-56 z-[1000] animate-fade-in-up">
                                        <div className="bg-white dark:bg-[#050505] border border-gray-200 dark:border-[#00f2ff]/40 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(0,242,255,0.2)] overflow-hidden">
                                            <div className="flex flex-col">
                                                {link.subItems!.map((sub) => (
                                                    <Link
                                                        key={sub.path}
                                                        href={sub.path}
                                                        className="flex items-center gap-3 px-6 py-4 text-xs hover:bg-[#00f2ff]/10 text-gray-900 dark:text-white hover:text-[#00f2ff] transition-all border-b border-black/5 dark:border-white/5 last:border-none uppercase font-bold"
                                                        onClick={(e) => {
                                                            handleNav(e, sub.path);
                                                            setActiveDropdown(null);
                                                        }}
                                                    >
                                                        {sub.icon && <i className={`hn ${sub.icon} text-[#00f2ff] text-sm`} />}
                                                        <span>{sub.label}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>

                {/* Theme Toggle / Mobile Menu Toggle */}
                <div className="flex items-center gap-4">
                    <div className="relative group/lang">
                        <button className="flex items-center gap-2 text-gray-700 dark:text-white/80 hover:text-[#00f2ff] transition-colors p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                            <i className="hn hn-globe text-lg" />
                            <span className="text-[10px] font-bold uppercase">{language}</span>
                        </button>
                        <div className="absolute top-full right-0 mt-2 w-48 bg-black/95 border border-[#00f2ff]/30 rounded-xl overflow-hidden opacity-0 invisible group-hover/lang:opacity-100 group-hover/lang:visible transition-all duration-300 z-[100] shadow-[0_10px_30px_rgba(0,242,255,0.2)]">
                            {[
                                { code: 'es', label: 'Español', Flag: ES },
                                { code: 'en', label: 'English', Flag: US },
                                { code: 'ja', label: '日本語', Flag: JP },
                                { code: 'fr', label: 'Français', Flag: FR }
                            ].map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => setLanguage(lang.code)}
                                    className={`w-full px-4 py-3 text-left text-[10px] font-bold uppercase transition-colors hover:bg-[#00f2ff]/20 flex items-center justify-between ${language === lang.code ? 'text-[#00f2ff] bg-[#00f2ff]/10' : 'text-white'}`}
                                >
                                    <span>{lang.label}</span>
                                    <span className="w-6 shadow-sm"><lang.Flag /></span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={toggleTheme}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-zinc-800 border-[#00f2ff]' : 'bg-zinc-100 border-red-500'} border-2 shadow-holo-glow hover:scale-110 active:scale-95 group relative overflow-hidden`}
                        title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                    >
                        <PokeballIcon isDark={theme === 'dark'} />
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </button>

                    <button className="lg:hidden text-[#00f2ff] p-2 hover:bg-[#00f2ff]/10 rounded-xl transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        <i className="hn hn-bars h-8 w-8" />
                    </button>
                </div>
            </div>

            {/* GSAP Side Mobile Menu */}
            <div
                ref={overlayRef}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1001] hidden opacity-0"
                onClick={() => setIsMenuOpen(false)}
            />

            <div
                ref={mobileMenuRef}
                className="fixed top-0 right-0 h-full w-[80vw] max-w-sm bg-black/95 border-l border-[#00f2ff]/30 z-[1002] shadow-2xl opacity-0 translate-x-full overflow-y-auto"
            >
                <div className="p-8">
                    <div className="flex items-center justify-between mb-12">
                        <h2 className="text-[#00f2ff] text-2xl font-black italic tracking-tighter">MENU</h2>
                        <button onClick={() => setIsMenuOpen(false)} className="text-white p-2">
                            <i className="hn hn-times h-8 w-8" />
                        </button>
                    </div>

                    <ul className="space-y-4">
                        {navLinks.map((link) => (
                            <li key={link.path} className="border-b border-white/5 pb-2 mobile-stagger-item opacity-0">
                                <Link
                                    href={link.path}
                                    className="block py-3 text-xl font-bold text-white hover:text-[#00f2ff] transition-colors uppercase italic"
                                    onClick={(e) => handleNav(e, link.path)}
                                >
                                    {link.label}
                                </Link>
                                {link.subItems && (
                                    <ul className="mt-2 space-y-2 pl-4">
                                        {link.subItems.map(sub => (
                                            <li key={sub.path} className="mobile-stagger-item opacity-0">
                                                <Link
                                                    key={sub.path}
                                                    href={sub.path}
                                                    className="block py-2 text-sm text-gray-400 hover:text-[#00f2ff] uppercase"
                                                    onClick={(e) => handleNav(e, sub.path)}
                                                >
                                                    — {sub.label}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>

                    {/* Mobile Language Selector */}
                    <div className="mt-12 pt-8 border-t border-white/10">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-6">Seleccionar Idioma</p>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { code: 'es', label: 'ESP', Flag: ES },
                                { code: 'en', label: 'ENG', Flag: US },
                                { code: 'ja', label: 'JPN', Flag: JP },
                                { code: 'fr', label: 'FRA', Flag: FR }
                            ].map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        setLanguage(lang.code);
                                        setIsMenuOpen(false);
                                    }}
                                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${language === lang.code ? 'bg-[#00f2ff]/20 border-[#00f2ff] text-[#00f2ff]' : 'bg-white/5 border-white/10 text-white'}`}
                                >
                                    <span className="text-[10px] font-black">{lang.label}</span>
                                    <span className="w-5"><lang.Flag /></span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>



        </nav>
    );
};

export default Navbar;
