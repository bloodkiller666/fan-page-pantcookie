'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { gsap } from 'gsap';
import { MdClose, MdLibraryMusic, MdPhotoLibrary, MdSearch, MdVideoLibrary } from 'react-icons/md';
import { useLanguage } from '../context/LanguageContext';
import { useScrollReveal } from '../hooks/useScrollReveal';
import RevealTitle from '../components/ui/RevealTitle';
import Gallery from '../components/multimedia/Gallery';
import VideoPlayer from '../components/multimedia/VideoPlayer';
import MusicPlayer from '../components/multimedia/MusicPlayer';

type Tab = 'images' | 'videos' | 'covers';

const TABS: { id: Tab; labelKey: string; tone: string; Icon: typeof MdPhotoLibrary }[] = [
    { id: 'images', labelKey: 'multimedia.tabs.photos', tone: 'bg-[var(--pink)]', Icon: MdPhotoLibrary },
    { id: 'videos', labelKey: 'multimedia.tabs.videos', tone: 'bg-[var(--cyan)]', Icon: MdVideoLibrary },
    { id: 'covers', labelKey: 'multimedia.tabs.covers', tone: 'bg-[var(--yellow)]', Icon: MdLibraryMusic },
];

const MultimediaContent = () => {
    const { t, language } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<Tab>('images');
    const [query, setQuery] = useState('');
    const rootRef = useRef<HTMLDivElement>(null);

    // Deep link: /multimedia?tab=videos
    useEffect(() => {
        const tab = searchParams?.get('tab');
        if (tab === 'images' || tab === 'videos' || tab === 'covers') setActiveTab(tab);
    }, [searchParams]);

    const selectTab = (tab: Tab) => {
        setActiveTab(tab);
        setQuery('');
        router.replace(`/multimedia?tab=${tab}`, { scroll: false });
    };

    useEffect(() => {
        const mm = gsap.matchMedia();
        mm.add('(prefers-reduced-motion: no-preference)', () => {
            gsap.from('.media-panel', { opacity: 0, y: 28, duration: 0.55, ease: 'power3.out', clearProps: 'transform,opacity' });
        }, rootRef);
        return () => mm.revert();
    }, [activeTab]);
    useScrollReveal(rootRef, [language]);

    return (
        <div ref={rootRef} className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 sm:py-16">
            <RevealTitle as="h1" className="font-display text-[clamp(2.8rem,8vw,6.5rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em]">
                {t('multimedia.title')}
            </RevealTitle>
            <p data-reveal className="mt-5 max-w-[56ch] text-lg font-medium text-[var(--muted)]">
                {t('multimedia.subtitle')}
            </p>

            {/* Tabs */}
            <div role="tablist" aria-label={t('multimedia.title')} className="mt-10 flex flex-wrap items-end gap-2 border-b-[3px] border-[var(--line)]">
                {TABS.map(({ id, labelKey, tone, Icon }) => {
                    const active = activeTab === id;
                    return (
                        <button
                            key={id}
                            type="button"
                            role="tab"
                            id={`tab-${id}`}
                            aria-selected={active}
                            aria-controls="media-panel"
                            onClick={() => selectTab(id)}
                            className={`flex min-h-[3.25rem] items-center gap-3 border-[3px] border-b-0 border-[var(--line)] px-6 font-display text-base font-bold uppercase tracking-[0.06em] transition-colors ${
                                active ? `${tone} text-[var(--ink)]` : 'bg-[var(--surface-2)] hover:bg-[var(--yellow)] hover:text-[var(--ink)]'
                            }`}
                        >
                            <Icon className="text-2xl" aria-hidden />
                            {t(labelKey)}
                        </button>
                    );
                })}
            </div>

            <div id="media-panel" role="tabpanel" aria-labelledby={`tab-${activeTab}`} className="media-panel pt-10">
                {/* Search (photos and videos) */}
                {activeTab !== 'covers' && (
                    <div className="relative mb-10 max-w-xl">
                        <label htmlFor="media-search" className="sr-only">
                            {t('multimedia.searchPlaceholder')}
                        </label>
                        <MdSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-[var(--muted)]" aria-hidden />
                        <input
                            id="media-search"
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t('multimedia.searchPlaceholder')}
                            className="w-full border-[3px] border-[var(--line)] bg-[var(--surface)] py-3.5 pl-14 pr-14 font-display text-lg font-bold text-[var(--text)] shadow-[5px_5px_0_var(--shadow)] placeholder:font-medium placeholder:text-[var(--muted)] focus:outline-none focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)] [&::-webkit-search-cancel-button]:hidden"
                        />
                        {query && (
                            <button type="button" onClick={() => setQuery('')} aria-label={t('multimedia.clearSearch')} className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center border-[3px] border-transparent hover:border-[var(--line)] hover:bg-[var(--pink)] hover:text-[var(--ink)]">
                                <MdClose className="text-2xl" />
                            </button>
                        )}
                    </div>
                )}

                {activeTab === 'images' && <Gallery query={query} />}
                {activeTab === 'videos' && <VideoPlayer query={query} />}
                {activeTab === 'covers' && <MusicPlayer />}
            </div>
        </div>
    );
};

export default function Multimedia() {
    return (
        <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center font-display text-2xl font-bold uppercase">Loading...</div>}>
            <MultimediaContent />
        </Suspense>
    );
}
