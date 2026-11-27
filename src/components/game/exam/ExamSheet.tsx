'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { MdArrowBack, MdFastForward, MdRefresh } from 'react-icons/md';
import { useGameSounds } from '../../../hooks/useGameSounds';
import { speak, stopVoice } from '../../../lib/eventVoice';
import script from '../../../data/eventScript.json';
import type { ExamAnswers, ExamQuestion, ExamResult } from './types';

interface ExamSheetProps {
    questions: ExamQuestion[];
    answers: ExamAnswers;
    result: ExamResult;
    onReplay: () => void;
    onExit: () => void;
}

/** Target length of the grading animation, however many questions there are. */
const TARGET_SECONDS = 9;

const Check = () => (
    <svg viewBox="0 0 64 64" className="h-full w-full" fill="none" stroke="#0070ff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" aria-label="correcta">
        <path pathLength={1} strokeDasharray={1} strokeDashoffset={1} d="M8 34 L25 51 L57 11" />
    </svg>
);

const Cross = () => (
    <svg viewBox="0 0 64 64" className="h-full w-full" fill="none" stroke="#ff007f" strokeWidth="8" strokeLinecap="round" aria-label="incorrecta">
        <path pathLength={1} strokeDasharray={1} strokeDashoffset={1} d="M12 12 L52 52" />
        <path pathLength={1} strokeDasharray={1} strokeDashoffset={1} d="M52 12 L12 52" />
    </svg>
);

/**
 * The exam paper: rows are marked one by one with a check or a cross, then the verdict is
 * stamped on the sheet. "Skip" jumps to the end for anyone who has seen it before.
 */
export default function ExamSheet({ questions, answers, result, onReplay, onExit }: ExamSheetProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const tlRef = useRef<gsap.core.Timeline | null>(null);
    const noteRef = useRef<HTMLSpanElement>(null);
    const [finished, setFinished] = useState(false);
    const sounds = useGameSounds();
    const soundsRef = useRef(sounds);
    soundsRef.current = sounds;

    const byId = new Map(result.results.map((r) => [r.id, r]));
    const passed = result.passed;
    const note = `${result.correctCount}/${result.total}`;

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        const mm = gsap.matchMedia();

        const showEverything = () => {
            gsap.set(root.querySelectorAll('.mark'), { opacity: 1 });
            gsap.set(root.querySelectorAll('.mark path'), { strokeDashoffset: 0 });
            gsap.set('.stamp', { opacity: 1, scale: 1, rotate: -12 });
            if (noteRef.current) noteRef.current.textContent = note;
            setFinished(true);
        };

        mm.add('(prefers-reduced-motion: reduce)', showEverything);

        mm.add('(prefers-reduced-motion: no-preference)', () => {
            const rows = gsap.utils.toArray<HTMLElement>('.sheet-row', root);
            const gap = Math.min(1, Math.max(0.35, TARGET_SECONDS / Math.max(1, rows.length)));
            const tl = gsap.timeline({ delay: 0.6 });
            tlRef.current = tl;

            rows.forEach((row) => {
                const ok = row.dataset.ok === '1';
                const mark = row.querySelector('.mark');
                const strokes = row.querySelectorAll('.mark path');
                tl.to(row, { backgroundColor: 'rgba(255, 238, 0, 0.5)', duration: 0.12 }, `>+${(gap * 0.25).toFixed(2)}`)
                    .set(mark, { opacity: 1 })
                    .fromTo(
                        strokes,
                        { strokeDashoffset: 1 },
                        {
                            strokeDashoffset: 0,
                            duration: 0.3,
                            ease: 'power2.out',
                            stagger: 0.1,
                            onStart: () => (ok ? soundsRef.current.playCorrect() : soundsRef.current.playIncorrect()),
                        }
                    );
                if (!ok) tl.to(row, { x: 7, duration: 0.05, repeat: 5, yoyo: true, ease: 'sine.inOut' }, '<');
                tl.to(row, { backgroundColor: 'rgba(255, 238, 0, 0)', duration: 0.25 }, `>+${(gap * 0.3).toFixed(2)}`);
            });

            // Total on the note box, then the stamp slams down
            const proxy = { n: 0 };
            tl.to(proxy, {
                n: result.correctCount,
                duration: 0.5,
                ease: 'none',
                onUpdate: () => {
                    if (noteRef.current) noteRef.current.textContent = `${Math.round(proxy.n)}/${result.total}`;
                },
            }, '>+0.2');
            tl.fromTo(
                '.stamp',
                { scale: 3.4, rotate: -34, opacity: 0 },
                {
                    scale: 1,
                    rotate: -12,
                    opacity: 1,
                    duration: 0.32,
                    ease: 'expo.in',
                    onComplete: () => {
                        gsap.fromTo(root, { x: -9 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.25)' });
                        if (passed) soundsRef.current.playVictory();
                        else soundsRef.current.playIncorrect();
                        const id = passed ? 'examPass' : 'examFail';
                        speak(id, script.lines[id].text);
                        setFinished(true);
                    },
                }
            );

            return () => {
                tl.kill();
                tlRef.current = null;
            };
        });

        return () => {
            mm.revert();
            stopVoice();
        };
        // The sheet is rebuilt for each result
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [result]);

    const skip = () => {
        const tl = tlRef.current;
        if (!tl) return;
        tl.timeScale(12);
    };

    return (
        <div className="mx-auto w-full max-w-3xl">
            <div
                ref={rootRef}
                className="relative overflow-hidden border-[3px] border-[var(--ink)] bg-[#fffdf6] text-[#180917] shadow-[10px_10px_0_var(--shadow)] [--line:#180917]"
                style={{ backgroundImage: 'repeating-linear-gradient(transparent 0 35px, rgba(0,112,255,0.13) 35px 36px)', backgroundPosition: '0 8.5rem' }}
            >
                {/* notebook margin */}
                <span aria-hidden className="absolute bottom-0 left-12 top-0 w-[2px] bg-[#ff007f]/45" />

                <header className="relative flex flex-wrap items-end justify-between gap-6 border-b-[3px] border-[var(--ink)] bg-[#fffdf6] px-6 pb-4 pt-6 pl-16">
                    <div>
                        <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] font-bold uppercase leading-none">{script.ui.examTitle}</h2>
                        <p className="mt-3 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.1em]">
                            Nombre: <span className="inline-block w-40 border-b-[3px] border-dotted border-[var(--ink)]" aria-hidden /> <span className="sr-only">anónimo</span>
                        </p>
                    </div>
                    <div className="border-[3px] border-[var(--ink)] bg-white px-5 py-2 text-center">
                        <p className="font-display text-xs font-bold uppercase tracking-[0.14em]">Nota</p>
                        <p className="score mt-1 min-w-[5ch] text-xl" aria-live="polite">
                            <span ref={noteRef}>–/–</span>
                        </p>
                    </div>
                </header>

                <ol className="relative">
                    {questions.map((q, i) => {
                        const r = byId.get(q.id);
                        const ok = !!r?.correct;
                        const picked = (answers[q.id] ?? []).map((id) => q.options.find((o) => o.id === id)?.text).filter(Boolean);
                        return (
                            <li key={q.id} data-ok={ok ? '1' : '0'} className="sheet-row flex items-center gap-4 border-b border-[#180917]/15 py-3 pl-16 pr-4">
                                <span className="score absolute left-3 w-8 text-center text-[0.55rem] text-[#ff007f]">{i + 1}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="font-display text-base font-bold leading-snug">{q.text.replace(/^EJEMPLO\.\s*/, '')}</p>
                                    <p className="mt-1 text-base font-semibold text-[#180917]/75">
                                        <span className="sr-only">{script.ui.yourAnswer}: </span>
                                        {picked.length ? picked.join(' · ') : <span className="italic opacity-70">{script.ui.noAnswer}</span>}
                                    </p>
                                </div>
                                <span className="mark h-12 w-12 shrink-0 opacity-0">{ok ? <Check /> : <Cross />}</span>
                            </li>
                        );
                    })}
                </ol>

                {/* Verdict stamp */}
                <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center" aria-live="polite">
                    <div
                        className={`stamp border-[8px] border-double px-8 py-3 font-display text-[clamp(2.4rem,9vw,5rem)] font-bold uppercase leading-none tracking-[0.04em] opacity-0 mix-blend-multiply ${passed ? 'border-[#0070ff] text-[#0070ff]' : 'border-[#ff007f] text-[#ff007f]'}`}
                    >
                        {passed ? script.ui.passed : script.ui.failed}
                    </div>
                </div>
                <div className="h-36 sm:h-40" aria-hidden />
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                {!finished && (
                    <button type="button" onClick={skip} className="btn btn--ghost">
                        <MdFastForward className="text-2xl" aria-hidden />
                        {script.ui.skipAnimation}
                    </button>
                )}
                {finished && (
                    <>
                        <button type="button" autoFocus onClick={onReplay} className="btn btn--yellow !px-8 !py-4 !text-lg">
                            <MdRefresh className="text-2xl" aria-hidden />
                            {script.ui.again}
                        </button>
                        <button type="button" onClick={onExit} className="btn btn--ghost !py-4">
                            <MdArrowBack className="text-2xl" aria-hidden />
                            {script.ui.backToGames}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
