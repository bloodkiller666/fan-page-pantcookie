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
        avatarSalto: typeof window !== 'undefined' ? new Image() : {} as HTMLImageElement,
        tierra: typeof window !== 'undefined' ? new Image() : {} as HTMLImageElement,
        nube: typeof window !== 'undefined' ? new Image() : {} as HTMLImageElement,
        enemigo: typeof window !== 'undefined' ? new Image() : {} as HTMLImageElement,
        enemigo2: typeof window !== 'undefined' ? new Image() : {} as HTMLImageElement,
        pancake: typeof window !== 'undefined' ? new Image() : {} as HTMLImageElement,
        sol: typeof window !== 'undefined' ? new Image() : {} as HTMLImageElement,
        casa1: typeof window !== 'undefined' ? new Image() : {} as HTMLImageElement,
        casa2: typeof window !== 'undefined' ? new Image() : {} as HTMLImageElement,
        casa3: typeof window !== 'undefined' ? new Image() : {} as HTMLImageElement,
        concha: typeof window !== 'undefined' ? new Image() : {} as HTMLImageElement,
        salmon: typeof window !== 'undefined' ? new Image() : {} as HTMLImageElement,
        muerteCaida: typeof window !== 'undefined' ? new Image() : {} as HTMLImageElement,
        muerteLoop: typeof window !== 'undefined' ? new Image() : {} as HTMLImageElement,
    });
    const [assetsLoaded, setAssetsLoaded] = useState(false);
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
    const [showGameOverUI, setShowGameOverUI] = useState(false);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [updateMessage, setUpdateMessage] = useState<string | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [showPauseMenu, setShowPauseMenu] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [showRules, setShowRules] = useState(false);
    const [isBgmMuted, setIsBgmMuted] = useState(false);
    const [isSfxMuted, setIsSfxMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '21:9'>('16:9');
    const [menuView, setMenuView] = useState<'main' | 'settings' | 'controls'>('main');
    const menuViewRef = useRef<'main' | 'settings' | 'controls'>('main');
    const setMenuViewSync = (v: 'main' | 'settings' | 'controls') => {
        menuViewRef.current = v;
        setMenuView(v);
    };
    
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const isGameFocusedRef = useRef(false);

    const powerUpsRef = useRef({
        concha: { active: false, endTime: 0 },
        salmon: { active: false, endTime: 0 }
    });
    const lastClickTimeRef = useRef<number>(0);

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
    const deathSound = useRef<HTMLAudioElement | null>(null);
    const gameOverSound = useRef<HTMLAudioElement | null>(null);
    const bgMusic = useRef<HTMLAudioElement | null>(null);

    const deathTimestampRef = useRef<number>(0);

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
        grounded: true,
        doubleJumpAvailable: true
    });

    const obstaclesRef = useRef<Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        type: 'hater' | 'hater2' | 'ingredient' | 'concha' | 'salmon';
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
        assets.avatar.src = 'https://pub-c4667318dbeb475aaf97ced2e83d838b.r2.dev/avatar.png';
        assets.avatarSalto.src = 'https://pub-c4667318dbeb475aaf97ced2e83d838b.r2.dev/salto.png';
        assets.tierra.src = 'https://pub-c4667318dbeb475aaf97ced2e83d838b.r2.dev/tierra.png';
        assets.nube.src = 'https://pub-c4667318dbeb475aaf97ced2e83d838b.r2.dev/nube.png';
        assets.enemigo.src = 'https://pub-c4667318dbeb475aaf97ced2e83d838b.r2.dev/enemigo-1.png';
        assets.enemigo2.src = 'https://pub-c4667318dbeb475aaf97ced2e83d838b.r2.dev/enemigo-2.png';
        assets.pancake.src = 'https://pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev/pancake.png';
        assets.sol.src = 'https://pub-c4667318dbeb475aaf97ced2e83d838b.r2.dev/sol.png';
        assets.casa1.src = 'https://pub-c4667318dbeb475aaf97ced2e83d838b.r2.dev/casa-1.png';
        assets.casa2.src = 'https://pub-c4667318dbeb475aaf97ced2e83d838b.r2.dev/casa-2.png';
        assets.casa3.src = 'https://pub-c4667318dbeb475aaf97ced2e83d838b.r2.dev/casa-3.png';
        assets.concha.src = 'https://pub-c4667318dbeb475aaf97ced2e83d838b.r2.dev/concha.png';
        assets.salmon.src = 'https://pub-c4667318dbeb475aaf97ced2e83d838b.r2.dev/salmon.png';
        assets.muerteCaida.src = 'https://pub-c4667318dbeb475aaf97ced2e83d838b.r2.dev/muerte%20part1.png';
        assets.muerteLoop.src = 'https://pub-c4667318dbeb475aaf97ced2e83d838b.r2.dev/muerte%20part2.png';

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
        jumpSound.current = new Audio('https://pub-c4667318dbeb475aaf97ced2e83d838b.r2.dev/jump.mp3');
        collectSound.current = new Audio('https://pub-c4667318dbeb475aaf97ced2e83d838b.r2.dev/collect.mp3');
        deathSound.current = new Audio('https://pub-c4667318dbeb475aaf97ced2e83d838b.r2.dev/death.mp3');
        gameOverSound.current = new Audio('https://pub-c4667318dbeb475aaf97ced2e83d838b.r2.dev/game-over.mp3');
        bgMusic.current = new Audio('https://pub-c4667318dbeb475aaf97ced2e83d838b.r2.dev/bg-music.mp3');
        if (bgMusic.current) {
            bgMusic.current.loop = true;
            bgMusic.current.volume = 0.4;
            bgMusic.current.muted = isBgmMuted;
        }

        return () => {
            if (bgMusic.current) {
                bgMusic.current.pause();
                bgMusic.current = null;
            }
        };
    }, []); 

    const toggleBgm = () => {
        setIsBgmMuted((prev) => {
            const next = !prev;
            if (bgMusic.current) bgMusic.current.muted = next;
            return next;
        });
    };

    const toggleSfx = () => {
        setIsSfxMuted((prev) => {
            const next = !prev;
            if (jumpSound.current) jumpSound.current.muted = next;
            if (collectSound.current) collectSound.current.muted = next;
            if (deathSound.current) deathSound.current.muted = next;
            if (gameOverSound.current) gameOverSound.current.muted = next;
            return next;
        });
    };

    const gameOver = useCallback(async () => {
        isPlayingRef.current = false;
        setGameState('gameover');
        deathTimestampRef.current = performance.now();
        // Sonido de muerte al instante
        if (deathSound.current) {
            deathSound.current.currentTime = 0;
            deathSound.current.play().catch(() => { });
        }
        if (bgMusic.current) bgMusic.current.pause();

        // The requestRef will be handled by the gameLoop which continues if gameState === 'gameover'
        const currentHigh = parseInt(localStorage.getItem('shuraRunHighScore') || '0');
        if (scoreRef.current > currentHigh) {
            localStorage.setItem('shuraRunHighScore', scoreRef.current.toString());
            setHighScore(scoreRef.current);
        }

        // Submit to Supabase if we have a name
        const name = playerName || 'Anonymous';

        // 1. Check if we beat the existing score
        const check = await checkExistingScore('shura_run', name);

        if (check.exists && check.score !== null) {
            // Auto-overwrite if better
            if (scoreRef.current > check.score) {
                const result = await submitGameScore('shura_run', name, scoreRef.current);
                if (result.success && result.updated) {
                    setUpdateMessage(t('games.shuraRun.updatingScore'));
                    setTimeout(() => setUpdateMessage(null), 3000);
                }
            }
        } else {
            // New entry entirely
            const result = await submitGameScore('shura_run', name, scoreRef.current);
            if (result.success && result.updated) {
                setUpdateMessage(t('games.shuraRun.updatingScore'));
                setTimeout(() => setUpdateMessage(null), 3000);
            }
        }
    }, [t, playerName]);

    const gameLoop = useCallback((timestamp: number) => {
        if (gameState === 'start' || isPausedRef.current || !assetsLoaded) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Calcular Delta Time
        let deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0;
        if (deltaTime > 0.1) deltaTime = 0.016; 
        
        lastTimeRef.current = timestamp;
        frameCountRef.current++;

        // --- 1. ACTUALIZAR (Solo si está en juego) ---
        if (gameState === 'playing') {
            // Actualizar jugador
            const player = playerRef.current;
            player.dy += GRAVITY * deltaTime * 60;
            player.y += player.dy * deltaTime * 60;

            const groundLevel = CANVAS_HEIGHT - 140;
            if (player.y + player.height > groundLevel) {
                player.y = groundLevel - player.height;
                player.dy = 0;
                player.grounded = true;
            } else {
                player.grounded = false;
            }

            // Actualizar decoraciones
            if (timestamp - lastDecorationTimeRef.current > 2000 + Math.random() * 3000) {
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
                if (dec.x + dec.width < 0) dec.markedForDeletion = true;
            });
            decorationsRef.current = decorationsRef.current.filter(dec => !dec.markedForDeletion);

            // Actualizar estela
            if (player.grounded && frameCountRef.current % 5 === 0) {
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

            // Actualizar partículas
            particlesRef.current.forEach(p => {
                p.x += p.vx * deltaTime * 60;
                p.y += p.vy * deltaTime * 60;
                p.opacity -= 0.02 * deltaTime * 60;
                p.size *= Math.pow(0.98, deltaTime * 60);
                if (p.opacity <= 0) p.markedForDeletion = true;
            });
            particlesRef.current = particlesRef.current.filter(p => !p.markedForDeletion);

            // Actualizar y spawneo de obstáculos
            const speedIncrease = Math.floor(scoreRef.current / 100) * 0.5;
            speedRef.current = Math.min(INITIAL_SPEED + speedIncrease, MAX_SPEED);
            const currentInterval = (INITIAL_SPEED * INITIAL_OBSTACLE_INTERVAL) / speedRef.current;

            if (timestamp - lastObstacleTimeRef.current > currentInterval) {
                const rand = Math.random();
                let type: 'hater' | 'hater2' | 'ingredient' | 'concha' | 'salmon' = 'ingredient';
                if (rand > 0.5) type = Math.random() > 0.5 ? 'hater' : 'hater2';
                else if (rand > 0.1) type = 'ingredient';
                else if (rand > 0.05) type = 'concha';
                else type = 'salmon';
                
                const lastObs = obstaclesRef.current[obstaclesRef.current.length - 1];
                if (!lastObs || (CANVAS_WIDTH - lastObs.x > 400)) {
                    const obsY = (type === 'hater' || type === 'hater2') ? groundLevel - 100 : groundLevel - 150 - (Math.random() * 200);
                    obstaclesRef.current.push({
                        x: CANVAS_WIDTH,
                        y: obsY,
                        width: (type === 'hater' || type === 'hater2') ? 100 : 80,
                        height: (type === 'hater' || type === 'hater2') ? 100 : 80,
                        type,
                        markedForDeletion: false
                    });
                    lastObstacleTimeRef.current = timestamp;
                }
            }

            // Mover obstáculos y Colisiones
            obstaclesRef.current.forEach(obs => {
                obs.x -= speedRef.current * deltaTime * 60;
                if (
                    player.x < obs.x + obs.width &&
                    player.x + player.width > obs.x &&
                    player.y < obs.y + obs.height &&
                    player.y + player.height > obs.y
                ) {
                    if (obs.type === 'hater' || obs.type === 'hater2') {
                        if (powerUpsRef.current.salmon.active) {
                            if (!obs.markedForDeletion) {
                                obs.markedForDeletion = true;
                                scoreRef.current += 100;
                                setScore(scoreRef.current);
                            }
                        } else {
                            gameOver();
                            return;
                        }
                    } else if (!obs.markedForDeletion) {
                        obs.markedForDeletion = true;
                        if (collectSound.current) {
                            collectSound.current.currentTime = 0;
                            collectSound.current.play().catch(() => { });
                        }
                        if (obs.type === 'ingredient') scoreRef.current += 50;
                        else if (obs.type === 'concha') {
                            powerUpsRef.current.concha = { active: true, endTime: performance.now() + 30000 };
                            playerRef.current.doubleJumpAvailable = true;
                            scoreRef.current += 200;
                        } else if (obs.type === 'salmon') {
                            powerUpsRef.current.salmon = { active: true, endTime: performance.now() + 20000 };
                            scoreRef.current += 300;
                        }
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
        }

        // --- 2. DIBUJAR (Siempre que el loop esté activo) ---
        // Fondo y Cielo
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.drawImage(assetsRef.current.sol, CANVAS_WIDTH - 400, 100, 200, 200);

        // Nubes (Parallax - basado en speedRef que sigue existiendo)
        const cloudGap = 800;
        for (let i = 0; i < 3; i++) {
            const cloudX = ((timestamp * 0.02 + i * cloudGap) % (CANVAS_WIDTH + 400)) - 200;
            ctx.drawImage(assetsRef.current.nube, CANVAS_WIDTH - cloudX, 100 + i * 50, 300, 150);
        }

        // Decoraciones (Casas)
        decorationsRef.current.forEach(dec => {
            ctx.globalAlpha = 0.5;
            ctx.drawImage(assetsRef.current[dec.asset], dec.x, dec.y, dec.width, dec.height);
            ctx.globalAlpha = 1.0;
        });

        const groundLevel = CANVAS_HEIGHT - 140;

        // Suelo Infinito (Parallax - basado en timestamp * speed, el speed no varía si murió)
        const groundImg = assetsRef.current.tierra;
        const groundWidth = 400;
        const groundOffset = (gameState === 'playing') 
            ? (timestamp * (speedRef.current * 0.05)) % groundWidth
            : (lastTimeRef.current * (speedRef.current * 0.05)) % groundWidth; // Se congela si no está jugando? 
            // Wait, el usuario quiere que se vea quieto? Si "updatePhysics" no corre, x no cambia. 
            // El suelo depende del cálculo (timestamp * speed). Debo fijar el offset si no juega.
        
        // Corregir offset para que se detenga visualmente
        const currentGroundOffset = (gameState === 'playing') 
            ? (timestamp * (speedRef.current * 0.05)) % groundWidth
            : (deathTimestampRef.current * (speedRef.current * 0.05)) % groundWidth;

        for (let i = 0; i <= CANVAS_WIDTH / groundWidth + 1; i++) {
            ctx.drawImage(groundImg, (i * groundWidth) - currentGroundOffset, groundLevel, groundWidth, 140);
        }

        // Partículas
        particlesRef.current.forEach(p => {
            ctx.fillStyle = `rgba(200, 200, 200, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Obstáculos
        obstaclesRef.current.forEach(obs => {
            const assetName = obs.type === 'hater' ? 'enemigo' : 
                              obs.type === 'hater2' ? 'enemigo2' : 
                              obs.type === 'concha' ? 'concha' : 
                              obs.type === 'salmon' ? 'salmon' : 'pancake';
            ctx.drawImage(assetsRef.current[assetName as keyof typeof assetsRef.current], obs.x, obs.y, obs.width, obs.height);
        });

        // Avatar / Muerte
        const player = playerRef.current;
        if (gameState === 'gameover') {
            const timeSinceDeath = timestamp - deathTimestampRef.current;
            const dropDuration = 400;

            if (timeSinceDeath < dropDuration) {
                // ESCENA 1: CAÍDA
                const frame = Math.floor(timeSinceDeath / 100);
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(
                    assetsRef.current.muerteCaida,
                    (frame % 4) * 64, 0,
                    64, 83,
                    player.x, player.y,
                    player.width, player.height
                );
            } else {
                // ESCENA 2: MAREO (Loop)
                const loopFrame = Math.floor((timeSinceDeath - dropDuration) / 150) % 2;
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(
                    assetsRef.current.muerteLoop,
                    loopFrame * 64, 0,
                    64, 83,
                    player.x, player.y,
                    player.width, player.height
                );
                
                // Mostrar UI demorada
                if (timeSinceDeath - dropDuration > 3000 && !showGameOverUI) {
                    setShowGameOverUI(true);
                }
            }
        } else {
            // Animación Normal
            const isJumping = !player.grounded;
            const activeAvatar = isJumping ? assetsRef.current.avatarSalto : assetsRef.current.avatar;
            const FRAME_W = 64;
            const FRAME_H = isJumping ? 83 : 71;
            const TOTAL_FRAMES = isJumping ? 5 : 10;
            
            let currentFrame = 0;
            if (isJumping) {
                if (player.dy < -15) currentFrame = 0;
                else if (player.dy < -5) currentFrame = 1;
                else if (player.dy < 5) currentFrame = 2;
                else if (player.dy < 15) currentFrame = 3;
                else currentFrame = 4;
            } else {
                currentFrame = Math.floor(timestamp / 80) % TOTAL_FRAMES;
            }

            // GOKU SUPER SAIYAN EFFECT (GOD MODE)
            if (powerUpsRef.current.salmon.active && gameState === 'playing') {
                ctx.save();
                ctx.shadowColor = '#ffff00'; // Yellow glow
                ctx.shadowBlur = 25;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                // Add a slightly golden tint filter
                ctx.globalCompositeOperation = 'source-over'; 
            }

            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
                activeAvatar,
                currentFrame * FRAME_W, 0,
                FRAME_W, FRAME_H,
                player.x, player.y,
                player.width, player.height
            );

            if (powerUpsRef.current.salmon.active && gameState === 'playing') {
                ctx.restore();
            }
        }

        // HUD Power-ups
        const pNowCheck = performance.now();
        if (powerUpsRef.current.salmon.active && pNowCheck > powerUpsRef.current.salmon.endTime) powerUpsRef.current.salmon.active = false;
        if (powerUpsRef.current.concha.active && pNowCheck > powerUpsRef.current.concha.endTime) {
            powerUpsRef.current.concha.active = false;
            playerRef.current.doubleJumpAvailable = false;
        }

        const hasSalmon = powerUpsRef.current.salmon.active;
        const hasConcha = powerUpsRef.current.concha.active;
        if ((hasSalmon || hasConcha) && gameState === 'playing') {
             const barW = 600;
             const barH = 28;
             const barX = (CANVAS_WIDTH - barW) / 2;
             const barY = 30;
             const pNow = performance.now();
 
             let pProgress = 0;
             let barColor1 = '#ff6600';
             let barColor2 = '#ff2200';
             let labelText = '';
 
             if (hasSalmon) {
                 pProgress = Math.max(0, (powerUpsRef.current.salmon.endTime - pNow) / 20000);
                 barColor1 = '#ff9900'; barColor2 = '#cc0000';
                 labelText = t('games.shuraRun.godMode') || '🐟 GOD MODE';
             } else if (hasConcha) {
                 pProgress = Math.max(0, (powerUpsRef.current.concha.endTime - pNow) / 30000);
                 barColor1 = '#00e5ff'; barColor2 = '#0055cc';
                 labelText = t('games.shuraRun.doubleJump') || '🐚 DOBLE SALTO';
             }
 
             ctx.save();
             ctx.fillStyle = 'rgba(0,0,0,0.55)';
             ctx.beginPath(); ctx.roundRect(barX - 10, barY - 10, barW + 20, barH + 30, 12); ctx.fill();
             ctx.shadowColor = barColor1; ctx.shadowBlur = 18; ctx.strokeStyle = barColor1; ctx.lineWidth = 2;
             ctx.beginPath(); ctx.roundRect(barX, barY + 14, barW, barH, 8); ctx.stroke(); ctx.shadowBlur = 0;
             ctx.fillStyle = 'rgba(255,255,255,0.08)';
             ctx.beginPath(); ctx.roundRect(barX, barY + 14, barW, barH, 8); ctx.fill();
             const grad = ctx.createLinearGradient(barX, 0, barX + barW * pProgress, 0);
             grad.addColorStop(0, barColor1); grad.addColorStop(1, barColor2);
             ctx.fillStyle = grad; ctx.shadowBlur = 12;
             ctx.beginPath(); ctx.roundRect(barX, barY + 14, barW * pProgress, barH, 8); ctx.fill();
             ctx.shadowBlur = 0;
             ctx.fillStyle = 'white'; ctx.font = 'bold 22px Arial'; ctx.textAlign = 'center'; ctx.shadowBlur = 10;
             ctx.fillText(labelText, CANVAS_WIDTH / 2, barY + 12); ctx.restore();
        }

        if (gameState === 'playing' || gameState === 'gameover') {
            requestRef.current = requestAnimationFrame(gameLoop);
        }
    }, [gameOver, assetsLoaded, showGameOverUI, t, gameState]);

    const jump = useCallback(() => {
        if (isPlayingRef.current) {
            if (playerRef.current.grounded) {
                playerRef.current.dy = powerUpsRef.current.concha.active ? JUMP_FORCE * 1.15 : JUMP_FORCE;
                playerRef.current.grounded = false;
                if (jumpSound.current) {
                    jumpSound.current.currentTime = 0;
                    jumpSound.current.play().catch(() => { });
                }
            } else if (powerUpsRef.current.concha.active && playerRef.current.doubleJumpAvailable) {
                 playerRef.current.dy = JUMP_FORCE * 1.1;
                 playerRef.current.doubleJumpAvailable = false;
                 if (jumpSound.current) {
                    jumpSound.current.currentTime = 0;
                    jumpSound.current.play().catch(() => { });
                }
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

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            gameContainerRef.current?.requestFullscreen?.();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen?.();
            setIsFullscreen(false);
        }
    }, []);

    const startGame = () => {

        // Load high score
        const savedHigh = localStorage.getItem('shuraRunHighScore');
        setHighScore(savedHigh ? parseInt(savedHigh) : 0);

        setGameState('playing');
        setShowGameOverUI(false);
        deathTimestampRef.current = 0;
        setScore(0);
        scoreRef.current = 0;
        speedRef.current = INITIAL_SPEED;
        playerRef.current = {
            x: 150,
            y: 500,
            width: 110,
            height: 122,
            dy: 0,
            grounded: true,
            doubleJumpAvailable: true
        };
        powerUpsRef.current = {
            concha: { active: false, endTime: 0 },
            salmon: { active: false, endTime: 0 }
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
        setMenuViewSync('main');

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
        } else if (gameState === 'gameover') {
            isPlayingRef.current = false;
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

    // Reproducir sonido de gameover cuando aparece el UI
    useEffect(() => {
        if (showGameOverUI) {
            if (gameOverSound.current) {
                gameOverSound.current.currentTime = 0;
                gameOverSound.current.play().catch(() => { });
            }
        }
    }, [showGameOverUI]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isGameFocusedRef.current) return;
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                // Bloquear durante animación de muerte
                if (gameState === 'gameover' && (!showGameOverUI || menuView !== 'main')) return;
                if (gameState === 'playing') jump();
                else if (gameState === 'start' && menuView === 'main') startGame();
            }
            if (e.code === 'ArrowDown') {
                if (!isGameFocusedRef.current) return;
                e.preventDefault();
                if (gameState === 'playing' && !isPausedRef.current) fastFall();
            }
            if (e.code === 'KeyP' || e.code === 'Escape') {
                if (!isGameFocusedRef.current) return;
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
            if (!isGameFocusedRef.current) return;
            // Bloquear durante animación de muerte
            if (gameState === 'gameover' && (!showGameOverUI || menuView !== 'main')) return;
            if (gameState === 'playing') {
                if (!isPausedRef.current) jump();
            } else if (gameState === 'start' && menuView === 'main') {
                startGame();
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (gameState === 'playing' && !isPausedRef.current) cutJump();
        };

        const handleMouseDown = (e: MouseEvent) => {
            if (!isGameFocusedRef.current) return;
            // Bloquear durante animación de muerte
            if (gameState === 'gameover' && (!showGameOverUI || menuViewRef.current !== 'main')) return;
            // Block if in sub-menus (use ref to avoid stale closure)
            if (menuViewRef.current !== 'main') return;
            if (gameState === 'playing' && !isPausedRef.current) {
                jump();
                lastClickTimeRef.current = performance.now();
            } else if (gameState === 'start' && menuViewRef.current === 'main') {
                startGame();
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
    }, [gameState, jump, cutJump, fastFall, togglePause, showGameOverUI, startGame]);

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
                            ref={gameContainerRef}
                            className="aspect-video w-full bg-[#1a1a1a] relative overflow-hidden flex flex-col justify-end touch-none cursor-pointer select-none outline-none"
                            tabIndex={0}
                            onMouseEnter={() => { isGameFocusedRef.current = true; gameContainerRef.current?.focus(); }}
                            onMouseLeave={() => { isGameFocusedRef.current = false; }}
                            onTouchStart={() => { isGameFocusedRef.current = true; }}
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
                            {gameState === 'start' && menuView === 'main' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-[2px] transition-all z-20"
                                    style={{ fontFamily: '"Press Start 2P", cursive' }}>
                                    <div className="flex flex-col items-center gap-6 p-8 md:p-12 border-4 border-neon-cyan bg-black/90 pixel-shadow">
                                        <h2 className="text-neon-cyan/90 text-3xl md:text-5xl animate-pulse mb-4 tracking-widest text-center leading-relaxed drop-shadow-[0_0_15px_rgba(0,243,255,0.8)]">
                                            SHURA<br/>RUN
                                        </h2>
                                        <div className="flex flex-col w-full gap-4">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); startGame(); }}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                className="w-full bg-white text-black text-sm md:text-base py-4 px-8 border-4 border-white hover:bg-neon-cyan hover:border-neon-cyan hover:text-black transition-colors pixel-shadow group flex items-center justify-center"
                                            >
                                                <span className="opacity-0 group-hover:opacity-100 mr-3">▶</span>
                                                {t('games.shuraRun.menuPlay')}
                                                <span className="opacity-0 group-hover:opacity-100 ml-3">◀</span>
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setMenuViewSync('settings'); }}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                className="w-full bg-black text-white text-sm md:text-base py-4 px-8 border-4 border-white hover:bg-zinc-800 transition-colors pixel-shadow group flex items-center justify-center"
                                            >
                                                <span className="opacity-0 group-hover:opacity-100 mr-3">▶</span>
                                                {t('games.shuraRun.menuSettings')}
                                                <span className="opacity-0 group-hover:opacity-100 ml-3">◀</span>
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setMenuViewSync('controls'); }}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                className="w-full bg-black text-white text-sm md:text-base py-4 px-8 border-4 border-white hover:bg-zinc-800 transition-colors pixel-shadow group flex items-center justify-center"
                                            >
                                                <span className="opacity-0 group-hover:opacity-100 mr-3">▶</span>
                                                {t('games.shuraRun.menuControls')}
                                                <span className="opacity-0 group-hover:opacity-100 ml-3">◀</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {gameState === 'gameover' && showGameOverUI && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20"
                                     style={{ fontFamily: '"Press Start 2P" , cursive' }}>
                                     <div className="bg-black/80 border-4 border-white p-8 md:p-12 pixel-shadow max-w-[90%] flex flex-col items-center animate-scale-in">
                                         <h1 className="text-white text-3xl md:text-5xl lg:text-6xl mb-8 tracking-tighter text-center italic drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                                             {t('games.shuraRun.gameOver')}
                                         </h1>
                                         <div className="flex gap-10 md:gap-20 mb-12 py-6 border-y-4 border-white/20 w-full justify-center">
                                             <div className="flex flex-col items-center">
                                                 <span className="text-gray-400 text-[10px] md:text-xs mb-2 uppercase">{t('games.shuraRun.score')}</span>
                                                 <span className="text-neon-cyan text-2xl md:text-3xl font-pixel">{score.toString().padStart(5, '0')}</span>
                                             </div>
                                             <div className="flex flex-col items-center">
                                                 <span className="text-gray-400 text-[10px] md:text-xs mb-2 uppercase">{t('games.shuraRun.highScore')}</span>
                                                 <span className="text-white text-2xl md:text-3xl font-pixel">{highScore.toString().padStart(5, '0')}</span>
                                             </div>
                                         </div>
                                         <button
                                             onClick={(e) => { e.stopPropagation(); startGame(); }}
                                             className="w-full bg-red-600 hover:bg-red-500 text-white font-pixel text-lg md:text-xl py-4 border-4 border-white transition-all transform active:scale-95 pixel-shadow uppercase tracking-widest flex items-center justify-center group"
                                         >
                                             <span className="opacity-0 group-hover:opacity-100 mr-4">▶</span>
                                             {t('games.shuraRun.continue')}
                                             <span className="opacity-0 group-hover:opacity-100 ml-4">◀</span>
                                         </button>
                                     </div>
                                 </div>
                            )}

                            {gameState === 'playing' && isPausedRef.current && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-30"
                                    style={{ fontFamily: '"Press Start 2P", cursive' }}>
                                    <div className="flex flex-col items-center bg-[#111] border-2 border-white p-8 pixel-shadow text-center min-w-[280px] md:min-w-[340px]">
                                        <h2 className="text-neon-cyan text-3xl md:text-4xl mb-2">{t('games.shuraRun.pauseTitle')}</h2>
                                        <div className="border-t-4 border-neon-cyan w-1/4 mb-4 mt-2"></div>
                                        <p className="text-gray-400 text-[10px] mb-8 uppercase">{t('games.shuraRun.pauseSubtitle')}</p>

                                        <div className="flex flex-col w-full gap-4 mb-8">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); togglePause(); }}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                className="w-full bg-[#00ffff] text-black text-xs md:text-sm py-4 border-2 border-black pixel-shadow hover:scale-105 transition-transform"
                                            >
                                                {t('games.shuraRun.pauseContinue')}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); startGame(); }}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                className="w-full bg-[#ffff00] text-black text-xs md:text-sm py-4 border-2 border-black pixel-shadow hover:scale-105 transition-transform"
                                            >
                                                {t('games.shuraRun.pauseRestart')}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setGameState('start'); setIsPaused(false); isPausedRef.current = false; setMenuViewSync('main'); }}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                className="w-full bg-[#ff003c] text-white text-xs md:text-sm py-4 border-2 border-black pixel-shadow hover:scale-105 transition-transform"
                                            >
                                                {t('games.shuraRun.pauseExit')}
                                            </button>
                                        </div>

                                        <div className="border border-gray-600 p-4 text-left w-full">
                                            <p className="text-neon-cyan text-[8px] mb-2 uppercase">{">"} {t('games.shuraRun.pauseHintTitle')}</p>
                                            <p className="text-gray-400 text-[8px] leading-relaxed uppercase">{t('games.shuraRun.pauseHintDesc')}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {menuView === 'settings' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-[2px] z-40 transition-all"
                                    style={{ fontFamily: '"Press Start 2P", cursive' }}>
                                    <div className="flex flex-col items-center gap-6 p-8 border-4 border-neon-cyan bg-black/90 pixel-shadow w-[80%] max-w-[500px]">
                                        <h2 className="text-neon-cyan text-2xl md:text-3xl mb-4 text-center uppercase">{t('games.shuraRun.settingsTitle')}</h2>
                                        <div className="flex flex-col w-full gap-4">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleBgm(); }}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                className="w-full bg-black text-white text-xs md:text-sm py-4 px-4 border-4 border-white hover:bg-zinc-800 transition-colors pixel-shadow flex items-center justify-between"
                                            >
                                                <span className="uppercase">{t('games.shuraRun.settingsMusic')}</span>
                                                <span className={isBgmMuted ? "text-red-500" : "text-neon-cyan"}>{isBgmMuted ? 'OFF' : 'ON'}</span>
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleSfx(); }}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                className="w-full bg-black text-white text-xs md:text-sm py-4 px-4 border-4 border-white hover:bg-zinc-800 transition-colors pixel-shadow flex items-center justify-between"
                                            >
                                                <span className="uppercase">{t('games.shuraRun.settingsSfx')}</span>
                                                <span className={isSfxMuted ? "text-red-500" : "text-neon-cyan"}>{isSfxMuted ? 'OFF' : 'ON'}</span>
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                className="w-full bg-black text-white text-xs md:text-sm py-4 px-4 border-4 border-white hover:bg-zinc-800 transition-colors pixel-shadow flex items-center justify-between"
                                            >
                                                <span className="uppercase">{t('games.shuraRun.settingsFullscreen')}</span>
                                                <span className="text-neon-cyan">{isFullscreen ? 'ON' : 'OFF'}</span>
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setMenuViewSync('main'); }}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                className="w-full bg-white text-black text-xs md:text-sm py-4 border-4 border-black hover:bg-gray-200 transition-colors pixel-shadow mt-4"
                                            >
                                                ← {t('games.shuraRun.back')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {menuView === 'controls' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/95 backdrop-blur-[2px] z-40 transition-all"
                                    style={{ fontFamily: '"Press Start 2P", cursive' }}>
                                    <div className="flex flex-col items-center p-8 border-4 border-white bg-black pixel-shadow w-[80%] max-w-[500px]">
                                        <h2 className="text-white text-xl md:text-2xl mb-8 border-b-4 border-white pb-4 w-full text-center uppercase">{t('games.shuraRun.controlsTitle')}</h2>
                                        <div className="flex flex-col items-start gap-6 w-full mb-8">
                                            <div className="flex items-center justify-between text-white w-full gap-4">
                                                <div className="bg-zinc-800 border-4 border-gray-500 p-2 md:p-3 shadow-[0_4px_0_#555] flex-1 text-center">
                                                    <span className="text-[10px] md:text-sm">SPACE / ↑</span>
                                                </div>
                                                <span className="text-[10px] md:text-sm text-gray-300 flex-1 text-right uppercase">{t('games.shuraRun.controlsJump')}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-white w-full gap-4">
                                                <div className="bg-zinc-800 border-4 border-gray-500 p-2 md:p-3 shadow-[0_4px_0_#555] flex-1 text-center">
                                                    <span className="text-[10px] md:text-sm">CLICK</span>
                                                </div>
                                                <span className="text-[10px] md:text-sm text-gray-300 flex-1 text-right uppercase">{t('games.shuraRun.controlsTap')}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-white w-full gap-4">
                                                <div className="bg-zinc-800 border-4 border-gray-500 p-2 md:p-3 shadow-[0_4px_0_#555] flex-1 text-center">
                                                    <span className="text-[10px] md:text-sm">↓ DOWN</span>
                                                </div>
                                                <span className="text-[10px] md:text-sm text-gray-300 flex-1 text-right uppercase">{t('games.shuraRun.controlsQuickFall')}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-white w-full gap-4">
                                                <div className="bg-zinc-800 border-4 border-gray-500 p-2 md:p-3 shadow-[0_4px_0_#555] flex-1 text-center">
                                                    <span className="text-[10px] md:text-sm">ESC / P</span>
                                                </div>
                                                <span className="text-[10px] md:text-sm text-gray-300 flex-1 text-right uppercase">{t('games.shuraRun.controlsPause')}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setMenuViewSync('main'); }}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            className="w-full bg-neon-cyan text-black text-xs md:text-sm py-4 border-4 border-white hover:bg-[#00e5e5] transition-colors pixel-shadow"
                                        >
                                            ← {t('games.shuraRun.back')}
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
                                {t('games.shuraRun.hallOfFame')}
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
                                        <span>{t('games.shuraRun.progressLabel')}</span>
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
                            <h4 className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-4">{t('games.shuraRun.menuControls')}</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2 text-xs text-white">
                                    <kbd className="px-2 py-1 bg-zinc-800 rounded border border-zinc-700 font-pixel text-[10px]">SPACE</kbd>
                                    <span className="uppercase">{t('games.shuraRun.jump')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-white">
                                    <kbd className="px-2 py-1 bg-zinc-800 rounded border border-zinc-700 font-pixel text-[10px]">ESC</kbd>
                                    <span className="uppercase">{t('games.shuraRun.pause')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Existing Modals were successfully removed to retain everything in-canvas. */}

            
            {/* Interactive FAB */}
            <button 
                onClick={startGame}
                className="fixed bottom-8 right-8 h-16 w-16 bg-neon-pink text-white rounded-full shadow-[0_0_30px_rgba(255,0,127,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all group z-50 overflow-visible"
            >
                <MdDirectionsRun className="text-3xl" />
                <span className="absolute right-20 bg-zinc-900 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none border border-neon-pink/20 translate-x-4 group-hover:translate-x-0">
                    {t('games.shuraRun.quickStart')}
                </span>
            </button>
        </main>
    );

}