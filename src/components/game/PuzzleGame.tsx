'use client';
import { useState, useEffect } from 'react';
import DifficultySelector from './DifficultySelector';
import PuzzleBoard from './PuzzleBoard';
import Timer from './Timer';
import PlayerInput from './PlayerInput';
import Leaderboard from './Leaderboard';
import { getRandomPuzzleImage } from '../../utils/imageSelector';
import { submitScore } from '../../utils/localScoreService';
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

        // Submit score to Firebase
        const result = await submitScore(playerName.trim(), elapsedTime, difficulty);

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

                        {/* Timer */}
                        {(gameState === 'playing' || gameState === 'completed') && (
                            <div className="mb-6">
                                <Timer
                                    isRunning={isTimerRunning}
                                    elapsedTime={elapsedTime}
                                    onTimeUpdate={setElapsedTime}
                                />
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
        </div>
    );
};

export default PuzzleGame;
