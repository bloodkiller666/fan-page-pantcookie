'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { MdArrowBack, MdArrowForward, MdCheck, MdLogout, MdRefresh } from 'react-icons/md';
import GameDialog from '../GameDialog';
import ConfirmDialog from '../ConfirmDialog';
import { Countdown } from '../trivia/Pickers';
import { useGameSounds } from '../../../hooks/useGameSounds';
import { speak, stopVoice } from '../../../lib/eventVoice';
import script from '../../../data/eventScript.json';
import ExamSheet from './ExamSheet';
import type { ExamAnswers, ExamResult, ExamStart } from './types';

type Phase = 'intro' | 'rules' | 'loading' | 'countdown' | 'question' | 'grading' | 'sheet' | 'error';

const LOGO = 'https://pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev/Shura%20HiwaLogo%206.png';
const LAST_KEY = 'examen_ultimo';
const KEYS = 'abcd1234';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** POST with a few retries: a hiccup during the live event should never lose the attempt. */
async function postJson<T>(url: string, body: unknown, tries = 3): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < tries; attempt++) {
        try {
            const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}), cache: 'no-store' });
            if (res.ok) return (await res.json()) as T;
            // Client errors will not improve by retrying
            if (res.status >= 400 && res.status < 500 && res.status !== 429) throw new Error(`http_${res.status}`);
            lastError = new Error(`http_${res.status}`);
        } catch (error) {
            lastError = error;
            if (error instanceof Error && error.message.startsWith('http_4')) throw error;
        }
        await wait(500 * 2 ** attempt);
    }
    throw lastError ?? new Error('network');
}

export default function ExamGame({ onExit }: { onExit: () => void }) {
    const sounds = useGameSounds();
    const soundsRef = useRef(sounds);
    soundsRef.current = sounds;

    const [phase, setPhase] = useState<Phase>('intro');
    const [exam, setExam] = useState<ExamStart | null>(null);
    const [index, setIndex] = useState(0);
    const [selected, setSelected] = useState<string[]>([]);
    const [locked, setLocked] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(15);
    const [count, setCount] = useState(3);
    const [result, setResult] = useState<ExamResult | null>(null);
    const [showExit, setShowExit] = useState(false);
    const [last, setLast] = useState<{ correct: number; total: number } | null>(null);
    const [errorKind, setErrorKind] = useState<'load' | 'grade'>('load');

    const answersRef = useRef<ExamAnswers>({});
    const selectedRef = useRef<string[]>([]);
    const lockedRef = useRef(false);
    const startPromise = useRef<Promise<ExamStart> | null>(null);
    const subRef = useRef<HTMLSpanElement>(null);
    const barRef = useRef<HTMLDivElement>(null);
    const typeRef = useRef<gsap.core.Tween | null>(null);
    const runRef = useRef(0);

    const question = exam?.questions[index];
    const total = exam?.questions.length ?? 0;

    // ---- Loading the exam -------------------------------------------------------------
    const fetchExam = useCallback(() => {
        const p = postJson<ExamStart>('/api/exam/start', {}, 3);
        startPromise.current = p;
        p.catch(() => {});
        return p;
    }, []);

    useEffect(() => {
        fetchExam();
        try {
            const raw = localStorage.getItem(LAST_KEY);
            if (raw) setLast(JSON.parse(raw));
        } catch {
            /* no previous attempt */
        }
        return () => {
            runRef.current++;
            stopVoice();
        };
    }, [fetchExam]);

    // ---- Intro voice + typed subtitle -------------------------------------------------
    const typeText = useCallback((text: string, ms: number) => {
        typeRef.current?.kill();
        const el = subRef.current;
        if (!el) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            el.textContent = text;
            return;
        }
        const proxy = { n: 0 };
        el.textContent = '';
        typeRef.current = gsap.to(proxy, {
            n: text.length,
            duration: Math.max(0.8, (ms * 0.85) / 1000),
            ease: 'none',
            onUpdate: () => {
                el.textContent = text.slice(0, Math.round(proxy.n));
            },
        });
    }, []);

    useEffect(() => {
        if (phase !== 'intro') return;
        const run = ++runRef.current;
        const line = script.lines.examIntro;
        const handle = speak('examIntro', line.text, (ms) => typeText(line.text, ms));
        handle.done.then(() => {
            if (runRef.current === run) setPhase((p) => (p === 'intro' ? 'rules' : p));
        });
        return () => handle.stop();
    }, [phase, typeText]);

    // Rules dialog: its voice line plays when it opens
    useEffect(() => {
        if (phase !== 'rules') return;
        const handle = speak('examRules', script.lines.examRules.text);
        return () => handle.stop();
    }, [phase]);

    // ---- Starting an attempt ----------------------------------------------------------
    const begin = useCallback(async () => {
        stopVoice();
        setPhase('loading');
        try {
            const data = await (startPromise.current ?? fetchExam());
            answersRef.current = {};
            selectedRef.current = [];
            setExam(data);
            setIndex(0);
            setSelected([]);
            setResult(null);
            setSecondsLeft(data.secondsPerQuestion);
            setCount(3);
            setPhase('countdown');
        } catch {
            setErrorKind('load');
            setPhase('error');
        }
    }, [fetchExam]);

    const replay = useCallback(() => {
        startPromise.current = null;
        fetchExam();
        begin();
    }, [begin, fetchExam]);

    // Countdown 3-2-1-GO
    useEffect(() => {
        if (phase !== 'countdown') return;
        soundsRef.current.playCountdown(count);
        const timer = setTimeout(() => {
            if (count <= 0) setPhase('question');
            else setCount((c) => c - 1);
        }, count === 0 ? 700 : 1000);
        return () => clearTimeout(timer);
    }, [phase, count]);

    // ---- Grading ----------------------------------------------------------------------
    const grade = useCallback(async () => {
        if (!exam) return;
        setPhase('grading');
        try {
            const data = await postJson<ExamResult>('/api/exam/grade', { token: exam.token, answers: answersRef.current }, 4);
            try {
                localStorage.setItem(LAST_KEY, JSON.stringify({ correct: data.correctCount, total: data.total, at: Date.now() }));
            } catch {
                /* the last-attempt note is optional */
            }
            setResult(data);
            setPhase('sheet');
        } catch {
            setErrorKind('grade');
            setPhase('error');
        }
    }, [exam]);

    // ---- Answering --------------------------------------------------------------------
    const commit = useCallback(() => {
        if (!exam || lockedRef.current) return;
        lockedRef.current = true;
        setLocked(true);
        const q = exam.questions[index];
        answersRef.current[q.id] = [...selectedRef.current];

        window.setTimeout(() => {
            lockedRef.current = false;
            setLocked(false);
            selectedRef.current = [];
            setSelected([]);
            if (index + 1 >= exam.questions.length) grade();
            else setIndex((i) => i + 1);
        }, 380);
    }, [exam, index, grade]);

    const choose = useCallback(
        (id: string) => {
            if (!question || lockedRef.current) return;
            soundsRef.current.playSelect();
            const next = question.multiple
                ? selectedRef.current.includes(id)
                    ? selectedRef.current.filter((x) => x !== id)
                    : [...selectedRef.current, id]
                : [id];
            selectedRef.current = next;
            setSelected(next);
            // Single answer: choosing is answering
            if (!question.multiple) commit();
        },
        [question, commit]
    );

    // 15-second clock for each question. It follows the real clock, so a throttled tab cannot stretch it.
    useEffect(() => {
        if (phase !== 'question' || !exam) return;
        const secs = exam.secondsPerQuestion;
        const deadline = performance.now() + secs * 1000;
        setSecondsLeft(secs);
        const bar = barRef.current;
        if (bar) bar.style.setProperty('--v', '100');

        const timer = window.setInterval(() => {
            const left = Math.max(0, deadline - performance.now());
            bar?.style.setProperty('--v', String((left / (secs * 1000)) * 100));
            setSecondsLeft(Math.ceil(left / 1000));
            if (left <= 0) {
                window.clearInterval(timer);
                commit();
            }
        }, 100);
        return () => window.clearInterval(timer);
        // The clock restarts with each question, and `commit` is stable per question
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, index, exam]);

    // Keyboard: A-D / 1-4 choose, Enter confirms a multiple-answer question
    useEffect(() => {
        if (phase !== 'question' || !question) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            if (e.key === 'Enter' && question.multiple && selectedRef.current.length > 0) {
                e.preventDefault();
                commit();
                return;
            }
            const at = e.key.length === 1 ? KEYS.indexOf(e.key.toLowerCase()) : -1;
            if (at >= 0 && question.options[at % 4]) choose(question.options[at % 4].id);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [phase, question, choose, commit]);

    // Warn before leaving mid-attempt
    useEffect(() => {
        if (phase !== 'question' && phase !== 'countdown') return;
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [phase]);

    const urgent = secondsLeft <= 5;

    // ---- Render -----------------------------------------------------------------------
    if (phase === 'intro') {
        return (
            <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center">
                <div className="cart-shell w-full">
                    <div className="cart">
                        <div className="cart__face p-6 sm:p-10">
                            <div className="flex items-center gap-5">
                                <span className="block h-20 w-20 shrink-0 overflow-hidden border-[3px] border-[var(--line)] bg-[var(--pink)] shadow-[5px_5px_0_var(--shadow)]">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={LOGO} alt="" className="h-full w-full object-cover" />
                                </span>
                                <h2 className="font-display text-[clamp(1.8rem,5vw,3rem)] font-bold uppercase leading-none">{script.ui.examTitle}</h2>
                            </div>
                            <p className="sr-only" aria-live="polite">{script.lines.examIntro.text}</p>
                            <p aria-hidden className="mt-8 min-h-[9rem] font-display text-[clamp(1.3rem,3vw,2rem)] font-bold leading-[1.2]">
                                <span ref={subRef} />
                            </p>
                            <button type="button" autoFocus onClick={() => { stopVoice(); setPhase('rules'); }} className="btn mt-6">
                                {script.ui.continue}
                                <MdArrowForward className="text-2xl" aria-hidden />
                            </button>
                        </div>
                        <div className="pins" aria-hidden />
                    </div>
                </div>
            </div>
        );
    }

    if (phase === 'rules') {
        return (
            <GameDialog open title={script.ui.spoiler} tone="yellow" wide>
                <ul className="space-y-4">
                    {script.ui.rules.map((rule) => (
                        <li key={rule} className="flex gap-3 text-lg font-semibold leading-snug">
                            <MdCheck className="mt-1 shrink-0 text-2xl text-[var(--pink)]" aria-hidden />
                            {rule}
                        </li>
                    ))}
                </ul>
                <p className="mt-6 border-t-[3px] border-[var(--line)] pt-4 text-base font-medium text-[var(--muted)]">{script.ui.rulesFooter}</p>
                {last && (
                    <p className="mt-3 font-display text-sm font-bold uppercase tracking-[0.1em]">
                        {script.ui.lastTry}: {last.correct}/{last.total}
                    </p>
                )}
                <button type="button" autoFocus onClick={begin} className="btn mt-6 w-full !py-4 !text-lg">
                    {script.ui.start}
                    <MdArrowForward className="text-2xl" aria-hidden />
                </button>
            </GameDialog>
        );
    }

    if (phase === 'loading' || phase === 'grading') {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6" role="status">
                <span className="h-16 w-16 animate-spin border-[6px] border-[var(--line)] border-t-[var(--pink)]" aria-hidden />
                <p className="font-display text-xl font-bold uppercase tracking-[0.12em]">{phase === 'grading' ? script.ui.grading : '...'}</p>
            </div>
        );
    }

    if (phase === 'error') {
        return (
            <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-start justify-center gap-6" role="alert">
                <h2 className="font-display text-4xl font-bold uppercase leading-none">{errorKind === 'grade' ? script.ui.gradingError : script.ui.loadError}</h2>
                <div className="flex flex-wrap gap-4">
                    <button type="button" autoFocus onClick={errorKind === 'grade' ? grade : begin} className="btn">
                        <MdRefresh className="text-2xl" aria-hidden />
                        {script.ui.retry}
                    </button>
                    <button type="button" onClick={onExit} className="btn btn--ghost">
                        <MdArrowBack className="text-2xl" aria-hidden />
                        {script.ui.backToGames}
                    </button>
                </div>
            </div>
        );
    }

    if (phase === 'countdown') return <Countdown value={count} />;

    if (phase === 'sheet' && exam && result) {
        return <ExamSheet questions={exam.questions} answers={answersRef.current} result={result} onReplay={replay} onExit={onExit} />;
    }

    if (phase !== 'question' || !question) return null;

    return (
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
            {/* HUD */}
            <div className="cart-shell">
                <div className="cart">
                    <div className="cart__face p-5">
                        <div className="flex items-center justify-between gap-4">
                            <p className="score text-lg">
                                {String(index + 1).padStart(2, '0')}
                                <span className="text-[var(--muted)]">/{String(total).padStart(2, '0')}</span>
                            </p>
                            <p className={`score text-lg ${urgent ? 'animate-pulse text-[var(--pink)]' : ''}`} role="timer" aria-live="off">
                                {secondsLeft}s
                            </p>
                            <button type="button" onClick={() => setShowExit(true)} className="btn btn--ghost !min-h-11 !px-4 !py-2 !text-sm">
                                <MdLogout className="text-xl" aria-hidden />
                                <span className="hidden sm:inline">{script.ui.backToGames}</span>
                            </button>
                        </div>
                        <div ref={barRef} className={`hud-bar mt-4 ${urgent ? '' : 'hud-bar--yellow'}`} style={{ ['--v' as string]: 100 }} />
                        <ul className="mt-4 flex gap-1.5" aria-hidden>
                            {Array.from({ length: total }).map((_, i) => (
                                <li key={i} className={`h-2 flex-1 border-2 border-[var(--line)] ${i < index ? 'bg-[var(--cyan)]' : i === index ? 'bg-[var(--yellow)]' : 'bg-transparent'}`} />
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Question */}
            <div key={question.id} className="exam-q">
                <div className="cart-shell">
                    <div className="cart">
                        <div className="cart__face px-6 py-10 text-center sm:px-10 sm:py-14">
                            <h2 className="font-display text-[clamp(1.5rem,3.6vw,2.6rem)] font-bold leading-[1.1]">{question.text.replace(/^EJEMPLO\.\s*/, '')}</h2>
                            {question.multiple && <p className="tag tag--blue mx-auto mt-6 animate-pulse">{script.ui.pickMany}</p>}
                        </div>
                    </div>
                </div>

                <ul className="mt-8 grid gap-6 sm:grid-cols-2">
                    {question.options.map((option, i) => {
                        const on = selected.includes(option.id);
                        return (
                            <li key={option.id} className={question.options.length === 1 ? 'sm:col-span-2' : ''}>
                                <button
                                    type="button"
                                    aria-pressed={on}
                                    disabled={locked}
                                    onClick={() => choose(option.id)}
                                    className={`flex min-h-[4.5rem] w-full items-stretch border-[3px] border-[var(--line)] text-left shadow-[5px_5px_0_var(--shadow)] transition-[transform,box-shadow] duration-150 ${
                                        on ? 'bg-[var(--yellow)] text-[var(--ink)]' : 'bg-[var(--surface)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_var(--shadow)]'
                                    } ${locked && !on ? 'opacity-50' : ''}`}
                                >
                                    <span className="score flex w-14 shrink-0 items-center justify-center border-r-[3px] border-[var(--line)] text-xs">
                                        {on ? <MdCheck className="text-2xl" aria-hidden /> : String.fromCharCode(65 + i)}
                                    </span>
                                    <span className="flex flex-1 items-center px-4 py-3 font-display text-lg font-bold leading-tight">{option.text}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>

                {question.multiple && (
                    <div className="mt-8 flex justify-end">
                        <button type="button" onClick={commit} disabled={selected.length === 0 || locked} className="btn btn--yellow !px-8 !py-4">
                            {script.ui.confirm}
                            <MdArrowForward className="text-2xl" aria-hidden />
                        </button>
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={showExit}
                title={script.ui.backToGames}
                body="Perderás tu avance en este intento."
                icon={<MdLogout />}
                onYes={() => {
                    setShowExit(false);
                    onExit();
                }}
                onNo={() => setShowExit(false)}
            />
        </div>
    );
}
