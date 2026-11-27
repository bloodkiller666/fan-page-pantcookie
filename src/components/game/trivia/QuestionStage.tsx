'use client';
import { useEffect, useRef } from 'react';
import { MdArrowForward, MdCheck, MdClose, MdInfo, MdMusicNote, MdPauseCircle, MdPlayCircle, MdPriorityHigh, MdSend } from 'react-icons/md';
import { useLanguage } from '../../../context/LanguageContext';
import ScoreIndicator from './ScoreIndicator';
import type { Category, GameMode, TriviaQuestion } from './types';

interface QuestionStageProps {
    mode: GameMode;
    category: Category;
    question: TriviaQuestion;
    index: number;
    total: number;
    score: number;
    scoreChange: number | null;
    onScoreChangeDone: () => void;
    /** Seconds left (per question, per song, or whole run in chaos). */
    remaining: number;
    /** Seconds the bar counts down from; 0 hides the bar. */
    timeTotal: number;
    answered: boolean;
    selected: number[];
    correctIndexes: number[];
    isMultiple: boolean;
    showCorrect: boolean;
    streak: number;
    chaos: { correct: number; incorrect: number };
    audio?: { isPlaying: boolean; hasPlayed: boolean; onPlay: () => void };
    onOption: (index: number) => void;
    onSubmit: () => void;
    onNext: () => void;
    onPause: () => void;
}

const formatClock = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

export default function QuestionStage(props: QuestionStageProps) {
    const { mode, category, question, index, total, score, scoreChange, onScoreChangeDone, remaining, timeTotal, answered, selected, correctIndexes, isMultiple, showCorrect, streak, chaos, audio, onOption, onSubmit, onNext, onPause } = props;
    const { t } = useLanguage();
    const isMusic = category === 'music';
    const timedOut = answered && selected.length === 0;
    const last = index + 1 >= total;
    const pct = timeTotal > 0 ? Math.max(0, Math.min(100, (remaining / timeTotal) * 100)) : 0;
    // Some locale strings carry their own play glyph; the button already has an icon
    const audioLabel = String(
        audio?.isPlaying ? t('games.trivia.audioPlaying') : mode === 'insane' && audio?.hasPlayed ? t('games.trivia.audioUsed') : mode === 'insane' ? t('games.trivia.playTrack') : t('games.trivia.playSong')
    ).replace(/^[▶►s]+/, '');
    const urgent = timeTotal > 0 && mode !== 'chaos' && remaining <= 5;

    // Keyboard: A-D / 1-4 pick an option, Enter goes next once answered
    const handlers = useRef({ onOption, onNext, answered, count: question.options.length });
    handlers.current = { onOption, onNext, answered, count: question.options.length };
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            const target = e.target as HTMLElement | null;
            if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
            const h = handlers.current;
            if (e.key === 'Enter' && h.answered && !target?.closest('button')) {
                e.preventDefault();
                h.onNext();
                return;
            }
            const map = e.key.length === 1 ? 'abcd1234'.indexOf(e.key.toLowerCase()) : -1;
            if (map >= 0 && !h.answered) {
                const i = map % 4;
                if (i < h.count) h.onOption(i);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    return (
        <div className="flex flex-col gap-8">
            {/* HUD */}
            <div className="cart-shell">
                <div className="cart">
                    <div className="cart__face p-5">
                        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
                            <div className="flex items-center gap-6">
                                <div>
                                    <p className="font-display text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">{t('games.trivia.question')}</p>
                                    <p className="score mt-2 text-lg">
                                        {String(index + 1).padStart(2, '0')}
                                        <span className="text-[var(--muted)]">/{total}</span>
                                    </p>
                                </div>
                                <div className="relative">
                                    <p className="font-display text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">{t('games.trivia.pointsLabel')}</p>
                                    <p className="score mt-2 text-lg text-[var(--pink)]">{score}</p>
                                    {scoreChange !== null && <ScoreIndicator points={scoreChange} onComplete={onScoreChangeDone} />}
                                </div>
                                {mode === 'chaos' && (
                                    <div className="hidden gap-4 sm:flex">
                                        <p className="score flex items-center gap-1 text-xs text-[var(--blue)] dark:text-[var(--cyan)]"><MdCheck aria-label={t('games.trivia.chaosCorrect')} />{chaos.correct}</p>
                                        <p className="score flex items-center gap-1 text-xs text-[var(--pink)]"><MdClose aria-label={t('games.trivia.chaosIncorrect')} />{chaos.incorrect}</p>
                                    </div>
                                )}
                                {streak > 1 && (
                                    <p className="tag tag--pink pop-in" key={streak}>
                                        {t('games.trivia.streak')} x{streak}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                {timeTotal > 0 && (
                                    <p className={`score text-lg ${urgent ? 'animate-pulse text-[var(--pink)]' : ''}`} role="timer" aria-live="off">
                                        {mode === 'chaos' ? formatClock(remaining) : `${remaining}s`}
                                    </p>
                                )}
                                <button type="button" onClick={onPause} className="btn btn--ghost !min-h-11 !px-4 !py-2 !text-sm">
                                    <MdPauseCircle className="text-xl" aria-hidden />
                                    <span className="hidden sm:inline">{t('games.puzzle.pause')}</span>
                                </button>
                            </div>
                        </div>

                        {/* Time bar for timed modes; progress bar otherwise */}
                        <div className="mt-5">
                            {timeTotal > 0 ? (
                                <div className={`hud-bar ${urgent ? '' : 'hud-bar--yellow'}`} style={{ ['--v' as string]: pct }} />
                            ) : (
                                <div className="hud-bar hud-bar--cyan" style={{ ['--v' as string]: (index / total) * 100 }} />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Question */}
            <div className="cart-shell">
                <div className="cart">
                    <div className="cart__face flex flex-col items-center gap-6 px-5 py-10 text-center sm:px-10 sm:py-14">
                        {question.image && (
                            <div className="bezel w-full max-w-sm">
                                <div className="bezel__screen aspect-video bg-black">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={question.image} alt="" className="h-full w-full object-cover" />
                                </div>
                            </div>
                        )}

                        {isMusic && audio && (
                            <button
                                type="button"
                                onClick={audio.onPlay}
                                disabled={(mode === 'insane' && audio.hasPlayed) || audio.isPlaying || answered}
                                className="btn btn--cyan !px-8 !py-4"
                            >
                                {audio.isPlaying ? <MdMusicNote className="animate-pulse text-3xl" aria-hidden /> : <MdPlayCircle className="text-3xl" aria-hidden />}
                                {audioLabel}
                            </button>
                        )}

                        {mode === 'insane' && (
                            <ul className="flex flex-wrap justify-center gap-2" aria-hidden>
                                <li className="tag tag--cyan">{t('games.trivia.insaneRight')} +10</li>
                                <li className="tag tag--pink">{t('games.trivia.insaneWrong')} -5</li>
                                <li className="tag">{t('games.trivia.insaneListen')} -3</li>
                            </ul>
                        )}

                        <h2 className="max-w-3xl font-display text-[clamp(1.5rem,3.4vw,2.6rem)] font-bold leading-[1.1]">
                            {isMusic ? <>&ldquo;{question.question}&rdquo;</> : question.question}
                        </h2>

                        {question.hint && (
                            <p className="tag flex items-center gap-2 !normal-case">
                                <MdInfo aria-hidden />
                                {t('games.trivia.hint')}: {question.hint}
                            </p>
                        )}

                        {isMultiple && !answered && (
                            <p className="tag tag--blue animate-pulse">
                                <MdPriorityHigh aria-hidden />
                                {t('games.trivia.pickMany')}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Options */}
            <ul className="grid gap-6 md:grid-cols-2">
                {question.options.map((option, i) => {
                    const isSelected = selected.includes(i);
                    const isCorrect = correctIndexes.includes(i);
                    const state = answered ? (isCorrect ? 'correct' : isSelected ? 'wrong' : 'dim') : isSelected ? 'picked' : 'idle';

                    const face =
                        state === 'correct' ? 'bg-[var(--cyan)] text-[var(--ink)]' : state === 'wrong' ? 'bg-[var(--pink)] text-[var(--ink)]' : state === 'picked' ? 'bg-[var(--yellow)] text-[var(--ink)]' : 'bg-[var(--surface)]';

                    return (
                        <li key={i}>
                            <button
                                type="button"
                                disabled={answered}
                                aria-pressed={isSelected}
                                onClick={() => onOption(i)}
                                className={`group flex min-h-[4.5rem] w-full items-stretch border-[3px] border-[var(--line)] text-left shadow-[5px_5px_0_var(--shadow)] transition-[transform,box-shadow] duration-150 ${
                                    answered ? (state === 'dim' ? 'opacity-45' : '') : 'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_var(--shadow)] active:translate-x-1 active:translate-y-1 active:shadow-none'
                                } ${face}`}
                            >
                                <span className="score flex w-14 shrink-0 items-center justify-center border-r-[3px] border-[var(--line)] text-xs">
                                    {state === 'correct' ? <MdCheck className="text-2xl" aria-label="correct" /> : state === 'wrong' ? <MdClose className="text-2xl" aria-label="wrong" /> : String.fromCharCode(65 + i)}
                                </span>
                                <span className="flex flex-1 items-center px-4 py-3 font-display text-lg font-bold leading-tight">{option}</span>
                            </button>
                        </li>
                    );
                })}
            </ul>

            {showCorrect && (
                <div role="status" className="border-[3px] border-[var(--line)] bg-[var(--surface-2)] p-5 shadow-[5px_5px_0_var(--shadow)]">
                    <p className="font-display text-xl font-bold uppercase">{timedOut ? t('games.trivia.timeUp') : t('games.trivia.incorrect')}</p>
                    <p className="mt-1 text-base font-medium">
                        {t('games.trivia.correctAnswerIs')}:{' '}
                        <span className="font-bold">{correctIndexes.map((i) => question.options[i] || '').filter(Boolean).join(', ')}</span>
                    </p>
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4">
                {isMultiple && !answered ? (
                    <button type="button" onClick={onSubmit} disabled={selected.length === 0} className="btn btn--blue">
                        <MdSend className="text-xl" aria-hidden />
                        {t('games.trivia.submitAnswer')}
                    </button>
                ) : (
                    <span />
                )}
                <button type="button" onClick={onNext} disabled={!answered} className="btn btn--yellow !px-8 !py-4 ml-auto">
                    {last ? t('games.trivia.finish') : t('common.next')}
                    <MdArrowForward className="text-2xl" aria-hidden />
                </button>
            </div>
        </div>
    );
}
