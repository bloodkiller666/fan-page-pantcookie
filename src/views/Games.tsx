'use client';
import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { MdEdit, MdLock, MdPlayArrow } from 'react-icons/md';
import ExamGame from '../components/game/exam/ExamGame';
import { isLockedGame } from '../lib/event';
import { useEvent } from '../lib/useEvent';
import script from '../data/eventScript.json';
import PuzzleGame from '../components/game/PuzzleGame';
import TriviaGame from '../components/game/trivia/TriviaGame';
import ShuraRunGame from '../components/game/shura-run/ShuraRunGame';
import PlayerInput from '../components/game/PlayerInput';
import GameDialog from '../components/game/GameDialog';
import { useLanguage } from '../context/LanguageContext';

type GameId = 'puzzle' | 'trivia' | 'shuraRun' | 'examen';

const ART = {
    puzzle: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPYRsIWbUqNh-a-VWR_MO8g3khJ6eVMNX6l3H5fGPrUnEp01Ml2s40NsSvlvtiTugefIBHdWXFvpoW1Spin-uS77FQg9MXgAGwETbGisA0l-KLocksxXidPCAfLzLKLDN7np1hrP5S3aTv-YIdLwCIMV-66Vkjv2kVfQEi7UrO_Ev_Pcfs6kE5soxk7nbBk3M4FrD0Ezo5GotWMcnP64qcdaZfCUGC2ttpMGPwOPi0CvuAWp0Bp4YDnMR-wH4NnS5u_JdcX3Gto3c',
    trivia: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBy-_fx_lxjGNHUxeykasMYI7eCci5mIMRdbli2KJoQ6ZOh8zPX5DsPI2KOsFqJc9HcSLBsDlcI452Ao_WLwmI-0ulGTvujpIrNw3rV6EP23rWHoHyC0b_9WhsTu4gXGCNs7wrIB3x848y8sHaHOeeQxjezO_009KLOKX3ave43CMREIOLv0NG3rlSq6s0xtqfkZgW_FPAZOSlTUxkXeqbJBSxOFsD9ulxIm0WtO1OoPBymDTz75NSrsqNfrLgeK_s4DuFkLATDz-Q',
    examen: 'https://pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev/Shura%20HiwaLogo%206.png',
    shuraRun: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdjL2V2Ot0p54beKJQMARTwB1-XsW7cbFdKE5S52XQnc3SkQl9nnZxUf5DT65t7bswUpYmW8cPJgJsyX2GRNELbKNEQaJ2aI47-UwDKipeFkQk7n2qC2GohuiQ0-FQsDpKZBRR1sElFOMN8zWZwGFSvqJ1WRfzAssc4j0TufHB5Bk2AprrWzu1mQ4TKYVeN4uX2c37yabAFKve30KaaRQYWJXXigGO4-usqEGCZ6Ji8vJblJx2hCX5C2Z42WjtRpyCnuT1LDxXZSk',
};

const GamesContent = () => {
    const { t } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selected, setSelected] = useState<GameId | null>(null);
    const [playerName, setPlayerName] = useState('');
    const [showNamePrompt, setShowNamePrompt] = useState(false);
    const shelfRef = useRef<HTMLDivElement>(null);
    const { ready: eventReady, active: eventActive } = useEvent();

    useEffect(() => {
        const savedName = localStorage.getItem('playerName');
        if (savedName) setPlayerName(savedName);
        // During the event the old games are closed, so no name is needed
        else if (eventReady && !eventActive) setShowNamePrompt(true);
    }, [eventReady, eventActive]);

    const handleNameSubmit = () => {
        if (playerName.trim()) {
            localStorage.setItem('playerName', playerName.trim());
            setShowNamePrompt(false);
            // Stay on the menu after registering; the player picks a game
            router.push('/games', { scroll: false });
        }
    };

    useEffect(() => {
        const game = searchParams?.get('game');
        const savedName = localStorage.getItem('playerName');

        if (game === 'examen') {
            // Anonymous: no player name needed
            setSelected(eventActive ? 'examen' : null);
        } else if (game === 'puzzle' || game === 'trivia' || game === 'shuraRun') {
            if (eventActive && isLockedGame(game)) {
                setSelected(null);
            } else if (savedName) {
                setSelected(game);
            } else {
                // Deep link without a registered name: back to the menu and ask for one
                setSelected(null);
                setShowNamePrompt(true);
                router.replace('/games', { scroll: false });
            }
        } else {
            setSelected(null);
        }
    }, [searchParams, router, eventActive]);

    const games: { id: GameId; title: string; desc: string; tone: 'pink' | 'cyan' | 'yellow'; action: string; isNew?: boolean }[] = [
        { id: 'puzzle', title: t('games.options.puzzleTitle'), desc: t('games.puzzle.difficultyDesc'), tone: 'pink', action: t('games.options.playPuzzle') },
        { id: 'trivia', title: t('games.options.triviaTitle'), desc: t('games.options.triviaDesc'), tone: 'cyan', action: t('games.options.playTrivia') },
        { id: 'shuraRun', title: t('games.options.shuraRunTitle'), desc: t('games.options.shuraRunDesc'), tone: 'yellow', action: t('games.options.playShuraRun') },
    ];
    if (eventActive) {
        games.unshift({ id: 'examen', title: script.ui.examTitle, desc: script.ui.examDesc, tone: 'pink', action: script.ui.play, isNew: true });
    }

    // Cartridges slide into the shelf one after another
    useEffect(() => {
        if (selected || !shelfRef.current) return;
        const mm = gsap.matchMedia();
        mm.add('(prefers-reduced-motion: no-preference)', () => {
            gsap.from('.game-cart', {
                y: 90,
                rotate: (i: number) => (i - 1) * 4,
                opacity: 0,
                duration: 0.8,
                stagger: 0.12,
                ease: 'back.out(1.4)',
                clearProps: 'transform,opacity',
            });
        }, shelfRef);
        return () => mm.revert();
    }, [selected]);

    // Arrow keys move between cartridges (acts like a console menu)
    const onShelfKey = (e: React.KeyboardEvent) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const items = Array.from(shelfRef.current?.querySelectorAll<HTMLElement>('[data-cart]') ?? []);
        const i = items.indexOf(document.activeElement as HTMLElement);
        if (i === -1) return;
        e.preventDefault();
        items[(i + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length].focus();
    };

    if (selected === 'examen') {
        return (
            <div className="px-4 py-10 md:px-12">
                <div className="mx-auto max-w-7xl">
                    <ExamGame onExit={() => router.push('/games', { scroll: false })} />
                </div>
            </div>
        );
    }

    if (selected && playerName) {
        return (
            <div className="px-4 py-10 md:px-12">
                <div className="mx-auto max-w-7xl">
                    {selected === 'puzzle' && <PuzzleGame playerName={playerName} />}
                    {selected === 'trivia' && <TriviaGame playerName={playerName} />}
                    {selected === 'shuraRun' && <ShuraRunGame playerName={playerName} />}
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-[calc(100svh-var(--nav-h))] overflow-hidden px-4 py-12 sm:px-6 md:py-16">
            <div className="mx-auto max-w-[1400px]">
                <header className="flex flex-wrap items-end justify-between gap-6">
                    <div>
                        <h1 className="font-display text-[clamp(2.6rem,7vw,5.5rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em]">{t('games.title')}</h1>
                        <p className="mt-4 text-lg font-medium text-[var(--muted)]">{t('games.subtitle')}</p>
                    </div>

                    {playerName && (
                        <button
                            type="button"
                            onClick={() => setShowNamePrompt(true)}
                            className="flex items-center gap-3 border-[3px] border-[var(--line)] bg-[var(--surface)] py-2 pl-2 pr-4 shadow-[4px_4px_0_var(--shadow)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
                            aria-label={`${t('common.playerName')}: ${playerName}`}
                        >
                            <span className="flex h-11 w-11 items-center justify-center border-[3px] border-[var(--ink)] bg-[var(--pink)] font-display text-xl font-bold uppercase text-[var(--ink)]">
                                {playerName.charAt(0)}
                            </span>
                            <span className="max-w-[10rem] truncate font-display text-lg font-bold uppercase">{playerName}</span>
                            <MdEdit className="text-xl text-[var(--muted)]" aria-hidden />
                        </button>
                    )}
                </header>

                <div ref={shelfRef} onKeyDown={onShelfKey} className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    {games.map((game) => {
                        const closed = eventActive && isLockedGame(game.id);
                        return (
                        <button
                            key={game.id}
                            type="button"
                            data-cart
                            disabled={closed}
                            aria-disabled={closed}
                            onClick={() => router.push(`/games?game=${game.id}`, { scroll: false })}
                            className={`game-cart group h-full text-left outline-offset-8 ${closed ? 'cursor-not-allowed grayscale' : ''}`}
                        >
                            <div className="cart-shell is-interactive h-full">
                                <div className={`cart cart--${game.tone} h-full`}>
                                    <div className="cart__face flex h-full flex-col">
                                        <div className="relative aspect-[4/3] overflow-hidden border-b-[3px] border-[var(--ink)] bg-[var(--ink)]">
                                            {game.isNew && <span className="absolute left-3 top-3 z-10 border-[3px] border-[var(--ink)] bg-[var(--yellow)] px-3 py-1 font-display text-sm font-bold uppercase tracking-[0.1em] text-[var(--ink)] shadow-[3px_3px_0_var(--ink)]">{script.ui.newTag}</span>}
                                            {closed && (
                                                <span className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[var(--ink)]/70 text-center text-white">
                                                    <MdLock className="text-5xl" aria-hidden />
                                                    <span className="px-3 font-display text-sm font-bold uppercase tracking-[0.1em]">{script.ui.lockedGame}</span>
                                                </span>
                                            )}
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={ART[game.id]}
                                                alt=""
                                                loading="lazy"
                                                className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
                                            />
                                        </div>
                                        <div className="flex flex-1 flex-col gap-3 p-5">
                                            <h2 className="font-display text-3xl font-bold uppercase leading-none tracking-tight">{game.title}</h2>
                                            <p className="text-base font-semibold leading-snug">{game.desc}</p>
                                            <span className="mt-auto inline-flex items-center gap-2 pt-3 font-display text-sm font-bold uppercase tracking-[0.1em]">
                                                <MdPlayArrow className="text-2xl" aria-hidden />
                                                {closed ? script.ui.lockedGame : game.action}
                                            </span>
                                        </div>
                                        <div className="pins" aria-hidden />
                                    </div>
                                </div>
                            </div>
                        </button>
                        );
                    })}

                    {/* Empty slot: room for the next cartridge */}
                    <div className="game-cart" aria-hidden>
                        <div className="flex aspect-[4/5] flex-col items-center justify-center gap-4 border-[3px] border-dashed border-[var(--line)] text-[var(--muted)] opacity-70">
                            <MdLock className="text-5xl" />
                            <span className="score text-[0.6rem]">COMING SOON</span>
                        </div>
                    </div>
                </div>
            </div>

            <GameDialog
                open={showNamePrompt}
                onClose={playerName ? () => setShowNamePrompt(false) : undefined}
                title={t('games.welcomeTitle')}
                tone="pink"
            >
                <p className="mb-6 font-display text-sm font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{t('games.welcomeSubtitle')}</p>
                <PlayerInput playerName={playerName} onNameChange={setPlayerName} onStartGame={handleNameSubmit} />
            </GameDialog>
        </div>
    );
};

export default function Games() {
    return (
        <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center font-display text-2xl font-bold uppercase">Loading...</div>}>
            <GamesContent />
        </Suspense>
    );
}
