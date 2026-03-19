'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiImage, FiVideo, FiTarget, FiInfo, FiMenu, FiX, FiSun, FiMoon, FiMessageSquare, FiGlobe, FiSend, FiChevronDown, FiMusic } from 'react-icons/fi';
import { MdCatchingPokemon } from 'react-icons/md';
import { useLanguage } from '../../context/LanguageContext';
import { useTransition } from '../../context/TransitionContext';
import gsap from 'gsap';

const Navbar = () => {
    const { t, setLanguage } = useLanguage();
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

    // Mobile Menu Animation with GSAP
    useEffect(() => {
        if (!mobileMenuRef.current || !overlayRef.current) return;

        if (isMenuOpen) {
            // Open animation
            gsap.to(overlayRef.current, { opacity: 1, display: 'block', duration: 0.3 });
            gsap.to(mobileMenuRef.current, { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
        } else {
            // Close animation
            gsap.to(mobileMenuRef.current, { x: '100%', opacity: 0, duration: 0.4, ease: 'power3.in' });
            gsap.to(overlayRef.current, { opacity: 0, display: 'none', duration: 0.3 });
        }
    }, [isMenuOpen]);

    const navLinks = [
        { path: '/', label: t('nav.home'), icon: FiHome },
        {
            path: '/multimedia',
            label: t('nav.multimedia'),
            icon: FiImage,
            subItems: [
                { label: t('nav.multimediaPhotos'), path: '/multimedia?tab=images', icon: FiImage },
                { label: t('nav.multimediaVideos'), path: '/multimedia?tab=videos', icon: FiVideo },
                { label: t('nav.multimediaCovers'), path: '/multimedia?tab=covers', icon: FiMusic },
            ]
        },
        {
            path: '/games',
            label: t('nav.games'),
            icon: FiTarget,
            subItems: [
                { label: t('nav.gamesPuzzle'), path: '/games?game=puzzle', icon: FiTarget },
                { label: t('nav.gamesTrivia'), path: '/games?game=trivia', icon: FiTarget },
                { label: t('nav.gamesShuraRun'), path: '/games?game=shuraRun', icon: MdCatchingPokemon },
            ]
        },
        { path: '/chat', label: t('nav.chat'), icon: FiMessageSquare },
        {
            path: '/mensajes',
            label: t('nav.mensajes'),
            icon: FiSend,
            subItems: [
                { label: t('nav.mensajesWrite'), path: '/mensajes?view=write', icon: FiSend },
                { label: t('nav.mensajesRead'), path: '/mensajes?view=read', icon: FiImage },
            ]
        },
        { path: '/about', label: t('nav.about'), icon: FiInfo },
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
        <nav className="w-full z-50 font-orbitron border-b border-[#00f2ff]/20">
            <div className="glass-panel bg-holo-dark dark:bg-black/80 px-8 py-0 flex items-center justify-between transition-all duration-300 min-h-[70px]">

                {/* Logo Section */}
                <Link
                    href="/"
                    className="flex items-center space-x-3 group"
                    onClick={(e) => handleNav(e, '/')}
                >
                    <div className="relative group/logo">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#00f2ff] to-[#ff00e5] rounded-full opacity-0 group-hover/logo:opacity-50 blur transition-opacity duration-300"></div>
                        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#00f2ff]/30 shadow-holo-glow">
                            <img
                                src="https://pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev/Shura%20HiwaLogo%206.png"
                                alt="Shake-Gang Logo"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <h1 className="text-white text-2xl font-black tracking-tighter italic drop-shadow-holo-glow leading-none">
                            SHAKE-<span className="text-[#ff00e5]">GANG</span>
                        </h1>
                        <p className="text-[10px] text-[#00f2ff] tracking-[0.3em] uppercase opacity-70">Community Network</p>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <ul className="hidden lg:flex items-center space-x-8 text-sm font-bold tracking-widest text-white h-full">
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
                                    className={`nav-link text-sm transition-all duration-300 hover:text-[#00f2ff] flex items-center gap-2 py-4 ${actualActive ? 'text-[#00f2ff] border-b-2 border-[#00f2ff]' : 'text-white border-b-2 border-transparent hover:border-[#00f2ff]/30'}`}
                                    onClick={(e) => handleNav(e, link.path)}
                                >
                                    {link.label.toUpperCase()}
                                    {hasSubMenu && <FiChevronDown className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />}
                                </Link>

                                {/* Dropdown Menu */}
                                {hasSubMenu && isDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-[2px] w-56 z-[100] animate-fade-in-up">
                                        <div className="bg-black/95 backdrop-blur-2xl border border-[#00f2ff]/30 rounded-xl shadow-[0_20px_50px_rgba(0,242,255,0.3)] overflow-hidden">
                                            <div className="flex flex-col">
                                                {link.subItems!.map((sub) => (
                                                    <Link
                                                        key={sub.path}
                                                        href={sub.path}
                                                        className="flex items-center gap-3 px-6 py-4 text-xs hover:bg-[#00f2ff]/10 text-white hover:text-[#00f2ff] transition-all border-b border-white/5 last:border-none uppercase font-bold"
                                                        onClick={(e) => {
                                                            handleNav(e, sub.path);
                                                            setActiveDropdown(null);
                                                        }}
                                                    >
                                                        {sub.icon && <sub.icon className="text-[#00f2ff] text-sm" />}
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
                    <button
                        onClick={toggleTheme}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-indigo-900 border-[#00f2ff]' : 'bg-yellow-400 border-[#ff00e5]'} border-2 shadow-holo-glow hover:scale-110 active:scale-95`}
                    >
                        {theme === 'dark' ? <FiMoon className="text-white text-sm" /> : <FiSun className="text-white text-sm" />}
                    </button>

                    <button className="lg:hidden text-[#00f2ff] p-2 hover:bg-[#00f2ff]/10 rounded-xl transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        <FiMenu className="h-8 w-8" />
                    </button>
                </div>
            </div>

            {/* GSAP Side Mobile Menu */}
            <div
                ref={overlayRef}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] hidden opacity-0"
                onClick={() => setIsMenuOpen(false)}
            />

            <div
                ref={mobileMenuRef}
                className="fixed top-0 right-0 h-full w-[80vw] max-w-sm bg-black/95 border-l border-[#00f2ff]/30 z-[70] shadow-2xl opacity-0 translate-x-full overflow-y-auto"
            >
                <div className="p-8">
                    <div className="flex items-center justify-between mb-12">
                        <h2 className="text-[#00f2ff] text-2xl font-black italic tracking-tighter">MENU</h2>
                        <button onClick={() => setIsMenuOpen(false)} className="text-white p-2">
                            <FiX className="h-8 w-8" />
                        </button>
                    </div>

                    <ul className="space-y-4">
                        {navLinks.map((link) => (
                            <li key={link.path} className="border-b border-white/5 pb-2">
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
                                            <li key={sub.path}>
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
                </div>
            </div>


            {/* Decorative bottom highlight */}
            <div className="w-1/2 h-[1px] mx-auto mt-2 bg-gradient-to-r from-transparent via-[#00f2ff] to-transparent opacity-50 shadow-holo-glow"></div>
        </nav>
    );
};

export default Navbar;
