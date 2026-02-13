'use client';
import { useEffect, useRef, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
import { useLanguage } from '../context/LanguageContext';
import Gallery from '../components/multimedia/Gallery';
import VideoPlayer from '../components/multimedia/VideoPlayer';
import MusicPlayer from '../components/multimedia/MusicPlayer';

const MultimediaContent = () => {
    const [activeTab, setActiveTab] = useState<string>('images');
    const { t } = useLanguage();
    const searchParams = useSearchParams();

    useEffect(() => {
        const tab = searchParams?.get('tab');
        if (typeof tab === 'string' && (tab === 'images' || tab === 'videos' || tab === 'covers')) {
            setActiveTab(tab);
        }
    }, [searchParams]);
    const [query, setQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const tabsRef = useRef<HTMLDivElement>(null);

    // Terms for autocomplete (Simplified list based on known content)
    const searchableTerms = useMemo(() => [
        'Robert', 'Roberto', 'Salmonsito', 'Chura', 'Arte', 'Pandilla', 'Stream', 'Vlog',
        'Drawing', 'Gaming', 'Cover', 'Canción', 'Video', 'Foto', 'Fan Art'
    ], []);

    const suggestions = useMemo(() => {
        if (!query || query.length < 2) return [];
        return searchableTerms.filter(term =>
            term.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
    }, [query, searchableTerms]);

    useEffect(() => {
        const handleClickOutside = () => setShowSuggestions(false);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Initial Container Fade In
            gsap.from(containerRef.current, { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out' });

            // Parallax Header
            gsap.to(headerRef.current, {
                yPercent: 50,
                ease: 'none',
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true
                }
            });

            // Search Bar Scale/Fade In
            gsap.from(searchRef.current, {
                scale: 0.8,
                opacity: 0,
                duration: 0.8,
                delay: 0.3,
                ease: 'back.out(1.7)'
            });

            // Tabs Slide Up
            gsap.from(tabsRef.current, {
                y: 50,
                opacity: 0,
                duration: 0.8,
                delay: 0.5,
                ease: 'power3.out'
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="min-h-screen bg-pattern py-20 transition-colors duration-300">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div ref={headerRef} className="mb-12 flex flex-col items-center text-center">
                    <h1 className="text-6xl md:text-8xl font-black mb-6 text-[#ff00ff] drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(255,0,255,0.8)] tracking-tighter uppercase italic">
                        {t('multimedia.title')}
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mb-10 font-medium tracking-wide">
                        {t('multimedia.subtitle')}
                    </p>

                    {/* Centered Search with Autocomplete */}
                    <div ref={searchRef} className="w-full max-w-xl relative group">
                        <div className="relative p-[1px] bg-gradient-to-r from-transparent via-[#ff00ff]/50 dark:via-[#ff00ff] to-transparent rounded-2xl shadow-sm dark:shadow-lg">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                placeholder={t('multimedia.searchPlaceholder')}
                                className="w-full px-6 py-4 rounded-2xl border border-gray-100 dark:border-none bg-white dark:bg-black/80 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#ff00ff]/20 dark:focus:ring-0 outline-none transition-all duration-300"
                            />
                            {query && (
                                <button
                                    onClick={() => setQuery('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#ff00ff] transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Suggestions Dropdown */}
                        {showSuggestions && query.length > 1 && suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-black/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#ff00ff]/30 z-50 overflow-hidden animate-fade-in-up">
                                {suggestions.map((suggestion, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            setQuery(suggestion);
                                            setShowSuggestions(false);
                                        }}
                                        className="w-full text-left px-6 py-3 hover:bg-[#ff00ff]/10 dark:hover:bg-[#ff00ff]/20 text-gray-700 dark:text-gray-300 hover:text-[#ff00ff] transition-colors border-b border-gray-100 dark:border-white/5 last:border-none flex items-center gap-3"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div ref={tabsRef} className="flex justify-center mb-16">
                    <div className="flex gap-4 md:gap-8 flex-wrap justify-center">
                        <button
                            onClick={() => setActiveTab('images')}
                            className={`px-10 py-4 font-bold uppercase tracking-widest transition-all duration-300 rounded-xl relative overflow-hidden border-2 ${activeTab === 'images'
                                ? 'bg-[#ff00ff] text-white shadow-lg shadow-pink-500/30 dark:shadow-[0_0_20px_rgba(255,0,255,0.4)] border-transparent'
                                : 'bg-white dark:bg-black/40 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-[#ff00ff]/30 hover:border-[#ff00ff] hover:text-[#ff00ff]'
                                }`}
                        >
                            {t('multimedia.tabs.photos')}
                        </button>
                        <button
                            onClick={() => setActiveTab('videos')}
                            className={`px-10 py-4 font-bold uppercase tracking-widest transition-all duration-300 rounded-xl relative overflow-hidden border-2 ${activeTab === 'videos'
                                ? 'bg-[#00ffff] text-black shadow-lg shadow-cyan-500/30 dark:shadow-[0_0_20px_rgba(0,255,255,0.4)] border-transparent'
                                : 'bg-white dark:bg-black/40 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-[#00ffff]/30 hover:border-[#00ffff] hover:text-[#00ffff]'
                                }`}
                        >
                            {t('multimedia.tabs.videos')}
                        </button>
                        <button
                            onClick={() => setActiveTab('covers')}
                            className={`px-10 py-4 font-bold uppercase tracking-widest transition-all duration-300 rounded-xl relative overflow-hidden border-2 ${activeTab === 'covers'
                                ? 'bg-[#bc13fe] text-white shadow-lg shadow-purple-500/30 dark:shadow-[0_0_20px_rgba(188,19,254,0.4)] border-transparent'
                                : 'bg-white dark:bg-black/40 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-[#bc13fe]/30 hover:border-[#bc13fe] hover:text-[#bc13fe]'
                                }`}
                        >
                            {t('multimedia.tabs.covers')}
                        </button>
                    </div>
                </div>

                {/* Content - Removed problematic transition to fix flicker */}
                <div className="relative">
                    {activeTab === 'images' && <Gallery query={query} />}
                    {activeTab === 'videos' && <VideoPlayer query={query} />}
                    {activeTab === 'covers' && <MusicPlayer />}
                </div>
            </div>
        </div>
    );
};

export default function Multimedia() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-pattern flex items-center justify-center text-white">Loading...</div>}>
            <MultimediaContent />
        </Suspense>
    );
}
