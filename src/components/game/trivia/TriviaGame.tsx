'use client';
import { useEffect, useMemo, useState, useRef, useCallback, ReactNode, Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { triviaQuestions } from '../../../utils/triviaQuestions';
import { useLanguage } from '../../../context/LanguageContext';
import PlayerInput from '../PlayerInput';
import Leaderboard from '../Leaderboard';
import { FiUsers, FiCpu, FiGlobe, FiArrowLeft, FiHeadphones } from 'react-icons/fi';
import { MdCatchingPokemon, MdQuiz, MdTimer, MdCheckCircle, MdEmojiEvents, MdHeadset, MdPsychology, MdHeadphones, MdBolt, MdPriorityHigh, MdStar, MdStars, MdMilitaryTech, MdSportsEsports, MdNotifications, MdPerson, MdHome, MdChevronRight, MdArrowBack, MdArrowForward, MdVisibility, MdPlayArrow, MdPets, MdMusicNote, MdCake, MdGridView, MdLeaderboard, MdShoppingBag, MdSettings, MdAllInclusive, MdSchool, MdSelfImprovement, MdMenuBook, MdRefresh, MdLogout, MdPlayCircle, MdInfo, MdWhatshot, MdLibraryMusic, MdAddCircle, MdRemoveCircle, MdArrowForwardIos, MdQrCode2, MdVideogameAsset, MdHelp } from 'react-icons/md';
import { useGameSounds } from '../../../hooks/useGameSounds';
import { submitGameScore, checkExistingScore } from '../../../utils/supabaseScoreService';
import ScoreOverwriteModal from '../ScoreOverwriteModal';
import RulesModal from '../RulesModal';
import PauseMenu from '../PauseMenu';

export type GameMode = 'timed' | 'untimed' | 'insane' | 'chaos';
export type Category = 'music' | 'pantcake' | 'shurahiwa' | string;

export interface TriviaQuestion {
  question: string;
  options: string[];
  correctIndex?: number;
  correctIndexes?: number[];
  image?: string;
  hint?: string;
  audioUrl?: string;
}

const TIMER_PER_QUESTION = 15;
const TOTAL_QUESTIONS = 20;

// Constantes para los nuevos modos
const INSANE_MODE_QUESTIONS = 20;
const INSANE_MODE_TIMER = 10; // Segundos tras reproducir
const CHAOS_MODE_QUESTIONS = 100;
const CHAOS_MODE_TIMER = 2400; // Segundos totales

const getPointsByRemainingTime = (remaining: number, isCorrect: boolean): number => {
  if (!isCorrect) return -2;
  if (remaining >= 10) return 5;
  if (remaining >= 5) return 3;
  if (remaining >= 1) return 1;
  return 0;
};

const pickQuestions = (questions: TriviaQuestion[], count: number): TriviaQuestion[] => {
  const shuffle = (arr: TriviaQuestion[]): TriviaQuestion[] => arr.map(v => ({ v, r: Math.random() })).sort((a, b) => a.r - b.r).map(x => x.v);
  return shuffle(questions).slice(0, count);
};

interface ScoreIndicatorProps {
  points: number;
  onComplete: () => void;
}

// Animated score indicator component
const ScoreIndicator = ({ points, onComplete }: ScoreIndicatorProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 300);
    }, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const getColorClass = () => {
    if (points > 0) return 'text-green-600 dark:text-green-400';
    if (points < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div
      className={`absolute right-0 top-0 text-2xl font-bold transition-all duration-1000 ${getColorClass()} ${visible ? 'opacity-100 -translate-y-8' : 'opacity-0 -translate-y-16'
        }`}
    >
      {points > 0 ? `+${points}` : points}
    </div>
  );
};

const TriviaGame = ({ playerName }: { playerName: string }) => {
  // Styles as strings for injection
  const customStyles = `
    .retro-grid {
        background-image: radial-gradient(#dbdddd 0.5px, transparent 0.5px);
        background-size: 24px 24px;
    }
    .pixel-dots {
        background-image: radial-gradient(circle, #dbdddd 1px, transparent 1px);
        background-size: 24px 24px;
    }
    .scanline-overlay {
        background: linear-gradient(to bottom, rgba(181, 0, 88, 0.03) 50%, rgba(255, 255, 255, 0) 50%);
        background-size: 100% 4px;
        pointer-events: none;
    }
    .scanline-overlay-insane {
        background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.05) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.02), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.02));
        background-size: 100% 2px, 3px 100%;
        pointer-events: none;
    }
  `;

  const { t } = useLanguage();
  const router = useRouter();
  const { playSelect, playCorrect, playIncorrect, playVictory, playCountdown } = useGameSounds();
  const [category, setCategory] = useState<Category | null>(null); // null, 'music', 'pantcake', 'shurahiwa'
  const [gameMode, setGameMode] = useState<GameMode | null>(null); // Added 'insane' and 'chaos'
  const [started, setStarted] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [countValue, setCountValue] = useState(3);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'incorrect' | 'timeout'; text: string } | null>(null);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [remaining, setRemaining] = useState(TIMER_PER_QUESTION);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [scoreChange, setScoreChange] = useState<number | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [pendingMode, setPendingMode] = useState<GameMode | null>(null);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [pendingScoreData, setPendingScoreData] = useState<{ score: number, oldScore: number } | null>(null);
  const [showNavigationConfirm, setShowNavigationConfirm] = useState(false);
  const [pendingNavigationAction, setPendingNavigationAction] = useState<(() => void) | null>(null);

  // Stats for Chaos Mode
  const [chaosStats, setChaosStats] = useState({ correct: 0, incorrect: 0 });

  // Stats for Timed Mode
  const [timedStats, setTimedStats] = useState({ correct: 0, incorrect: 0, streak: 0 });
  const [maxStreak, setMaxStreak] = useState(0);

  // Insane Mode State
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false);

  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Memoize questions based on selected category
  const questions = useMemo(() => {
    // Aquí le decimos que category es una de las llaves del objeto triviaQuestions
    const currentCategory = category as keyof typeof triviaQuestions;

    if (!category || !triviaQuestions[currentCategory]) return [];

    // Logic for Music Modes
    if (category === 'music') {
      if (gameMode === 'insane') {
        return pickQuestions(triviaQuestions[currentCategory], INSANE_MODE_QUESTIONS);
      } else if (gameMode === 'chaos') {
        return pickQuestions(triviaQuestions[currentCategory], CHAOS_MODE_QUESTIONS);
      }
    }

    return pickQuestions(triviaQuestions[currentCategory], TOTAL_QUESTIONS);
  }, [category, gameMode]);

  const current = questions[index];

  // Handle music category audio fragment
  useEffect(() => {
    // Only auto-play for non-music categories or normal modes. 
    // Insane/Chaos logic handles audio differently (manual play)
    if (category === 'music' && (gameMode === 'insane' || gameMode === 'chaos')) {
      // Reset audio state for new question
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsAudioPlaying(false);
      }
      setHasPlayedAudio(false);
      return;
    }

    if (!current || !started || gameOver || !current.audioUrl) return;

    // Stop and reset existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(current.audioUrl);
    audioRef.current = audio;
    audio.volume = 0.5;

    const playFragment = async () => {
      try {
        await audio.play();
        setIsAudioPlaying(true);

        // Generate a random start point (between 10% and 60% of duration if available, or just random small offset)
        // Since we might not have duration yet, we'll just start at 0 or a fixed offset for covers
        audio.currentTime = 15; // Start at 15s to get into the song usually

        // Play for 7-10 seconds
        const duration = 7000 + Math.random() * 3000;
        setTimeout(() => {
          if (audioRef.current === audio) {
            audio.pause();
            setIsAudioPlaying(false);
          }
        }, duration);
      } catch (err) {
        console.error("Audio play failed:", err);
      }
    };

    playFragment();

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [index, started, gameOver, current, category, gameMode]);

  // Stop audio when answered
  useEffect(() => {
    if (answered && audioRef.current) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    }
  }, [answered]);

  // Pause audio when menu is open
  useEffect(() => {
    if (showPauseMenu && audioRef.current) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    }
  }, [showPauseMenu]);

  // Check if current question has multiple answers
  const isMultipleAnswer = current && Array.isArray(current.correctIndexes);
  // FIX: Add safety check for current
  const correctAnswerIndexes: number[] = current
    ? (isMultipleAnswer ? (current.correctIndexes || []) : [current.correctIndex ?? 0])
    : [];

  useEffect(() => {
    if (!started || gameOver) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [started, gameOver]);

  // Timer Logic
  useEffect(() => {
    if (!started || gameOver || (answered && gameMode !== 'chaos') || gameMode === 'untimed' || showPauseMenu) return;

    if (gameMode === 'chaos') {
    } else if (gameMode === 'insane') {
      if (!hasPlayedAudio) return; // No timer until audio is played
    } else {
      setRemaining(TIMER_PER_QUESTION);
    }

    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [index, started, gameOver, answered, gameMode, hasPlayedAudio, showPauseMenu]);

  const selectCategory = (cat: Category) => {
    playSelect();
    setCategory(cat);
  };

  const realStartGame = useCallback(() => {
    setStarted(true);
    setIndex(0);
    setScore(0);
    setAnswered(false);
    setSelectedAnswers([]);
    setChaosStats({ correct: 0, incorrect: 0 });
    setTimedStats({ correct: 0, incorrect: 0, streak: 0 });
    setMaxStreak(0);

    // Initialize Timer based on Mode
    if (pendingMode === 'chaos') {
      setRemaining(CHAOS_MODE_TIMER);
    } else if (pendingMode === 'insane') {
      setRemaining(0); // Timer inactive initially
      setHasPlayedAudio(false);
    } else {
      setRemaining(TIMER_PER_QUESTION);
    }

    setIsCountingDown(false);
  }, [pendingMode]);

  const startGame = (mode: GameMode) => {
    setPendingMode(mode);
    setShowRules(true);
  };

  const confirmStartGame = () => {
    setShowRules(false);
    if (pendingMode) {
      playSelect();
      setGameMode(pendingMode);
      setIsCountingDown(true);
      setCountValue(3);
    }
  };

  // Manual Play for Music Modes
  const handleManualPlay = () => {
    if (isAudioPlaying || answered || !current?.audioUrl) return;

    if (gameMode === 'insane') {
      setScore(prev => Math.max(0, prev - 3));
    }

    // Si audioRef.current es null (ocurre en modos insane/chaos porque el useEffect
    // hace un return temprano sin crear el objeto Audio), lo creamos aquí.
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = 0.5;
    }

    const audio = audioRef.current;

    // 1. FORZAR EL NUEVO SRC: R2 a veces necesita que se le asigne el src justo antes de tocar
    audio.src = current.audioUrl;

    // 2. CARGAR EL ARCHIVO
    audio.load();

    // 3. REPRODUCIR CON MANEJO DE ERRORES (Importante para depurar)
    audio.play()
      .then(() => {
        setIsAudioPlaying(true);
        setHasPlayedAudio(true);
        if (gameMode === 'insane') {
          setRemaining(INSANE_MODE_TIMER);
        }
      })
      .catch(error => {
        console.error("Error de R2:", error);
        // Si sale error de CORS, aquí lo verás en la consola
      });
  };

  // Countdown logic
  useEffect(() => {
    if (!isCountingDown) {
      setCountValue(3); // Reset when not counting down
      return;
    }

    const timer = setInterval(() => {
      setCountValue(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          setTimeout(() => {
            setIsCountingDown(false);
            realStartGame();
          }, 800);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCountingDown, realStartGame]);

  // Audio for countdown
  useEffect(() => {
    if (!isCountingDown) return;
    playCountdown(countValue);
  }, [countValue, isCountingDown, playCountdown]);


  const handleOptionClick = (optIndex: number) => {
    if (answered && gameMode !== 'chaos') return; // In chaos mode, we might want rapid fire? No, usually one answer per question.

    if (isMultipleAnswer) {

      playSelect();
      setSelectedAnswers(prev => {
        if (prev.includes(optIndex)) {
          return prev.filter(i => i !== optIndex);
        } else {
          return [...prev, optIndex];
        }
      });
    } else {

      setSelectedAnswers([optIndex]);
      submitAnswer([optIndex]);
    }
  };

  const submitAnswer = (selectedIndexes = selectedAnswers) => {
    if (!current || (answered && gameMode !== 'chaos') || selectedIndexes.length === 0) return;

    let isCorrect = false;
    let isPartial = false;

    if (isMultipleAnswer) {
      const correctSet = new Set(current.correctIndexes || []);
      const selectedSet = new Set(selectedIndexes);
      isCorrect = correctSet.size === selectedSet.size &&
        [...correctSet].every(idx => selectedSet.has(idx as number));

      if (!isCorrect) {
        const correctSelected = [...selectedSet].filter(idx => correctSet.has(idx)).length;
        const incorrectSelected = [...selectedSet].filter(idx => !correctSet.has(idx)).length;
        isPartial = correctSelected > 0 && incorrectSelected > 0;
      }
    } else {
      isCorrect = selectedIndexes[0] === current.correctIndex;
    }

    let pts = 0;

    // LÓGICA DE RACHA UNIFICADA
    if (isCorrect || isPartial) {
      setTimedStats(prev => {
        const newStreak = prev.streak + 1;
        setMaxStreak(m => Math.max(m, newStreak));
        return { ...prev, correct: prev.correct + 1, streak: newStreak };
      });
    } else {
      setTimedStats(prev => ({ ...prev, incorrect: prev.incorrect + 1, streak: 0 }));
    }

    // --- LÓGICA DE PUNTOS ACTUALIZADA ---
    if (gameMode === 'insane') {
      // +10 si es correcto, -5 si es incorrecto
      // (La penalización de -3 por audio se aplica en handleManualPlay)
      pts = isCorrect ? 10 : -5;
    } else if (gameMode === 'chaos') {
      pts = isCorrect ? 10 : -3;
      if (isCorrect) setChaosStats(prev => ({ ...prev, correct: prev.correct + 1 }));
      else setChaosStats(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
    } else if (gameMode === 'timed') {
      pts = isCorrect ? getPointsByRemainingTime(remaining, true) : (isPartial ? 1 : -2);
    } else {
      pts = isCorrect ? 5 : (isPartial ? 1 : 0);
    }

    // Usamos Math.max(0, ...) para que el score nunca sea negativo
    setScore(s => Math.max(0, s + pts));
    setScoreChange(pts);
    setAnswered(true);

    // Detener audio si estaba sonando (Importante para el flujo del juego)
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsAudioPlaying(false);
    }

    if (!isCorrect && !isPartial) {
      playIncorrect();
      setFeedback({ type: 'incorrect', text: t('games.trivia.incorrectFeedback') });
      setShowCorrectAnswer(true);
    } else {
      playCorrect();
      setFeedback({ type: 'correct', text: t('games.trivia.correctFeedback') });
    }

    setTimeout(() => setFeedback(null), 1000);
  };

  const handleTimeout = () => {
    if (answered) return;

    if (gameMode === 'chaos') {
      setGameOver(true);
      playVictory();
      return;
    }

    setAnswered(true);
    setScoreChange(0);
    playIncorrect();
    setShowCorrectAnswer(true);

    // REINICIAR RACHA AL AGOTARSE EL TIEMPO
    setTimedStats(prev => ({ ...prev, incorrect: prev.incorrect + 1, streak: 0 }));
  };

  const nextQuestion = async () => {
    playSelect();
    if (index + 1 >= questions.length || (gameMode !== 'chaos' && index + 1 >= TOTAL_QUESTIONS) || (gameMode === 'chaos' && index + 1 >= CHAOS_MODE_QUESTIONS)) {
      setGameOver(true);
      playVictory();

      // Submit score logic
      if (category && gameMode) {
        const scoreDifficulty = category === 'music' ? `${category}:${gameMode}` : category;

        // 1. Check if we should show overwrite modal
        const check = await checkExistingScore('trivia', playerName, scoreDifficulty);

        if (check.exists && check.score !== null) {
          // If new score is better (higher for trivia), ask to overwrite
          if (score > check.score) {
            setPendingScoreData({ score, oldScore: check.score });
            setShowOverwriteModal(true);
            return;
          } else {
            // If not better, just ignore (existing service logic already handles this, but good to be explicit here)
            return;
          }
        }

        // 2. If no existing score, just submit
        const result = await submitGameScore('trivia', playerName, score, scoreDifficulty, { mode: gameMode });

        if (result.success && result.updated) {
          setUpdateMessage(t('games.trivia.scoreUpdating'));
          setTimeout(() => setUpdateMessage(null), 3500);
        }
      }
      return;
    }

    setIndex(i => i + 1);
    setAnswered(false);
    setSelectedAnswers([]);
    setShowCorrectAnswer(false);
    setScoreChange(null);
    setHasPlayedAudio(false); // Reset insane mode audio flag

    // Chaos Mode: Timer continues running, don't reset.
    if (gameMode !== 'chaos') {
      // Reset timer for other modes if needed (Insane handles it via audio)
      if (gameMode === 'timed') setRemaining(TIMER_PER_QUESTION);
    }
  };

  const resetToSelection = () => {
    setStarted(false);
    setCategory(null);
    setGameMode(null);
    setGameOver(false);
    setIndex(0);
    setScore(0);
    setAnswered(false);
    setSelectedAnswers([]);
    setShowCorrectAnswer(false);
    setScoreChange(null);
    setTimedStats({ correct: 0, incorrect: 0, streak: 0 });
    setMaxStreak(0);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setShowOverwriteModal(false);
    setPendingScoreData(null);
  };

  const handleGoHome = () => {
    router.push('/games');
  };

  const confirmOverwrite = async () => {
    if (!pendingScoreData || !category || !gameMode) return;

    setShowOverwriteModal(false);
    const scoreDifficulty = category === 'music' ? `${category}:${gameMode}` : category;

    const result = await submitGameScore('trivia', playerName, pendingScoreData.score, scoreDifficulty, { mode: gameMode });

    if (result.success) {
      setUpdateMessage(t('games.trivia.scoreUpdating'));
      setTimeout(() => setUpdateMessage(null), 3500);
    }
    setPendingScoreData(null);
  };

  const renderCategorySelection = () => (
    <div className="relative flex flex-col w-full animate-fade-in pt-4 pb-8 md:pt-6 md:pb-12 text-slate-900 dark:text-slate-100">
      <div className="relative z-10 space-y-8 -mt-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-blue to-primary-pink rounded-lg flex items-center justify-center text-white neon-glow">
              <MdSportsEsports className="text-2xl" />
            </div>
            <h2 className="text-xl font-bold tracking-tight bg-clip-text bg-gradient-to-r from-gray-800 dark:from-white to-primary-blue/80">Trivia Gamer</h2>
          </div>
          <div className="flex gap-4">
            <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-white/5 border border-white/10 text-slate-400 hover:text-primary-blue transition-colors">
              <MdNotifications />
            </button>
            <div className="flex items-center gap-2 p-2 w-fit">
              <div className="bg-white p-1 border border-black rounded-full">
                <MdPerson className="text-black text-xl" />
              </div>
              <span className="font-bold dark:text-white uppercase text-sm">
                {playerName || "Invitado"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <MdHome className="text-lg" />
            <span>Menu</span>
            <MdChevronRight />
            <span className="text-primary-blue font-medium">Categorías</span>
          </div>
        </div>
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-5xl font-black mb-3 tracking-tighter text-gray-800 dark:text-slate-100 uppercase italic">
            Elige tu <span className="text-primary-pink underline decoration-primary-pink/50 underline-offset-8">Categoría</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto md:mx-0">Demuestra tu nivel y desbloquea recompensas exclusivas en los desafíos de esta temporada.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div onClick={() => selectCategory('pantcake')} className="glass-card rounded-2xl p-1 flex flex-col group cursor-pointer overflow-hidden relative">
            <div className="relative aspect-video rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
              <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuADmNov2I1T3_GAPg4x6T2vc6Fio5cSU4M2wKPdKqzF65X9YvbsgPb8vo9mtABT1BQGEEY73P-rrGZpfIMxXC1kPZ_pRm1livhbXPkVRBqux0rfNqt6xN8A0XnigLhD0ZJRgz5yJPxN2GAA5qZhKcls00e0zztFlPxyTljSnRqe0e4tmfeiQYVvjhdJIYkp0PN7MX99T82pNvsr496dmg3NcyFid9eXnEmPgQcLqGCAHHEL0481iZEKwAVZYywTp7u6uW3UjkcvqRI" alt="pantcake" />
              <div className="absolute top-4 right-4 z-20 bg-primary-blue/20 backdrop-blur-md px-3 py-1 rounded-full border border-primary-blue/30"><span className="text-[10px] font-bold text-primary-blue uppercase tracking-widest">Hot 🔥</span></div>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-blue/10 flex items-center justify-center border border-primary-blue/20 neon-glow"><MdCake className="text-2xl text-primary-blue" /></div>
                <div><h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-primary-blue transition-colors">pantcake</h3><p className="text-slate-500 dark:text-slate-400 text-xs">{t('games.trivia.categorypantcake')}</p></div>
              </div>
            </div>
          </div>
          {/* Categoría: ShuraHiwa */}
          <div onClick={() => selectCategory('shurahiwa')} className="glass-card rounded-2xl p-1 flex flex-col group cursor-pointer overflow-hidden relative">
            <div className="relative aspect-video rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
              <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAy4HZrC4g-8Zmziv4BRCnLFks-2CZSAEHICVSO60Zm9pvzJAmbzW8LteJzSU1o88U6-WJhrVjYuCk15Wdv0RvNCuWWQKOa0ZBm-6MahOj1tZDR0cOO-Jp_o-VBgtp2JXZrB7RW-dS3BDX0z9-x3H5kwL4Ugx7ubmCrvvYgH1bDqRLg7GpZgqgi-XOCXDlwiGI1X3PF8qRlSILVqAgtVCqkVifG9T8dWE9sNCAg3EiVIbm6lsGmo4tMnZj5-PatL2AyOi5INWmZFIk" alt="ShuraHiwa" />
              <div className="absolute top-4 right-4 z-20 bg-primary-pink/20 backdrop-blur-md px-3 py-1 rounded-full border border-primary-pink/30"><span className="text-[10px] font-bold text-primary-pink uppercase tracking-widest">Rare 💎</span></div>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-pink/10 flex items-center justify-center text-primary-pink border border-primary-pink/20 neon-glow-pink"><MdPets className="text-2xl" /></div>
                <div><h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-primary-pink transition-colors">ShuraHiwa</h3><p className="text-slate-500 dark:text-slate-400 text-xs">{t('games.trivia.categoryShura')}</p></div>
              </div>
            </div>
          </div>
          {/* Categoría: Canciones */}
          <div onClick={() => selectCategory('music')} className="glass-card rounded-2xl p-1 flex flex-col group cursor-pointer overflow-hidden relative">
            <div className="relative aspect-video rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
              <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-60" src="https://www.freepik.es/foto-gratis/audiencia-emocionada-viendo-fuegos-artificiales-confeti-divirtiendose-festival-musica-noche-copiar-espacio_25566947.htm#fromView=keyword&page=1&position=1&uuid=59055ed4-19e3-46c4-853e-f6f7ef07e82a&query=Concert+background" alt="Music" />
              <div className="absolute top-4 right-4 z-20 bg-purple-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-purple-500/30"><span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Viral 🎵</span></div>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20"><MdMusicNote className="text-2xl" /></div>
                <div><h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-purple-400 transition-colors">{t('games.trivia.categoryMusicTitle')}</h3><p className="text-slate-500 dark:text-slate-400 text-xs">{t('games.trivia.categoryMusic')}</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderModeSelection = () => {
    if (category === 'music') {
      return (
        <div className="relative flex flex-col w-full animate-fade-in text-slate-900 dark:text-slate-100">
          <div className="relative z-10 space-y-8">
            <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-2">
              <div className="flex items-center gap-3">
                <MdSportsEsports className="text-3xl text-primary-blue" />
                <h2 className="text-xl font-bold">Trivia Master</h2>
              </div>
              <button onClick={() => setCategory(null)} className="h-10 w-10 flex items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-primary-blue transition-colors">
                <MdSettings />
              </button>
            </header>
            <main className="flex flex-col items-center justify-center py-6 text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight glow-text text-slate-900 dark:text-white uppercase italic">
                Desafío <span className="text-red-600">Musical</span>
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg mb-12">Pon a prueba tu oído con los modos más extremos</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
                <div onClick={() => startGame('insane')} className="group relative overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900/50 border-2 border-red-600/30 p-8 transition-all hover:border-red-600 hover:scale-[1.02] cursor-pointer">
                  <div className="mb-6 flex size-24 items-center justify-center mx-auto rounded-full bg-red-600/20 text-red-600 shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                    <MdPsychology className="text-6xl" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 uppercase">{t('games.trivia.insaneMode')}</h3>
                  <button className="w-full bg-red-600 text-white font-bold py-4 rounded-lg">HARDCORE</button>
                </div>
                <div onClick={() => startGame('chaos')} className="group relative overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900/50 border-2 border-purple-600/30 p-8 transition-all hover:border-purple-600 hover:scale-[1.02] cursor-pointer">
                  <div className="mb-6 flex size-24 items-center justify-center mx-auto rounded-full bg-purple-600/20 text-purple-600 shadow-[0_0_20px_rgba(147,51,234,0.3)]">
                    <MdBolt className="text-6xl" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 uppercase">{t('games.trivia.chaosMode')}</h3>
                  <button className="w-full bg-purple-600 text-white font-bold py-4 rounded-lg">CHAOS</button>
                </div>
              </div>
            </main>
          </div>
        </div>
      );
    }
    return (
      <div className="relative flex flex-col w-full animate-fade-in text-slate-900 dark:text-slate-100">
        <div className="relative z-10 space-y-8">
          <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-2">
            <div className="flex items-center gap-3">
              <MdSportsEsports className="text-3xl text-primary-blue" />
              <h2 className="text-xl font-bold">Trivia Master</h2>
            </div>
            <button onClick={() => setCategory(null)} className="h-10 w-10 flex items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-primary-blue transition-colors">
              <MdSettings />
            </button>
          </header>
          <main className="flex flex-col items-center justify-center py-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight glow-text text-slate-900 dark:text-white uppercase italic">
              Selecciona tu <span className="text-primary-blue">Desafío</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg mb-12">Elige cómo quieres poner a prueba tus conocimientos hoy ({category?.toUpperCase()})</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
              <div onClick={() => startGame('timed')} className="group relative overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900/50 border-2 border-primary-blue/40 p-8 cursor-pointer">
                <MdTimer className="text-6xl text-primary-blue mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-3 uppercase">Con Tiempo</h3>
                <button className="w-full bg-primary-blue text-white font-bold py-4 rounded-lg">COMENZAR</button>
              </div>
              <div onClick={() => startGame('untimed')} className="group relative overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900/50 border-2 border-slate-300 p-8 cursor-pointer">
                <MdAllInclusive className="text-6xl text-slate-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-3 uppercase">Sin Tiempo</h3>
                <button className="w-full bg-primary-pink text-white font-bold py-4 rounded-lg">EXPLORAR</button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  };


  const getStatusMessage = (value: number) => {
    switch (value) {
      case 3: return t('games.trivia.countdownReady');
      case 2: return t('games.trivia.countdownSet');
      case 1: return t('games.trivia.countdownSteady');
      case 0: return t('games.trivia.countdownGo');
      default: return '';
    }
  };


  const renderCountdown = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      {/* Contenedor con padding superior para evitar que se corte al brincar */}
      <div className="pt-12 md:pt-20">
        <div
          className="text-9xl md:text-[12rem] font-black italic tracking-tighter text-primary-blue dark:text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)] animate-bounce"
        >
          {/* Usamos countValue en lugar de countdown */}
          {countValue === 0 ? 'GO!' : countValue}
        </div>
      </div>
      <p className="mt-8 text-2xl md:text-3xl font-bold uppercase tracking-widest opacity-50">
        {/* Usamos la función de traducción t que ya tienes definida */}
        {countValue === 0 ? t('games.trivia.countdownGo') : t('games.trivia.countdownReady')}
      </p>
    </div>
  );

  const renderGameOverUI = () => (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto gap-6 py-8 px-4 animate-fade-in min-h-screen">
      {/* Título Principal */}
      <div className="text-center mb-4">
        <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-black dark:text-white drop-shadow-[4px_4px_0px_#FF007F]">
          ¡FIN DEL JUEGO!
        </h1>
      </div>

      {/* Estadísticas: Ahora en un contenedor flexible que no se corta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-6">
        <div className="bg-white dark:bg-zinc-900 border-4 border-black p-4 shadow-[5px_5px_0px_0px_#FF007F] flex flex-col items-center">
          <span className="text-[10px] font-black uppercase opacity-60">Puntaje</span>
          <span className="text-3xl font-black italic text-[#FF007F]">{score}</span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border-4 border-black p-4 shadow-[5px_5px_0px_0px_#00E5FF] flex flex-col items-center">
          <span className="text-[10px] font-black uppercase opacity-60">Mejor Racha</span>
          <span className="text-3xl font-black italic text-[#00E5FF]">{maxStreak}</span>
        </div>
      </div>

      {/* Tabla de Ranking: Ocupa su propio espacio sin pisar lo anterior */}
      <div className="w-full bg-white dark:bg-zinc-900 border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
        <h3 className="text-lg font-black uppercase italic tracking-tighter mb-4 text-center border-b-2 border-black pb-2">
          TABLA DE POSICIONES
        </h3>
        <div className="w-full">
          {/* Aquí renderiza el Leaderboard solo una vez */}
          <Leaderboard category={category ?? undefined} mode={gameMode ?? undefined} currentPlayer={playerName} game="trivia" />
        </div>
      </div>

      {/* Botón Volver (Ahora al final de todo) */}
      <button
        onClick={() => window.location.reload()}
        className="mt-4 bg-[#FF007F] text-white font-black px-10 py-4 uppercase italic border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all w-full md:w-auto"
      >
        Jugar de Nuevo
      </button>
    </div>
  );

  const renderChaosMode = () => {
    if (!current) return null;

    const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
      <div className="flex-grow container mx-auto px-4 md:px-6 py-8 md:py-12 flex flex-col md:grid md:grid-cols-12 gap-8 mb-24 md:mb-0 animate-fade-in retro-grid min-h-screen">
        <style dangerouslySetInnerHTML={{ __html: customStyles }} />
        {/* Left Column: Game Area */}
        <div className="md:col-span-8 flex flex-col gap-8 text-center">
          {/* Contenedor del Timer y Botón - Añadido margen superior y responsividad */}
          <div className="mt-6 md:mt-14 flex flex-col md:flex-row items-center justify-between bg-white dark:bg-zinc-900 p-6 rounded-3xl md:rounded-full shadow-[0_10px_30px_rgba(181,0,88,0.1)] relative overflow-hidden group w-full max-w-3xl mx-auto border-2 border-[#b50058]/20 gap-6 md:gap-0">
            <div className="absolute inset-0 scanline-overlay opacity-30"></div>

            {/* Sección del Timer */}
            <div className="flex items-center gap-4 relative z-10 w-full md:w-auto justify-center md:justify-start">
              <div className="w-12 h-12 flex items-center justify-center bg-[#b50058] text-white rounded-full animate-pulse shadow-[0_0_15px_rgba(181,0,88,0.4)] shrink-0">
                <MdTimer className="text-2xl" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Tiempo Restante</span>
                <span className="text-3xl font-black italic text-[#b50058] tracking-tighter">
                  {formatTime(remaining)}
                </span>
              </div>
            </div>

            {/* Botón de Reproducción */}
            <button
              onClick={handleManualPlay}
              disabled={isAudioPlaying || answered}
              className="w-full md:w-auto bg-gradient-to-tr from-[#b50058] to-[#ff709e] px-8 py-4 rounded-full flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_10px_20px_rgba(181,0,88,0.3)] disabled:opacity-50 relative z-10 border-b-4 border-black/20"
            >
              <MdPlayCircle className="text-white text-2xl" />
              <span className="font-black text-white uppercase tracking-widest text-xs md:text-sm italic">
                {isAudioPlaying ? 'Reproduciendo...' : 'Reproducir Pista'}
              </span>
            </button>
          </div>

          <div className="relative w-full max-w-4xl mx-auto mt-4 md:mt-8 group px-2 md:px-0">
            {/* Fondo con imagen - Ajustado bordes y sombras para pantallas pequeñas */}
            <div className="absolute inset-0 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border-[3px] md:border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
              <img
                src={current.image || "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=2070&auto=format&fit=crop"}
                alt="Album Artwork"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-40 dark:opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 via-transparent to-transparent"></div>

              {/* Icono de nota decorativo - Más pequeño en pantallas reducidas */}
              <div className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 opacity-20 pointer-events-none -mr-6 -mt-6 md:-mr-10 md:-mt-10">
                <MdMusicNote className="text-[120px] md:text-[180px] text-[#FF007F]" />
              </div>
            </div>

            {/* Contenedor del Acertijo - Reducción de paddings verticales para monitores bajos */}
            <div className="relative z-10 flex flex-col items-center justify-center py-8 md:py-16 px-4 md:px-12">
              {/* El cuadro ahora reduce su ancho máximo y padding en pantallas pequeñas */}
              <div className="w-full max-w-lg md:max-w-2xl bg-white dark:bg-zinc-900 border-[4px] md:border-[6px] border-black p-5 md:p-10 shadow-[8px_8px_0px_0px_#FF007F] md:shadow-[12px_12px_0px_0px_#FF007F] transform -rotate-1 hover:rotate-0 transition-transform duration-300">

                {/* TEXTO RESPONSIVO: lg en móvil, xl en monitor pequeño, 3xl en monitor grande */}
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black italic uppercase tracking-tighter text-black dark:text-white text-center leading-[1.1]">
                  {current.question}
                </h2>
              </div>

              {/* Pista - Ajustada para ser más discreta en pantallas pequeñas */}
              {current.hint && (
                <div className="mt-6 md:mt-8 px-4 py-2 md:px-6 md:py-3 bg-black text-white dark:bg-white dark:text-black border-[2px] md:border-[3px] border-black font-black italic uppercase text-[10px] md:text-xs tracking-[0.15em] md:tracking-[0.2em] flex items-center gap-2 md:gap-3 shadow-[4px_4px_0px_0px_#FF007F]">
                  <MdInfo className="text-base md:text-lg" />
                  <span>Pista: {current.hint}</span>
                </div>
              )}
            </div>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {current.options.map((opt, i) => {
              const isSelected = selectedAnswers.includes(i);
              const isCorrect = correctAnswerIndexes.includes(i);

              let btnClass = "flex items-center gap-4 p-6 bg-white dark:bg-zinc-900 rounded-xl transition-all text-left group border border-transparent shadow-sm ";
              let idxClass = "w-10 h-10 flex items-center justify-center rounded font-bold transition-colors ";

              if (answered) {
                if (isCorrect) {
                  btnClass += "border-green-500 bg-green-50/50 dark:bg-green-500/10 ";
                  idxClass += "bg-green-500 text-white ";
                } else if (isSelected) {
                  btnClass += "border-red-500 bg-red-50/50 dark:bg-red-500/10 ";
                  idxClass += "bg-red-500 text-white ";
                } else {
                  btnClass += "opacity-50 ";
                  idxClass += "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 ";
                }
              } else if (isSelected) {
                btnClass += "border-[#b50058] bg-[#b50058]/5 ";
                idxClass += "bg-[#b50058] text-white ";
              } else {
                btnClass += "hover:border-[#b50058]/30 hover:shadow-md ";
                idxClass += "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-400 group-hover:bg-[#b50058] group-hover:text-white ";
              }

              return (
                <button
                  key={i}
                  disabled={answered}
                  onClick={() => handleOptionClick(i)}
                  className={btnClass}
                >
                  <div className={idxClass}>{String.fromCharCode(65 + i)}</div>
                  <span className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Navigation Actions */}
          <div className="flex justify-end mt-4">
            <button
              onClick={nextQuestion}
              disabled={!answered}
              className={`flex items-center gap-4 px-8 py-5 rounded-full transition-all active:scale-95 font-bold uppercase tracking-widest
                ${answered
                  ? 'bg-zinc-900 dark:bg-[#b50058] text-white shadow-lg'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'}`}
            >
              <span>Siguiente</span>
              <MdArrowForward className="text-xl" />
            </button>
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <aside className="md:col-span-4 flex flex-col gap-6">
          <Leaderboard category={`${category}:${gameMode}`} currentPlayer={playerName} game="trivia" />

          {/* Additional Stats Card */}
          <div className="bg-gradient-to-br from-[#b50058] to-[#ff5290] rounded-2xl p-6 text-white flex flex-col gap-4 relative overflow-hidden group shadow-xl">
            <div className="absolute inset-0 scanline-overlay opacity-20"></div>
            <div className="flex items-center justify-between relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Racha actual</span>
              <MdWhatshot className="text-xl" />
            </div>
            <div className="relative z-10">
              <span className="text-5xl font-extrabold tracking-tighter">{timedStats.streak}</span>
              <span className="text-sm font-bold opacity-90 block">Aciertos Seguidos</span>
            </div>
            <div className="h-1 bg-white/20 rounded-full overflow-hidden mt-2 relative z-10">
              <div
                className="h-full bg-white shadow-[0_0_10px_white] transition-all duration-500"
                style={{ width: `${Math.min(100, (timedStats.streak / 10) * 100)}%` }}
              ></div>
            </div>
          </div>
        </aside>
      </div>
    );
  };

  const renderInsaneMode = () => {
    if (!current) return null;

    return (
      <main className="pt-8 pb-32 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 relative pixel-dots min-h-screen">
        <style dangerouslySetInnerHTML={{ __html: customStyles }} />
        {/* Left Column: Game Canvas */}
        <div className="lg:col-span-8 space-y-8">
          {/* Penalty Alert Header */}
          <style dangerouslySetInnerHTML={{
            __html: `
  @keyframes insane-glitch {
    0% { transform: translate(0) skew(0deg); }
    20% { transform: translate(-2px, 2px) skew(-1deg); text-shadow: -1px 0 #FF007F, 1px 0 #00E5FF; }
    40% { transform: translate(2px, -2px) skew(1deg); text-shadow: 1px 0 #FF007F, -1px 0 #00E5FF; }
    60% { transform: translate(-1px, 1px) skew(0deg); }
    80% { transform: translate(1px, -1px) skew(-1deg); text-shadow: -1px 0 #FF007F, 1px 0 #00E5FF; }
    100% { transform: translate(0) skew(0deg); }
  }
  .animate-insane-glitch {
    animation: insane-glitch 0.3s cubic-bezier(.46,.29,.58,.9) infinite;
  }
` }} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 px-2 md:px-0">
            {/* Tablero CORRECT - Recompensa (Amarillo/Ámbar) */}
            <div className="relative bg-[#fffbeb] dark:bg-zinc-950 border-2 border-amber-500/50 dark:border-yellow-500/50 p-4 rounded-xl shadow-[0_10px_30px_rgba(245,158,11,0.15)] dark:shadow-[0_0_25px_rgba(234,179,8,0.2)] overflow-hidden">
              <div className="absolute inset-0 scanline-overlay opacity-20 dark:opacity-30"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="p-2 border border-amber-600 dark:border-yellow-500">
                  <MdAddCircle className="text-amber-600 dark:text-yellow-400 text-2xl" />
                </div>
                <div>
                  <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-amber-700 dark:text-yellow-300 opacity-70 leading-none mb-1">Status: Reward</p>
                  <p className="font-mono text-xl font-black text-amber-600 dark:text-yellow-400 leading-none animate-insane-glitch">
                    +10 PTS
                  </p>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_5px,#fffbeb_5px,#fffbeb_10px)] dark:bg-[repeating-linear-gradient(45deg,#EA7E08,#EA7E08_5px,#000_5px,#000_10px)]"></div>
            </div>

            {/* Tablero INCORRECT - Penalización de Fallo (Rojo) */}
            <div className="relative bg-[#fef2f2] dark:bg-black border-2 border-red-500/50 dark:border-red-600/50 p-4 rounded-xl shadow-[0_10px_30px_rgba(239,68,68,0.15)] dark:shadow-[0_0_25px_rgba(220,38,38,0.3)] overflow-hidden">
              <div className="absolute inset-0 scanline-overlay opacity-30 dark:opacity-40"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="p-2 border border-red-600">
                  <MdRemoveCircle className="text-red-600 dark:text-red-500 text-2xl" />
                </div>
                <div>
                  <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-red-700 dark:text-red-300 opacity-70 leading-none mb-1">Status: Failed</p>
                  <p className="font-mono text-xl font-black text-red-600 dark:text-red-500 leading-none animate-insane-glitch">
                    -05 PTS
                  </p>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-[repeating-linear-gradient(45deg,#dc2626,#dc2626_5px,#fef2f2_5px,#fef2f2_10px)] dark:bg-[repeating-linear-gradient(45deg,#DC2626,#DC2626_5px,#000_5px,#000_10px)]"></div>
            </div>

            {/* Tablero AUDIO COST - Penalización de Pista (Cian/Azul) */}
            <div className="relative bg-[#f0f9ff] dark:bg-zinc-900 border-2 border-cyan-500/50 dark:border-cyan-400/30 p-4 rounded-xl shadow-[0_10px_30px_rgba(6,182,212,0.15)] dark:shadow-[0_0_25px_rgba(34,211,238,0.1)] overflow-hidden">
              <div className="absolute inset-0 scanline-overlay opacity-10"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="p-2 border border-cyan-600 dark:border-cyan-400">
                  <MdHeadphones className="text-cyan-600 dark:text-cyan-400 text-2xl" />
                </div>
                <div>
                  <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-cyan-700 dark:text-cyan-300 opacity-70 leading-none mb-1">Status: Cost</p>
                  <p className="font-mono text-xl font-black text-cyan-600 dark:text-cyan-400 leading-none animate-insane-glitch" style={{ animationDelay: '0.2s' }}>
                    -03 PTS
                  </p>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-[repeating-linear-gradient(45deg,#06b6d4,#06b6d4_5px,#f0f9ff_5px,#f0f9ff_10px)] dark:bg-[repeating-linear-gradient(45deg,#22d3ee,#22d3ee_5px,#18181b_5px,#18181b_10px)]"></div>
            </div>
          </div>

          {/* Main Song Card */}
          <div className="relative w-full max-w-4xl mx-auto mt-6 md:mt-10 group px-2 md:px-0">
            {/* Fondo con imagen - Bordes gruesos y sombras sólidas (Estilo Rompecabeza) */}
            <div className="absolute inset-0 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border-[4px] md:border-[6px] border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
              <img
                src={current.image || "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=2070&auto=format&fit=crop"}
                alt="Song Background"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms] opacity-50 dark:opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>
              {/* Overlay de líneas de escaneo más marcado para el modo Insane */}
              <div className="absolute inset-0 scanline-overlay opacity-20 pointer-events-none"></div>
            </div>

            {/* Contenido del Acertijo y Controles */}
            <div className="relative z-10 flex flex-col items-center justify-center py-10 md:py-16 px-6 space-y-10">

              {/* Visualizador de la Letra (Lyric Display) - Estilo Rompecabeza */}
              <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border-[6px] border-black p-8 md:p-12 shadow-[12px_12px_0px_0px_#FF007F] transform rotate-1">
                <p className="text-xl md:text-3xl font-black italic uppercase tracking-tighter text-black dark:text-white text-center leading-tight">
                  "{current.question}"
                </p>
              </div>
              <div className="flex flex-col items-center gap-6 w-full max-w-md">
                <button
                  onClick={handleManualPlay}
                  disabled={hasPlayedAudio || isAudioPlaying || answered}
                  className="w-full bg-gradient-to-tr from-[#FF007F] to-[#ff709e] px-10 py-5 rounded-full flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_10px_30px_rgba(255,0,127,0.4)] hover:shadow-[0_15px_40px_rgba(255,0,127,0.6)] disabled:opacity-50 disabled:grayscale relative z-10"
                >
                  <MdPlayCircle className="text-white text-3xl" />
                  <span className="font-black italic uppercase tracking-tighter text-white text-xl">
                    {isAudioPlaying ? 'SONANDO...' : hasPlayedAudio ? 'USADO' : 'REPRODUCIR CANCIÓN'}
                  </span>
                </button>

                {/* Barra de Tiempo Estilo Retro (Aparece al usar el audio) */}
                {hasPlayedAudio && !answered && (
                  <div className="w-full h-5 bg-zinc-200 dark:bg-black border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <div
                      className="h-full bg-[#FF007F] transition-all duration-1000 ease-linear border-r-[3px] border-black"
                      style={{ width: `${(remaining / INSANE_MODE_TIMER) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            {current.options.map((opt, i) => {
              const isSelected = selectedAnswers.includes(i);
              const isCorrect = correctAnswerIndexes.includes(i);

              // ESTILO BASE: Interfaz de terminal/tecnológica
              let btnClass = "relative overflow-hidden transition-all duration-200 border-2 ";
              let idxClass = "font-mono font-bold text-xl px-4 border-r-2 flex items-center justify-center ";
              let textClass = "flex-1 px-6 py-4 font-black italic uppercase tracking-tighter text-lg md:text-xl text-left ";

              if (answered) {
                if (isCorrect) {
                  // Estilo de SISTEMA CORRECTO (Verde Matrix)
                  btnClass += "bg-green-500/10 border-green-500 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] ";
                  idxClass += "border-green-500 bg-green-500/20 ";
                } else if (isSelected) {
                  // Estilo de ERROR CRÍTICO (Rojo Alerta)
                  btnClass += "bg-red-500/10 border-red-500 text-red-500 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.4)] ";
                  idxClass += "border-red-500 bg-red-500/20 ";
                } else {
                  // Neutralización del resto
                  btnClass += "bg-transparent border-zinc-800 opacity-30 ";
                  idxClass += "border-zinc-800 text-zinc-600 ";
                }
              } else if (isSelected) {
                // Estilo SELECCIONADO (Cian Eléctrico)
                btnClass += "bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)] translate-x-1 ";
                idxClass += "border-cyan-400 bg-cyan-400/30 ";
              } else {
                // Estilo REPOSO (Modo Claro/Oscuro adaptado)
                btnClass += "bg-white/5 dark:bg-black/40 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:border-[#FF007F] hover:bg-[#FF007F]/5 hover:shadow-[0_0_15px_rgba(255,0,127,0.2)] ";
                idxClass += "border-zinc-300 dark:border-zinc-700 text-zinc-500 group-hover:text-[#FF007F] ";
              }

              return (
                <button
                  key={i}
                  disabled={answered}
                  onClick={() => handleOptionClick(i)}
                  className={`${btnClass} group flex items-stretch group`}
                >
                  {/* Línea de escaneo interna solo para el botón */}
                  <div className="absolute inset-0 scanline-overlay opacity-[0.05] pointer-events-none"></div>

                  {/* Indicador lateral de selección */}
                  <div className={`w-1 transition-all ${isSelected ? 'bg-cyan-400' : 'bg-transparent'}`}></div>

                  <span className={idxClass}>
                    {String.fromCharCode(65 + i)}
                  </span>

                  <span className={textClass}>
                    {opt}
                  </span>

                  {/* Esquinas decorativas de "interfaz" */}
                  <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-current opacity-30"></div>
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-current opacity-30"></div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end pt-8">
            <button
              onClick={nextQuestion}
              disabled={!answered}
              className={`
      relative group overflow-hidden transition-all duration-300
      flex items-center gap-4 px-12 py-4
      font-black italic uppercase tracking-[0.2em] text-lg
      ${answered
                  ? 'bg-transparent border-2 border-cyan-500 text-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_40px_rgba(6,182,212,0.6)]'
                  : 'bg-zinc-900/50 border-2 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'}
    `}
              style={{
                clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)'
              }}
            >
              {/* Efecto de brillo de escaneo (Solo cuando está activo) */}
              {answered && (
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent -translate-x-full group-hover:animate-[scan_2s_infinite]"></div>
              )}

              <span className="relative z-10">Siguiente</span>
              <MdArrowForwardIos className={`relative z-10 text-xl transition-transform duration-300 ${answered ? 'group-hover:translate-x-2' : ''}`} />

              {/* Decoración de esquinas tecnológicas */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-current"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-current"></div>
            </button>
          </div>

          {/* Añade este keyframe a tu archivo de estilos o bloque Style */}
          <style dangerouslySetInnerHTML={{
            __html: `
  @keyframes scan {
    100% { transform: translateX(100%); }
  }
` }} />
        </div>

        {/* Right Column: Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          <Leaderboard category={`${category}:${gameMode}`} currentPlayer={playerName} game="trivia" />
        </aside>
      </main>
    );
  };

  const renderGameHeader = () => {
    const handleNavigationClick = (action: () => void) => {
      if (started && !gameOver) {
        setPendingNavigationAction(() => action);
        setShowNavigationConfirm(true);
      } else {
        action();
      }
    };

    return (
      <header className="fixed top-0 left-0 w-full z-50 bg-[#f6f6f6]/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 shadow-[0_4px_20px_rgba(181,0,88,0.05)]">
        <div className="flex justify-between items-center w-full max-w-7xl mx-auto px-6 py-4">

          {/* TÍTULO IZQUIERDO: Con la fuente del Ranking */}
          <div className="flex items-center gap-4">
            <span className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-[#FF007F]">
              {category === 'music' ? 'ADIVINA LA CANCIÓN' : 'PREGUNTADOS'}
            </span>
          </div>

          {/* SECCIÓN DERECHA: Navegación + Score */}
          <div className="flex items-center gap-4 md:gap-8">

            {/* Navegación con la misma fuente */}
            <nav className="hidden lg:flex items-center gap-6 text-[11px] font-black italic uppercase tracking-tighter">
              <button className="text-[#FF007F] border-b-2 border-[#FF007F]">Jugar</button>
              <button className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">Colección</button>
              <button className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">Ranking</button>
            </nav>

            {/* CONTENEDOR SCORE + AVATAR (ESTILO CÁPSULA) */}
            <div className="flex items-center gap-4 bg-white dark:bg-zinc-800 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm">

              {/* SCORE: Fuente unificada */}
              <div className="flex items-center gap-2 border-r border-zinc-200 dark:border-zinc-700 pr-4">
                <MdStars className="text-[#FF007F] text-xl" />
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase italic text-zinc-400 leading-none">Score</span>
                  <span className="text-base md:text-xl font-black italic uppercase tracking-tighter text-zinc-800 dark:text-zinc-100 leading-none">
                    {score.toString().padStart(4, '0')}
                  </span>
                </div>
              </div>

              {/* AVATAR */}
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#ff709e]/20 border-2 border-[#FF007F]">
                <img
                  className="w-full h-full object-cover"
                  src={`https://ui-avatars.com/api/?name=${playerName || 'U'}&background=FF007F&color=fff&bold=true`}
                  alt="Player Avatar"
                />
              </div>
            </div>

          </div>
        </div>
      </header>
    );
  };

  const renderBottomNav = () => {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-[100] rounded-t-[2.5rem] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border-t border-zinc-200/50 dark:border-zinc-800/50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="flex justify-around items-center px-6 pb-8 pt-4">

          {/* HOME */}
          <button onClick={handleGoHome} className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 p-2 hover:text-[#FF007F] active:scale-90 transition-all">
            <MdHome className="text-2xl" />
            <span className="font-['Plus_Jakarta_Sans'] text-[10px] font-bold uppercase tracking-widest mt-1">Home</span>
          </button>

          {/* JUGAR (Botón Central Destacado) */}
          <button onClick={() => setCategory(null)} className="flex flex-col items-center justify-center bg-gradient-to-tr from-[#b50058] to-[#ff5290] text-white rounded-2xl px-5 py-3 scale-110 shadow-lg shadow-[#b50058]/30 active:scale-95 transition-all">
            <MdVideogameAsset className="text-2xl" />
            <span className="font-['Plus_Jakarta_Sans'] text-[10px] font-bold uppercase tracking-widest">Jugar</span>
          </button>

          {/* RANKING */}
          <button className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 p-2 hover:text-[#FF007F] active:scale-90 transition-all">
            <MdEmojiEvents className="text-2xl" />
            <span className="font-['Plus_Jakarta_Sans'] text-[10px] font-bold uppercase tracking-widest mt-1">Ranking</span>
          </button>

          {/* AJUSTES */}
          <button className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 p-2 hover:text-[#FF007F] active:scale-90 transition-all">
            <MdSettings className="text-2xl" />
            <span className="font-['Plus_Jakarta_Sans'] text-[10px] font-bold uppercase tracking-widest mt-1">Ajustes</span>
          </button>

        </div>
      </nav>
    );
  };


  // Common Modals for all modes
  const renderCommonModals = () => (
    <>
      <PauseMenu
        isOpen={showPauseMenu}
        onResume={() => setShowPauseMenu(false)}
        onRestart={() => setShowRestartConfirm(true)}
        onExit={() => setShowExitConfirm(true)}
      />

      {showRestartConfirm && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-sm bg-[#101e22] border-2 border-[#0db9f2]/30 rounded-2xl shadow-2xl shadow-[#0db9f2]/10 overflow-hidden animate-fade-in-up">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#0db9f2]/10 blur-3xl rounded-full" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#0db9f2]/10 blur-3xl rounded-full" />

            <div className="relative p-8 flex flex-col items-center text-center">
              <div className="mb-6 bg-yellow-500/10 p-4 rounded-full border border-yellow-500/30">
                <MdRefresh className="text-5xl text-yellow-500 animate-spin-slow" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tight">{t('games.puzzle.restartConfirm')}</h2>
              <p className="text-slate-400 text-sm mb-8 font-medium">¿Estás seguro de que quieres perder tu progreso actual?</p>

              <div className="flex gap-4 w-full">
                <button
                  onClick={() => {
                    setShowRestartConfirm(false);
                    setShowPauseMenu(false);
                    setIsCountingDown(true);
                    setCountValue(3);
                  }}
                  className="flex-1 py-4 bg-green-500 hover:bg-green-600 text-[#101e22] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-green-500/25 border-b-4 border-green-700 mt-0.5"
                >
                  SÍ
                </button>
                <button
                  onClick={() => setShowRestartConfirm(false)}
                  className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-red-500/25 border-b-4 border-red-700 mt-0.5"
                >
                  NO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExitConfirm && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-sm bg-[#101e22] border-2 border-red-500/30 rounded-2xl shadow-2xl shadow-red-500/10 overflow-hidden animate-fade-in-up">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 blur-3xl rounded-full" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-red-500/10 blur-3xl rounded-full" />

            <div className="relative p-8 flex flex-col items-center text-center">
              <div className="mb-6 bg-red-500/10 p-4 rounded-full border border-red-500/30">
                <MdLogout className="text-5xl text-red-500" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tight">{t('games.puzzle.exitConfirm')}</h2>
              <p className="text-slate-400 text-sm mb-8 font-medium">Volverás al menú de selección de juegos.</p>

              <div className="flex gap-4 w-full">
                <button
                  onClick={() => {
                    setShowExitConfirm(false);
                    setShowPauseMenu(false);
                    resetToSelection();
                  }}
                  className="flex-1 py-4 bg-green-500 hover:bg-green-600 text-[#101e22] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-green-500/25 border-b-4 border-green-700 mt-0.5"
                >
                  SÍ
                </button>
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-red-500/25 border-b-4 border-red-700 mt-0.5"
                >
                  NO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNavigationConfirm && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-sm bg-[#101e22] border-2 border-[#FF007F]/30 rounded-3xl shadow-2xl shadow-[#FF007F]/20 overflow-hidden animate-fade-in-up">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#FF007F]/10 blur-3xl rounded-full" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#FF007F]/10 blur-3xl rounded-full" />

            <div className="relative p-8 flex flex-col items-center text-center">
              <div className="mb-6 bg-[#FF007F]/10 p-5 rounded-full border-2 border-[#FF007F]/30 shadow-[0_0_20px_rgba(255,0,127,0.2)]">
                <MdHelp className="text-5xl text-[#FF007F] animate-pulse" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tight">¿Estás seguro de Volver?</h2>
              <p className="text-slate-400 text-sm mb-8 font-medium">Perderás todo tu progreso actual en este juego.</p>

              <div className="flex gap-4 w-full">
                <button
                  onClick={() => {
                    setShowNavigationConfirm(false);
                    if (pendingNavigationAction) pendingNavigationAction();
                  }}
                  className="flex-1 py-4 bg-green-500 hover:bg-green-600 text-[#101e22] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-green-500/25 border-b-4 border-green-700 mt-0.5"
                >
                  SÍ
                </button>
                <button
                  onClick={() => {
                    setShowNavigationConfirm(false);
                    setPendingNavigationAction(null);
                  }}
                  className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-red-500/25 border-b-4 border-red-700 mt-0.5"
                >
                  NO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      <RulesModal
        isOpen={showRules}
        onContinue={confirmStartGame}
        title={category === 'music' ? t('games.trivia.musicRulesTitle') : t('games.trivia.rulesTitle')}
        icon={category === 'music' ? <MdHeadset /> : <MdPsychology />}
        instructions={
          category === 'music'
            ? (pendingMode === 'insane'
              ? [
                { icon: <MdPsychology />, title: 'Mental', description: t('games.trivia.musicInsane1') },
                { icon: <MdHeadphones />, title: 'Audio', description: t('games.trivia.musicInsane2') },
                { icon: <MdTimer />, title: 'Tiempo', description: t('games.trivia.musicInsane3') }
              ]
              : [
                { icon: <MdBolt />, title: 'Velocidad', description: t('games.trivia.musicChaos1') },
                { icon: <MdPriorityHigh />, title: 'Alerta', description: t('games.trivia.musicChaos2') },
                { icon: <MdHeadphones />, title: 'Escucha', description: t('games.trivia.musicChaos3') },
                { icon: <MdStar />, title: 'Puntaje', description: t('games.trivia.musicChaos4') }
              ])
            : [
              { icon: <MdQuiz />, title: 'Reto', description: t('games.trivia.rule1') },
              { icon: <MdStars />, title: 'Precisión', description: t('games.trivia.rule2') },
              { icon: <MdMilitaryTech />, title: 'Bonus', description: t('games.trivia.rule3') },
              ...(pendingMode === 'timed' ? [{ icon: <MdTimer />, title: 'Tiempo', description: t('games.trivia.timedWarning').replace('{time}', TIMER_PER_QUESTION.toString()) }] : [])
            ]
        }
      />

      {/* Score Overwrite Modal */}
      <ScoreOverwriteModal
        isOpen={showOverwriteModal}
        onConfirm={confirmOverwrite}
        onCancel={() => setShowOverwriteModal(false)}
        playerName={playerName}
        gameType="trivia"
        oldScore={pendingScoreData?.oldScore || 0}
        newScore={pendingScoreData?.score || 0}
      />
    </>
  );

  const renderSessionStats = () => {
    const total = timedStats.correct + timedStats.incorrect;
    const precision = total === 0 ? 0 : Math.round((timedStats.correct / total) * 100);
    const isTimed = gameMode === 'timed';
    const accentColor = isTimed ? 'text-[#ff007f]' : 'text-primary-blue';
    const bgGradient = isTimed
      ? 'from-[#ff007f]/10 border-[#ff007f]/20'
      : 'from-primary-blue/10 border-primary-blue/20';

    return (
      <div className={`bg-gradient-to-br ${bgGradient} to-transparent border rounded-2xl p-5 animate-fade-in shadow-sm`}>
        <h4 className={`text-[10px] font-black uppercase ${accentColor} mb-3 tracking-widest flex items-center gap-2`}>
          <MdLeaderboard className="text-sm" />
          Tus Estadísticas
        </h4>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-bold italic group">
            <span className="opacity-60 group-hover:opacity-100 transition-opacity">Racha:</span>
            <span className={`text-sm ${accentColor} flex items-center gap-1`}>
              {timedStats.streak} <MdWhatshot className={timedStats.streak > 0 ? 'animate-pulse' : 'opacity-20'} />
            </span>
          </div>

          <div className="flex justify-between items-center text-xs font-bold italic group">
            <span className="opacity-60 group-hover:opacity-100 transition-opacity">Correctas:</span>
            <span className="text-sm text-green-500">{timedStats.correct}</span>
          </div>

          <div className="flex justify-between items-center text-xs font-bold italic group">
            <span className="opacity-60 group-hover:opacity-100 transition-opacity">Incorrectas:</span>
            <span className="text-sm text-red-500">{timedStats.incorrect}</span>
          </div>

          <div className="flex justify-between items-center text-xs font-bold italic group pt-2 border-t border-black/5 dark:border-white/5">
            <span className="opacity-60 group-hover:opacity-100 transition-opacity">Precisión:</span>
            <div className="flex flex-col items-end">
              <span className={`text-sm font-black ${precision > 70 ? 'text-green-500' : precision > 40 ? 'text-orange-500' : 'text-red-500'}`}>
                {precision}%
              </span>
            </div>
          </div>
        </div>

        {/* Mini barra de precisión visual */}
        <div className="mt-3 h-1 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${precision > 70 ? 'bg-green-500' : precision > 40 ? 'bg-orange-500' : 'bg-red-500'}`}
            style={{ width: `${precision}%` }}
          />
        </div>
      </div>
    );
  };


  const renderShurahiwaTimed = () => {
    const current = questions[index];
    return (
      <div className="flex flex-col gap-4 w-full relative animate-fade-in -mt-6 md:-mt-10">

        {/* Header Compacto con Cronómetro Rosa */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-5 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 bg-zinc-100/50 dark:bg-zinc-800/50 px-5 py-2 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/50">
            <div className="relative flex items-center justify-center">
              <svg className="w-14 h-14 transform -rotate-90">
                <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-zinc-200 dark:text-zinc-700" />
                <circle
                  cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent"
                  strokeDasharray={150.8}
                  strokeDashoffset={150.8 - (150.8 * remaining) / TIMER_PER_QUESTION}
                  className={`${remaining <= 5 ? 'text-red-500' : 'text-[#FF007F]'} transition-all duration-1000`}
                />
              </svg>
              <span className={`absolute text-lg font-black ${remaining <= 5 ? 'text-red-500 animate-pulse' : 'text-zinc-800 dark:text-white'}`}>{remaining}</span>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest font-black opacity-50 leading-none mb-1">Tiempo</p>
              <p className="text-sm font-bold uppercase text-zinc-800 dark:text-white">Segundos</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-widest font-black opacity-50 leading-none mb-1">Puntos</p>
              <div className="relative flex whitespace-nowrap gap-1">
                <p className="text-3xl font-black text-[#FF007F] italic tracking-tighter">{score}</p>
                {scoreChange !== null && <div className="absolute top-0 -right-8"><ScoreIndicator points={scoreChange} onComplete={() => setScoreChange(null)} /></div>}
              </div>
            </div>
            <div className="bg-[#FF007F]/10 px-4 py-2 rounded-xl border border-[#FF007F]/20">
              <p className="text-[9px] uppercase tracking-widest font-black text-[#FF007F] mb-1">Pregunta</p>
              <p className="text-sm font-bold text-zinc-800 dark:text-white">{index + 1}/{TOTAL_QUESTIONS}</p>
            </div>
          </div>
        </div>

        {/* Contenedor de pregunta idéntico para consistencia */}
        <div className="flex-1 flex flex-col justify-center items-center py-8 md:py-12 px-6 gap-8 bg-white dark:bg-zinc-900/60 rounded-[2.5rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 relative overflow-hidden">
          <h2 className="text-2xl md:text-3xl font-bold text-center z-10 w-full">{current?.question}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {current?.options.map((opt, i) => {
              const isCorrectOption = correctAnswerIndexes.includes(i);
              const isSelected = selectedAnswers.includes(i);
              let cls = "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-primary-blue/50 hover:shadow-lg";
              if (answered) {
                if (isCorrectOption) cls = "bg-green-500/10 border-green-500 text-green-600 dark:text-green-400";
                else if (isSelected && !isCorrectOption) cls = "bg-red-500/10 border-red-500 text-red-600 dark:text-red-400";
                else cls = "opacity-50 border-gray-200 dark:border-gray-800";
              } else if (isSelected) cls = "bg-[#FF007F]/10 border-[#FF007F] text-[#FF007F]";

              return (
                <button key={i} disabled={answered} onClick={() => handleOptionClick(i)} className={`w-full p-4 rounded-xl border-4 font-bold uppercase tracking-wide transition-all duration-200 transform shadow-[4px_4px_0px_0px_black] active:translate-y-1 active:shadow-none flex items-center gap-4 ${cls}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-4 ${isSelected || (answered && isCorrectOption) ? 'border-black bg-white text-black' : 'border-black bg-gray-200 text-gray-500'}`}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className="text-left flex-1 leading-tight">{opt}</span>
                </button>
              );
            })}
          </div>

          {/* TABLA DE ESTADÍSTICAS CORREGIDA */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Pregunta actual */}
            <div className="bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 p-3 rounded-2xl">
              <p className="text-[9px] uppercase font-black opacity-50 mb-1">Progreso</p>
              <p className="text-sm font-bold">{index + 1} / {TOTAL_QUESTIONS}</p>
            </div>

            {/* Puntuación (Cambiado combo por score o una racha si existe) */}
            <div className="bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 p-3 rounded-2xl">
              <p className="text-[9px] uppercase font-black opacity-50 mb-1">Puntos Bonus</p>
              <p className="text-sm font-bold text-orange-500">
                ✨ {score > 0 ? (score / (index + 1)).toFixed(0) : 0} avg
              </p>
            </div>

            {/* Dificultad */}
            <div className="bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 p-3 rounded-2xl">
              <p className="text-[9px] uppercase font-black opacity-50 mb-1">Categoría</p>
              <p className="text-sm font-bold text-blue-500 uppercase truncate">{category || 'General'}</p>
            </div>

            {/* Modo */}
            <div className="bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 p-3 rounded-2xl">
              <p className="text-[9px] uppercase font-black opacity-50 mb-1">Sistema</p>
              <p className="text-sm font-bold text-[#FF007F] uppercase tracking-tighter">Normal Mode</p>
            </div>
          </div>

          {showCorrectAnswer && (
            <div className={`mb-2 w-full p-4 rounded-xl border-l-4 ${selectedAnswers.length === 0 ? 'bg-yellow-500/10 border-yellow-500' : 'bg-red-500/10 border-red-500'} animate-fade-in`}>
              <p className="font-bold mb-1">{selectedAnswers.length === 0 ? t('games.trivia.timeUp') : t('games.trivia.incorrect')}</p>
              <p className="text-sm opacity-90">{t('games.trivia.correctAnswerIs')}: <span className="font-bold">{correctAnswerIndexes.map(idx => current?.options?.[idx] || '').filter(Boolean).join(', ')}</span></p>
            </div>
          )}

          <div className="flex justify-between items-center mt-2 w-full">
            {isMultipleAnswer && !answered && (
              <button onClick={() => submitAnswer()} disabled={selectedAnswers.length === 0} className={`poke-button-blue ${selectedAnswers.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}>
                <MdCatchingPokemon className="animate-spin-slow mr-2" />
                {t('games.trivia.submitAnswer')}
              </button>
            )}
            <button onClick={nextQuestion} disabled={!answered} className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-lg uppercase tracking-wide transition-all ml-auto ${!answered ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 border border-slate-300 dark:border-slate-600 cursor-not-allowed opacity-50' : 'bg-[#FF007F] hover:bg-[#FF007F]/80 text-white shadow-lg shadow-[#FF007F]/20 active:scale-95'}`}>
              Siguiente
              <MdArrowForward className="text-xl" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderShurahiwaUntimed = () => {
    const current = questions[index];
    return (
      <div className="flex flex-col gap-4 w-full relative animate-fade-in -mt-6 md:-mt-10">

        <div className="bg-primary-blue/5 backdrop-blur-md border border-primary-blue/10 rounded-2xl p-6 border-l-4 border-l-primary-blue shadow-lg">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h1 className="text-primary-blue font-bold uppercase tracking-wider text-[10px]">Modo Activo</h1>
              <h2 className="text-2xl font-bold dark:text-white mt-1">Modo Sin Tiempo</h2>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="text-lg font-bold text-primary-blue border border-primary-blue/20 bg-primary-blue/10 px-4 py-2 rounded-lg flex items-center shadow-sm relative overflow-hidden">
                <div className="flex flex-col">
                  <span className="text-[10px] md:text-[9px] uppercase tracking-widest font-black opacity-60 leading-none mb-1">
                    {t('common.score')}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl md:text-3xl font-black leading-none text-primary-blue dark:text-white italic tracking-tighter">
                      {score}
                    </span>
                    <span className="text-xs md:text-sm font-bold opacity-80 leading-none italic uppercase">
                      PTS
                    </span>
                  </div>
                </div>

                {scoreChange !== null && (
                  <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2">
                    <ScoreIndicator points={scoreChange} onComplete={() => setScoreChange(null)} />
                  </div>
                )}
              </div>
              <span className="text-sm font-bold bg-primary-blue/20 text-primary-blue px-3 py-1 rounded-full shadow-sm">
                Pregunta {index + 1}/{TOTAL_QUESTIONS}
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full mt-4 overflow-hidden shadow-inner">
            <div className="bg-primary-blue h-full shadow-[0_0_15px_rgba(13,185,242,0.5)] transition-all duration-500" style={{ width: `${(index / TOTAL_QUESTIONS) * 100}%` }}></div>
          </div>
        </div>

        {/* Cuerpo de pregunta azul */}
        <div className="flex-1 flex flex-col justify-center items-center py-10 px-6 gap-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 relative overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-blue/5 rounded-full blur-[100px] pointer-events-none"></div>

          <h2 className="text-2xl md:text-3xl font-bold text-center z-10 dark:text-white w-full">{current?.question}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full z-10">
            {current?.options.map((opt, i) => {
              const isCorrectOption = correctAnswerIndexes.includes(i);
              const isSelected = selectedAnswers.includes(i);
              let btnClass = "group relative flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left overflow-hidden ";
              let iconClass = "flex items-center justify-center w-10 h-10 rounded-lg font-bold transition-colors z-10 ";
              let textClass = "text-lg font-semibold transition-colors z-10 relative ";

              if (answered) {
                if (isCorrectOption) {
                  btnClass += "border-green-500 bg-green-500/10";
                  iconClass += "bg-green-500 text-white shadow-lg shadow-green-500/30";
                  textClass += "text-green-700 dark:text-green-400";
                } else if (isSelected && !isCorrectOption) {
                  btnClass += "border-red-500 bg-red-500/10";
                  iconClass += "bg-red-500 text-white shadow-lg shadow-red-500/30";
                  textClass += "text-red-700 dark:text-red-400";
                } else {
                  btnClass += "border-gray-200 dark:border-gray-800 bg-transparent opacity-50";
                  iconClass += "bg-gray-200 dark:bg-gray-800 text-gray-500";
                  textClass += "text-gray-500";
                }
              } else if (isSelected) {
                btnClass += "border-primary-blue bg-primary-blue/10 shadow-[0_0_20px_rgba(13,185,242,0.1)] scale-[1.02]";
                iconClass += "bg-primary-blue text-white shadow-lg shadow-primary-blue/40";
                textClass += "text-primary-blue";
              } else {
                btnClass += "border-primary-blue/20 bg-slate-50 dark:bg-slate-800/40 hover:border-primary-blue hover:bg-primary-blue/5 active:scale-[0.98]";
                iconClass += "bg-primary-blue/10 text-primary-blue group-hover:bg-primary-blue group-hover:text-white";
                textClass += "text-slate-700 dark:text-slate-300 group-hover:text-primary-blue";
              }

              return (
                <button key={i} disabled={answered} onClick={() => handleOptionClick(i)} className={btnClass}>
                  {isSelected && !answered && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-blue/10 to-transparent pointer-events-none opacity-50"></div>
                  )}
                  <span className={iconClass}>{String.fromCharCode(64 + (i + 1))}</span>
                  <span className={textClass}>{opt}</span>
                </button>
              );
            })}
          </div>

          {showCorrectAnswer && (
            <div className={`mt-2 w-full p-4 rounded-xl border-l-4 border-red-500 bg-red-500/10 animate-fade-in z-10`}>
              <p className="font-bold mb-1 text-red-600 dark:text-red-400">{t('games.trivia.incorrect')}</p>
              <p className="text-sm opacity-90 text-slate-700 dark:text-slate-300">
                {t('games.trivia.correctAnswerIs')}: <span className="font-bold">{correctAnswerIndexes.map(idx => current?.options?.[idx] || '').filter(Boolean).join(', ')}</span>
              </p>
            </div>
          )}

          <div className="flex w-full justify-between pt-6 border-t border-slate-200 dark:border-slate-800 mt-2 z-10 items-center gap-4">
            {isMultipleAnswer && !answered ? (
              <button
                onClick={() => submitAnswer()}
                disabled={selectedAnswers.length === 0}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-lg transition-all ${selectedAnswers.length === 0 ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-primary-blue hover:bg-primary-blue/80 text-white active:scale-95 shadow-lg shadow-primary-blue/20'}`}
              >
                <MdCatchingPokemon className={selectedAnswers.length > 0 ? "animate-spin-slow" : ""} />
                {t('games.trivia.submitAnswer')}
              </button>
            ) : <div />}

            <button
              onClick={nextQuestion}
              disabled={!answered}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-lg uppercase tracking-wide transition-all ml-auto ${!answered ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 border border-slate-300 dark:border-slate-600 cursor-not-allowed opacity-50' : 'bg-primary-blue hover:bg-primary-blue/80 text-white shadow-lg shadow-primary-blue/20 active:scale-95'}`}
            >
              Siguiente
              <MdArrowForward className="text-xl" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderStandardUI = () => {
    const ispantcake = category === null || category === 'pantcake';

    if (ispantcake && (gameMode === 'untimed' || gameMode === 'timed')) {
      const current = questions[index];
      return (
        <div className="flex flex-col gap-8 mt-10 md:mt-16 animate-fade-in text-slate-900 dark:text-slate-100">


          <div className="max-w-7xl mx-auto animate-fade-in mt-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* COLUMNA IZQUIERDA: ÁREA DE JUEGO */}
              <div className="flex-1 flex flex-col gap-6">

                {/* HEADER TIPO "CON TIEMPO" O "SIN TIEMPO" */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-blue/5 rounded-full blur-3xl -z-0 pointer-events-none" />

                  <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setCategory(null)}
                        className="p-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-primary-blue/20 rounded-xl transition-all border border-slate-200 dark:border-slate-600 group"
                      >
                        <MdArrowBack className="text-xl text-slate-600 dark:text-primary-blue group-hover:-translate-x-1 transition-transform" />
                      </button>
                      <div>
                        <h1 className="text-primary-blue font-black uppercase tracking-tighter text-xs leading-none mb-1">Categoría: {category || 'pantcake'}</h1>
                        <h2 className={`text-2xl font-black italic tracking-tighter ${gameMode === 'timed' ? 'text-[#ff007f]' : 'dark:text-white'}`}>
                          {gameMode === 'timed' ? 'MODO CON TIEMPO' : 'MODO SIN TIEMPO'}
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {gameMode === 'timed' && (
                        <div className="text-center bg-[#ff007f]/10 px-4 py-2 rounded-xl">
                          <p className="text-[10px] font-bold text-[#ff007f] uppercase tracking-widest leading-none mb-1">Tiempo</p>
                          <p className={`text-2xl font-black leading-none ${remaining < 5 ? 'text-red-500 animate-pulse' : 'text-[#ff007f]'}`}>
                            {remaining}s
                          </p>
                        </div>
                      )}

                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Pregunta</p>
                        <p className="text-xl font-black text-slate-800 dark:text-white leading-none">
                          {String(index + 1).padStart(2, '0')}<span className="text-slate-300 dark:text-slate-600 mx-1">/</span>{TOTAL_QUESTIONS}
                        </p>
                      </div>

                      {/* Score Box Premium */}
                      <div className="relative">
                        <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2 rounded-xl flex flex-col items-center shadow-lg min-w-[100px] border border-white/10 dark:border-black/5">
                          <span className="text-[9px] font-black uppercase opacity-60 leading-none mb-1">Puntos</span>
                          <span className="text-2xl font-black italic leading-none tracking-tighter">{score}</span>
                        </div>
                        {scoreChange !== null && (
                          <div className="absolute -left-12 top-1/2 -translate-y-1/2 z-20">
                            <ScoreIndicator points={scoreChange} onComplete={() => setScoreChange(null)} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Barra de progreso / tiempo */}
                  <div className="mt-6 h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                    {gameMode === 'timed' ? (
                      <div
                        className={`h-full transition-all duration-1000 ${remaining < 5 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-[#ff007f] shadow-[0_0_10px_#ff007f]'}`}
                        style={{ width: `${(remaining / TIMER_PER_QUESTION) * 100}%` }}
                      />
                    ) : (
                      <div
                        className="h-full bg-primary-blue shadow-[0_0_10px_#0db9f2] transition-all duration-700"
                        style={{ width: `${((index + 1) / TOTAL_QUESTIONS) * 100}%` }}
                      />
                    )}
                  </div>
                </div>

                {/* CONTENEDOR DE LA PREGUNTA */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100 dark:border-gray-700 relative overflow-hidden flex-1 flex flex-col justify-center min-h-[400px]">
                  <div className={`absolute -top-24 -left-24 w-64 h-64 rounded-full blur-[100px] pointer-events-none ${gameMode === 'timed' ? 'bg-[#ff007f]/5' : 'bg-primary-blue/5'}`} />

                  <div className="relative z-10 flex flex-col items-center gap-10">
                    <h3 className="text-2xl md:text-4xl font-bold text-center leading-tight max-w-3xl text-slate-800 dark:text-white">
                      {current?.question}
                    </h3>

                    {isMultipleAnswer && !answered && (
                      <div className="bg-primary-pink/10 text-primary-pink px-4 py-2 rounded-xl border border-primary-pink/20 animate-pulse text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                        <MdPriorityHigh className="text-lg" /> Selecciona varias respuestas
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                      {current?.options.map((opt, i) => {
                        const isCorrectOption = correctAnswerIndexes.includes(i);
                        const isSelected = selectedAnswers.includes(i);

                        let cls = `bg-white dark:bg-gray-900 border-slate-200 dark:border-slate-700 hover:shadow-xl ${gameMode === 'timed' ? 'hover:border-[#ff007f]/50' : 'hover:border-primary-blue/50'}`;
                        if (answered) {
                          if (isCorrectOption) cls = "bg-green-500/10 border-green-500 text-green-700 dark:text-green-400";
                          else if (isSelected) cls = "bg-red-500/10 border-red-500 text-red-700 dark:text-red-400";
                          else cls = "opacity-40 border-slate-100 dark:border-slate-800 grayscale-[0.5]";
                        } else if (isSelected) {
                          cls = gameMode === 'timed'
                            ? "bg-[#ff007f]/5 border-[#ff007f] text-[#ff007f] ring-2 ring-[#ff007f]/10 scale-[1.02]"
                            : "bg-primary-blue/5 border-primary-blue text-primary-blue ring-2 ring-primary-blue/10 scale-[1.02]";
                        }

                        return (
                          <button
                            key={i}
                            disabled={answered}
                            onClick={() => handleOptionClick(i)}
                            className={`w-full p-5 rounded-2xl border-4 font-black uppercase tracking-wide transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] active:translate-y-1 active:shadow-none flex items-center gap-4 ${cls}`}
                          >
                            <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-lg border-4 ${isSelected || (answered && isCorrectOption) ? 'border-black bg-white text-black' : 'border-slate-300 bg-slate-100 text-slate-400'}`}>
                              {String.fromCharCode(65 + i)}
                            </div>
                            <span className="text-left flex-1 leading-snug">{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* FEEDBACK ERROR (SOLO UNO) */}
                    {showCorrectAnswer && (
                      <div className="w-full p-5 rounded-2xl border-l-8 border-red-500 bg-red-500/10 animate-fade-in">
                        <p className="font-black text-red-600 uppercase text-[10px] tracking-widest mb-1">Respuesta incorrecta</p>
                        <p className="text-slate-700 dark:text-slate-300 font-bold">
                          La correcta era: <span className="underline decoration-red-500/40 font-black">{correctAnswerIndexes.map(idx => current?.options?.[idx] || '').filter(Boolean).join(', ')}</span>
                        </p>
                      </div>
                    )}

                    {/* BOTONES DE NAVEGACIÓN */}
                    <div className="flex w-full justify-between items-center mt-4 gap-4">
                      <div className="flex-1">
                        {isMultipleAnswer && !answered && (
                          <button onClick={() => submitAnswer()} disabled={selectedAnswers.length === 0} className={`flex items-center gap-2 px-8 py-4 ${gameMode === 'timed' ? 'bg-[#ff007f] shadow-[0_6px_0_0_#d10068]' : 'bg-primary-blue shadow-[0_6px_0_0_#0a96c4]'} text-white rounded-2xl font-black uppercase tracking-tighter hover:brightness-110 active:translate-y-1 active:shadow-none transition-all disabled:opacity-30`}>
                            <MdCatchingPokemon className="text-2xl animate-spin-slow" />
                            Enviar Selección
                          </button>
                        )}
                      </div>

                      <button
                        onClick={nextQuestion}
                        disabled={!answered}
                        className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-black uppercase tracking-tighter transition-all ${!answered
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-600'
                          : (gameMode === 'timed' ? 'bg-[#ff007f] text-white hover:brightness-110 shadow-[0_6px_0_0_#d10068]' : 'bg-primary-pink text-white hover:brightness-110 shadow-[0_6px_0_0_#d10068]') + ' active:translate-y-1 active:shadow-none animate-pulse-subtle'
                          }`}
                      >
                        {index + 1 === TOTAL_QUESTIONS ? 'Finalizar' : 'Siguiente'}
                        <MdArrowForward className="text-xl" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA: RANKING */}
              <aside className="w-full lg:w-80 shrink-0 flex flex-col gap-6">
                <Leaderboard
                  game="trivia"
                  category={category || "pantcake"}
                  mode={gameMode || "untimed"}
                  currentPlayer={playerName}
                />

                {renderSessionStats()}
              </aside>

            </div>
          </div>
        </div>
      );
    }

    // ORIGINAL ENTIRE RENDERSTANDARDUI FOR EVERYTHING ELSE
    const current = questions[index];
    return (
      <div className="flex flex-col gap-8 mt-10 md:mt-16 animate-fade-in">


        {/* Timed mode: 3-column grid (stats | game | ranking); others: game + ranking */}
        <div className={`grid grid-cols-1 gap-8 ${gameMode === 'timed'
          ? 'md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]'
          : 'md:grid-cols-3'
          }`}>
          {/* LEFT SIDEBAR: For timed mode, show stats; otherwise just spacer */}
          {gameMode === 'timed' && (
            <div className="hidden md:flex flex-col gap-4 sticky top-4">
              <div className="flex flex-col p-4 bg-[#FF007F]/10 dark:bg-[#FF007F]/5 rounded-xl border-2 border-[#FF007F]/30 backdrop-blur-md shadow-[0_0_15px_rgba(255,0,127,0.1)]">
                <h2 className="text-[#FF007F] text-sm font-black uppercase tracking-tighter italic neon-text-pink">Modo Con Tiempo</h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Trivia Pro Challenge</p>
              </div>

              <div className="bg-white/80 dark:bg-[#101e22]/80 p-5 rounded-2xl border-2 border-[#0db9f2]/20 shadow-[0_0_30px_rgba(13,185,242,0.05)] backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#0db9f2]/5 rounded-full blur-3xl -z-0 group-hover:bg-[#0db9f2]/10 transition-colors" />
                <h3 className="relative z-10 font-black text-xs mb-4 flex items-center gap-2 text-slate-800 dark:text-white uppercase italic tracking-widest">
                  <MdLeaderboard className="text-[#0db9f2] text-lg" />
                  Tus Estadísticas
                </h3>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-200/60 dark:bg-slate-900/60">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Puntos</span>
                    <span className="text-lg font-bold text-[#0db9f2] relative">
                      {score}
                      {scoreChange !== null && (
                        <span className={`absolute -top-4 right-0 text-xs font-bold ${scoreChange > 0 ? 'text-green-500' : scoreChange < 0 ? 'text-red-500' : 'text-slate-400'
                          }`}>
                          {scoreChange > 0 ? `+${scoreChange}` : scoreChange}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-200/60 dark:bg-slate-900/60">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Racha</span>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold text-orange-500">{timedStats.streak}</span>
                      <MdStar className="text-orange-500" />
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Correctas</span>
                    <span className="text-lg font-bold text-green-500">{timedStats.correct}</span>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Incorrectas</span>
                    <span className="text-lg font-bold text-red-500">{timedStats.incorrect}</span>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-200/60 dark:bg-slate-900/60">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Precisión</span>
                    <span className="text-lg font-bold text-amber-500">
                      {timedStats.correct + timedStats.incorrect === 0
                        ? '0%'
                        : `${Math.round((timedStats.correct / (timedStats.correct + timedStats.incorrect)) * 100)}%`
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GAME AREA */}
          <div className={gameMode === 'timed' ? '' : 'md:col-span-3'}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors border border-gray-100 dark:border-gray-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-pink/5 rounded-full blur-3xl -z-0 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-blue/5 rounded-full blur-3xl -z-0 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCategory(null)} className="px-4 py-2 bg-[#0db9f2]/10 hover:bg-[#0db9f2]/20 dark:bg-[#0db9f2]/5 dark:hover:bg-[#0db9f2]/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-[#0db9f2]/30 flex items-center gap-2 text-[#0db9f2] shadow-lg shadow-[#0db9f2]/5">
                      <span className="bg-[#0db9f2] text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">B</span>
                      Categoría
                    </button>
                    <button onClick={resetToSelection} title="Ir al menú de juegos" className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-[#0db9f2]/20 dark:hover:bg-[#0db9f2]/20 rounded-xl transition-all border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-lg active:scale-95">
                      <MdHome className="text-lg text-slate-600 dark:text-[#0db9f2]" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-sm font-semibold uppercase tracking-wider text-gray-400">{category}</div>
                    <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-bold">
                      {index + 1}/{gameMode === 'chaos' ? CHAOS_MODE_QUESTIONS : TOTAL_QUESTIONS}
                    </div>
                  </div>

                  <div className="text-lg relative font-bold text-primary-blue dark:text-primary-pink">
                    {t('common.score')}: {score}
                    {scoreChange !== null && <ScoreIndicator points={scoreChange} onComplete={() => setScoreChange(null)} />}
                  </div>
                </div>

                {/* Lógica de Timers específica para cada modo */}
                {gameMode === 'insane' ? (
                  <div className="mb-8">
                    <div className="flex flex-col items-center gap-4">
                      <button onClick={handleManualPlay} disabled={hasPlayedAudio || isAudioPlaying || answered} className={`px-8 py-4 rounded-xl font-black uppercase tracking-widest text-white shadow-[4px_4px_0px_0px_black] transition-all ${hasPlayedAudio ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 active:translate-y-1 active:shadow-none animate-pulse'}`}>
                        {isAudioPlaying ? t('games.trivia.audioPlaying') : hasPlayedAudio ? t('games.trivia.audioUsed') : t('games.trivia.playTrack')}
                      </button>
                      {hasPlayedAudio && !answered && (
                        <div className="w-full bg-black border-4 border-black rounded-xl h-8 flex items-center shadow-[4px_4px_0px_0px_black] overflow-hidden relative mt-2">
                          <div className="h-full bg-red-500 transition-all duration-1000 ease-linear" style={{ width: `${(remaining / INSANE_MODE_TIMER) * 100}%` }} />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white font-black text-xs">{remaining}s</div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : gameMode === 'chaos' ? (
                  <div className="mb-8">
                    <div className="w-full bg-black border-4 border-black rounded-xl h-12 flex items-center shadow-[4px_4px_0px_0px_black] overflow-hidden relative">
                      <div className="h-full bg-purple-600 transition-all duration-1000 ease-linear" style={{ width: `${(remaining / CHAOS_MODE_TIMER) * 100}%` }} />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white font-black text-lg">{t('games.trivia.totalTime')}: {remaining}s</div>
                    </div>
                    <div className="flex justify-center gap-4 mt-2 text-xs font-bold uppercase">
                      <span className="text-green-500">{t('games.trivia.chaosCorrect')}: {chaosStats.correct}</span>
                      <span className="text-red-500">{t('games.trivia.chaosIncorrect')}: {chaosStats.incorrect}</span>
                    </div>
                    <div className="flex justify-center mt-4">
                      <button onClick={handleManualPlay} disabled={isAudioPlaying || answered} className={`px-6 py-2 rounded-lg font-black uppercase tracking-widest text-white shadow-[2px_2px_0px_0px_black] transition-all text-xs ${answered ? 'bg-gray-500 cursor-not-allowed opacity-50' : 'bg-purple-600 hover:bg-purple-500 active:translate-y-0.5 active:shadow-none'}`}>
                        {isAudioPlaying ? t('games.trivia.audioPlaying') : t('games.trivia.playSong')}
                      </button>
                    </div>
                  </div>
                ) : gameMode === 'timed' && (
                  <div className="flex flex-col gap-2 mb-8">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tiempo Restante</p>
                        <p className={`text-3xl font-black leading-none ${remaining < 5 ? 'text-red-500' : 'text-[#ff007f]'}`}>{remaining}<span className="text-base">s</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Pregunta</p>
                        <p className="text-xl font-bold text-slate-800 dark:text-white">{String(index + 1).padStart(2, '0')}/{TOTAL_QUESTIONS}</p>
                      </div>
                    </div>
                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-300 dark:border-slate-600">
                      <div className={`h-full transition-all duration-1000 rounded-full ${remaining < 5 ? 'bg-red-500 shadow-[0_0_8px_#ef4444,0_0_16px_#ef4444]' : 'bg-[#ff007f] shadow-[0_0_10px_#ff007f,0_0_20px_#ff007f]'}`} style={{ width: `${(remaining / TIMER_PER_QUESTION) * 100}%` }} />
                    </div>
                  </div>
                )}

                <div className="mb-8 text-center">
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white leading-tight">{current?.question}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {current?.options.map((opt, i) => {
                    const isCorrectOption = correctAnswerIndexes.includes(i);
                    const isSelected = selectedAnswers.includes(i);
                    let cls = "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-primary-blue/50 hover:shadow-lg";
                    if (answered) {
                      if (isCorrectOption) cls = "bg-green-500/10 border-green-500 text-green-600 dark:text-green-400";
                      else if (isSelected && !isCorrectOption) cls = "bg-red-500/10 border-red-500 text-red-600 dark:text-red-400";
                      else cls = "opacity-50 border-gray-200 dark:border-gray-800";
                    } else if (isSelected) cls = "bg-primary-blue/10 border-primary-blue text-primary-blue";

                    return (
                      <button key={i} disabled={answered} onClick={() => handleOptionClick(i)} className={`w-full p-4 rounded-xl border-4 font-bold uppercase tracking-wide transition-all duration-200 transform shadow-[4px_4px_0px_0px_black] active:translate-y-1 active:shadow-none flex items-center gap-4 ${cls}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-4 ${isSelected || (answered && isCorrectOption) ? 'border-black bg-white text-black' : 'border-black bg-gray-200 text-gray-500'}`}>
                          {String.fromCharCode(65 + i)}
                        </div>
                        <span className="text-left flex-1 leading-tight">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {showCorrectAnswer && (
                  <div className={`mb-6 p-4 rounded-xl border-l-4 ${selectedAnswers.length === 0 && gameMode === 'timed' ? 'bg-yellow-500/10 border-yellow-500' : 'bg-red-500/10 border-red-500'} animate-fade-in`}>
                    <p className="font-bold mb-1">{selectedAnswers.length === 0 && gameMode === 'timed' ? t('games.trivia.timeUp') : t('games.trivia.incorrect')}</p>
                    <p className="text-sm opacity-90">{t('games.trivia.correctAnswerIs')}: <span className="font-bold">{correctAnswerIndexes.map(idx => current?.options?.[idx] || '').filter(Boolean).join(', ')}</span></p>
                  </div>
                )}

                <div className="flex justify-between items-center mt-6">
                  {isMultipleAnswer && !answered && (
                    <button onClick={() => submitAnswer()} disabled={selectedAnswers.length === 0} className={`poke-button-blue ${selectedAnswers.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}>
                      <MdCatchingPokemon className="animate-spin-slow mr-2" />
                      {t('games.trivia.submitAnswer')}
                    </button>
                  )}
                  <button onClick={nextQuestion} disabled={!answered} className={`poke-button-pink ml-auto ${!answered ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95 animate-pulse-subtle'}`}>
                    {t('common.next')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-[#0a0a0c] text-slate-900 dark:text-slate-100 selection:bg-primary-blue/30 overflow-x-hidden">

      {/* Contenedor con ancho dinámico: Ampliado para Shurahiwa */}
      <div className={`mx-auto px-2 md:px-4 pt-4 pb-8 md:pt-6 md:pb-12 transition-all duration-300 ${category === 'shurahiwa' ? 'max-w-[1450px]' : 'container'
        }`}>

        {!category ? (
          renderCategorySelection()
        ) : !started && !isCountingDown ? (
          renderModeSelection()
        ) : isCountingDown ? (
          renderCountdown()
        ) : gameOver ? (
          <div className="w-full max-w-4xl mx-auto">
            {renderGameOverUI()}
          </div>
        ) : category === 'shurahiwa' ? (
          /* --- DISEÑO DE COLUMNAS PARA SHURAHIWA --- */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 md:pb-10">
            {renderGameHeader()}
            <div className="flex flex-col lg:flex-row gap-8 mt-16 md:mt-20">
              {/* Contenedor del Juego */}
              <div className="flex-1 w-full min-w-0">
                <div className="bg-white dark:bg-zinc-900/40 rounded-[2.5rem] p-4 md:p-10 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
                  {/* Renderizamos el modo actual de Shurahiwa */}
                  {gameMode === 'chaos' ? renderChaosMode() :
                    gameMode === 'insane' ? renderInsaneMode() :
                      gameMode === 'untimed' ? renderShurahiwaUntimed() : renderShurahiwaTimed()}
                </div>
              </div>
              <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-24">
                <Leaderboard
                  game="trivia"
                  category="shurahiwa"
                  mode={gameMode || undefined}
                  currentPlayer={playerName}
                />

                <div className="mt-6">
                  {renderSessionStats()}
                </div>
              </aside>
            </div>

            {renderBottomNav()}
          </div>
        ) : (
          /* --- RESTO DE CATEGORÍAS (Ej. Música) --- */
          <div className="animate-fade-in">
            {renderGameHeader()}
            <div className="mt-8">
              {category === 'music' && gameMode === 'chaos' ? renderChaosMode() :
                category === 'music' && gameMode === 'insane' ? renderInsaneMode() :
                  renderStandardUI()}
            </div>
            {renderBottomNav()}
          </div>
        )}
      </div>

      {/* Feedback de respuesta */}
      {feedback && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
          <div className={`text-4xl md:text-6xl font-black italic tracking-tighter border-8 border-black dark:border-white p-8 bg-white dark:bg-black shadow-[10px_10px_0px_0px_#FF007F] animate-bounce-in ${feedback.type === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
            {feedback.text}
          </div>
        </div>
      )}

      {renderCommonModals()}
    </div>
  );
};

export default TriviaGame;