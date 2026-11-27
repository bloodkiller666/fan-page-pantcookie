'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DifficultySelector from './DifficultySelector';
import PuzzleBoard from './PuzzleBoard';
import Leaderboard from './Leaderboard';
import { getRandomPuzzleImage } from '../../utils/imageSelector';
import { submitGameScore, checkExistingScore } from '../../utils/supabaseScoreService';
import { useLanguage } from '../../context/LanguageContext';
import { useGameSounds } from '../../hooks/useGameSounds';
import ScoreOverwriteModal from './ScoreOverwriteModal';
import RulesModal from './RulesModal';
import PauseMenu from './PauseMenu';
import GameDialog from './GameDialog';
import { MdEmojiEvents, MdExtension, MdGridView, MdLogout, MdPanTool, MdPauseCircle, MdRefresh, MdRestartAlt, MdShare, MdSignalCellularAlt, MdTimer, MdWarning } from 'react-icons/md';

const PuzzleGame = ({ playerName }: { playerName: string }) => {
    const { t } = useLanguage();
    const { playVictory } = useGameSounds();
    const [difficulty, setDifficulty] = useState('medium');
    const [gameState, setGameState] = useState('setup'); // setup, playing, completed
    const [currentImage, setCurrentImage] = useState('');
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [showRules, setShowRules] = useState(false);
    const [showPauseMenu, setShowPauseMenu] = useState(false);
    const [showRestartConfirm, setShowRestartConfirm] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [showVictoryScreen, setShowVictoryScreen] = useState(false);
    const [showOverwriteModal, setShowOverwriteModal] = useState(false);
    const [pendingScoreData, setPendingScoreData] = useState<{ score: number, oldScore: number } | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();

    const resetGame = () => {
        setGameState('setup');
        setElapsedTime(0);
        setIsTimerRunning(false);
        setCurrentImage('');
        setShowVictoryScreen(false);

        const params = new URLSearchParams(searchParams?.toString() || "");
        params.delete('difficulty');
        params.delete('state');
        router.push(`/games?${params.toString()}`, { scroll: false });
    };


    const startGame = () => {
        setShowRules(true);
    };

    const confirmStartGame = () => {
        setShowRules(false);
        const image = getRandomPuzzleImage();
        setCurrentImage(image);
        setGameState('playing');
        setElapsedTime(0);
        setIsTimerRunning(true);

        const params = new URLSearchParams(searchParams?.toString() || "");
        params.set('difficulty', difficulty);
        params.set('state', 'playing');
        router.push(`/games?${params.toString()}`, { scroll: false });
    };

    const handlePuzzleComplete = async () => {
        setIsTimerRunning(false);
        setGameState('completed');
        playVictory();

        const check = await checkExistingScore('puzzle', playerName.trim(), difficulty);

        if (check.exists && check.score !== null) {
            if (elapsedTime < check.score) {
                setPendingScoreData({ score: elapsedTime, oldScore: check.score });
                setShowOverwriteModal(true);
                return;
            } else {
                return;
            }
        }

        await submitGameScore('puzzle', playerName.trim(), elapsedTime, difficulty);
    };

    const confirmOverwrite = async () => {
        if (!pendingScoreData) return;
        setShowOverwriteModal(false);
        await submitGameScore('puzzle', playerName.trim(), pendingScoreData.score, difficulty);
        setPendingScoreData(null);
    };


    const handleShare = () => {
        const timeStr = `${Math.floor(elapsedTime / 60)}:${(elapsedTime % 60).toString().padStart(2, '0')}`;
        const text = t('games.puzzle.shareText', { difficulty: difficulty.toUpperCase(), time: timeStr }) || `¡Acabo de completar el Puzzle Challenge en dificultad ${difficulty.toUpperCase()} en solo ${timeStr}! ¿Puedes superarme?`;

        if (navigator.share) {
            navigator.share({
                title: 'Puzzle Challenge Result',
                text: text,
                url: window.location.href,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(`${text} ${window.location.href}`);
            alert(t('games.puzzle.copied') || '¡Resultado copiado al portapapeles!');
        }
    };

    const restartGame = () => {
        const image = getRandomPuzzleImage();
        setCurrentImage(image);
        setGameState('playing');
        setElapsedTime(0);
        setIsTimerRunning(true);
        setShowVictoryScreen(false);
    };

    const changeDifficulty = (newDifficulty: string) => {
        if (gameState === 'playing') {
            const confirm = window.confirm(t('common.progressLostWarning') || '¿Seguro? Se perderá el progreso actual.');
            if (!confirm) return;
        }
        setDifficulty(newDifficulty);
        const params = new URLSearchParams(searchParams?.toString() || "");
        params.set('difficulty', newDifficulty);
        params.delete('state');
        router.push(`/games?${params.toString()}`, { scroll: false });

        setGameState('setup');
        setShowVictoryScreen(false);
    };

    // Sync state with URL
    useEffect(() => {
        if (!searchParams) return;
        const diff = searchParams.get('difficulty');
        const state = searchParams.get('state');

        // Intercept back button if playing
        if (gameState === 'playing' && !state) {
            router.forward();
            setIsTimerRunning(false);
            setShowPauseMenu(true);
            return;
        }

        if (diff) {
            setDifficulty(diff);
        }

        if (state === 'playing') {
            if (gameState !== 'playing' && gameState !== 'completed') {
                // Trigger game start if not already playing
                confirmStartGame();
            }
        } else if (state === 'setup' || !state) {
            setGameState('setup');
            setIsTimerRunning(false);
            setShowVictoryScreen(false);
        }
    }, [searchParams, gameState, router]);

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isTimerRunning]);

    const puzzleRules = [
        {
            icon: <MdPanTool />,
            title: t('games.puzzle.rulesMueve') || 'Mueve las piezas',
            description: t('games.puzzle.rulesMueveDesc') || 'Arrastra las piezas para completar la imagen correctamente.'
        },
        {
            icon: <MdTimer />,
            title: t('games.puzzle.rulesVelocidad') || 'Velocidad es clave',
            description: t('games.puzzle.rulesVelocidadDesc') || 'Completa en el menor tiempo posible para subir en el ranking.'
        },
        {
            icon: <MdWarning />,
            title: t('games.puzzle.rulesCuidado') || 'Cuidado al cambiar',
            description: t('games.puzzle.rulesCuidadoDesc') || 'Cambiar la dificultad reiniciará tu progreso actual de inmediato.'
        }
    ];

    const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <div className="relative w-full">
            <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <span className="flex h-14 w-14 items-center justify-center border-[3px] border-[var(--line)] bg-[var(--pink)] text-[var(--ink)] shadow-[4px_4px_0_var(--shadow)]" aria-hidden>
                        <MdGridView className="text-3xl" />
                    </span>
                    <h1 className="font-display text-3xl font-bold uppercase leading-none tracking-tight sm:text-4xl">
                        Puzzle <span className="text-[var(--pink)]">Challenge</span>
                    </h1>
                </div>
            </header>

            <main className="flex w-full flex-col gap-12 lg:flex-row">
                {/* Left side: interaction area */}
                <div className="flex flex-1 flex-col gap-10">
                    {gameState === 'setup' && (
                        <div className="space-y-10">
                            <div className="space-y-3">
                                <h2 className="font-display text-[clamp(2.2rem,5vw,4rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em]">
                                    {t('games.puzzle.selectDifficulty')}
                                </h2>
                                <p className="text-lg font-medium text-[var(--muted)]">{t('games.puzzle.difficultyDesc')}</p>
                            </div>

                            <DifficultySelector difficulty={difficulty} onSelectDifficulty={changeDifficulty} disabled={false} />

                            <div className="flex justify-center">
                                <button type="button" onClick={startGame} className="btn w-full max-w-md !text-xl">
                                    {t('games.puzzle.startGame') || 'Comenzar Juego'}
                                </button>
                            </div>
                        </div>
                    )}

                    {(gameState === 'playing' || (gameState === 'completed' && !showVictoryScreen)) && (
                        <div className="w-full space-y-8">
                            <div className="flex flex-wrap items-center justify-between gap-6 border-[3px] border-[var(--line)] bg-[var(--surface)] p-5 shadow-[6px_6px_0_var(--shadow)]">
                                <div className="flex items-center gap-8">
                                    <div>
                                        <p className="font-display text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">{t('common.difficulty') || 'Dificultad'}</p>
                                        <p className="mt-1 font-display text-2xl font-bold uppercase leading-none">{difficulty}</p>
                                    </div>
                                    <div className="h-12 w-[3px] bg-[var(--line)]" aria-hidden />
                                    <div>
                                        <p className="font-display text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">{t('common.timer') || 'Cronómetro'}</p>
                                        <p className="score mt-2 flex items-center gap-3 text-xl" role="timer" aria-live="off">
                                            <MdTimer className="text-2xl text-[var(--blue)]" aria-hidden />
                                            {fmt(elapsedTime)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsTimerRunning(false);
                                        setShowPauseMenu(true);
                                    }}
                                    className="btn btn--cyan"
                                >
                                    <MdPauseCircle className="text-2xl" aria-hidden />
                                    {t('games.puzzle.pause') || 'Pausa'}
                                </button>
                            </div>

                            <div className="relative">
                                <PuzzleBoard image={currentImage} difficulty={difficulty} onComplete={handlePuzzleComplete} isCompleted={gameState === 'completed'} />

                                {gameState === 'completed' && (
                                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40">
                                        <button type="button" onClick={() => setShowVictoryScreen(true)} className="btn btn--yellow !px-10 !py-5 !text-xl">
                                            {t('games.puzzle.viewResults') || 'Ver Resultados'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-center">
                                <button type="button" onClick={restartGame} className="btn btn--ghost">
                                    <MdRestartAlt className="text-2xl" aria-hidden />
                                    {t('games.puzzle.restart') || 'Reiniciar'}
                                </button>
                            </div>
                        </div>
                    )}

                    {gameState === 'completed' && showVictoryScreen && (
                        <div className="flex flex-1 flex-col gap-8">
                            <div className="space-y-3 text-center">
                                <h2 className="font-display text-[clamp(2.4rem,6vw,4.8rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em]">
                                    {t('games.puzzle.victoryGreet', { name: playerName })}
                                </h2>
                                <p className="font-display text-lg font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{t('games.puzzle.conquered') || '¡Has conquistado el desafío!'}</p>
                            </div>

                            <div className="cart-shell">
                                <div className="cart cart--yellow">
                                    <div className="cart__face flex flex-col items-center px-6 py-12 text-center">
                                        <span className="flex h-28 w-28 items-center justify-center border-[3px] border-[var(--ink)] bg-[var(--pink)] shadow-[6px_6px_0_var(--ink)]" aria-hidden>
                                            <MdEmojiEvents className="text-7xl" />
                                        </span>
                                        <h3 className="mt-8 font-display text-3xl font-bold uppercase leading-none">{t('games.puzzle.victoryTitle')}</h3>
                                        <p className="mt-3 max-w-md text-lg font-semibold leading-snug">{t('games.puzzle.victoryDesc')}</p>

                                        <div className="mt-10 grid w-full max-w-xl gap-6 sm:grid-cols-2">
                                            <div className="border-[3px] border-[var(--ink)] bg-white p-6 text-left">
                                                <MdTimer className="text-3xl" aria-hidden />
                                                <p className="mt-3 font-display text-xs font-bold uppercase tracking-[0.14em]">{t('common.finalTime') || 'Tiempo Final'}</p>
                                                <p className="score mt-2 text-xl">{Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}</p>
                                            </div>
                                            <div className="border-[3px] border-[var(--ink)] bg-white p-6 text-left">
                                                <MdSignalCellularAlt className="text-3xl" aria-hidden />
                                                <p className="mt-3 font-display text-xs font-bold uppercase tracking-[0.14em]">{t('common.difficulty') || 'Dificultad'}</p>
                                                <p className="mt-2 font-display text-3xl font-bold uppercase leading-none">{difficulty}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pins" aria-hidden />
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-5">
                                <button type="button" onClick={resetGame} className="btn w-full max-w-md !py-5 !text-xl">
                                    {t('games.puzzle.playAgainBtn') || '¡JUGAR DE NUEVO!'}
                                </button>
                                <button type="button" onClick={handleShare} className="btn btn--ghost">
                                    <MdShare className="text-xl" aria-hidden />
                                    {t('common.shareResults')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <aside className="w-full shrink-0 lg:w-96">
                    <Leaderboard difficulty={difficulty} currentPlayer={playerName} game="puzzle" />
                </aside>
            </main>

            <RulesModal isOpen={showRules} onContinue={confirmStartGame} title={t('games.puzzle.rulesTitle') || 'Reglas del Puzzle'} icon={<MdExtension />} instructions={puzzleRules} />

            <PauseMenu
                isOpen={showPauseMenu}
                onResume={() => {
                    setShowPauseMenu(false);
                    setIsTimerRunning(true);
                }}
                onRestart={() => setShowRestartConfirm(true)}
                onExit={() => setShowExitConfirm(true)}
            />

            <GameDialog open={showRestartConfirm} onClose={() => setShowRestartConfirm(false)} title={t('games.puzzle.restart') || 'Reiniciar'} icon={<MdRefresh />} tone="yellow">
                <p className="text-lg font-semibold leading-snug">{t('games.puzzle.confirmRestart') || '¿Reiniciar el rompecabezas?'}</p>
                <div className="mt-6 grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => {
                            setShowRestartConfirm(false);
                            setShowPauseMenu(false);
                            restartGame();
                        }}
                        className="btn"
                    >
                        {t('common.yes') || 'Sí'}
                    </button>
                    <button type="button" onClick={() => setShowRestartConfirm(false)} className="btn btn--ghost">
                        {t('common.no') || 'No'}
                    </button>
                </div>
            </GameDialog>

            <GameDialog open={showExitConfirm} onClose={() => setShowExitConfirm(false)} title={t('games.puzzle.exitBtn') || 'Salir'} icon={<MdLogout />} tone="yellow">
                <p className="text-lg font-semibold leading-snug">{t('games.puzzle.confirmExit') || '¿Deseas abandonar el juego?'}</p>
                <div className="mt-6 grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => {
                            setShowExitConfirm(false);
                            setShowPauseMenu(false);
                            resetGame();
                        }}
                        className="btn"
                    >
                        {t('games.puzzle.exitBtn') || 'Salir'}
                    </button>
                    <button type="button" onClick={() => setShowExitConfirm(false)} className="btn btn--ghost">
                        {t('common.cancel') || 'Cancelar'}
                    </button>
                </div>
            </GameDialog>

            <ScoreOverwriteModal
                isOpen={showOverwriteModal}
                onConfirm={confirmOverwrite}
                onCancel={() => setShowOverwriteModal(false)}
                playerName={playerName}
                gameType="puzzle"
                oldScore={pendingScoreData?.oldScore || 0}
                newScore={pendingScoreData?.score || 0}
            />
        </div>
    );
};

export default PuzzleGame;
