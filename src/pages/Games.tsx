'use client';
import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { gsap } from 'gsap';
import PuzzleGame from '../components/game/PuzzleGame';
import TriviaGame from '../components/game/trivia/TriviaGame';
import { useLanguage } from '../context/LanguageContext';

const GamesContent = () => {
    const { t } = useLanguage();
    const [selected, setSelected] = useState<'puzzle' | 'trivia' | null>(null); // 'puzzle' | 'trivia' | null
    const searchParams = useSearchParams();

    useEffect(() => {
        const game = searchParams?.get('game');
        if (game === 'puzzle' || game === 'trivia') {
            setSelected(game);
        }
    }, [searchParams]);
    const containerRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(containerRef.current, { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out' });
        });
        return () => ctx.revert();
    }, []);
    return (
        <div ref={containerRef} className="min-h-screen bg-pattern py-24 transition-colors duration-300">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-20">
                    <div className="inline-block px-6 py-2 rounded-xl border-4 border-black bg-pokemon-yellow text-black text-xs uppercase tracking-[0.2em] font-black mb-8 shadow-[4px_4px_0px_0px_black]">
                        Game Systems Online // Pantcookie
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black neon-text-pink mb-6 uppercase italic tracking-tighter">
                        {selected ? (selected === 'puzzle' ? t('games.options.puzzleTitle') : t('games.options.triviaTitle')) : t('games.title')}
                    </h1>
                    <p className="text-xl text-gray-400 dark:text-gray-400 max-w-2xl mx-auto font-medium tracking-wide uppercase text-xs tracking-[0.2em]">
                        {!selected ? t('games.subtitle') : ''}
                    </p>
                </div>

                {!selected && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
                        {/* Puzzle Card */}
                        <div className="poke-card p-10 group relative overflow-hidden">
                            <h2 className="text-3xl font-black mb-6 uppercase tracking-tighter neon-text-pink">{t('games.options.puzzleTitle')}</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-10 font-medium leading-relaxed uppercase text-xs tracking-widest">
                                {t('home.features.gamesDesc')}
                            </p>
                            <button
                                onClick={() => setSelected('puzzle')}
                                className="poke-button-pink w-full"
                            >
                                {t('games.options.playPuzzle')}
                            </button>
                        </div>

                        {/* Trivia Card */}
                        <div className="poke-card p-10 group relative overflow-hidden">
                            <h2 className="text-3xl font-black mb-6 uppercase tracking-tighter neon-text-blue">{t('games.options.triviaTitle')}</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-10 font-medium leading-relaxed uppercase text-xs tracking-widest">
                                {t('games.options.triviaDesc')}
                            </p>
                            <button
                                onClick={() => setSelected('trivia')}
                                className="poke-button-blue w-full"
                            >
                                {t('games.options.playTrivia')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Selected Game */}
                {(selected === 'puzzle' || selected === 'trivia') && (
                    <div className="mt-8 animate-fade-in-up">
                        <div className="relative">
                            {selected === 'puzzle' ? <PuzzleGame /> : <TriviaGame />}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function Games() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-pattern flex items-center justify-center text-white">Loading...</div>}>
            <GamesContent />
        </Suspense>
    );
}
