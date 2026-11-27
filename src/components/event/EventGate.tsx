'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';
import { MdArrowForward, MdSkipNext, MdVolumeOff, MdVolumeUp } from 'react-icons/md';
import { EVENT } from '../../lib/event';
import { useEvent } from '../../lib/useEvent';
import { isVoiceMuted, setVoiceMuted, speak, stopVoice, VoiceHandle } from '../../lib/eventVoice';
import { useTransition } from '../../context/TransitionContext';
import script from '../../data/eventScript.json';

type Step = 'off' | 'tap' | 'again' | 'date' | 'yes' | 'no';
type LineId = keyof typeof script.lines;

const LOGO = 'https://pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev/Shura%20HiwaLogo%206.png';
const SKIP_ROUTES = /^\/(admin|legal|cerrado)/;

/**
 * One-time intro for the event: a tap to unlock sound, then the "¿Tú otra vez?" and
 * "¿es 18 de diciembre?" modals. Subtitles are always shown and every step has a way forward,
 * so a missing audio file or blocked sound never traps anyone.
 */
export default function EventGate() {
    const { ready, active } = useEvent();
    const pathname = usePathname() || '/';
    const { transitionTo } = useTransition();

    const [step, setStep] = useState<Step>('off');
    const [muted, setMuted] = useState(false);
    const [canRetry, setCanRetry] = useState(false);
    const [speaking, setSpeaking] = useState(false);

    const subRef = useRef<HTMLSpanElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const voiceRef = useRef<VoiceHandle | null>(null);
    const runRef = useRef(0);
    const typeRef = useRef<gsap.core.Tween | null>(null);

    // Decide whether to show the intro (once per browser, never on admin/legal/closed pages)
    useEffect(() => {
        if (!ready || !active || SKIP_ROUTES.test(pathname)) return;
        let seen = false;
        try {
            seen = localStorage.getItem(EVENT.introSeenKey) === '1';
        } catch {
            /* treat as not seen */
        }
        if (seen) return;
        setMuted(isVoiceMuted());

        const open = () => setStep((s) => (s === 'off' ? 'tap' : s));
        // On a first visit the boot screen runs first; wait for it
        const bootPending = pathname === '/' && !localStorage.getItem('shakegang_onboarding_done');
        if (bootPending) {
            window.addEventListener('loading_complete', open, { once: true });
            return () => window.removeEventListener('loading_complete', open);
        }
        open();
    }, [ready, active, pathname]);

    useEffect(() => {
        if (step === 'off') return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [step]);

    useEffect(() => () => stopVoice(), []);

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
        // Finish a little before the voice does, so the text is complete while it is still talking
        typeRef.current = gsap.to(proxy, {
            n: text.length,
            duration: Math.max(0.8, (ms * 0.85) / 1000),
            ease: 'none',
            onUpdate: () => {
                el.textContent = text.slice(0, Math.round(proxy.n));
            },
        });
    }, []);

    const play = useCallback(
        (id: LineId, then?: () => void) => {
            const run = ++runRef.current;
            const line = script.lines[id];
            setSpeaking(true);
            const handle = speak(id, line.text, (ms) => typeText(line.text, ms));
            voiceRef.current = handle;
            handle.done.then(() => {
                if (runRef.current !== run) return;
                setSpeaking(false);
                then?.();
            });
        },
        [typeText]
    );

    const goTo = useCallback(
        (next: Step) => {
            setStep(next);
            setCanRetry(false);
            if (next === 'again') play('again', () => goTo('date'));
            if (next === 'date') play('date');
            if (next === 'yes') play('yes');
            if (next === 'no') {
                play('no');
                // Never a dead end: after a moment there is a way back
                window.setTimeout(() => setCanRetry(true), 4500);
            }
        },
        [play]
    );

    // Panel entrance on every step
    useEffect(() => {
        if (step === 'off' || !panelRef.current) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        gsap.fromTo(panelRef.current, { y: 30, scale: 0.96, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.5)', clearProps: 'transform,opacity' });
    }, [step]);

    const close = () => {
        runRef.current++;
        stopVoice();
        typeRef.current?.kill();
        setStep('off');
        setSpeaking(false);
    };

    const finishAndGo = () => {
        try {
            localStorage.setItem(EVENT.introSeenKey, '1');
        } catch {
            /* the intro may repeat if storage is blocked */
        }
        close();
        transitionTo('/games');
    };

    const toggleMute = () => {
        const next = !muted;
        setMuted(next);
        setVoiceMuted(next);
    };

    const skipVoice = () => {
        voiceRef.current?.stop();
    };

    if (step === 'off') return null;

    const lineId: LineId | null = step === 'again' || step === 'date' || step === 'yes' || step === 'no' ? step : null;
    const fullText = lineId ? script.lines[lineId].text : '';

    return (
        <div className="fixed inset-0 z-[13000] flex items-center justify-center overflow-y-auto bg-[#180917] p-4 text-[#fde0f6] [--line:#fde0f6] [--shadow:var(--pink)]" role="dialog" aria-modal="true" aria-label="Evento">
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(#fde0f6 1.4px, transparent 1.6px)', backgroundSize: '16px 16px' }} />

            {/* Voice controls */}
            <div className="absolute right-4 top-4 z-10 flex gap-3">
                {lineId && speaking && (
                    <button type="button" onClick={skipVoice} aria-label={script.ui.skip} title={script.ui.skip} className="flex h-12 w-12 items-center justify-center border-[3px] border-[var(--line)] bg-[#261325] hover:bg-[var(--yellow)] hover:text-[var(--ink)]">
                        <MdSkipNext className="text-2xl" />
                    </button>
                )}
                <button type="button" onClick={toggleMute} aria-pressed={muted} aria-label={muted ? script.ui.unmute : script.ui.mute} title={muted ? script.ui.unmute : script.ui.mute} className="flex h-12 w-12 items-center justify-center border-[3px] border-[var(--line)] bg-[#261325] hover:bg-[var(--yellow)] hover:text-[var(--ink)]">
                    {muted ? <MdVolumeOff className="text-2xl" /> : <MdVolumeUp className="text-2xl" />}
                </button>
            </div>

            <div ref={panelRef} className="relative w-full max-w-2xl">
                <div className="cart-shell">
                    <div className="cart">
                        <div className="cart__face bg-[#261325] p-6 text-[#fde0f6] sm:p-10" style={{ background: '#261325' }}>
                            {/* Speaker */}
                            <div className="flex items-center gap-5">
                                <span className="relative block h-20 w-20 shrink-0 overflow-hidden border-[3px] border-[#fde0f6] bg-[var(--pink)] shadow-[5px_5px_0_var(--pink)] sm:h-24 sm:w-24">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={LOGO} alt="" className="h-full w-full object-cover" />
                                </span>
                                <span className="flex h-12 items-end gap-1.5" aria-hidden>
                                    {[0, 1, 2, 3, 4].map((i) => (
                                        <span key={i} className={`w-2.5 origin-bottom bg-[var(--cyan)] ${speaking ? 'event-bar' : 'scale-y-[0.2]'}`} style={{ height: '100%', animationDelay: `${i * 0.12}s` }} />
                                    ))}
                                </span>
                            </div>

                            {step === 'tap' ? (
                                <div className="mt-8">
                                    <h2 className="font-display text-[clamp(2rem,6vw,3.6rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em]">{script.ui.gateTitle}</h2>
                                    <button type="button" autoFocus onClick={() => goTo('again')} className="btn btn--yellow mt-8 !px-8 !py-4 !text-xl [--line:var(--ink)] [--shadow:var(--pink)]">
                                        {script.ui.gateButton}
                                        <MdArrowForward className="text-2xl" aria-hidden />
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-8">
                                    {/* Typed subtitle for the eye, full text for screen readers */}
                                    <p className="sr-only" aria-live="polite">{fullText}</p>
                                    <p aria-hidden className="min-h-[7.5rem] font-display text-[clamp(1.4rem,3.4vw,2.2rem)] font-bold leading-[1.15]">
                                        <span ref={subRef} />
                                    </p>

                                    <div className="mt-8 flex flex-wrap gap-4">
                                        {step === 'date' && (
                                            <>
                                                <button type="button" autoFocus onClick={() => goTo('yes')} className="btn btn--cyan !px-10 !py-4 !text-xl [--line:var(--ink)] [--shadow:var(--pink)]">{script.ui.yes}</button>
                                                <button type="button" onClick={() => goTo('no')} className="btn !px-10 !py-4 !text-xl [--line:var(--ink)] [--shadow:#fde0f6]">{script.ui.no}</button>
                                            </>
                                        )}
                                        {step === 'again' && (
                                            <button type="button" autoFocus onClick={() => { voiceRef.current?.stop(); goTo('date'); }} className="btn btn--ghost [--line:#fde0f6]">
                                                {script.ui.continue}
                                                <MdArrowForward className="text-2xl" aria-hidden />
                                            </button>
                                        )}
                                        {step === 'yes' && (
                                            <button type="button" autoFocus onClick={finishAndGo} className="btn btn--yellow !px-8 !py-4 !text-xl [--line:var(--ink)] [--shadow:var(--pink)]">
                                                {script.ui.continue}
                                                <MdArrowForward className="text-2xl" aria-hidden />
                                            </button>
                                        )}
                                        {step === 'no' && canRetry && (
                                            <button type="button" autoFocus onClick={() => goTo('date')} className="btn btn--ghost [--line:#fde0f6]">
                                                {script.ui.mistake}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="pins" aria-hidden />
                    </div>
                </div>
            </div>

            <style jsx>{`
                .event-bar {
                    animation: event-bar 0.7s ease-in-out infinite alternate;
                }
                @keyframes event-bar {
                    from { transform: scaleY(0.2); }
                    to { transform: scaleY(1); }
                }
                @media (prefers-reduced-motion: reduce) {
                    .event-bar { animation: none; transform: scaleY(0.6); }
                }
            `}</style>
        </div>
    );
}
