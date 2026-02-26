'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DifficultySelector from './DifficultySelector';
import PuzzleBoard from './PuzzleBoard';
import Timer from './Timer';
import PlayerInput from './PlayerInput';
import Leaderboard from './Leaderboard';
import { getRandomPuzzleImage } from '../../utils/imageSelector';
import { submitGameScore } from '../../utils/supabaseScoreService';
import { FiRefreshCw } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import { useGameSounds } from '../../hooks/useGameSounds';

const PuzzleGame = () => {
    const { t } = useLanguage();
    const { playVictory } = useGameSounds();
    const [difficulty, setDifficulty] = useState('medium');
    const [gameState, setGameState] = useState('setup'); // setup, playing, completed
    const [playerName, setPlayerName] = useState('');
    const [currentImage, setCurrentImage] = useState('');
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [showRules, setShowRules] = useState(false);
    const [showPauseMenu, setShowPauseMenu] = useState(false);
    const [showRestartConfirm, setShowRestartConfirm] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    useEffect(() => {
        // Load player name from localStorage
        const savedName = localStorage.getItem('playerName');
        if (savedName) {
            setPlayerName(savedName);
        }
    }, []);

    const startGame = () => {
        if (!playerName.trim()) {
            alert(t('games.puzzle.alertName'));
            return;
        }
        setShowRules(true);
    };

    const confirmStartGame = () => {
        setShowRules(false);
        // Save player name
        localStorage.setItem('playerName', playerName.trim());

        // Select random image
        const image = getRandomPuzzleImage();
        setCurrentImage(image);

        // Start game
        setGameState('playing');
        setElapsedTime(0);
        setIsTimerRunning(true);
    };

    const handlePuzzleComplete = async () => {
        setIsTimerRunning(false);
        setGameState('completed');
        playVictory();

        // Submit score to Supabase
        const result = await submitGameScore('puzzle', playerName.trim(), elapsedTime, difficulty);

        if (result.success) {
            console.log('Score submitted successfully!');
        } else {
            console.error('Failed to submit score:', result.error);
        }
    };

    const resetGame = () => {
        setGameState('setup');
        setElapsedTime(0);
        setIsTimerRunning(false);
        setCurrentImage('');
    };

    const restartGame = () => {
        // Same difficulty, different image or same? Let's do same flow as start game
        const image = getRandomPuzzleImage();
        setCurrentImage(image);
        setGameState('playing');
        setElapsedTime(0);
        setIsTimerRunning(true);
    };

    const changeDifficulty = (newDifficulty) => {
        if (gameState === 'playing') {
            const confirm = window.confirm('¿Estás seguro? Perderás el progreso actual.');
            if (!confirm) return;
        }
        setDifficulty(newDifficulty);
        setGameState('setup'); // Force back to setup to ensure clean state
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Game Area */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors duration-300">
                        {/* Difficulty Selector */}
                        <DifficultySelector
                            difficulty={difficulty}
                            onSelectDifficulty={changeDifficulty}
                            disabled={gameState === 'playing'}
                        />

                        {/* Player Input */}
                        {gameState === 'setup' && (
                            <PlayerInput
                                playerName={playerName}
                                onNameChange={setPlayerName}
                                onStartGame={startGame}
                            />
                        )}

                        {/* Timer and Pause Button */}
                        {(gameState === 'playing' || gameState === 'completed') && (
                            <div className="mb-6 flex items-center justify-between">
                                <Timer
                                    isRunning={isTimerRunning}
                                    elapsedTime={elapsedTime}
                                    onTimeUpdate={setElapsedTime}
                                />
                                {gameState === 'playing' && (
                                    <button
                                        onClick={() => {
                                            setIsTimerRunning(false);
                                            setShowPauseMenu(true);
                                        }}
                                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-xs font-black uppercase tracking-widest transition-all border-2 border-black shadow-[2px_2px_0px_0px_black] active:translate-y-0.5 active:shadow-none"
                                    >
                                        Pausa
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Puzzle Board */}
                        {gameState === 'playing' && (
                            <PuzzleBoard
                                image={currentImage}
                                difficulty={difficulty}
                                onComplete={handlePuzzleComplete}
                            />
                        )}

                        {/* Completion Message */}
                        {gameState === 'completed' && (
                            <div className="text-center py-12 animate-fade-in-up">
                                <div className="mb-6">
                                    <div className="text-6xl mb-4">🎉</div>
                                    <h2 className="text-3xl font-bold text-primary-pink mb-2">
                                        {t('games.puzzle.congrats').replace('{name}', playerName)}
                                    </h2>
                                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
                                        {t('games.puzzle.completeIn')}{' '}
                                        <span className="font-bold text-primary-blue dark:text-blue-400">
                                            {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                                        </span>
                                    </p>
                                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                                        {t('games.difficulty')}: <span className="font-semibold capitalize">{difficulty}</span>
                                    </p>
                                </div>

                                <button
                                    onClick={resetGame}
                                    className="btn-modern bg-primary-pink text-white shadow-lg hover:bg-pink-600 mx-auto"
                                >
                                    <FiRefreshCw className="w-5 h-5" />
                                    {t('games.puzzle.playAgain')}
                                </button>
                            </div>
                        )}

                        {/* Reset Button (during game) */}
                        {gameState === 'playing' && (
                            <div className="mt-8 text-center">
                                <button
                                    onClick={restartGame}
                                    className="text-gray-600 dark:text-gray-400 hover:text-primary-pink dark:hover:text-primary-pink transition flex items-center justify-center gap-2 mx-auto"
                                >
                                    <FiRefreshCw className="w-4 h-4" />
                                    {t('games.puzzle.restart')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="lg:col-span-1">
                    <Leaderboard difficulty={difficulty} currentPlayer={playerName} />
                </div>
            </div>

            {/* Rules Modal */}
            {showRules && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up border border-primary-pink/20">
                        <h3 className="text-2xl font-bold text-primary-pink mb-4 text-center">
                            🧩 Reglas del Puzzle
                        </h3>
                        <div className="space-y-4 text-gray-600 dark:text-gray-300 mb-8">
                            <p>1. Arrastra las piezas para completar la imagen original.</p>
                            <p>2. Completa el rompecabezas en el menor tiempo posible para entrar al ranking.</p>
                            <p>3. Puedes cambiar la dificultad, pero perderás tu progreso actual.</p>
                            <p className="text-sm italic text-gray-500">¡Buena suerte, galleta! 🍪</p>
                        </div>
                        <button
                            onClick={confirmStartGame}
                            className="w-full btn-modern bg-primary-pink text-white shadow-lg hover:bg-pink-600 py-3 rounded-xl font-bold text-lg"
                        >
                            Continuar
                        </button>
                    </div>
                </div>
            )}

            {/* PAUSE MENU OVERLAY */}
            <AnimatePresence>
                {showPauseMenu && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-sm w-full p-8 border-4 border-black"
                        >
                            <h3 className="text-3xl font-black text-center mb-8 uppercase italic tracking-tighter dark:text-white">PAUSA</h3>
                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={() => {
                                        setShowPauseMenu(false);
                                        setIsTimerRunning(true);
                                    }}
                                    className="w-full py-4 bg-primary-blue text-white font-black uppercase tracking-widest rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_black] hover:translate-y-0.5 hover:shadow-none transition-all"
                                >
                                    Continuar
                                </button>
                                <button
                                    onClick={() => setShowRestartConfirm(true)}
                                    className="w-full py-4 bg-yellow-500 text-white font-black uppercase tracking-widest rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_black] hover:translate-y-0.5 hover:shadow-none transition-all"
                                >
                                    Reiniciar
                                </button>
                                <button
                                    onClick={() => setShowExitConfirm(true)}
                                    className="w-full py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_black] hover:translate-y-0.5 hover:shadow-none transition-all"
                                >
                                    Salir
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* RESTART CONFIRMATION */}
                {showRestartConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-4 border-black shadow-[8px_8px_0px_0px_black] max-w-xs w-full text-center"
                        >
                            <p className="text-xl font-black mb-6 dark:text-white uppercase italic">¿Estás seguro de reiniciar?</p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        setShowRestartConfirm(false);
                                        setShowPauseMenu(false);
                                        restartGame();
                                    }}
                                    className="flex-1 py-3 bg-green-500 text-white font-black uppercase rounded-xl border-2 border-black"
                                >
                                    Sí
                                </button>
                                <button
                                    onClick={() => setShowRestartConfirm(false)}
                                    className="flex-1 py-3 bg-gray-400 text-white font-black uppercase rounded-xl border-2 border-black"
                                >
                                    No
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* EXIT CONFIRMATION */}
                {showExitConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-4 border-black shadow-[8px_8px_0px_0px_black] max-w-xs w-full text-center"
                        >
                            <p className="text-xl font-black mb-6 dark:text-white uppercase italic">¿Estás seguro de salir?</p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        setShowExitConfirm(false);
                                        setShowPauseMenu(false);
                                        resetGame();
                                    }}
                                    className="flex-1 py-3 bg-red-600 text-white font-black uppercase rounded-xl border-2 border-black"
                                >
                                    Sí
                                </button>
                                <button
                                    onClick={() => setShowExitConfirm(false)}
                                    className="flex-1 py-3 bg-gray-400 text-white font-black uppercase rounded-xl border-2 border-black"
                                >
                                    No
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PuzzleGame;
