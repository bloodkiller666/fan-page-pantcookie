'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DifficultySelector from './DifficultySelector';
import PuzzleBoard from './PuzzleBoard';
import PlayerInput from './PlayerInput';
import Leaderboard from './Leaderboard';
import { getRandomPuzzleImage } from '../../utils/imageSelector';
import { submitGameScore, checkExistingScore } from '../../utils/supabaseScoreService';
import { useLanguage } from '../../context/LanguageContext';
import { useGameSounds } from '../../hooks/useGameSounds';
import ScoreOverwriteModal from './ScoreOverwriteModal';
import RulesModal from './RulesModal';
import PauseMenu from './PauseMenu';
import { MdAutoAwesome, MdEmojiEvents, MdGridView, MdHelp, MdHome, MdLightbulb, MdLogout, MdPauseCircle, MdPerson, MdRefresh, MdRestartAlt, MdSettings, MdShare, MdSignalCellularAlt, MdTimer, MdWorkspacePremium, MdExtension, MdPanTool, MdWarning } from 'react-icons/md';

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

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 transition-colors duration-500">
            {/* Top Navigation */}
            <header className="flex-shrink-0 flex items-center justify-between px-6 lg:px-12 py-8 border-b border-primary/10 bg-white dark:bg-slate-900/90 backdrop-blur-2xl z-20 shadow-lg dark:shadow-none transition-colors duration-300">
                <div className="flex items-center gap-6 group">
                    <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(13,185,242,0.4)] group-hover:rotate-12 transition-transform duration-500">
                        <MdGridView className="dark:text-white text-3xl font-black" />
                    </div>
                    <div className="flex flex-col leading-none">
                        <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-slate-100 italic">
                            PUZZLE <span className="text-primary not-italic">CHALLENGE</span>
                        </h1>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 mt-1">Pro Edition</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button className="h-12 w-12 flex items-center justify-center rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-all active:scale-90 border border-primary/20 shadow-sm">
                        <MdSettings />
                    </button>
                    <button className="h-12 w-12 flex items-center justify-center rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-all active:scale-90 border border-primary/20 shadow-sm">
                        <MdHelp />
                    </button>
                    <div className="h-8 w-[1px] bg-primary/20 mx-2"></div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-cyan-400 p-0.5 shadow-lg shadow-primary/20 overflow-hidden group/avatar cursor-pointer">
                        <div className="w-full h-full rounded-full bg-white dark:bg-slate-800 flex items-center justify-center">
                            <MdPerson className="text-primary text-2xl group-hover/avatar:scale-110 transition-transform" />
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col lg:flex-row p-8 lg:p-12 gap-12 max-w-[1600px] mx-auto w-full">
                {/* Left Side: Interaction Area */}
                <div className="flex-1 flex flex-col gap-12">

                    {/* VIEW: SETUP */}
                    {gameState === 'setup' && (
                        <div className="space-y-12 animate-fade-in">
                            <div className="space-y-4">
                                <h2 className="text-6xl font-black text-slate-900 dark:text-slate-100 tracking-tighter italic">
                                    {t('games.puzzle.selectDifficulty').split(' ')[0]} <span className="text-primary">{t('games.puzzle.selectDifficulty').split(' ').slice(1).join(' ')}</span>
                                </h2>
                                <p className="text-xl text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">
                                    {t('games.puzzle.difficultyDesc')}
                                </p>
                            </div>

                            <DifficultySelector
                                difficulty={difficulty}
                                onSelectDifficulty={changeDifficulty}
                                disabled={false}
                            />

                            <div className="flex justify-center">
                                <button
                                    onClick={startGame}
                                    className="w-full max-w-md py-6 rounded-2xl bg-gradient-to-r from-primary via-[#00f2ff] to-primary bg-[length:200%_auto] hover:bg-right transition-all duration-500 dark:text-white text-background-dark font-black text-xl uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(13,185,242,0.3)] hover:shadow-[0_0_50px_rgba(13,185,242,0.5)] active:scale-[0.98] transform"
                                >
                                    {t('games.puzzle.startGame') || 'Comenzar Juego'}
                                </button>
                            </div>
                        </div>
                    )}

                    {(gameState === 'playing' || (gameState === 'completed' && !showVictoryScreen)) && (
                        <div className="space-y-8 animate-fade-in w-full">
                            <div className="flex flex-wrap items-center justify-between gap-6 bg-slate-100 dark:bg-primary/5 border border-slate-200 dark:border-primary/20 p-6 rounded-3xl backdrop-blur-md shadow-xl">
                                <div className="flex items-center gap-10">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500 dark:text-primary/60 font-black mb-1">{t('common.difficulty') || 'Dificultad'}</span>
                                        <span className="text-2xl font-black text-slate-900 dark:text-white italic uppercase">{difficulty}</span>
                                    </div>
                                    <div className="h-12 w-[1.5px] bg-slate-300 dark:bg-primary/20"></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500 dark:text-primary/60 font-black mb-1">{t('common.timer') || 'Cronómetro'}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums drop-shadow-[0_0_10px_rgba(13,185,242,0.4)]">
                                                {Math.floor(elapsedTime / 60).toString().padStart(2, '0')}:{(elapsedTime % 60).toString().padStart(2, '0')}
                                            </span>
                                            <MdTimer className="text-slate-400 dark:text-primary/60 text-2xl animate-spin-slow" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => {
                                            setIsTimerRunning(false);
                                            setShowPauseMenu(true);
                                        }}
                                        className="flex items-center gap-3 bg-white dark:bg-primary/10 hover:bg-primary hover:text-white transition-all text-slate-700 dark:text-primary px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest border border-primary/20 shadow-lg active:scale-95"
                                    >
                                        <MdPauseCircle />
                                        {t('games.puzzle.pause') || 'Pausa'}
                                    </button>
                                </div>
                            </div>

                            <div className="relative group">
                                <PuzzleBoard
                                    image={currentImage}
                                    difficulty={difficulty}
                                    onComplete={handlePuzzleComplete}
                                    isCompleted={gameState === 'completed'}
                                />

                                {gameState === 'completed' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-background-dark/20 backdrop-blur-sm rounded-3xl animate-fade-in z-30">
                                        <button
                                            onClick={() => setShowVictoryScreen(true)}
                                            className="px-12 py-6 bg-primary text-background-dark font-black uppercase tracking-[0.3em] rounded-2xl shadow-[0_0_50px_rgba(13,185,242,0.6)] hover:scale-110 active:scale-95 transition-all animate-bounce"
                                        >
                                            {t('games.puzzle.viewResults') || 'Ver Resultados'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={restartGame}
                                className="w-full lg:w-fit self-center flex items-center justify-center gap-3 bg-slate-800 dark:bg-slate-700/50 hover:bg-red-500 hover:shadow-red-500/30 transition-all text-white px-12 py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 border border-white/5"
                            >
                                <MdRestartAlt />
                                {t('games.puzzle.restart') || 'Reiniciar'}
                            </button>
                        </div>
                    )}

                    {gameState === 'completed' && showVictoryScreen && (
                        <div className="flex-1 flex flex-col gap-8 animate-fade-in-up">
                            <div className="text-center space-y-3">
                                <h1 className="text-5xl lg:text-7xl font-black text-primary tracking-tighter italic uppercase drop-shadow-[0_0_20px_rgba(13,185,242,0.3)]">
                                    {t('games.puzzle.victoryGreet', { name: playerName })}
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 text-xl font-bold uppercase tracking-[0.2em]">{t('games.puzzle.conquered') || '¡Has conquistado el desafío!'}</p>
                            </div>
                            <div className="relative flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900/40 rounded-[3rem] border border-slate-200 dark:border-primary/20 backdrop-blur-xl overflow-hidden shadow-2xl dark:shadow-none">
                                <div className="absolute inset-0 opacity-10 pointer-events-none">
                                    <div className="absolute bottom-10 right-10 text-primary transform rotate-12 animate-pulse">
                                        <MdAutoAwesome className="text-[10rem]" />
                                    </div>
                                </div>
                                <div className="relative z-10 text-center flex flex-col items-center">
                                    <div className="mb-8 h-64 w-64 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20 shadow-[0_0_60px_rgba(13,185,242,0.2)]">
                                        <MdEmojiEvents className="text-primary drop-shadow-[0_0_20px_rgba(13,185,242,1)] transform scale-[5.5]" style={{ fontVariationSettings: "'FILL' 1" }} />
                                    </div>
                                    <h3 className="text-4xl font-black uppercase italic tracking-tighter mb-3 text-slate-900 dark:text-white">{t('games.puzzle.victoryTitle')}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 max-w-md mx-auto px-6 leading-relaxed">{t('games.puzzle.victoryDesc')}</p>
                                    <div className="flex flex-wrap justify-center gap-6 w-full px-6">
                                        <div className="flex-1 min-w-[200px] bg-slate-50 dark:bg-slate-800/80 p-8 rounded-3xl border border-slate-200 dark:border-white/5 shadow-inner group hover:border-primary/30 transition-colors">
                                            <MdTimer className="text-primary mb-4 text-4xl transform group-hover:scale-110 transition-transform" />
                                            <p className="text-xs uppercase tracking-[0.1em] text-slate-500 font-black mb-2 sm:whitespace-nowrap">{t('common.finalTime') || 'Tiempo Final'}</p>
                                            <p className="text-4xl font-black italic tracking-tighter text-slate-900 dark:text-slate-100">
                                                {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                                            </p>
                                        </div>
                                        <div className="flex-1 min-w-[200px] bg-slate-50 dark:bg-slate-800/80 p-8 rounded-3xl border border-slate-200 dark:border-white/5 shadow-inner group hover:border-primary/30 transition-colors">
                                            <MdSignalCellularAlt className="text-primary mb-4 text-4xl transform group-hover:scale-110 transition-transform" />
                                            <p className="text-xs uppercase tracking-[0.1em] text-slate-500 font-black mb-2 sm:whitespace-nowrap">{t('common.difficulty') || 'Dificultad'}</p>
                                            <p className="text-4xl font-black italic tracking-tighter text-slate-900 dark:text-slate-100 uppercase">{difficulty}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-6 mt-6">
                                <button
                                    onClick={resetGame}
                                    className="w-full max-w-md py-6 bg-[#ff007a] hover:bg-[#ff1a8a] text-white rounded-2xl text-2xl font-black tracking-[0.2em] uppercase transition-all transform hover:scale-[1.03] active:scale-95 shadow-[0_0_30px_rgba(255,0,122,0.4)] hover:shadow-[0_0_50px_rgba(255,0,122,0.6)]"
                                >
                                    {t('games.puzzle.playAgainBtn') || '¡JUGAR DE NUEVO!'}
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="flex items-center gap-3 text-slate-500 hover:text-primary font-black uppercase tracking-widest text-sm transition-all group"
                                >
                                    <MdShare className="group-hover:scale-125 transition-transform" />
                                    {t('common.shareResults')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <aside className="w-full lg:w-96 flex flex-col gap-8">
                    <div className="flex-shrink-0">
                        <Leaderboard difficulty={difficulty} currentPlayer={playerName} game="puzzle" />
                    </div>

                    {gameState === 'playing' && (
                        <div className="bg-primary/90 p-8 rounded-[2rem] relative overflow-hidden group shadow-2xl shadow-primary/20 transform hover:-translate-y-2 transition-all duration-500">
                            <div className="relative z-10">
                                <h4 className="text-background-dark font-black text-2xl uppercase italic tracking-tighter mb-2">{t('games.puzzle.needHelp')}</h4>
                                <p className="text-background-dark/80 text-sm font-bold mb-6 leading-tight">{t('games.puzzle.useHint')}</p>
                                <button className="bg-background-dark text-white px-6 py-4 rounded-xl font-black text-sm w-full shadow-2xl hover:brightness-110 transition-all active:scale-95 uppercase tracking-widest border border-white/10">
                                    {t('games.puzzle.useHintBtn')}
                                </button>
                            </div>
                            <MdLightbulb className="absolute -bottom-8 -right-8 text-background-dark/20 text-[10rem] rotate-12 group-hover:rotate-0 transition-all duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        </div>
                    )}

                    <div className="bg-gradient-to-br from-primary/20 to-indigo-600/20 rounded-[2rem] p-8 border border-white/10 backdrop-blur-md shadow-xl">
                        <h4 className="font-black text-lg mb-2 flex items-center gap-3 italic tracking-tighter uppercase">
                            <MdWorkspacePremium className="text-[#ff007a] shadow-[0_0_10px_rgba(255,0,122,0.4)]" />
                            {t('games.puzzle.weeklyChallenge')}
                        </h4>
                        <p className="text-xs text-slate-500 font-bold mb-5 leading-relaxed">{t('games.puzzle.weeklyGoal')}</p>
                        <div className="w-full bg-slate-200 dark:bg-slate-800/50 h-3 rounded-full overflow-hidden border border-white/5">
                            <div className="bg-[#ff007a] h-full w-2/3 shadow-[0_0_15px_rgba(255,0,122,0.6)] rounded-full animate-pulse-slow"></div>
                        </div>
                        <p className="text-[10px] uppercase font-black text-right mt-3 text-[#ff007a] tracking-[0.2em] italic">{t('games.puzzle.weeklyProgress')}</p>
                    </div>
                </aside>
            </main>

            <RulesModal
                isOpen={showRules}
                onContinue={confirmStartGame}
                title={t('games.puzzle.rulesTitle') || "Reglas del Puzzle"}
                icon={<MdExtension />}
                instructions={puzzleRules}
            />

            <PauseMenu
                isOpen={showPauseMenu}
                onResume={() => {
                    setShowPauseMenu(false);
                    setIsTimerRunning(true);
                }}
                onRestart={() => setShowRestartConfirm(true)}
                onExit={() => setShowExitConfirm(true)}
            />

            {showRestartConfirm && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 border-2 border-primary/20 shadow-3xl max-w-xs w-full text-center animate-fade-in-up">
                        <div className="mb-6 w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
                            <MdRefresh className="text-red-500 text-3xl" />
                        </div>
                        <p className="text-xl font-black mb-8 text-slate-100 uppercase italic leading-tight">{t('games.puzzle.confirmRestart') || '¿Reiniciar el rompecabezas?'}</p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setShowRestartConfirm(false);
                                    setShowPauseMenu(false);
                                    restartGame();
                                }}
                                className="flex-1 py-4 bg-red-600 text-white font-black uppercase rounded-2xl shadow-lg hover:brightness-110 transition-all shadow-red-600/20"
                            >
                                {t('common.yes') || 'Sí'}
                            </button>
                            <button
                                onClick={() => setShowRestartConfirm(false)}
                                className="flex-1 py-4 bg-slate-800 text-slate-400 font-black uppercase rounded-2xl hover:bg-slate-700 transition-all"
                            >
                                {t('common.no') || 'No'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showExitConfirm && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 border-2 border-primary/20 shadow-3xl max-w-xs w-full text-center animate-fade-in-up">
                        <div className="mb-6 w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
                            <MdLogout className="text-red-500 text-3xl" />
                        </div>
                        <p className="text-xl font-black mb-8 text-slate-100 uppercase italic leading-tight">{t('games.puzzle.confirmExit') || '¿Deseas abandonar el juego?'}</p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setShowExitConfirm(false);
                                    setShowPauseMenu(false);
                                    resetGame();
                                }}
                                className="flex-1 py-4 bg-red-600 text-white font-black uppercase rounded-2xl shadow-lg hover:brightness-110 transition-all shadow-red-600/20"
                            >
                                {t('games.puzzle.exitBtn') || 'Salir'}
                            </button>
                            <button
                                onClick={() => setShowExitConfirm(false)}
                                className="flex-1 py-4 bg-slate-800 text-slate-400 font-black uppercase rounded-2xl hover:bg-slate-700 transition-all"
                            >
                                {t('common.cancel') || 'Cancelar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ScoreOverwriteModal
                isOpen={showOverwriteModal}
                onConfirm={confirmOverwrite}
                onCancel={() => setShowOverwriteModal(false)}
                playerName={playerName}
                gameType="puzzle"
                oldScore={pendingScoreData?.oldScore || 0}
                newScore={pendingScoreData?.score || 0}
            />

            <nav className="flex lg:hidden fixed bottom-0 left-0 right-0 bg-background-light dark:bg-background-dark border-t border-primary/10 px-6 py-4 justify-around z-50 backdrop-blur-xl">
                <button className="flex flex-col items-center gap-1 text-primary">
                    <MdHome />
                    <span className="text-[10px] font-black uppercase italic">{t('nav.home')}</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-slate-500">
                    <MdEmojiEvents />
                    <span className="text-[10px] font-black uppercase italic">{t('nav.ranking')}</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-slate-500">
                    <MdPerson />
                    <span className="text-[10px] font-black uppercase italic">{t('nav.profile')}</span>
                </button>
            </nav>
        </div>
    );
};
;

export default PuzzleGame;