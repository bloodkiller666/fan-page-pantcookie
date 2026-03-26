'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { submitGameScore, checkExistingScore } from '../../../utils/supabaseScoreService';
import Leaderboard from '../Leaderboard';
import { useLanguage } from '../../../context/LanguageContext';
import ScoreOverwriteModal from '../ScoreOverwriteModal';
import RulesModal from '../RulesModal';
import PauseMenu from '../PauseMenu';
import { MdDirectionsRun, MdSpaceBar, MdSpeed, MdBreakfastDining } from 'react-icons/md';

export default function ShuraRunGame({ playerName }: { playerName: string }) {
    const { t } = useLanguage();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const assetsRef = useRef({
        avatar: typeof window !== 'undefined' ? new Image() : {} as HTMLImageElement,
        tierra: typeof window !== 'undefined' ? new Image() : {} as HTMLImageElement,
        nube: typeof window !== 'undefined' ? new Image() : {} as HTMLImageElement,
        enemigo: typeof window !== 'undefined' ? new Image() : {} as HTMLImageElement,
        enemigo2: typeof window !== 'undefined' ? new Image() : {} as HTMLImageElement,
        pancake: typeof window !== 'undefined' ? new Image() : {} as HTMLImageElement,
        sol: typeof window !== 'undefined' ? new Image() : {} as HTMLImageElement,
        casa1: typeof window !== 'undefined' ? new Image() : {} as HTMLImageElement,
        casa2: typeof window !== 'undefined' ? new Image() : {} as HTMLImageElement,
        casa3: typeof window !== 'undefined' ? new Image() : {} as HTMLImageElement
    });
    const [assetsLoaded, setAssetsLoaded] = useState(false);
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [updateMessage, setUpdateMessage] = useState<string | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [showPauseMenu, setShowPauseMenu] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [showOverwriteModal, setShowOverwriteModal] = useState(false);
    const [showRules, setShowRules] = useState(false);
    const [pendingScoreData, setPendingScoreData] = useState<{ score: number, oldScore: number } | null>(null);

    const CANVAS_WIDTH = 1920;
    const CANVAS_HEIGHT = 1080;
    const GRAVITY = 1.2;
    const JUMP_FORCE = -25;
    const INITIAL_SPEED = 10;
    const MAX_SPEED = 30;
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
    const lastTimeRef = useRef<number>(0);
    const frameCountRef = useRef<number>(0);
    const lastObstacleTimeRef = useRef(0);
    const lastDecorationTimeRef = useRef(0);
    const playerRef = useRef({
        x: 150,
        y: 500,
        width: 120,
        height: 120,
        dy: 0,
        grounded: true
    });

    const obstaclesRef = useRef<Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        type: 'hater' | 'hater2' | 'ingredient';
        markedForDeletion: boolean;
    }>>([]);

    const decorationsRef = useRef<Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        asset: 'casa1' | 'casa2' | 'casa3';
        markedForDeletion: boolean;
    }>>([]);

    const particlesRef = useRef<Array<{
        x: number;
        y: number;
        size: number;
        opacity: number;
        vx: number;
        vy: number;
        markedForDeletion: boolean;
    }>>([]);

    useEffect(() => {
        const assets = assetsRef.current;
        assets.avatar.src = '/image/avatar.png';
        assets.tierra.src = 'https://pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev/tierra.png';
        assets.nube.src = 'https://pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev/nube.png';
        assets.enemigo.src = 'https://pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev/enemigo-1.png';
        assets.enemigo2.src = '/image/enemigo-2.png';
        assets.pancake.src = 'https://pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev/pancake.png';
        assets.sol.src = '/image/sol.png';
        assets.casa1.src = '/image/casa-1.png';
        assets.casa2.src = '/image/casa-2.png';
        assets.casa3.src = '/image/casa-3.png';

        // Configuración para que el pixel art no se vea borroso
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.imageSmoothingEnabled = false;
        }

        const loadPromises = Object.values(assets).map(img => {
            return new Promise((resolve) => {
                if (img.complete) {
                    resolve(true);
                } else {
                    img.onload = () => resolve(true);
                    img.onerror = () => resolve(true);
                }
            });
        });

        Promise.all(loadPromises).then(() => setAssetsLoaded(true));

        const savedScore = localStorage.getItem('shuraRunHighScore');
        if (savedScore) setHighScore(parseInt(savedScore));

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
        const name = playerName || 'Anonymous';

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
        const name = playerName || 'Anonymous';
        const result = await submitGameScore('shura_run', name, pendingScoreData.score);
        if (result.success) {
            setUpdateMessage(t('games.shuraRun.updatingScore'));
            setTimeout(() => setUpdateMessage(null), 3000);
        }
        setPendingScoreData(null);
    };

    const gameLoop = useCallback((timestamp: number) => {
        if (!isPlayingRef.current || isPausedRef.current || !assetsLoaded) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Calcular Delta Time
        const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0;
        lastTimeRef.current = timestamp;
        frameCountRef.current++;

        // 1. LIMPIAR Y DIBUJAR CIELO
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // 2. DIBUJAR EL SOL (Estático pero en el recorrido)
        ctx.drawImage(assetsRef.current.sol, CANVAS_WIDTH - 400, 100, 200, 200);

        // 3. DIBUJAR NUBES (PARALLAX)
        const cloudSpeed = speedRef.current * 0.1;
        const cloudGap = 800;
        for (let i = 0; i < 3; i++) {
            const cloudX = ((timestamp * 0.02 + i * cloudGap) % (CANVAS_WIDTH + 400)) - 200;
            ctx.drawImage(assetsRef.current.nube, CANVAS_WIDTH - cloudX, 100 + i * 50, 300, 150);
        }

        const groundLevel = CANVAS_HEIGHT - 140;

        // 4. ACTUALIZAR Y DIBUJAR DECORACIONES (CASAS - DETRÁS DE LA TIERRA)
        if (isPlayingRef.current && timestamp - lastDecorationTimeRef.current > 2000 + Math.random() * 3000) {
            const houseTypes: Array<'casa1' | 'casa2' | 'casa3'> = ['casa1', 'casa2', 'casa3'];
            const randomHouse = houseTypes[Math.floor(Math.random() * houseTypes.length)];
            decorationsRef.current.push({
                x: CANVAS_WIDTH,
                y: groundLevel - 200, 
                width: 250,
                height: 250,
                asset: randomHouse,
                markedForDeletion: false
            });
            lastDecorationTimeRef.current = timestamp;
        }

        decorationsRef.current.forEach(dec => {
            dec.x -= speedRef.current * deltaTime * 60;
            ctx.globalAlpha = 0.5; // Bajar intensidad decoraciones
            ctx.drawImage(assetsRef.current[dec.asset], dec.x, dec.y, dec.width, dec.height);
            ctx.globalAlpha = 1.0;
            if (dec.x + dec.width < 0) dec.markedForDeletion = true;
        });
        decorationsRef.current = decorationsRef.current.filter(dec => !dec.markedForDeletion);

        // 5. ACTUALIZAR JUGADOR (CON DELTA TIME)
        const player = playerRef.current;
        player.dy += GRAVITY * deltaTime * 60;
        player.y += player.dy * deltaTime * 60;

        if (player.y + player.height > groundLevel) {
            player.y = groundLevel - player.height;
            player.dy = 0;
            player.grounded = true;
        } else {
            player.grounded = false;
        }

        // 6. DIBUJAR SUELO INFINITO (ADELANTE DE LAS CASAS)
        const groundImg = assetsRef.current.tierra;
        const groundWidth = 400;
        const groundOffset = (timestamp * (speedRef.current * 0.05)) % groundWidth;

        for (let i = 0; i <= CANVAS_WIDTH / groundWidth + 1; i++) {
            ctx.drawImage(groundImg, (i * groundWidth) - groundOffset, groundLevel, groundWidth, 140);
        }

        // 8. EFECTO DE ESTELA DE POLVO
        if (player.grounded && isPlayingRef.current) {
            if (frameCountRef.current % 5 === 0) {
                particlesRef.current.push({
                    x: player.x + 20,
                    y: player.y + player.height - 10,
                    size: Math.random() * 10 + 10,
                    opacity: 0.6,
                    vx: -(speedRef.current * 0.3 + Math.random() * 2),
                    vy: -(Math.random() * 2),
                    markedForDeletion: false
                });
            }
        }

        particlesRef.current.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.opacity -= 0.02;
            p.size *= 0.98;
            if (p.opacity <= 0) p.markedForDeletion = true;

            ctx.fillStyle = `rgba(200, 200, 200, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        particlesRef.current = particlesRef.current.filter(p => !p.markedForDeletion);

        // 9. ACTUALIZAR Y DIBUJAR OBSTÁCULOS
        const speedIncrease = Math.floor(scoreRef.current / 100) * 0.5;
        speedRef.current = Math.min(INITIAL_SPEED + speedIncrease, MAX_SPEED);
        const currentInterval = (INITIAL_SPEED * INITIAL_OBSTACLE_INTERVAL) / speedRef.current;

        if (timestamp - lastObstacleTimeRef.current > currentInterval) {
            const rand = Math.random();
            const isHater = rand > 0.4;
            const type: 'hater' | 'hater2' | 'ingredient' = isHater 
                ? (Math.random() > 0.5 ? 'hater' : 'hater2') 
                : 'ingredient';
            
            const lastObs = obstaclesRef.current[obstaclesRef.current.length - 1];
            const minDistance = 400;
            const canSpawn = !lastObs || (CANVAS_WIDTH - lastObs.x > minDistance);

            if (canSpawn) {
                obstaclesRef.current.push({
                    x: CANVAS_WIDTH,
                    y: type !== 'ingredient' ? groundLevel - 100 : groundLevel - 150 - (Math.random() * 200),
                    width: 100,
                    height: 100,
                    type,
                    markedForDeletion: false
                });
                lastObstacleTimeRef.current = timestamp;
            }
        }

        obstaclesRef.current.forEach(obs => {
            obs.x -= speedRef.current * deltaTime * 60;

            if (obs.type === 'hater') {
                ctx.drawImage(assetsRef.current.enemigo, obs.x, obs.y, obs.width, obs.height);
            } else if (obs.type === 'hater2') {
                ctx.drawImage(assetsRef.current.enemigo2, obs.x, obs.y, obs.width, obs.height);
            } else {
                ctx.drawImage(assetsRef.current.pancake, obs.x, obs.y, obs.width, obs.height);
            }

            if (
                player.x < obs.x + obs.width &&
                player.x + player.width > obs.x &&
                player.y < obs.y + obs.height &&
                player.y + player.height > obs.y
            ) {
                if (obs.type === 'hater' || obs.type === 'hater2') {
                    gameOver();
                    return;
                } else if (obs.type === 'ingredient' && !obs.markedForDeletion) {
                    obs.markedForDeletion = true;
                    if (collectSound.current) {
                        collectSound.current.currentTime = 0;
                        collectSound.current.play().catch(() => { });
                    }
                    scoreRef.current += 50;
                    setScore(scoreRef.current);
                }
            }

            if (obs.x + obs.width < 0) {
                obs.markedForDeletion = true;
                if (obs.type === 'hater' || obs.type === 'hater2') {
                    scoreRef.current += 10;
                    setScore(scoreRef.current);
                }
            }
        });

        obstaclesRef.current = obstaclesRef.current.filter(obs => !obs.markedForDeletion);

        // 10. DIBUJAR AVATAR (Sprite Animado - Siempre al frente)
        const FRAME_W = 64;
        const FRAME_H = 71;
        const TOTAL_FRAMES = 10;
        const currentFrame = Math.floor(frameCountRef.current / 6) % TOTAL_FRAMES;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
            assetsRef.current.avatar,
            currentFrame * FRAME_W, 0,
            FRAME_W, FRAME_H,
            player.x, player.y,
            player.width, player.height
        );

        if (isPlayingRef.current) {
            requestRef.current = requestAnimationFrame(gameLoop);
        }
    }, [gameOver, assetsLoaded, t]);

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

        // Load high score
        const savedHigh = localStorage.getItem('shuraRunHighScore');
        setHighScore(savedHigh ? parseInt(savedHigh) : 0);

        setGameState('playing');
        setScore(0);
        scoreRef.current = 0;
        speedRef.current = INITIAL_SPEED;
        playerRef.current = {
            x: 150,
            y: 500,
            width: 110,  // Ajustado un poco por el spritesheet de 64x71
            height: 122,
            dy: 0,
            grounded: true
        };
        obstaclesRef.current = [];
        decorationsRef.current = [];
        particlesRef.current = [];
        frameCountRef.current = 0;

        lastTimeRef.current = 0;
        lastObstacleTimeRef.current = performance.now();
        lastDecorationTimeRef.current = performance.now();
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

    const gameOverContainerRef = useRef<HTMLDivElement>(null);
    const [prevGameState, setPrevGameState] = useState<'start' | 'playing' | 'gameover'>('start');

    useEffect(() => {
        if (gameState === 'gameover' && prevGameState !== 'gameover' && gameOverContainerRef.current) {
            import('gsap').then(({ gsap }) => {
                gsap.fromTo(gameOverContainerRef.current,
                    { scale: 0, opacity: 0, rotation: -10 },
                    { 
                        scale: 1, 
                        opacity: 1, 
                        rotation: 0,
                        duration: 0.8, 
                        ease: "back.out(1.7)", // Springy Mario-like bounce
                        force3D: true 
                    }
                );
            });
        }
        setPrevGameState(gameState);
    }, [gameState, prevGameState]);

    return (
        <main className="px-6 md:px-12 pb-12 w-full max-w-7xl mx-auto select-none">
            <div className="max-w-6xl mx-auto py-8">
                {/* Hero Game Section */}
                <section className="relative mb-16">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
                        <div>
                            <span className="inline-block py-1 px-3 bg-pokemon-pink/10 text-pokemon-pink border border-pokemon-pink/20 rounded-full font-bold text-[10px] tracking-widest uppercase mb-4 animate-pulse">
                                Live Session
                            </span>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-gray-900 dark:text-white uppercase leading-none">
                                SHURA RUN
                            </h1>
                        </div>
                        <div className="flex gap-8 md:gap-12 text-left md:text-right">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-[0.2em] mb-1 font-bold">
                                    {t('games.shuraRun.score')}
                                </p>
                                <p className="text-4xl font-bold text-neon-cyan tracking-tight">
                                    {score.toString().padStart(5, '0')}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-[0.2em] mb-1 font-bold">
                                    {t('games.shuraRun.highScore')}
                                </p>
                                <p className="text-4xl font-bold text-pokemon-pink tracking-tight">
                                    {highScore.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Game Viewport Container */}
                    <div className="relative p-1 bg-gray-100 dark:bg-zinc-950 border border-neon-cyan/20 rounded-xl overflow-hidden shadow-[0_0_50px_-12px_rgba(0,243,255,0.15)]">
                        <div 
                            className="aspect-video md:aspect-[21/9] w-full bg-[#1a1a1a] relative overflow-hidden flex flex-col justify-end touch-none cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (gameState === 'playing' && !isPausedRef.current) jump();
                            }}
                        >
                            <canvas
                                ref={canvasRef}
                                width={1920}
                                height={1080}
                                className="w-full h-full block object-contain"
                            />

                            {/* Scanline & Grid Effect Overlays */}
                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/20"></div>
                            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>

                            {/* Game State Overlays */}
                            {gameState === 'start' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] transition-all z-20">
                                    <div className="text-center p-6 bg-zinc-900/80 border border-neon-cyan/30 rounded-2xl">
                                        <MdSpaceBar className="text-6xl text-neon-cyan mx-auto mb-4 animate-bounce" />
                                        <p className="text-white font-bold text-xl tracking-widest uppercase mb-6">
                                            {t('games.shuraRun.tapToJump')}
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    startGame();
                                                }}
                                                className="bg-neon-cyan text-black font-black py-3 px-8 rounded-full shadow-[0_0_15px_rgba(0,243,255,0.5)] hover:scale-105 transition-transform uppercase italic"
                                            >
                                                {t('games.shuraRun.playNow')}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowRules(true);
                                                }}
                                                className="bg-white/10 text-white font-bold py-3 px-6 rounded-full border border-white/20 hover:bg-white/20 transition-all uppercase text-sm"
                                            >
                                                {t('games.puzzle.rulesTitle').split(' ')[1] || 'Reglas'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {gameState === 'gameover' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-30 overflow-hidden">
                                    <div 
                                        ref={gameOverContainerRef}
                                        className="text-center will-change-transform"
                                    >
                                        {updateMessage ? (
                                            <div className="mb-8 p-4 bg-pokemon-yellow text-black font-bold rounded-xl animate-bounce border-2 border-black">
                                                {updateMessage}
                                            </div>
                                        ) : (
                                            <h2 className="text-5xl md:text-7xl font-black text-red-500 mb-4 tracking-tighter uppercase drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                                                {t('games.shuraRun.gameOver')}
                                            </h2>
                                        )}
                                        <div className="mb-8 space-y-1">
                                            <p className="text-white text-xl md:text-2xl font-bold uppercase tracking-tight">
                                                {t('common.score')}: <span className="text-neon-cyan">{score}</span>
                                            </p>
                                            <p className="text-gray-400 text-xs md:text-sm font-black uppercase tracking-widest">
                                                {t('games.shuraRun.best')}: {highScore}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                startGame();
                                            }}
                                            className="bg-neon-cyan hover:bg-neon-cyan/80 text-black font-black text-xl px-12 py-4 rounded-full border-4 border-white transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,243,255,0.6)] uppercase tracking-widest italic"
                                        >
                                            {t('games.shuraRun.retry')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Ranking and Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Ranking Table (The Spotlight) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tighter">
                                Hall of Fame
                            </h3>
                            <div className="flex gap-2">
                                <span className="h-2 w-2 rounded-full bg-neon-cyan"></span>
                                <span className="h-2 w-2 rounded-full bg-gray-300 dark:bg-zinc-800"></span>
                                <span className="h-2 w-2 rounded-full bg-gray-300 dark:bg-zinc-800"></span>
                            </div>
                        </div>
                        
                        {/* Integrated Leaderboard Component with Custom Styling */}
                        <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                            <Leaderboard
                                game="shura_run"
                                currentPlayer={playerName}
                                className="w-full animate-fade-in"
                            />
                        </div>
                    </div>

                    {/* Secondary Info Panel */}
                    <div className="space-y-8">
                        {/* Status Card */}
                        <div className="bg-gray-100 dark:bg-zinc-900 p-8 rounded-2xl border border-gray-200 dark:border-zinc-800 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-neon-cyan/5 rounded-full -mr-8 -mt-8 group-hover:bg-neon-cyan/10 transition-all"></div>
                            <h4 className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-6">
                                {t('games.shuraRun.instructions').split('.')[0]}
                            </h4>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-[10px] font-bold text-gray-700 dark:text-white uppercase mb-2">
                                        <span>Progress to High Score</span>
                                        <span className="text-neon-cyan">
                                            {highScore > 0 ? Math.min(Math.round((score / highScore) * 100), 100) : 0}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-neon-cyan transition-all duration-500" 
                                            style={{ width: `${highScore > 0 ? Math.min((score / highScore) * 100, 100) : 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                                    <MdDirectionsRun className="text-lg text-neon-pink" />
                                    <p>{t('games.shuraRun.instructions')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Controls Hint */}
                        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 hidden md:block">
                            <h4 className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-4">Controls</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2 text-xs text-white">
                                    <kbd className="px-2 py-1 bg-zinc-800 rounded border border-zinc-700 font-pixel text-[10px]">SPACE</kbd>
                                    <span>Jump</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-white">
                                    <kbd className="px-2 py-1 bg-zinc-800 rounded border border-zinc-700 font-pixel text-[10px]">ESC</kbd>
                                    <span>Pause</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Existing Modals */}
            <RulesModal
                isOpen={showRules}
                onContinue={() => setShowRules(false)}
                title="Shura Run"
                icon={<MdDirectionsRun />}
                instructions={[
                    { icon: <MdSpaceBar />, title: 'Salto', description: t('games.shuraRun.tapToJump') },
                    { icon: <MdBreakfastDining />, title: 'Puntaje', description: t('games.shuraRun.instructions') },
                    { icon: <MdSpeed />, title: 'Dificultad', description: 'La velocidad aumenta conforme avanzas. ¡No te detengas!' }
                ]}
            />

            <PauseMenu
                isOpen={showPauseMenu}
                onResume={togglePause}
                onRestart={startGame}
                onExit={() => setShowExitConfirm(true)}
            />

            <ScoreOverwriteModal
                isOpen={showOverwriteModal}
                onConfirm={confirmOverwrite}
                onCancel={() => setShowOverwriteModal(false)}
                playerName={playerName || (typeof window !== 'undefined' ? localStorage.getItem('playerName') : '') || 'Anonymous'}
                gameType="shura_run"
                oldScore={pendingScoreData?.oldScore || 0}
                newScore={pendingScoreData?.score || 0}
            />

            {/* EXIT CONFIRMATION MODAL */}
            {showExitConfirm && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border-4 border-black dark:border-zinc-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-xs w-full text-center">
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
            
            {/* Interactive FAB */}
            <button 
                onClick={startGame}
                className="fixed bottom-8 right-8 h-16 w-16 bg-neon-pink text-white rounded-full shadow-[0_0_30px_rgba(255,0,127,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all group z-50 overflow-visible"
            >
                <MdDirectionsRun className="text-3xl" />
                <span className="absolute right-20 bg-zinc-900 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none border border-neon-pink/20 translate-x-4 group-hover:translate-x-0">
                    QUICK START
                </span>
            </button>
        </main>
    );

}