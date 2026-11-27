'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { submitGameScore, checkExistingScore } from '../../../utils/supabaseScoreService';
import Leaderboard from '../Leaderboard';
import { useLanguage } from '../../../context/LanguageContext';
import { gsap } from 'gsap';
import { MdArrowBack, MdDirectionsRun, MdKeyboard, MdLogout, MdPlayArrow, MdRefresh, MdTune } from 'react-icons/md';

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
    // Canvas can't read CSS variables, so resolve the display font family once
    const hudFontRef = useRef('sans-serif');

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

        const displayFont = getComputedStyle(document.documentElement).getPropertyValue('--font-display').trim();
        if (displayFont) hudFontRef.current = `${displayFont}, sans-serif`;

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
        if (deathSound.current) {
            deathSound.current.currentTime = 0;
            deathSound.current.play().catch(() => { });
        }
        if (bgMusic.current) bgMusic.current.pause();

        const currentHigh = parseInt(localStorage.getItem('shuraRunHighScore') || '0');
        if (scoreRef.current > currentHigh) {
            localStorage.setItem('shuraRunHighScore', scoreRef.current.toString());
            setHighScore(scoreRef.current);
        }

        const name = playerName || 'Anonymous';
        const check = await checkExistingScore('shura_run', name);

        if (check.exists && check.score !== null) {
            if (scoreRef.current > check.score) {
                const result = await submitGameScore('shura_run', name, scoreRef.current);
                if (result.success && result.updated) {
                    setUpdateMessage(t('games.shuraRun.updatingScore'));
                    setTimeout(() => setUpdateMessage(null), 3000);
                }
            }
        } else {
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

        let deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0;
        if (deltaTime > 0.1) deltaTime = 0.016;

        lastTimeRef.current = timestamp;
        frameCountRef.current++;

        if (gameState === 'playing') {
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

            particlesRef.current.forEach(p => {
                p.x += p.vx * deltaTime * 60;
                p.y += p.vy * deltaTime * 60;
                p.opacity -= 0.02 * deltaTime * 60;
                p.size *= Math.pow(0.98, deltaTime * 60);
                if (p.opacity <= 0) p.markedForDeletion = true;
            });
            particlesRef.current = particlesRef.current.filter(p => !p.markedForDeletion);

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

        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.drawImage(assetsRef.current.sol, CANVAS_WIDTH - 400, 100, 200, 200);

        const cloudGap = 800;
        for (let i = 0; i < 3; i++) {
            const cloudX = ((timestamp * 0.02 + i * cloudGap) % (CANVAS_WIDTH + 400)) - 200;
            ctx.drawImage(assetsRef.current.nube, CANVAS_WIDTH - cloudX, 100 + i * 50, 300, 150);
        }

        decorationsRef.current.forEach(dec => {
            ctx.globalAlpha = 0.5;
            ctx.drawImage(assetsRef.current[dec.asset], dec.x, dec.y, dec.width, dec.height);
            ctx.globalAlpha = 1.0;
        });

        const groundLevel = CANVAS_HEIGHT - 140;
        const groundImg = assetsRef.current.tierra;
        const groundWidth = 400;

        const currentGroundOffset = (gameState === 'playing')
            ? (timestamp * (speedRef.current * 0.05)) % groundWidth
            : (deathTimestampRef.current * (speedRef.current * 0.05)) % groundWidth;

        for (let i = 0; i <= CANVAS_WIDTH / groundWidth + 1; i++) {
            ctx.drawImage(groundImg, (i * groundWidth) - currentGroundOffset, groundLevel, groundWidth, 140);
        }

        particlesRef.current.forEach(p => {
            ctx.fillStyle = `rgba(200, 200, 200, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        obstaclesRef.current.forEach(obs => {
            const assetName = obs.type === 'hater' ? 'enemigo' :
                obs.type === 'hater2' ? 'enemigo2' :
                    obs.type === 'concha' ? 'concha' :
                        obs.type === 'salmon' ? 'salmon' : 'pancake';
            ctx.drawImage(assetsRef.current[assetName as keyof typeof assetsRef.current], obs.x, obs.y, obs.width, obs.height);
        });

        const player = playerRef.current;
        if (gameState === 'gameover') {
            const timeSinceDeath = timestamp - deathTimestampRef.current;
            const dropDuration = 400;

            if (timeSinceDeath < dropDuration) {
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
                const loopFrame = Math.floor((timeSinceDeath - dropDuration) / 150) % 2;
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(
                    assetsRef.current.muerteLoop,
                    loopFrame * 64, 0,
                    64, 83,
                    player.x, player.y,
                    player.width, player.height
                );

                if (timeSinceDeath - dropDuration > 3000 && !showGameOverUI) {
                    setShowGameOverUI(true);
                }
            }
        } else {
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

            if (powerUpsRef.current.salmon.active && gameState === 'playing') {
                ctx.save();
                ctx.shadowColor = '#ffff00';
                ctx.shadowBlur = 25;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
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
                labelText = t('games.shuraRun.godMode') || 'GOD MODE';
            } else if (hasConcha) {
                pProgress = Math.max(0, (powerUpsRef.current.concha.endTime - pNow) / 30000);
                barColor1 = '#00e5ff'; barColor2 = '#0055cc';
                labelText = t('games.shuraRun.doubleJump') || 'DOBLE SALTO';
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
            ctx.fillStyle = 'white'; ctx.font = `bold 26px ${hudFontRef.current}`; ctx.textAlign = 'center'; ctx.shadowBlur = 10;
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
        } else {
            document.exitFullscreen?.();
        }
    }, []);

    useEffect(() => {
        const sync = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', sync);
        return () => document.removeEventListener('fullscreenchange', sync);
    }, []);

    const startGame = () => {
        if (typeof window !== 'undefined') {
            const newUrl = `${window.location.pathname}?game=shuraRun&state=playing`;
            window.history.pushState({ path: newUrl }, '', newUrl);
        }

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

    const exitToMain = useCallback(() => {
        setGameState('start');
        isPlayingRef.current = false;
        setIsPaused(false);
        isPausedRef.current = false;
        setMenuViewSync('main');
        setShowPauseMenu(false);
        if (bgMusic.current) bgMusic.current.pause();
        
        if (typeof window !== 'undefined') {
            const cleanUrl = `${window.location.pathname}?game=shuraRun`;
            window.history.pushState({ path: cleanUrl }, '', cleanUrl);
        }
    }, []);

    // =========================================================================
    // ¡CORRECCIÓN AQUÍ! Se eliminó la línea "setMenuViewSync('main')" de este bloque
    // =========================================================================
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const state = params.get('state');

        if (state === 'playing') {
            if (gameState !== 'playing' && gameState !== 'gameover') {
                startGame();
            }
        } else if (state === 'start' || !state) {
            setGameState('start');
            isPlayingRef.current = false;
            setIsPaused(false);
            isPausedRef.current = false;
            // Quitamos setMenuViewSync('main') de aquí para que no rompa Ajustes/Controles al leer la URL limpia
            if (bgMusic.current) bgMusic.current.pause();
        }
    }, [gameState]); // Reducidas las dependencias inestables para evitar bucles

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
            if (gameState === 'playing') {
                if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
                    e.preventDefault();
                    togglePause();
                }
            }
            if (!isGameFocusedRef.current) return;
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                if (gameState === 'gameover' && (!showGameOverUI || menuView !== 'main')) return;
                if (gameState === 'playing') jump();
                else if (gameState === 'start' && menuView === 'main' && !(e.target as HTMLElement | null)?.closest('button')) startGame();
            }
            if (e.code === 'ArrowDown') {
                e.preventDefault();
                if (gameState === 'playing' && !isPausedRef.current) fastFall();
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                if (gameState === 'playing' && !isPausedRef.current) cutJump();
            }
        };

        const handleTouchStart = (e: TouchEvent) => {
            if (!isGameFocusedRef.current) return;
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
            if (gameState === 'gameover' && (!showGameOverUI || menuViewRef.current !== 'main')) return;
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
    }, [gameState, jump, cutJump, fastFall, togglePause, showGameOverUI, menuView]);

    const gameOverContainerRef = useRef<HTMLDivElement>(null);

    // Pop the game-over panel in once it is actually on screen (it mounts ~3s after death)
    useEffect(() => {
        const el = gameOverContainerRef.current;
        if (!showGameOverUI || !el) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            gsap.set(el, { opacity: 1 });
            return;
        }
        gsap.fromTo(el, { scale: 0.6, opacity: 0, rotation: -6 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.7, ease: 'back.out(1.7)', force3D: true });
    }, [showGameOverUI]);

    const progress = highScore > 0 ? Math.min(Math.round((score / highScore) * 100), 100) : 0;
    const BTN = '!min-h-10 !py-2 !text-sm sm:!min-h-12 sm:!py-3 sm:!text-base';

    return (
        <main className="mx-auto w-full max-w-7xl select-none">
            <section className="relative mb-14">
                <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
                    <h1 className="font-display text-[clamp(2.6rem,7vw,5.5rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em]">
                        Shura <span className="text-[var(--pink)]">Run</span>
                    </h1>
                    <dl className="flex gap-8 md:gap-12">
                        <div>
                            <dt className="font-display text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">{t('games.shuraRun.score')}</dt>
                            <dd className="score mt-2 text-2xl text-[var(--blue)] dark:text-[var(--cyan)] sm:text-3xl" aria-live="off">{score.toString().padStart(5, '0')}</dd>
                        </div>
                        <div>
                            <dt className="font-display text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">{t('games.shuraRun.highScore')}</dt>
                            <dd className="score mt-2 text-2xl text-[var(--pink)] sm:text-3xl">{highScore.toLocaleString()}</dd>
                        </div>
                    </dl>
                </div>

                {/* CRT bezel around the canvas */}
                <div className="bezel shadow-[10px_10px_0_var(--shadow)]">
                    <div
                        ref={gameContainerRef}
                        className="bezel__screen relative flex aspect-video w-full max-sm:aspect-auto max-sm:h-[23rem] cursor-pointer touch-none select-none flex-col justify-end bg-[#180917] outline-none"
                        tabIndex={0}
                        onMouseEnter={() => {
                            isGameFocusedRef.current = true;
                            gameContainerRef.current?.focus({ preventScroll: true });
                        }}
                        onMouseLeave={() => {
                            isGameFocusedRef.current = false;
                        }}
                        onTouchStart={() => {
                            isGameFocusedRef.current = true;
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (gameState === 'playing' && !isPausedRef.current) jump();
                        }}
                    >
                        <canvas ref={canvasRef} width={1920} height={1080} className="block h-full w-full object-contain" />

                        {/* Main menu */}
                        {gameState === 'start' && menuView === 'main' && (
                            <Overlay>
                                <Panel>
                                    <h2 className="mb-4 text-center font-display text-3xl font-bold uppercase leading-[0.95] sm:mb-6 sm:text-5xl">
                                        Shura <span className="text-[var(--pink)]">Run</span>
                                    </h2>
                                    <div className="flex flex-col gap-3 sm:gap-4">
                                        <button type="button" autoFocus onClick={(e) => { e.stopPropagation(); startGame(); }} {...STOP} className={`btn ${BTN}`}>
                                            <MdPlayArrow className="text-2xl" aria-hidden />
                                            {t('games.shuraRun.menuPlay')}
                                        </button>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); setMenuViewSync('settings'); }} {...STOP} className={`btn btn--ghost ${BTN}`}>
                                            <MdTune className="text-xl" aria-hidden />
                                            {t('games.shuraRun.menuSettings')}
                                        </button>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); setMenuViewSync('controls'); }} {...STOP} className={`btn btn--ghost ${BTN}`}>
                                            <MdKeyboard className="text-xl" aria-hidden />
                                            {t('games.shuraRun.menuControls')}
                                        </button>
                                    </div>
                                </Panel>
                            </Overlay>
                        )}

                        {/* Pause */}
                        {gameState === 'playing' && showPauseMenu && (
                            <Overlay>
                                <Panel tone="cyan">
                                    <h2 className="font-display text-3xl font-bold uppercase leading-none sm:text-4xl">{t('games.shuraRun.pauseTitle')}</h2>
                                    <p className="mt-2 font-display text-xs font-semibold uppercase tracking-[0.14em] opacity-80 sm:mb-2">{t('games.shuraRun.pauseSubtitle')}</p>
                                    <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:gap-4">
                                        <button type="button" autoFocus onClick={(e) => { e.stopPropagation(); togglePause(); }} {...STOP} className={`btn btn--ghost ${BTN} [--line:var(--ink)] [--shadow:var(--ink)]`}>
                                            <MdPlayArrow className="text-2xl" aria-hidden />
                                            {t('games.shuraRun.pauseContinue')}
                                        </button>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); startGame(); }} {...STOP} className={`btn btn--yellow ${BTN} [--line:var(--ink)] [--shadow:var(--ink)]`}>
                                            <MdRefresh className="text-xl" aria-hidden />
                                            {t('games.shuraRun.pauseRestart')}
                                        </button>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); exitToMain(); }} {...STOP} className={`btn ${BTN} [--line:var(--ink)] [--shadow:var(--ink)]`}>
                                            <MdLogout className="text-xl" aria-hidden />
                                            {t('games.shuraRun.pauseExit')}
                                        </button>
                                    </div>
                                    <p className="mt-4 hidden border-t-[3px] border-[var(--ink)] pt-3 text-sm font-semibold leading-snug sm:block">
                                        <span className="font-display font-bold uppercase">{t('games.shuraRun.pauseHintTitle')}</span> {t('games.shuraRun.pauseHintDesc')}
                                    </p>
                                </Panel>
                            </Overlay>
                        )}

                        {/* Settings */}
                        {menuView === 'settings' && (
                            <Overlay strong>
                                <Panel>
                                    <h2 className="mb-4 font-display text-2xl font-bold uppercase leading-none sm:mb-6 sm:text-3xl">{t('games.shuraRun.settingsTitle')}</h2>
                                    <div className="flex flex-col gap-3 sm:gap-4">
                                        <Toggle label={t('games.shuraRun.settingsMusic')} on={!isBgmMuted} onToggle={toggleBgm} />
                                        <Toggle label={t('games.shuraRun.settingsSfx')} on={!isSfxMuted} onToggle={toggleSfx} />
                                        <Toggle label={t('games.shuraRun.settingsFullscreen')} on={isFullscreen} onToggle={toggleFullscreen} />
                                        <button type="button" autoFocus onClick={(e) => { e.stopPropagation(); setMenuViewSync('main'); }} {...STOP} className={`btn btn--yellow mt-1 ${BTN}`}>
                                            <MdArrowBack className="text-xl" aria-hidden />
                                            {t('games.shuraRun.back')}
                                        </button>
                                    </div>
                                </Panel>
                            </Overlay>
                        )}

                        {/* Controls */}
                        {menuView === 'controls' && (
                            <Overlay strong>
                                <Panel>
                                    <h2 className="mb-4 font-display text-2xl font-bold uppercase leading-none sm:mb-6 sm:text-3xl">{t('games.shuraRun.controlsTitle')}</h2>
                                    <ul className="mb-4 flex flex-col gap-3 sm:mb-6 sm:gap-4">
                                        {[
                                            ['SPACE / ↑', t('games.shuraRun.controlsJump')],
                                            ['CLICK', t('games.shuraRun.controlsTap')],
                                            ['↓', t('games.shuraRun.controlsQuickFall')],
                                            ['ESC / P', t('games.shuraRun.controlsPause')],
                                        ].map(([keys, action]) => (
                                            <li key={keys} className="flex items-center justify-between gap-4">
                                                <kbd className="score min-w-[7.5rem] border-[3px] border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-center text-[0.6rem] shadow-[0_4px_0_var(--shadow)]">{keys}</kbd>
                                                <span className="text-right font-display text-sm font-bold uppercase sm:text-base">{action}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <button type="button" autoFocus onClick={(e) => { e.stopPropagation(); setMenuViewSync('main'); }} {...STOP} className={`btn btn--yellow w-full ${BTN}`}>
                                        <MdArrowBack className="text-xl" aria-hidden />
                                        {t('games.shuraRun.back')}
                                    </button>
                                </Panel>
                            </Overlay>
                        )}

                        {/* Game over */}
                        {gameState === 'gameover' && showGameOverUI && (
                            <Overlay>
                                <div ref={gameOverContainerRef} className="w-full max-w-[26rem] opacity-0">
                                    <Panel tone="pink">
                                        <h2 className="text-center font-display text-3xl font-bold uppercase leading-none sm:text-5xl">{t('games.shuraRun.gameOver')}</h2>
                                        <div className="my-4 grid grid-cols-2 gap-3 border-y-[3px] border-[var(--ink)] py-4 text-center sm:my-6 sm:gap-6 sm:py-6">
                                            <div>
                                                <p className="font-display text-xs font-bold uppercase tracking-[0.14em]">{t('games.shuraRun.score')}</p>
                                                <p className="score mt-2 text-lg sm:text-2xl">{score.toString().padStart(5, '0')}</p>
                                            </div>
                                            <div>
                                                <p className="font-display text-xs font-bold uppercase tracking-[0.14em]">{t('games.shuraRun.highScore')}</p>
                                                <p className="score mt-2 text-lg sm:text-2xl">{highScore.toString().padStart(5, '0')}</p>
                                            </div>
                                        </div>
                                        {updateMessage && <p className="mb-3 text-center text-sm font-bold uppercase">{updateMessage}</p>}
                                        <div className="flex flex-col gap-3">
                                            <button type="button" autoFocus onClick={(e) => { e.stopPropagation(); startGame(); }} {...STOP} className={`btn btn--yellow ${BTN} [--line:var(--ink)] [--shadow:var(--ink)]`}>
                                                <MdRefresh className="text-2xl" aria-hidden />
                                                {t('games.shuraRun.continue')}
                                            </button>
                                            <button type="button" onClick={(e) => { e.stopPropagation(); exitToMain(); }} {...STOP} className={`btn btn--ghost ${BTN} [--line:var(--ink)] [--shadow:var(--ink)]`}>
                                                <MdLogout className="text-xl" aria-hidden />
                                                {t('games.shuraRun.pauseExit')}
                                            </button>
                                        </div>
                                    </Panel>
                                </div>
                            </Overlay>
                        )}
                    </div>
                </div>
            </section>

            {/* Ranking and side panels */}
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <h2 className="mb-6 font-display text-3xl font-bold uppercase leading-none">{t('games.shuraRun.hallOfFame')}</h2>
                    <Leaderboard game="shura_run" currentPlayer={playerName} className="w-full" />
                </div>

                <div className="space-y-8">
                    <div className="cart-shell">
                        <div className="cart">
                            <div className="cart__face p-6">
                                <div className="mb-2 flex justify-between font-display text-sm font-bold uppercase">
                                    <span>{t('games.shuraRun.progressLabel')}</span>
                                    <span className="score text-xs">{progress}%</span>
                                </div>
                                <div className="hud-bar hud-bar--cyan" style={{ ['--v' as string]: progress }} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} />
                                <p className="mt-5 flex items-start gap-3 text-base font-medium leading-snug">
                                    <MdDirectionsRun className="mt-0.5 shrink-0 text-2xl text-[var(--pink)]" aria-hidden />
                                    {t('games.shuraRun.instructions')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="hidden border-[3px] border-[var(--line)] bg-[var(--surface)] p-6 md:block">
                        <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-[0.14em] text-[var(--muted)]">{t('games.shuraRun.menuControls')}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 text-sm">
                                <kbd className="score border-[3px] border-[var(--line)] bg-[var(--surface-2)] px-2 py-1 text-[0.55rem]">SPACE</kbd>
                                <span className="font-display font-bold uppercase">{t('games.shuraRun.jump')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <kbd className="score border-[3px] border-[var(--line)] bg-[var(--surface-2)] px-2 py-1 text-[0.55rem]">ESC</kbd>
                                <span className="font-display font-bold uppercase">{t('games.shuraRun.pause')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

/** Stops mouse/touch from reaching the window-level jump handlers. */
const STOP = {
    onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
    onTouchStart: (e: React.TouchEvent) => e.stopPropagation(),
};

function Overlay({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
    return (
        <div className={`absolute inset-0 z-20 flex items-center justify-center overflow-y-auto p-3 sm:p-6 ${strong ? 'bg-[#180917]/95' : 'bg-[#180917]/80'}`}>
            {children}
        </div>
    );
}

function Panel({ children, tone }: { children: React.ReactNode; tone?: 'pink' | 'cyan' }) {
    return (
        <div className="cart-shell w-full max-w-[26rem]">
            <div className={`cart ${tone ? `cart--${tone}` : ''}`}>
                <div className="cart__face p-4 sm:p-6">{children}</div>
            </div>
        </div>
    );
}

function Toggle({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            onClick={(e) => {
                e.stopPropagation();
                onToggle();
            }}
            {...STOP}
            className="flex min-h-10 w-full items-center justify-between gap-4 border-[3px] border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-left font-display text-sm font-bold uppercase transition-colors hover:bg-[var(--yellow)] hover:text-[var(--ink)] sm:min-h-12 sm:text-base"
        >
            <span>{label}</span>
            <span className={`score border-2 border-[var(--ink)] px-2 py-1 text-[0.55rem] ${on ? 'bg-[var(--cyan)] text-[var(--ink)]' : 'bg-[var(--ink)] text-[#fde0f6]'}`}>{on ? 'ON' : 'OFF'}</span>
        </button>
    );
}
