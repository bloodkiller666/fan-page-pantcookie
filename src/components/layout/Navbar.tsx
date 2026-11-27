'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MdClose, MdDarkMode, MdExpandMore, MdLightMode, MdLock, MdMenu, MdTranslate } from 'react-icons/md';
import { isLockedRoute } from '../../lib/event';
import { useEvent } from '../../lib/useEvent';
import { ES, US, JP, FR } from 'country-flag-icons/react/3x2';
import { useLanguage } from '../../context/LanguageContext';
import { useTransition } from '../../context/TransitionContext';

gsap.registerPlugin(ScrollTrigger);

const LOGO = 'https://pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev/Shura%20HiwaLogo%206.png';

const LANGUAGES = [
    { code: 'es', label: 'Español', Flag: ES },
    { code: 'en', label: 'English', Flag: US },
    { code: 'ja', label: '日本語', Flag: JP },
    { code: 'fr', label: 'Français', Flag: FR },
] as const;

interface NavItem {
    path: string;
    label: string;
    subItems?: { label: string; path: string }[];
}

const Navbar = () => {
    const { t, setLanguage, language } = useLanguage();
    const { transitionTo } = useTransition();
    const pathname = usePathname() || '';
    const { active: eventActive } = useEvent();
    const closed = (path: string) => eventActive && isLockedRoute(path);

    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [menuOpen, setMenuOpen] = useState(false);
    const [openSub, setOpenSub] = useState<string | null>(null);
    const [langOpen, setLangOpen] = useState(false);
    const navRef = useRef<HTMLElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);

    // Page-scroll progress bar along the bottom edge (a single scrubbed transform)
    useEffect(() => {
        if (!progressRef.current) return;
        const mm = gsap.matchMedia();
        mm.add('(prefers-reduced-motion: no-preference)', () => {
            gsap.fromTo(
                progressRef.current,
                { scaleX: 0 },
                { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } }
            );
        });
        return () => mm.revert();
    }, [pathname]);

    // Theme: dark by default, persisted. The inline script in layout.tsx applies it before first paint.
    useEffect(() => {
        setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    }, []);

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        document.documentElement.classList.toggle('dark', next === 'dark');
        localStorage.setItem('theme-mode', next);
    };

    const closeAll = useCallback(() => {
        setMenuOpen(false);
        setOpenSub(null);
        setLangOpen(false);
    }, []);

    // Close popovers on outside click or Escape
    useEffect(() => {
        const onPointer = (e: PointerEvent) => {
            if (navRef.current && !navRef.current.contains(e.target as Node)) {
                setOpenSub(null);
                setLangOpen(false);
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeAll();
        };
        document.addEventListener('pointerdown', onPointer);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('pointerdown', onPointer);
            document.removeEventListener('keydown', onKey);
        };
    }, [closeAll]);

    // Lock page scroll while the mobile sheet is open
    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [menuOpen]);

    const navLinks: NavItem[] = [
        { path: '/', label: t('nav.home') },
        {
            path: '/multimedia',
            label: t('nav.multimedia'),
            subItems: [
                { label: t('nav.multimediaPhotos'), path: '/multimedia?tab=images' },
                { label: t('nav.multimediaVideos'), path: '/multimedia?tab=videos' },
                { label: t('nav.multimediaCovers'), path: '/multimedia?tab=covers' },
            ],
        },
        {
            path: '/games',
            label: t('nav.games'),
            subItems: [
                { label: t('nav.gamesPuzzle'), path: '/games?game=puzzle' },
                { label: t('nav.gamesTrivia'), path: '/games?game=trivia' },
                { label: t('nav.gamesShuraRun'), path: '/games?game=shuraRun' },
            ],
        },
        { path: '/chat', label: t('nav.chat') },
        {
            path: '/mensajes',
            label: t('nav.mensajes'),
            subItems: [
                { label: t('nav.mensajesWrite'), path: '/mensajes?view=write' },
                { label: t('nav.mensajesRead'), path: '/mensajes?view=read' },
            ],
        },
        { path: '/about', label: t('nav.about') },
    ];

    const isActive = (path: string) => (path === '/' ? pathname === '/' : pathname.startsWith(path));

    const go = (e: React.MouseEvent, path: string) => {
        e.preventDefault();
        closeAll();
        transitionTo(path);
    };

    const ActiveLang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

    return (
        <nav
            ref={navRef}
            aria-label="Principal"
            className="fixed top-0 left-0 w-full z-[9999] border-b-[3px] border-[var(--line)] bg-[var(--surface)] text-[var(--text)]"
            style={{ height: 'var(--nav-h)' }}
        >
            <div className="mx-auto flex h-full max-w-[1400px] items-stretch justify-between gap-4 px-4 sm:px-6">
                {/* Logo plate */}
                <Link href="/" onClick={(e) => go(e, '/')} className="group flex items-center gap-3 self-center" aria-label="SHAKE-GANG">
                    <span className="relative block h-11 w-11 shrink-0 overflow-hidden border-[3px] border-[var(--line)] bg-[var(--pink)] shadow-[3px_3px_0_var(--shadow)] transition-transform duration-150 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={LOGO} alt="" className="h-full w-full object-cover" />
                    </span>
                    <span className="hidden leading-none sm:block">
                        <span className="block font-display text-xl font-bold uppercase tracking-tight">
                            Shake<span className="text-[var(--pink)]">-</span>Gang
                        </span>
                        <span className="mt-1 block font-display text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                            Community Network
                        </span>
                    </span>
                </Link>

                {/* Desktop cartridge tabs */}
                <ul className="hidden items-end gap-1 lg:flex">
                    {navLinks.map((link) => {
                        const active = isActive(link.path);
                        const hasSub = !!link.subItems?.length;
                        const open = openSub === link.path;
                        return (
                            <li
                                key={link.path}
                                className="relative flex items-end"
                                onMouseEnter={() => hasSub && setOpenSub(link.path)}
                                onMouseLeave={() => hasSub && setOpenSub((cur) => (cur === link.path ? null : cur))}
                            >
                                <div
                                    className={`flex h-[52px] items-stretch border-[3px] border-b-0 border-[var(--line)] font-display font-bold uppercase tracking-[0.06em] transition-colors ${
                                        active
                                            ? 'bg-[var(--pink)] text-[var(--ink)] h-[56px]'
                                            : 'bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--yellow)] hover:text-[var(--ink)]'
                                    }`}
                                >
                                    <Link
                                        href={link.path}
                                        onClick={(e) => go(e, link.path)}
                                        aria-current={active ? 'page' : undefined}
                                        className="flex items-center px-4 text-[0.82rem]"
                                    >
                                        {link.label}
                                        {closed(link.path) && <MdLock className="ml-2 text-base" aria-label="cerrado" />}
                                    </Link>
                                    {hasSub && (
                                        <button
                                            type="button"
                                            aria-expanded={open}
                                            aria-label={`${link.label}: submenu`}
                                            onClick={() => setOpenSub(open ? null : link.path)}
                                            className="flex items-center pr-2"
                                        >
                                            <MdExpandMore className={`text-xl transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                                        </button>
                                    )}
                                </div>

                                {hasSub && open && (
                                    <div className="absolute left-0 top-full z-10 w-60 border-[3px] border-[var(--line)] bg-[var(--surface)] shadow-[6px_6px_0_var(--shadow)]">
                                        {link.subItems!.map((sub) => (
                                            <Link
                                                key={sub.path}
                                                href={sub.path}
                                                onClick={(e) => go(e, sub.path)}
                                                className="block border-b-2 border-[var(--line)] px-4 py-3 font-display text-sm font-bold uppercase tracking-wide last:border-b-0 hover:bg-[var(--yellow)] hover:text-[var(--ink)]"
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

                {/* Controls */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="relative">
                        <button
                            type="button"
                            aria-haspopup="listbox"
                            aria-expanded={langOpen}
                            onClick={() => setLangOpen((v) => !v)}
                            className="flex h-11 items-center gap-2 border-[3px] border-[var(--line)] bg-[var(--surface-2)] px-3 font-display text-sm font-bold uppercase transition-colors hover:bg-[var(--yellow)] hover:text-[var(--ink)]"
                        >
                            <MdTranslate className="text-lg" aria-hidden />
                            <span className="w-5 overflow-hidden" aria-hidden><ActiveLang.Flag /></span>
                            <span>{language}</span>
                        </button>
                        {langOpen && (
                            <ul
                                role="listbox"
                                aria-label="Idioma"
                                className="absolute right-0 top-full mt-2 w-48 border-[3px] border-[var(--line)] bg-[var(--surface)] shadow-[6px_6px_0_var(--shadow)]"
                            >
                                {LANGUAGES.map(({ code, label, Flag }) => (
                                    <li key={code} role="option" aria-selected={language === code}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setLanguage(code);
                                                setLangOpen(false);
                                            }}
                                            className={`flex w-full items-center justify-between border-b-2 border-[var(--line)] px-4 py-3 text-left font-display text-sm font-bold last:border-b-0 hover:bg-[var(--yellow)] hover:text-[var(--ink)] ${
                                                language === code ? 'bg-[var(--pink)] text-[var(--ink)]' : ''
                                            }`}
                                        >
                                            <span>{label}</span>
                                            <span className="w-6"><Flag /></span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={toggleTheme}
                        aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                        className="flex h-11 w-11 items-center justify-center border-[3px] border-[var(--line)] bg-[var(--cyan)] text-[var(--ink)] shadow-[3px_3px_0_var(--shadow)] transition-transform duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
                    >
                        {theme === 'dark' ? <MdLightMode className="text-2xl" /> : <MdDarkMode className="text-2xl" />}
                    </button>

                    <button
                        type="button"
                        onClick={() => setMenuOpen(true)}
                        aria-label="Menu"
                        aria-expanded={menuOpen}
                        className="flex h-11 w-11 items-center justify-center border-[3px] border-[var(--line)] bg-[var(--pink)] text-[var(--ink)] shadow-[3px_3px_0_var(--shadow)] lg:hidden"
                    >
                        <MdMenu className="text-2xl" />
                    </button>
                </div>
            </div>

            <div ref={progressRef} aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[-3px] h-[5px] origin-left scale-x-0 bg-[var(--cyan)]" />

            {/* Connector pins under the slot bar */}
            <div className="pins pointer-events-none absolute inset-x-0 top-full" aria-hidden />

            {/* Mobile sheet */}
            <div
                className={`fixed inset-0 z-[10000] bg-black/70 transition-opacity duration-200 lg:hidden ${menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                onClick={() => setMenuOpen(false)}
                aria-hidden
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Menu"
                className={`fixed right-0 top-0 z-[10001] flex h-full w-[min(88vw,24rem)] flex-col overflow-y-auto border-l-[3px] border-[var(--line)] bg-[var(--bg)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
                inert={!menuOpen}
            >
                <div className="flex items-center justify-between border-b-[3px] border-[var(--line)] bg-[var(--pink)] px-5 py-4 text-[var(--ink)]">
                    <span className="font-display text-2xl font-bold uppercase">Menu</span>
                    <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close" className="flex h-11 w-11 items-center justify-center border-[3px] border-[var(--ink)] bg-[var(--yellow)]">
                        <MdClose className="text-2xl" />
                    </button>
                </div>

                <ul className="flex-1 px-5 py-6">
                    {navLinks.map((link) => (
                        <li key={link.path} className="mb-4">
                            <Link
                                href={link.path}
                                onClick={(e) => go(e, link.path)}
                                aria-current={isActive(link.path) ? 'page' : undefined}
                                className={`block border-[3px] border-[var(--line)] px-4 py-3 font-display text-xl font-bold uppercase shadow-[4px_4px_0_var(--shadow)] ${
                                    isActive(link.path) ? 'bg-[var(--pink)] text-[var(--ink)]' : 'bg-[var(--surface)]'
                                }`}
                            >
                                <span className="flex items-center justify-between gap-3">
                                    {link.label}
                                    {closed(link.path) && <MdLock className="text-2xl" aria-label="cerrado" />}
                                </span>
                            </Link>
                            {link.subItems && (
                                <ul className="mt-3 flex flex-wrap gap-2">
                                    {link.subItems.map((sub) => (
                                        <li key={sub.path}>
                                            <Link href={sub.path} onClick={(e) => go(e, sub.path)} className="tag !text-[0.8rem] !py-2">
                                                {sub.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>

                <div className="border-t-[3px] border-[var(--line)] px-5 py-5">
                    <div className="grid grid-cols-2 gap-3">
                        {LANGUAGES.map(({ code, label, Flag }) => (
                            <button
                                key={code}
                                type="button"
                                onClick={() => {
                                    setLanguage(code);
                                    setMenuOpen(false);
                                }}
                                aria-pressed={language === code}
                                className={`flex items-center justify-between border-[3px] border-[var(--line)] px-3 py-3 font-display text-sm font-bold ${
                                    language === code ? 'bg-[var(--pink)] text-[var(--ink)]' : 'bg-[var(--surface)]'
                                }`}
                            >
                                <span>{label}</span>
                                <span className="w-5"><Flag /></span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
