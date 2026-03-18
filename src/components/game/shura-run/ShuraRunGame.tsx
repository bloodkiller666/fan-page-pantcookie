'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { submitGameScore, checkExistingScore } from '../../../utils/supabaseScoreService';
import Leaderboard from '../Leaderboard';
import { useLanguage } from '../../../context/LanguageContext';
import ScoreOverwriteModal from '../ScoreOverwriteModal';
import RulesModal from '../RulesModal';

export default function ShuraRunGame() {
    const { t } = useLanguage();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [playerName, setPlayerName] = useState('');
    const [updateMessage, setUpdateMessage] = useState<string | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [showPauseMenu, setShowPauseMenu] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [showOverwriteModal, setShowOverwriteModal] = useState(false);
    const [showRules, setShowRules] = useState(false);
    const [pendingScoreData, setPendingScoreData] = useState<{ score: number, oldScore: number } | null>(null);
    const GRAVITY = 0.5;
    const JUMP_FORCE = -15;
    const INITIAL_SPEED = 3;
    const MAX_SPEED = 15;
    const INITIAL_OBSTACLE_INTERVAL = 1800;

    // Audio Refs
    const jumpSound = useRef<HTMLAudioElement | null>(null);
    const collectSound = useRef<HTMLAudioElement | null>(null);
    const gameOverSound = useRef<HTMLAudioElement | null>(null);
    const bgMusic = useRef<HTMLAudioElement | null>(null);

    const requestRef = useRef<number | null>(null);
    const isPlayingRef = useRef(false);
    const isPausedRef = useRef(false);
    const scoreRef = useRef(0);
    const speedRef = useRef(INITIAL_SPEED);
    const lastTimeRef = useRef(0);
    const lastObstacleTimeRef = useRef(0);
    const playerRef = useRef({
        x: 50,
        y: 200,
        width: 40,
        height: 40,
        dy: 0,
        grounded: true
    });

    const obstaclesRef = useRef<Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        type: 'hater' | 'ingredient';
        markedForDeletion: boolean;
    }>>([]);

    useEffect(() => {
        const savedScore = localStorage.getItem('shuraRunHighScore');
        if (savedScore) setHighScore(parseInt(savedScore));
        const savedName = localStorage.getItem('playerName');
        if (savedName) setPlayerName(savedName);

        // Initialize Audio
        jumpSound.current = new Audio('/audio/jump.mp3');
        collectSound.current = new Audio('/audio/collect.mp3');
        gameOverSound.current = new Audio('/audio/gameover.mp3');
        bgMusic.current = new Audio('/audio/bg-music.mp3');
        if (bgMusic.current) {
            bgMusic.current.loop = true;
            bgMusic.current.volume = 0.4;
        }

        return () => {
            if (bgMusic.current) {
                bgMusic.current.pause();
                bgMusic.current = null;
            }
        };
    }, []);

    const gameOver = useCallback(async () => {
        isPlayingRef.current = false;
        setGameState('gameover');
        if (gameOverSound.current) {
            gameOverSound.current.currentTime = 0;
            gameOverSound.current.play().catch(() => { });
        }
        if (bgMusic.current) bgMusic.current.pause();

        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        const currentHigh = parseInt(localStorage.getItem('shuraRunHighScore') || '0');
        if (scoreRef.current > currentHigh) {
            localStorage.setItem('shuraRunHighScore', scoreRef.current.toString());
            setHighScore(scoreRef.current);
        }

        // Submit to Supabase if we have a name
        const name = localStorage.getItem('playerName') || 'Anonymous';

        // 1. Check if we should show overwrite modal
        const check = await checkExistingScore('shura_run', name);

        if (check.exists && check.score !== null) {
            // If new score is better, ask to overwrite
            if (scoreRef.current > check.score) {
                setPendingScoreData({ score: scoreRef.current, oldScore: check.score });
                setShowOverwriteModal(true);
                return;
            } else {
                // If not better, don't submit
                return;
            }
        }

        const result = await submitGameScore('shura_run', name, scoreRef.current);

        if (result.success && result.updated) {
            setUpdateMessage(t('games.shuraRun.updatingScore'));
            setTimeout(() => setUpdateMessage(null), 3000);
        }
    }, [t]);

    const confirmOverwrite = async () => {
        if (!pendingScoreData) return;
        setShowOverwriteModal(false);
        const name = localStorage.getItem('playerName') || 'Anonymous';
        const result = await submitGameScore('shura_run', name, pendingScoreData.score);
        if (result.success) {
            setUpdateMessage(t('games.shuraRun.updatingScore'));
            setTimeout(() => setUpdateMessage(null), 3000);
        }
        setPendingScoreData(null);
    };

    const gameLoop = useCallback((time: number) => {
        if (!isPlayingRef.current || isPausedRef.current) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (!lastTimeRef.current) lastTimeRef.current = time;
        const deltaTime = time - lastTimeRef.current;
        lastTimeRef.current = time;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const player = playerRef.current;
        player.dy += GRAVITY;
        player.y += player.dy;
        const groundLevel = canvas.height - 20;
        if (player.y + player.height > groundLevel) {
            player.y = groundLevel - player.height;
            player.dy = 0;
            player.grounded = true;
        } else {
            player.grounded = false;
        }

        const speedIncrease = Math.floor(scoreRef.current / 100) * 0.5;
        speedRef.current = Math.min(INITIAL_SPEED + speedIncrease, MAX_SPEED);
        const currentInterval = (INITIAL_SPEED * INITIAL_OBSTACLE_INTERVAL) / speedRef.current;

        // Spawn Obstacles
        if (time - lastObstacleTimeRef.current > currentInterval) {
            const isHater = Math.random() > 0.4;
            obstaclesRef.current.push({
                x: canvas.width,
                y: isHater ? groundLevel - 40 : groundLevel - 40 - (Math.random() * 50),
                width: 40,
                height: 40,
                type: isHater ? 'hater' : 'ingredient',
                markedForDeletion: false
            });
            lastObstacleTimeRef.current = time;
        }

        obstaclesRef.current.forEach(obs => {
            obs.x -= speedRef.current;

            if (
                player.x < obs.x + obs.width &&
                player.x + player.width > obs.x &&
                player.y < obs.y + obs.height &&
                player.y + player.height > obs.y
            ) {
                if (obs.type === 'hater') {
                    gameOver();
                    return;
                } else if (obs.type === 'ingredient' && !obs.markedForDeletion) {
                    obs.markedForDeletion = true;
                    if (collectSound.current) {
                        collectSound.current.currentTime = 0;
                        collectSound.current.play().catch(() => { });
                    }
                    scoreRef.current += 50; // Bonus score
                    setScore(scoreRef.current);
                }
            }

            // Remove off-screen
            if (obs.x + obs.width < 0) {
                obs.markedForDeletion = true;
                if (obs.type === 'hater') {
                    scoreRef.current += 10; // Score for surviving
                    setScore(scoreRef.current);
                }
            }
        });

        obstaclesRef.current = obstaclesRef.current.filter(obs => !obs.markedForDeletion);
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#4ade80';
        ctx.fillRect(0, groundLevel, canvas.width, 20);

        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(player.x + 25, player.y + 10, 10, 10);
        ctx.fillStyle = 'black';
        ctx.fillRect(player.x + 30, player.y + 12, 4, 4);

        obstaclesRef.current.forEach(obs => {
            if (obs.type === 'hater') {
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                // Angry face
                ctx.fillStyle = 'black';
                ctx.beginPath();
                ctx.moveTo(obs.x + 10, obs.y + 15);
                ctx.lineTo(obs.x + 30, obs.y + 15);
                ctx.stroke();
            } else {
                ctx.fillStyle = '#eab308';
                ctx.beginPath();
                ctx.arc(obs.x + 20, obs.y + 20, 15, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = '20px Arial';
                ctx.fillText('🥞', obs.x + 5, obs.y + 25);
            }
        });

        ctx.fillStyle = 'black';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(`${t('games.shuraRun.score')}: ${scoreRef.current}`, 20, 40);

        if (isPlayingRef.current) {
            requestRef.current = requestAnimationFrame(gameLoop);
        }
    }, [gameOver]);

    const jump = useCallback(() => {
        if (isPlayingRef.current && playerRef.current.grounded) {
            playerRef.current.dy = JUMP_FORCE;
            playerRef.current.grounded = false;
            if (jumpSound.current) {
                jumpSound.current.currentTime = 0;
                jumpSound.current.play().catch(() => { });
            }
        }
    }, []);

    const cutJump = useCallback(() => {
        if (isPlayingRef.current && playerRef.current.dy < -3) {
            playerRef.current.dy *= 0.4;
        }
    }, []);

    const fastFall = useCallback(() => {
        if (isPlayingRef.current && !playerRef.current.grounded) {
            playerRef.current.dy = Math.max(playerRef.current.dy + 2, 12);
        }
    }, []);

    const startGame = () => {
        if (!playerName.trim()) {
            const name = prompt(t('common.enterName'), playerName);
            if (name) {
                setPlayerName(name);
                localStorage.setItem('playerName', name);
            } else {
                return;
            }
        }

        // Load high score
        const savedHigh = localStorage.getItem('shuraRunHighScore');
        setHighScore(savedHigh ? parseInt(savedHigh) : 0);

        setGameState('playing');
        setScore(0);
        scoreRef.current = 0;
        speedRef.current = INITIAL_SPEED;
        playerRef.current = { x: 50, y: 200, width: 40, height: 40, dy: 0, grounded: true };
        obstaclesRef.current = [];

        lastTimeRef.current = 0;
        lastObstacleTimeRef.current = performance.now();
        setIsPaused(false);
        isPausedRef.current = false;
        setShowPauseMenu(false);
        setShowExitConfirm(false);

        if (bgMusic.current) {
            bgMusic.current.currentTime = 0;
            bgMusic.current.play().catch(() => { });
        }

        // Ensure loop restarts if already in playing state
        if (gameState === 'playing') {
            lastTimeRef.current = performance.now();
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            requestRef.current = requestAnimationFrame(gameLoop);
        }
    };

    const togglePause = useCallback(() => {
        if (gameState !== 'playing') return;

        const newPaused = !isPausedRef.current;
        setIsPaused(newPaused);
        isPausedRef.current = newPaused;
        setShowPauseMenu(newPaused);

        if (!newPaused) {
            if (bgMusic.current) bgMusic.current.play().catch(() => { });
            lastTimeRef.current = performance.now();
            requestRef.current = requestAnimationFrame(gameLoop);
        } else {
            if (bgMusic.current) bgMusic.current.pause();
        }
    }, [gameState, gameLoop]);

    useEffect(() => {
        if (gameState === 'playing') {
            isPlayingRef.current = true;
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            requestRef.current = requestAnimationFrame(gameLoop);
        } else {
            isPlayingRef.current = false;
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        }

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            isPlayingRef.current = false;
        };
    }, [gameState, gameLoop]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                if (gameState === 'playing') jump();
                else startGame();
            }
            if (e.code === 'ArrowDown') {
                e.preventDefault();
                if (gameState === 'playing' && !isPausedRef.current) fastFall();
            }
            if (e.code === 'KeyP' || e.code === 'Escape') {
                e.preventDefault();
                togglePause();
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                if (gameState === 'playing' && !isPausedRef.current) cutJump();
            }
        };

        const handleTouchStart = (e: TouchEvent) => {
            if (gameState === 'playing') {
                if (!isPausedRef.current) jump();
            }
            else startGame();
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (gameState === 'playing' && !isPausedRef.current) cutJump();
        };

        const handleMouseDown = (e: MouseEvent) => {
            if (gameState === 'playing') {
                if (!isPausedRef.current) jump();
            }
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (gameState === 'playing' && !isPausedRef.current) cutJump();
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchend', handleTouchEnd);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [gameState, jump, cutJump, fastFall, togglePause]);

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto p-4 select-none">
            <div className="mb-4 flex justify-between w-full max-w-lg text-gray-800 dark:text-white font-bold uppercase tracking-wider">
                <div>{t('games.shuraRun.score')}: <span className="text-pokemon-yellow">{score}</span></div>
                <div>{t('games.shuraRun.highScore')}: <span className="text-pokemon-pink">{highScore}</span></div>
            </div>

            <div
                className="relative rounded-2xl overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] bg-slate-800 touch-none"
                onClick={(e) => {
                    e.stopPropagation();
                    if (gameState === 'playing' && !isPausedRef.current) jump();
                }}
                onMouseDown={(e) => {
                    if (gameState === 'playing' && !isPausedRef.current) jump();
                }}
                onMouseUp={(e) => {
                    if (gameState === 'playing' && !isPausedRef.current) cutJump();
                }}
                onTouchStart={(e) => {
                    if (gameState === 'playing' && !isPausedRef.current) jump();
                }}
                onTouchEnd={(e) => {
                    if (gameState === 'playing' && !isPausedRef.current) cutJump();
                }}
            >
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={400}
                    className="w-full max-w-full h-auto block bg-[#87CEEB]"
                />

                {gameState === 'start' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-6 text-center z-10">
                        <h2 className="text-4xl md:text-6xl font-black text-pokemon-yellow mb-4 uppercase italic tracking-tighter transform -rotate-3">Shura Run</h2>

                        <p className="mb-8 text-gray-300 font-medium text-lg max-w-sm">
                            {t('games.shuraRun.tapToJump')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    startGame();
                                }}
                                className="bg-primary hover:bg-primary/80 text-white font-black text-xl py-4 px-10 rounded-full border-4 border-white shadow-xl transition-transform hover:scale-105 active:scale-95 animate-pulse"
                            >
                                {t('games.shuraRun.playNow')}
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowRules(true);
                                }}
                                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold py-4 px-8 rounded-full border-2 border-white/30 transition-all hover:border-white/60"
                            >
                                {t('games.puzzle.rulesTitle').split(' ')[1] || 'Reglas'}
                            </button>
                        </div>
                    </div>
                )}

                <RulesModal
                    isOpen={showRules}
                    onContinue={() => setShowRules(false)}
                    title="Shura Run"
                    icon="directions_run"
                    instructions={[
                        { icon: 'space_bar', title: 'Salto', description: t('games.shuraRun.tapToJump') },
                        { icon: 'pancake', title: 'Puntaje', description: t('games.shuraRun.instructions') },
                        { icon: 'speed', title: 'Dificultad', description: 'La velocidad aumenta conforme avanzas. ¡No te detengas!' }
                    ]}
                />

                {gameState === 'gameover' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-6 text-center z-10 animate-fade-in">
                        {updateMessage ? (
                            <div className="mb-8 p-4 bg-pokemon-yellow text-black font-bold rounded-xl animate-bounce border-2 border-black">
                                {updateMessage}
                            </div>
                        ) : (
                            <h2 className="text-5xl font-black text-red-500 mb-2 uppercase tracking-tighter">{t('games.shuraRun.gameOver')}</h2>
                        )}
                        <div className="text-2xl mb-8 font-bold">
                            {t('common.score')}: <span className="text-pokemon-yellow">{score}</span>
                            <br />
                            <span className="text-sm text-gray-400 font-normal uppercase tracking-widest">{t('games.shuraRun.best')}: {highScore}</span>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                startGame();
                            }}
                            className="bg-pokemon-blue hover:bg-blue-600 text-white font-black text-xl py-4 px-10 rounded-full border-4 border-white shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-transform hover:scale-110 active:scale-95"
                        >
                            {t('games.shuraRun.retry')}
                        </button>
                    </div>
                )}

                {/* PAUSE MENU OVERLAY */}
                {showPauseMenu && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-xs w-full p-8 border-4 border-black animate-fade-in-up">
                            <h3 className="text-3xl font-black text-center mb-8 uppercase italic tracking-tighter dark:text-white">{t('games.puzzle.pause')}</h3>
                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        togglePause();
                                    }}
                                    className="w-full py-4 bg-pokemon-blue text-white font-black uppercase tracking-widest rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_black] hover:translate-y-0.5 hover:shadow-none transition-all"
                                >
                                    {t('games.puzzle.continue')}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        startGame();
                                    }}
                                    className="w-full py-4 bg-pokemon-yellow text-black font-black uppercase tracking-widest rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_black] hover:translate-y-0.5 hover:shadow-none transition-all"
                                >
                                    {t('games.puzzle.restart')}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowExitConfirm(true);
                                    }}
                                    className="w-full py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_black] hover:translate-y-0.5 hover:shadow-none transition-all"
                                >
                                    {t('games.puzzle.exit')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* EXIT CONFIRMATION MODAL */}
                {showExitConfirm && (
                    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border-4 border-black shadow-[8px_8px_0px_0px_black] max-w-xs w-full text-center">
                            <h3 className="text-2xl font-black mb-6 dark:text-white uppercase italic">{t('games.puzzle.exitConfirm')}</h3>
                            <div className="flex gap-4">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setGameState('start');
                                        setShowExitConfirm(false);
                                        setShowPauseMenu(false);
                                    }}
                                    className="flex-1 py-4 bg-green-500 text-white font-black uppercase rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_black] hover:translate-y-0.5 hover:shadow-none transition-all"
                                >
                                    {t('games.puzzle.yes')}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowExitConfirm(false);
                                    }}
                                    className="flex-1 py-4 bg-red-500 text-white font-black uppercase rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_black] hover:translate-y-0.5 hover:shadow-none transition-all"
                                >
                                    {t('games.puzzle.no')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-6 text-xs text-gray-400 uppercase tracking-widest font-bold">
                {t('games.shuraRun.tapToJump')}
            </div>

            <div className="mt-8 w-full">
                <Leaderboard
                    game="shura_run"
                    currentPlayer={playerName}
                />
            </div>

            {/* Overwrite Confirmation Modal */}
            <ScoreOverwriteModal
                isOpen={showOverwriteModal}
                onConfirm={confirmOverwrite}
                onCancel={() => setShowOverwriteModal(false)}
                playerName={playerName || (typeof window !== 'undefined' ? localStorage.getItem('playerName') : '') || 'Anonymous'}
                gameType="shura_run"
                oldScore={pendingScoreData?.oldScore || 0}
                newScore={pendingScoreData?.score || 0}
            />
        </div>
    );
}