'use client';
import { MdArrowBack, MdLeaderboard, MdRefresh, MdWhatshot } from 'react-icons/md';
import { useLanguage } from '../../../context/LanguageContext';
import Leaderboard from '../Leaderboard';
import type { Category, GameMode } from './types';

/** Leaderboard filter key: music scores are stored per mode ("music:insane"). */
export const leaderboardKey = (category: Category | null, mode: GameMode | null) =>
    category === 'music' && mode ? `${category}:${mode}` : (category ?? 'pantcake');

interface SessionStatsProps {
    correct: number;
    incorrect: number;
    streak: number;
}

export function SessionStats({ correct, incorrect, streak }: SessionStatsProps) {
    const { t } = useLanguage();
    const total = correct + incorrect;
    const precision = total === 0 ? 0 : Math.round((correct / total) * 100);

    return (
        <div className="cart-shell">
            <div className="cart">
                <div className="cart__face p-5">
                    <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.14em]">
                        <MdLeaderboard className="text-xl text-[var(--pink)]" aria-hidden />
                        {t('games.trivia.yourStats')}
                    </h3>
                    <dl className="space-y-3 font-display text-base font-bold uppercase">
                        <div className="flex items-center justify-between">
                            <dt className="text-[var(--muted)]">{t('games.trivia.streak')}</dt>
                            <dd className="score flex items-center gap-2 text-xs">
                                {streak} <MdWhatshot className={streak > 0 ? 'text-lg text-[var(--pink)]' : 'text-lg opacity-30'} aria-hidden />
                            </dd>
                        </div>
                        <div className="flex items-center justify-between">
                            <dt className="text-[var(--muted)]">{t('games.trivia.correctLabel')}</dt>
                            <dd className="score text-xs">{correct}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                            <dt className="text-[var(--muted)]">{t('games.trivia.wrongLabel')}</dt>
                            <dd className="score text-xs">{incorrect}</dd>
                        </div>
                        <div className="flex items-center justify-between border-t-[3px] border-[var(--line)] pt-3">
                            <dt className="text-[var(--muted)]">{t('games.trivia.accuracy')}</dt>
                            <dd className="score text-xs">{precision}%</dd>
                        </div>
                    </dl>
                    <div className="hud-bar hud-bar--cyan mt-4" style={{ ['--v' as string]: precision }} role="progressbar" aria-valuenow={precision} aria-valuemin={0} aria-valuemax={100} />
                </div>
            </div>
        </div>
    );
}

interface GameOverProps {
    score: number;
    maxStreak: number;
    correct: number;
    incorrect: number;
    category: Category | null;
    mode: GameMode | null;
    playerName: string;
    updateMessage: string | null;
    onPlayAgain: () => void;
    onBack: () => void;
}

export function GameOverScreen({ score, maxStreak, correct, incorrect, category, mode, playerName, updateMessage, onPlayAgain, onBack }: GameOverProps) {
    const { t } = useLanguage();

    return (
        <section className="mx-auto flex w-full max-w-4xl flex-col gap-10 py-6">
            <h1 className="pop-in text-center font-display text-[clamp(2.6rem,8vw,6rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em]">{t('games.trivia.gameOverTitle')}</h1>

            <div className="grid gap-6 sm:grid-cols-2">
                <div className="cart-shell">
                    <div className="cart cart--pink">
                        <div className="cart__face p-6">
                            <p className="font-display text-sm font-bold uppercase tracking-[0.14em]">{t('common.score')}</p>
                            <p className="score mt-3 text-3xl">{score}</p>
                        </div>
                    </div>
                </div>
                <div className="cart-shell">
                    <div className="cart cart--cyan">
                        <div className="cart__face p-6">
                            <p className="font-display text-sm font-bold uppercase tracking-[0.14em]">{t('games.trivia.bestStreak')}</p>
                            <p className="score mt-3 text-3xl">{maxStreak}</p>
                        </div>
                    </div>
                </div>
            </div>

            {updateMessage && <p className="tag tag--pink mx-auto">{updateMessage}</p>}

            <div className="grid items-start gap-8 lg:grid-cols-[1fr_16rem]">
                <div>
                    <h2 className="mb-4 font-display text-2xl font-bold uppercase">{t('games.trivia.standings')}</h2>
                    <Leaderboard game="trivia" category={leaderboardKey(category, mode)} mode={mode ?? undefined} currentPlayer={playerName} className="w-full" />
                </div>
                <SessionStats correct={correct} incorrect={incorrect} streak={0} />
            </div>

            <div className="flex flex-wrap justify-center gap-4">
                <button type="button" onClick={onPlayAgain} className="btn !px-8 !py-4 !text-lg">
                    <MdRefresh className="text-2xl" aria-hidden />
                    {t('games.trivia.playAgain')}
                </button>
                <button type="button" onClick={onBack} className="btn btn--ghost">
                    <MdArrowBack className="text-2xl" aria-hidden />
                    {t('games.trivia.categories')}
                </button>
            </div>
        </section>
    );
}
