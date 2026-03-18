'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiImage, FiVideo, FiTarget, FiInfo, FiMenu, FiX, FiSun, FiMoon, FiMessageSquare, FiGlobe, FiSend, FiChevronDown, FiMusic } from 'react-icons/fi';
import { MdCatchingPokemon } from 'react-icons/md';
import { useLanguage } from '../../context/LanguageContext';
import { useTransition } from '../../context/TransitionContext';

const Navbar = () => {
    const { t, setLanguage } = useLanguage();
    const { transitionTo } = useTransition();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        <nav className="holo-float w-full max-w-7xl mx-auto px-4 mt-4 sticky top-4 z-50 font-orbitron">
            <div className="glass-panel scanlines bg-holo-dark dark:bg-black/70 rounded-2xl shadow-holo-glow px-6 py-3 flex items-center justify-between transition-all duration-300">
                
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
                        <h1 className="text-white text-xl font-black tracking-tighter italic drop-shadow-holo-glow leading-none">
                            SHAKE-<span className="text-[#ff00e5]">GANG</span>
                        </h1>
                        <p className="text-[8px] text-[#00f2ff] tracking-[0.3em] uppercase opacity-70">Community Network</p>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <ul className="hidden lg:flex items-center space-x-6 text-[10px] font-bold tracking-widest text-white">
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
                                    className={`nav-link transition-all duration-300 hover:text-[#00f2ff] block py-2 ${actualActive ? 'text-[#00f2ff] border-b-2 border-[#00f2ff]' : 'text-white'}`}
                                    onClick={(e) => handleNav(e, link.path)}
                                >
                                    {link.label.toUpperCase()}
                                </Link>

                                {/* Dropdown Menu */}
                                {hasSubMenu && isDropdownOpen && (
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-black/80 backdrop-blur-xl border border-[#00f2ff]/30 rounded-xl shadow-holo-glow overflow-hidden z-50 animate-fade-in-up">
                                        {link.subItems!.map((sub) => (
                                            <Link
                                                key={sub.path}
                                                href={sub.path}
                                                className="block px-4 py-3 text-[9px] hover:bg-[#00f2ff]/10 text-white hover:text-[#00f2ff] transition-colors border-b border-white/5 last:border-none uppercase"
                                                onClick={(e) => {
                                                    handleNav(e, sub.path);
                                                    setActiveDropdown(null);
                                                }}
                                            >
                                                {sub.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>

                {/* Utilities Section */}
                <div className="flex items-center space-x-6">
                    {/* Language Selector */}
                    <div className="relative group">
                        <button className="flex items-center space-x-2 text-white hover:text-[#00f2ff] transition-colors group">
                            <FiGlobe className="h-4 w-4 text-[#00f2ff] group-hover:animate-pulse" />
                            <span className="text-[10px] hidden sm:block uppercase">{t('nav.language')}</span>
                        </button>
                        <div className="absolute right-0 top-full pt-4 w-32 hidden group-hover:block z-50">
                            <div className="bg-black/90 backdrop-blur-xl border border-[#00f2ff]/30 rounded-xl shadow-holo-glow overflow-hidden">
                                {['en', 'ja', 'fr', 'es'].map((lang) => (
                                    <button
                                        key={lang}
                                        onClick={() => setLanguage(lang)}
                                        className="block w-full text-left px-4 py-2 text-[9px] text-white hover:bg-[#00f2ff]/10 hover:text-[#00f2ff] transition-colors uppercase border-b border-white/5 last:border-none"
                                    >
                                        {lang === 'en' ? 'English' : lang === 'ja' ? '日本語' : lang === 'fr' ? 'Français' : 'Español'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Theme Toggle / Avatar Link */}
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={toggleTheme}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-indigo-900 border-[#00f2ff]' : 'bg-yellow-400 border-[#ff00e5]'} border-2 shadow-holo-glow hover:scale-110 active:scale-95`}
                        >
                            {theme === 'dark' ? <FiMoon className="text-white text-xs" /> : <FiSun className="text-white text-xs" />}
                        </button>

                        <div className="relative group cursor-pointer" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#00f2ff] to-[#ff00e5] rounded-full opacity-70 group-hover:opacity-100 blur transition-opacity duration-300"></div>
                            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/50">
                                <img 
                                    src="https://pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev/Shura%20HiwaLogo%206.png" 
                                    alt="Profile" 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button className="lg:hidden text-[#00f2ff]" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="lg:hidden mt-4 glass-panel bg-black/90 rounded-2xl shadow-holo-glow overflow-hidden animate-fade-in-up">
                    <ul className="flex flex-col p-4 text-[10px] font-bold tracking-widest">
                        {navLinks.map((link) => (
                            <li key={link.path}>
                                <Link
                                    href={link.path}
                                    className="block py-4 px-6 text-white hover:text-[#00f2ff] border-b border-white/5 uppercase"
                                    onClick={(e) => handleNav(e, link.path)}
                                >
                                    {link.label}
                                </Link>
                                {link.subItems && (
                                    <div className="bg-white/5 pl-8">
                                        {link.subItems.map(sub => (
                                            <Link
                                                key={sub.path}
                                                href={sub.path}
                                                className="block py-3 px-6 text-[8px] text-gray-400 hover:text-[#00f2ff] uppercase"
                                                onClick={(e) => handleNav(e, sub.path)}
                                            >
                                                {sub.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Decorative bottom highlight */}
            <div className="w-1/2 h-[1px] mx-auto mt-2 bg-gradient-to-r from-transparent via-[#00f2ff] to-transparent opacity-50 shadow-holo-glow"></div>
        </nav>
    );
};

export default Navbar;
