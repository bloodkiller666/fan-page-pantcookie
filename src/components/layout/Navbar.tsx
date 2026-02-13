'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiImage, FiVideo, FiTarget, FiInfo, FiMenu, FiX, FiSun, FiMoon, FiMessageSquare, FiGlobe, FiSend, FiChevronDown, FiMusic } from 'react-icons/fi';
import { MdCatchingPokemon } from 'react-icons/md';
import { useLanguage } from '../../context/LanguageContext';

const Navbar = () => {
    const { t, setLanguage } = useLanguage();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [expandedMobileMenus, setExpandedMobileMenus] = useState<Record<string, boolean>>({}); // New state for mobile
    const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [theme, setTheme] = useState('dark');
    const pathname = usePathname();

    useEffect(() => {
        // Initial theme load
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
        root.removeAttribute('data-theme');

        if (theme === 'dark') {
            root.classList.add('dark');
        }
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

    const isActive = (path) => activeDropdown === path || pathname === path;

    const handleMouseEnter = (path) => {
        if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
        setActiveDropdown(path);
    };

    const handleMouseLeave = () => {
        dropdownTimeoutRef.current = setTimeout(() => {
            setActiveDropdown(null);
        }, 200);
    };

    const toggleMobileSubmenu = (path) => {
        setExpandedMobileMenus(prev => ({
            ...prev,
            [path]: !prev[path]
        }));
    };

    return (
        <nav className="bg-[var(--poke-bg)] text-[var(--poke-text)] sticky top-0 z-50 backdrop-blur-xl transition-all duration-300 border-b-4 border-black shadow-[0_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="container mx-auto px-6 py-4">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <Link href="/" className="flex items-center group gap-3">
                        <div className="relative">
                            <img
                                src="/Fotos/Shura HiwaLogo 6.png"
                                alt="Shura Hiwa Logo"
                                className="relative h-12 w-auto object-contain transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                            />
                        </div>
                        <span className="text-2xl font-black tracking-tighter italic uppercase neon-text-pink transition-all duration-300 group-hover:tracking-widest group-hover:-skew-x-12">Shake-Gang</span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden lg:flex items-center space-x-8">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            const active = pathname === link.path;
                            const hasSubMenu = link.subItems && link.subItems.length > 0;
                            const isDropdownOpen = activeDropdown === link.path;

                            return (
                                <div
                                    key={link.path}
                                    className="relative group h-full flex items-center"
                                    onMouseEnter={() => hasSubMenu && handleMouseEnter(link.path)}
                                    onMouseLeave={() => hasSubMenu && handleMouseLeave()}
                                >
                                    <Link
                                        href={link.path}
                                        className={`relative transition-all duration-300 flex items-center gap-2 font-black uppercase tracking-widest text-sm hover:text-[#ff00ff] py-2 ${active ? 'neon-text-blue' : 'text-gray-500'}`}
                                    >
                                        <Icon className={`w-4 h-4 ${active ? 'animate-pulse' : ''}`} />
                                        {link.label}
                                        {hasSubMenu && <FiChevronDown className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />}
                                        {active && (
                                            <div className="absolute -bottom-6 left-0 w-full h-[4px] bg-pokemon-blue" />
                                        )}
                                    </Link>

                                    {/* Dropdown Menu */}
                                    {hasSubMenu && isDropdownOpen && (
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-[var(--poke-bg)] rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-4 border-black overflow-hidden animate-fade-in-up z-50 transition-colors">
                                            {link.subItems.map((subItem) => {
                                                const SubIcon = subItem.icon;
                                                return (
                                                    <Link
                                                        key={subItem.label}
                                                        href={subItem.path}
                                                        className="block px-4 py-3 hover:bg-pokemon-pink/10 text-[var(--poke-text)] hover:text-pokemon-pink transition-colors border-b-2 border-black last:border-none flex items-center gap-3 text-xs font-black uppercase tracking-widest"
                                                        onClick={() => setActiveDropdown(null)}
                                                    >
                                                        <SubIcon className="w-3 h-3" />
                                                        {subItem.label}
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Language Selector */}
                        <div className="relative group">
                            <button className="flex items-center px-4 py-2 rounded-xl border-4 border-black bg-white dark:bg-gray-800 shadow-[4px_4px_0px_0px_black] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_black] transition-all font-black uppercase tracking-widest text-xs text-[var(--poke-text)]">
                                <FiGlobe className="mr-2 w-4 h-4 text-pokemon-pink" />
                                {t('nav.language')}
                            </button>
                            <div className="absolute right-0 top-full pt-4 w-40 hidden group-hover:block animate-fade-in-up z-50">
                                <div className="bg-[var(--poke-bg)] rounded-xl shadow-[8px_8px_0px_0px_black] py-2 border-4 border-black">
                                    {['en', 'ja', 'fr', 'es'].map((lang) => (
                                        <button
                                            key={lang}
                                            onClick={() => setLanguage(lang)}
                                            className="block w-full text-left px-5 py-2 hover:bg-pokemon-pink/10 text-[var(--poke-text)] hover:text-pokemon-pink font-black uppercase tracking-tighter text-xs transition-colors border-b-2 border-black last:border-none"
                                        >
                                            {lang === 'en' ? 'English' : lang === 'ja' ? '日本語' : lang === 'fr' ? 'Français' : 'Español'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-3 rounded-xl border-4 border-black bg-white dark:bg-gray-800 text-pokemon-pink shadow-[4px_4px_0px_0px_black] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_black] transition-all flex items-center justify-center active:translate-x-0 active:translate-y-0 active:shadow-none"
                            aria-label="Toggle Theme"
                        >
                            {theme === 'light' ? (
                                <svg className="w-6 h-6" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="45" fill="white" stroke="black" strokeWidth="8" />
                                    <path d="M5 50 a45 45 0 0 1 90 0" fill="#fd219f" stroke="black" strokeWidth="8" />
                                    <line x1="5" y1="50" x2="95" y2="50" stroke="black" strokeWidth="8" />
                                    <circle cx="50" cy="50" r="15" fill="white" stroke="black" strokeWidth="8" />
                                    <circle cx="50" cy="50" r="6" fill="white" stroke="black" strokeWidth="2" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" viewBox="0 0 100 100">
                                    <path d="M50 5 a45 45 0 0 1 45 45" fill="#3b4cca" stroke="black" strokeWidth="8" />
                                    <path d="M50 5 a45 45 0 0 0 -45 45" fill="#3b4cca" stroke="black" strokeWidth="8" />
                                    <path d="M5 50 a45 45 0 0 0 90 0" fill="white" stroke="black" strokeWidth="8" />
                                    <line x1="5" y1="50" x2="40" y2="50" stroke="black" strokeWidth="8" />
                                    <line x1="60" y1="50" x2="95" y2="50" stroke="black" strokeWidth="8" />
                                    <circle cx="50" cy="50" r="15" fill="white" stroke="black" strokeWidth="8" />
                                    <path d="M35 50 a15 15 0 0 1 30 0" fill="none" stroke="black" strokeWidth="4" />
                                    <circle cx="50" cy="50" r="6" fill="white" stroke="black" strokeWidth="2" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center gap-4 lg:hidden">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full border border-black text-black dark:text-white"
                        >
                            {theme === 'light' ? (
                                <svg className="w-6 h-6" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="45" fill="white" stroke="black" strokeWidth="8" />
                                    <path d="M5 50 a45 45 0 0 1 90 0" fill="#fd219f" stroke="black" strokeWidth="8" />
                                    <line x1="5" y1="50" x2="95" y2="50" stroke="black" strokeWidth="8" />
                                    <circle cx="50" cy="50" r="15" fill="white" stroke="black" strokeWidth="8" />
                                    <circle cx="50" cy="50" r="6" fill="white" stroke="black" strokeWidth="2" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" viewBox="0 0 100 100">
                                    <path d="M50 5 a45 45 0 0 1 45 45" fill="#3b4cca" stroke="black" strokeWidth="8" />
                                    <path d="M50 5 a45 45 0 0 0 -45 45" fill="#3b4cca" stroke="black" strokeWidth="8" />
                                    <path d="M5 50 a45 45 0 0 0 90 0" fill="white" stroke="black" strokeWidth="8" />
                                    <line x1="5" y1="50" x2="40" y2="50" stroke="black" strokeWidth="8" />
                                    <line x1="60" y1="50" x2="95" y2="50" stroke="black" strokeWidth="8" />
                                    <circle cx="50" cy="50" r="15" fill="white" stroke="black" strokeWidth="8" />
                                    <path d="M35 50 a15 15 0 0 1 30 0" fill="none" stroke="black" strokeWidth="4" />
                                    <circle cx="50" cy="50" r="6" fill="white" stroke="black" strokeWidth="2" />
                                </svg>
                            )}
                        </button>
                        <button
                            className="p-2 rounded-lg border border-[#ff00ff]/40 text-[#ff00ff]"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="lg:hidden mt-4 pb-6 bg-white/95 dark:bg-black/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-[#ff00ff]/20 animate-fade-in-up">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            // Only allow toggling if it has subitems
                            const handleMobileClick = (e) => {
                                if (link.subItems) {
                                    e.preventDefault(); // Prevent navigation on parent click
                                    toggleMobileSubmenu(link.path);
                                } else {
                                    setIsMenuOpen(false); // Close menu for regular links
                                }
                            };

                            const isExpanded = expandedMobileMenus[link.path];

                            return (
                                <div key={link.path}>
                                    <Link
                                        href={link.path}
                                        className="py-4 px-8 border-b border-gray-100 dark:border-white/5 last:border-none flex items-center justify-between font-black uppercase tracking-widest text-sm transition-all text-gray-600 dark:text-gray-400 hover:text-[#ff00ff]"
                                        onClick={handleMobileClick}
                                    >
                                        <div className="flex items-center gap-4">
                                            <Icon className="w-5 h-5" />
                                            {link.label}
                                        </div>
                                        {/* Show chevron if subitems exist */}
                                        {link.subItems && (
                                            <FiChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        )}
                                    </Link>

                                    {/* Mobile Submenu Items: Only show if expanded */}
                                    {link.subItems && isExpanded && (
                                        <div className="bg-black/5 dark:bg-white/5 pl-12 animate-fade-in-down">
                                            {link.subItems.map(subItem => (
                                                <Link
                                                    key={subItem.label}
                                                    href={subItem.path}
                                                    className="block py-3 px-4 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-[#ff00ff]"
                                                    onClick={() => setIsMenuOpen(false)}
                                                >
                                                    - {subItem.label}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
