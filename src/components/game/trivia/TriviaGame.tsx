'use client';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';

import { triviaQuestions } from '../../../utils/triviaQuestions';
import { useLanguage } from '../../../context/LanguageContext';
import PlayerInput from '../PlayerInput';
import Leaderboard from '../Leaderboard';
import { FiUsers, FiCpu, FiGlobe, FiArrowLeft, FiHeadphones } from 'react-icons/fi';
import { MdCatchingPokemon, MdQuiz, MdTimer, MdCheckCircle, MdEmojiEvents, MdHeadset, MdPsychology, MdHeadphones, MdBolt, MdPriorityHigh, MdStar, MdStars, MdMilitaryTech, MdSportsEsports, MdNotifications, MdPerson, MdHome, MdChevronRight, MdArrowBack, MdArrowForward, MdVisibility, MdPlayArrow, MdPets, MdMusicNote, MdCake, MdGridView, MdLeaderboard, MdShoppingBag, MdSettings, MdAllInclusive, MdSchool, MdSelfImprovement, MdMenuBook } from 'react-icons/md';
import { useGameSounds } from '../../../hooks/useGameSounds';
import { submitGameScore, checkExistingScore } from '../../../utils/supabaseScoreService';
import ScoreOverwriteModal from '../ScoreOverwriteModal';
import RulesModal from '../RulesModal';
import PauseMenu from '../PauseMenu';

const TIMER_PER_QUESTION = 15;
const TOTAL_QUESTIONS = 20;

// Constantes para los nuevos modos
const INSANE_MODE_QUESTIONS = 20;
const INSANE_MODE_TIMER = 11; // Segundos tras reproducir
const CHAOS_MODE_QUESTIONS = 100;
const CHAOS_MODE_TIMER = 2400; // Segundos totales

const getPointsByRemainingTime = (remaining, isCorrect) => {
  if (!isCorrect) return -2;
  if (remaining >= 10) return 5;
  if (remaining >= 5) return 3;
  if (remaining >= 1) return 1;
  return 0;
};

const pickQuestions = (questions, count) => {
  const shuffle = (arr) => arr.map(v => ({ v, r: Math.random() })).sort((a, b) => a.r - b.r).map(x => x.v);
  return shuffle(questions).slice(0, count);
};

// Animated score indicator component
const ScoreIndicator = ({ points, onComplete }) => {
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

const TriviaGame = () => {
  const { t } = useLanguage();
  const { playSelect, playCorrect, playIncorrect, playVictory, playCountdown } = useGameSounds();
  const [playerName, setPlayerName] = useState('');
  const [category, setCategory] = useState<string | null>(null); // null, 'music', 'pantcookie', 'shurahiwa'
  const [gameMode, setGameMode] = useState<'timed' | 'untimed' | 'insane' | 'chaos' | null>(null); // Added 'insane' and 'chaos'
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
  const [pendingMode, setPendingMode] = useState(null);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [pendingScoreData, setPendingScoreData] = useState<{ score: number, oldScore: number } | null>(null);

  // Stats for Chaos Mode
  const [chaosStats, setChaosStats] = useState({ correct: 0, incorrect: 0 });

  // Insane Mode State
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false);

  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Memoize questions based on selected category
  const questions = useMemo(() => {
    if (!category || !triviaQuestions[category]) return [];

    // Logic for Music Modes
    if (category === 'music') {
      if (gameMode === 'insane') {
        return pickQuestions(triviaQuestions[category], INSANE_MODE_QUESTIONS);
      } else if (gameMode === 'chaos') {
        return pickQuestions(triviaQuestions[category], CHAOS_MODE_QUESTIONS); // Or all available if less than 100
      }
    }

    return pickQuestions(triviaQuestions[category], TOTAL_QUESTIONS);
  }, [category, gameMode]); // Added gameMode dependency

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

  // Check if current question has multiple answers
  const isMultipleAnswer = current && Array.isArray(current.correctIndexes);
  // FIX: Add safety check for current
  const correctAnswerIndexes = current
    ? (isMultipleAnswer ? current.correctIndexes : [current.correctIndex])
    : [];

  useEffect(() => {
    const savedName = localStorage.getItem('playerName');
    if (savedName) setPlayerName(savedName);
  }, []);

  useEffect(() => {
    if (!started || gameOver) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [started, gameOver]);

  // Timer Logic
  useEffect(() => {
    if (!started || gameOver || (answered && gameMode !== 'chaos') || gameMode === 'untimed') return;

    // Chaos Mode: Global Timer (doesn't reset per question)
    if (gameMode === 'chaos') {
      // Logic handled separately or we use 'remaining' as global time
      // If this effect runs, it decrements 'remaining'. 
      // For Chaos, 'remaining' should be initialized to 120 and decrement until 0.
    } else if (gameMode === 'insane') {
      // Insane Mode: Timer only starts after audio play (if enabled) or maybe not?
      // Requirement: "si el jugador no logra decifrar el acertijo y reproduce la canción... se encenderá un contador de 7 segundos"
      if (!hasPlayedAudio) return; // No timer until audio is played
    } else {
      // Normal Timed Mode
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
  }, [index, started, gameOver, answered, gameMode, hasPlayedAudio]);

  const selectCategory = (cat) => {
    if (!playerName.trim()) {
      alert(t('common.enterName'));
      return;
    }
    playSelect();
    localStorage.setItem('playerName', playerName);
    setCategory(cat);
  };

  const realStartGame = useCallback(() => {
    setStarted(true);
    setIndex(0);
    setScore(0);
    setAnswered(false);
    setSelectedAnswers([]);
    setChaosStats({ correct: 0, incorrect: 0 });

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

  const startGame = (mode) => {
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
    if (!current?.audioUrl || isAudioPlaying) return;

    const audio = new Audio(current.audioUrl);
    audioRef.current = audio;
    audio.volume = 0.5;

    audio.play().then(() => {
      setIsAudioPlaying(true);

      if (gameMode === 'insane') {
        setHasPlayedAudio(true);
        setRemaining(INSANE_MODE_TIMER); // Start 7s countdown
      }
    }).catch(e => console.error(e));

    audio.onended = () => setIsAudioPlaying(false);
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
          // Small delay before starting game to show "GO!"
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


  const handleOptionClick = (optIndex) => {
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
    if ((answered && gameMode !== 'chaos') || selectedIndexes.length === 0) return;

    let isCorrect = false;
    let isPartial = false;

    if (isMultipleAnswer) {
      const correctSet = new Set(current.correctIndexes as number[]);
      const selectedSet = new Set(selectedIndexes);

      isCorrect = correctSet.size === selectedSet.size &&
        [...correctSet].every(idx => selectedSet.has(idx));

      if (!isCorrect) {

        const correctSelected = [...selectedSet].filter(idx => correctSet.has(idx)).length;
        const incorrectSelected = [...selectedSet].filter(idx => !correctSet.has(idx)).length;
        isPartial = correctSelected > 0 && incorrectSelected > 0;

      }
    } else {
      isCorrect = selectedIndexes[0] === current.correctIndex;
    }

    let pts = 0;

    // Scoring Logic per Mode
    if (gameMode === 'insane') {
      if (isCorrect) {
        pts = hasPlayedAudio ? 3 : 5;
      } else {
        pts = 0; // No penalty mentioned for incorrect, but usually 0.
      }
    } else if (gameMode === 'chaos') {
      if (isCorrect) {
        pts = 10;
        setChaosStats(prev => ({ ...prev, correct: prev.correct + 1 }));
      } else {
        pts = -3;
        setChaosStats(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
      }
    } else if (gameMode === 'timed') {
      if (isCorrect) {
        pts = getPointsByRemainingTime(remaining, true);
      } else if (isPartial) {
        pts = 1;
      } else {
        pts = -2;
      }
    } else {
      // Untimed
      if (isCorrect) pts = 5;
      else if (isPartial) pts = 1;
      else pts = 0;
    }

    setScore(s => s + pts);
    setScoreChange(pts);
    setAnswered(true);

    if (!isCorrect) {
      playIncorrect();
      setFeedback({ type: 'incorrect', text: t('games.trivia.incorrectFeedback') });
      setShowCorrectAnswer(true);
    } else {
      playCorrect();
      setFeedback({ type: 'correct', text: gameMode === 'timed' && remaining > 10 ? t('games.trivia.excellent') : t('games.trivia.correctFeedback') });
    }

    setTimeout(() => {
      setFeedback(null);
    }, 1000);
  };

  const handleTimeout = () => {
    if (answered) return;

    if (gameMode === 'chaos') {
      // Chaos Mode Timeout = Game Over
      setGameOver(true);
      playVictory(); // Or failure sound?
      return;
    }

    // Insane Mode Timeout (7s passed)
    if (gameMode === 'insane') {
      setAnswered(true);
      setScoreChange(0); // 0 points if time runs out
      playIncorrect();
      setShowCorrectAnswer(true);
      return;
    }

    setAnswered(true);
    setScoreChange(0);
    playIncorrect();
    setShowCorrectAnswer(true);
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
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setShowOverwriteModal(false);
    setPendingScoreData(null);
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
  if (!category) {
    return (
      <div className="relative flex flex-col w-full animate-fade-in text-slate-900 dark:text-slate-100">
        {/* Background Glows */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-blue/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-pink/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-blue to-primary-pink rounded-lg flex items-center justify-center text-white neon-glow">
                <MdSportsEsports className="text-2xl" />
              </div>
              <h2 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-800 dark:from-white to-primary-blue/80">Trivia Gamer</h2>
            </div>
            <div className="flex gap-4">
              <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-white/5 border border-white/10 text-slate-400 hover:text-primary-blue transition-colors">
                <MdNotifications />
              </button>
              <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary-blue/20 flex items-center justify-center">
                  <MdPerson className="text-primary-blue text-xs" />
                </div>
                <span className="text-xs font-medium">{playerName || 'Invitado'}</span>
              </div>
            </div>
          </div>

          {/* Info Bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <MdHome className="text-lg" />
              <span>Menu</span>
              <MdChevronRight />
              <span className="text-primary-blue font-medium">Categorías</span>
            </div>
          </div>

          {/* Hero section */}
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-5xl font-black mb-3 tracking-tighter text-gray-800 dark:text-slate-100 uppercase italic">
              Elige tu <span className="text-primary-pink underline decoration-primary-pink/50 underline-offset-8">Categoría</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto md:mx-0">
              Demuestra tu nivel y desbloquea recompensas exclusivas en los desafíos de esta temporada.
            </p>
          </div>

          <div className="mb-8">
            <PlayerInput
              playerName={playerName}
              onNameChange={setPlayerName}
              onStartGame={() => { }} // No auto-start, just name setting
              hideButton={true}
            />
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* PantCookie */}
            <div
              onClick={() => selectCategory('pantcookie')}
              className="glass-card rounded-2xl p-1 flex flex-col group cursor-pointer overflow-hidden relative"
            >
              <div className="relative aspect-video rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
                <img
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-60"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuADmNov2I1T3_GAPg4x6T2vc6Fio5cSU4M2wKPdKqzF65X9YvbsgPb8vo9mtABT1BQGEEY73P-rrGZpfIMxXC1kPZ_pRm1livhbXPkVRBqux0rfNqt6xN8A0XnigLhD0ZJRgz5yJPxN2GAA5qZhKcls00e0zztFlPxyTljSnRqe0e4tmfeiQYVvjhdJIYkp0PN7MX99T82pNvsr496dmg3NcyFid9eXnEmPgQcLqGCAHHEL0481iZEKwAVZYywTp7u6uW3UjkcvqRI"
                  alt="PantCookie"
                />
                <div className="absolute top-4 right-4 z-20 bg-primary-blue/20 backdrop-blur-md px-3 py-1 rounded-full border border-primary-blue/30">
                  <span className="text-[10px] font-bold text-primary-blue uppercase tracking-widest">Hot 🔥</span>
                </div>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-blue/10 flex items-center justify-center border border-primary-blue/20 neon-glow">
                    <MdCake className="text-2xl text-primary-blue" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-primary-blue transition-colors">PantCookie</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">{t('games.trivia.categoryPantcookie')}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <MdVisibility className="text-slate-500 text-sm" />
                    <span className="text-xs text-slate-500">12.4k jugadores</span>
                  </div>
                  <MdPlayArrow className="text-primary-blue opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>

            {/* ShuraHiwa */}
            <div
              onClick={() => selectCategory('shurahiwa')}
              className="glass-card rounded-2xl p-1 flex flex-col group cursor-pointer overflow-hidden relative"
            >
              <div className="relative aspect-video rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
                <img
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-60"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAy4HZrC4g-8Zmziv4BRCnLFks-2CZSAEHICVSO60Zm9pvzJAmbzW8LteJzSU1o88U6-WJhrVjYuCk15Wdv0RvNCuWWQKOa0ZBm-6MahOj1tZDR0cOO-Jp_o-VBgtp2JXZrB7RW-dS3BDX0z9-x3H5kwL4Ugx7ubmCrvvYgH1bDqRLg7GpZgqgi-XOCXDlwiGI1X3PF8qRlSILVqAgtVCqkVifG9T8dWE9sNCAg3EiVIbm6lsGmo4tMnZj5-PatL2AyOi5INWmZFIk"
                  alt="ShuraHiwa"
                />
                <div className="absolute top-4 right-4 z-20 bg-primary-pink/20 backdrop-blur-md px-3 py-1 rounded-full border border-primary-pink/30">
                  <span className="text-[10px] font-bold text-primary-pink uppercase tracking-widest">Rare 💎</span>
                </div>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-pink/10 flex items-center justify-center text-primary-pink border border-primary-pink/20 neon-glow-pink">
                    <MdPets className="text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-primary-pink transition-colors">ShuraHiwa</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">{t('games.trivia.categoryShura')}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <MdVisibility className="text-slate-500 text-sm" />
                    <span className="text-xs text-slate-500">8.9k jugadores</span>
                  </div>
                  <MdPlayArrow className="text-primary-pink opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>

            {/* Canciones */}
            <div
              onClick={() => selectCategory('music')}
              className="glass-card rounded-2xl p-1 flex flex-col group cursor-pointer overflow-hidden relative"
            >
              <div className="relative aspect-video rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
                <img
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-60"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAy993X-qeTwANsYf-pKpygT7HFcY6m8didf28B29m-n--nbDwyLnz24UuLqcSaJ1aD_TB2Pk0nkmxQxkmpMxfVCMm9rdE8Pk0nkmxQxkmpMxfVCMm9rdE8Kg_kIu98viRnnJP5ueQ_ayjuThwJojBh6rBmru5zef1LSqhRLX2-JlML9a7GnlVDztkVAvtYhMPkaYtGqFYVUONqg2vSCwIcumGatrmNNFN7KHRQwNTPdr1mvlzc6JtIPPzeOr1K7ZLDgeURiwdNMz6aYVn1UWhmEQZNAgAagJO_K8"
                  alt="Music"
                />
                <div className="absolute top-4 right-4 z-20 bg-purple-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-purple-500/30">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Viral 🎵</span>
                </div>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                    <MdMusicNote className="text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-purple-400 transition-colors">{t('games.trivia.categoryMusicTitle')}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">{t('games.trivia.categoryMusic')}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <MdVisibility className="text-slate-500 text-sm" />
                    <span className="text-xs text-slate-500">25.1k jugadores</span>
                  </div>
                  <MdPlayArrow className="text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Stats Mockup from user input */}
          <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 mt-8">
            <div className="flex items-center gap-6">
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full border-2 border-black bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white">JD</div>
                <div className="w-10 h-10 rounded-full border-2 border-black bg-primary-blue flex items-center justify-center text-[10px] font-bold text-white">SM</div>
                <div className="w-10 h-10 rounded-full border-2 border-black bg-primary-pink flex items-center justify-center text-[10px] font-bold text-white">AL</div>
                <div className="w-10 h-10 rounded-full border-2 border-black bg-white/10 flex items-center justify-center text-[10px] font-bold text-slate-400">+52</div>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Hay <span className="text-gray-800 dark:text-white font-bold">142 amigos</span> conectados jugando ahora</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const cats = ['pantcookie', 'shurahiwa', 'music'];
                  selectCategory(cats[Math.floor(Math.random() * cats.length)] as any);
                }}
                className="px-6 py-3 rounded-xl bg-primary-blue text-white font-bold text-sm tracking-wide neon-glow hover:brightness-110 transition-all uppercase"
              >
                Partida Rápida
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Navigation Bar (Mobile) */}
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 glass-card rounded-2xl flex items-center justify-around py-3 px-6 border border-white/10">
          <button className="text-primary-blue flex flex-col items-center gap-1">
            <MdGridView />
            <span className="text-[10px] font-bold uppercase">Categorías</span>
          </button>
          <button className="text-slate-400 flex flex-col items-center gap-1">
            <MdLeaderboard />
            <span className="text-[10px] font-bold uppercase">Ranking</span>
          </button>
          <div className="w-12 h-12 rounded-full bg-primary-blue flex items-center justify-center -translate-y-6 border-4 border-slate-900 shadow-xl">
            <MdPlayArrow className="text-slate-900 text-3xl font-bold" />
          </div>
          <button className="text-slate-400 flex flex-col items-center gap-1">
            <MdShoppingBag />
            <span className="text-[10px] font-bold uppercase">Tienda</span>
          </button>
          <button className="text-slate-400 flex flex-col items-center gap-1">
            <MdSettings />
            <span className="text-[10px] font-bold uppercase">Perfil</span>
          </button>
        </div>
      </div>
    );
  }

  if (!started && !isCountingDown) {
    if (category === 'music') {
      return (
        <div className="relative flex flex-col w-full animate-fade-in text-slate-900 dark:text-slate-100">
          {/* Background Glows */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]"></div>
          </div>

          <div className="relative z-10 space-y-8">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-2">
              <div className="flex items-center gap-3">
                <div className="size-8 text-primary-blue flex items-center justify-center">
                  <MdSportsEsports className="text-3xl" />
                </div>
                <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold tracking-tight">Trivia Master</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full bg-primary-blue/10 border border-primary-blue/20">
                  <MdStars className="text-primary-blue text-sm" />
                  <span className="text-sm font-bold text-primary-blue">Nivel 42</span>
                </div>
                <button
                  onClick={() => setCategory(null)}
                  className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-primary-blue transition-colors"
                >
                  <MdSettings />
                </button>
              </div>
            </header>

            <main className="flex flex-col items-center justify-center py-6">
              <div className="max-w-4xl w-full text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight glow-text text-slate-900 dark:text-white uppercase">
                  Desafío <span className="text-red-600">Musical</span>
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">Pon a prueba tu oído con los modos más extremos</p>
              </div>

              {/* Cards Container */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl relative">
                {/* VS Divider */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center size-16 rounded-full bg-slate-900 border-4 border-slate-800 shadow-2xl">
                  <span className="text-red-600 font-black text-2xl italic tracking-tighter">VS</span>
                </div>

                {/* Mode: Insane */}
                <div
                  onClick={() => startGame('insane')}
                  className="group relative overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900/50 border-2 border-red-600/30 p-8 transition-all hover:border-red-600 hover:scale-[1.02] flex flex-col items-center text-center cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-red-600/5 to-transparent pointer-events-none"></div>
                  <div className="mb-6 flex size-24 items-center justify-center rounded-full bg-red-600/20 text-red-600 shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                    <MdPsychology className="text-6xl" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white uppercase tracking-wider">{t('games.trivia.insaneMode')}</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-xs leading-relaxed">
                    {t('games.trivia.insaneModeDesc')}
                  </p>
                  <div className="mt-auto w-full">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-4 px-2">
                      <span className="flex items-center gap-1 uppercase"><MdHeadset className="text-sm" /> Auditivo</span>
                      <span className="flex items-center gap-1 uppercase"><MdTimer className="text-sm" /> 7s Limit</span>
                    </div>
                    <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg transition-all flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                      <span>HARDCORE</span>
                      <MdPlayArrow className="text-xl" />
                    </button>
                  </div>
                </div>

                {/* Mode: Chaos */}
                <div
                  onClick={() => startGame('chaos')}
                  className="group relative overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900/50 border-2 border-purple-600/30 p-8 transition-all hover:border-purple-600 hover:scale-[1.02] flex flex-col items-center text-center cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-purple-600/5 to-transparent pointer-events-none"></div>
                  <div className="mb-6 flex size-24 items-center justify-center rounded-full bg-purple-600/20 text-purple-600 shadow-[0_0_20px_rgba(147,51,234,0.3)]">
                    <MdBolt className="text-6xl" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white uppercase tracking-wider">{t('games.trivia.chaosMode')}</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-xs leading-relaxed">
                    {t('games.trivia.chaosModeDesc')}
                  </p>
                  <div className="mt-auto w-full">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-4 px-2">
                      <span className="flex items-center gap-1 uppercase"><MdPriorityHigh className="text-sm" /> Speedrun</span>
                      <span className="flex items-center gap-1 uppercase"><MdStar className="text-sm" /> 100 Qs</span>
                    </div>
                    <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-lg transition-all flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(147,51,234,0.4)]">
                      <span>CHAOS</span>
                      <MdPlayArrow className="text-xl" />
                    </button>
                  </div>
                </div>
              </div>
            </main>
          </div>

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

          {/* Bottom Navigation (Mobile Friendly) */}
          <nav className="flex justify-around items-center border-t border-slate-200 dark:border-slate-800 py-3 px-6 md:hidden">
            <button
              onClick={() => setCategory(null)}
              className="flex flex-col items-center gap-1 text-primary-blue"
            >
              <MdHome className="text-xl" />
              <span className="text-[10px] font-bold uppercase">Inicio</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-400">
              <MdEmojiEvents className="text-xl" />
              <span className="text-[10px] font-bold uppercase">Ranking</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-400">
              <MdShoppingBag className="text-xl" />
              <span className="text-[10px] font-bold uppercase">Tienda</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-400">
              <MdPerson className="text-xl" />
              <span className="text-[10px] font-bold uppercase">Perfil</span>
            </button>
          </nav>
        </div>
      );
    }

    return (
      <div className="relative flex flex-col w-full animate-fade-in text-slate-900 dark:text-slate-100">
        {/* Background Glows */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-blue/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-pink/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10 space-y-8">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="size-8 text-primary-blue flex items-center justify-center">
                <MdSportsEsports className="text-3xl" />
              </div>
              <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold tracking-tight">Trivia Master</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full bg-primary-blue/10 border border-primary-blue/20">
                <MdStars className="text-primary-blue text-sm" />
                <span className="text-sm font-bold text-primary-blue">Nivel 42</span>
              </div>
              <button
                onClick={() => setCategory(null)}
                className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-primary-blue transition-colors"
              >
                <MdSettings />
              </button>
            </div>
          </header>

          <main className="flex flex-col items-center justify-center py-6">
            <div className="max-w-4xl w-full text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight glow-text text-slate-900 dark:text-white uppercase">
                Selecciona tu <span className="text-primary-blue">Desafío</span>
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg">Elige cómo quieres poner a prueba tus conocimientos hoy ({category?.toUpperCase()})</p>
            </div>

            {/* Cards Container */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl relative">
              {/* VS Divider */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center size-16 rounded-full bg-slate-900 border-4 border-slate-800 shadow-2xl">
                <span className="text-primary-blue font-black text-2xl italic tracking-tighter">VS</span>
              </div>

              {/* Mode: Con Tiempo */}
              <div
                onClick={() => startGame('timed')}
                className="group relative overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900/50 border-2 border-primary-blue/40 p-8 transition-all hover:border-primary-blue hover:scale-[1.02] flex flex-col items-center text-center cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-primary-blue/5 to-transparent pointer-events-none"></div>
                <div className="mb-6 flex size-24 items-center justify-center rounded-full bg-primary-blue/20 text-primary-blue neon-glow">
                  <MdTimer className="text-6xl" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white uppercase tracking-wider">Con Tiempo</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-xs leading-relaxed">
                  ¡Pura adrenalina! Responde antes de que el cronómetro llegue a cero para maximizar tus puntos.
                </p>
                <div className="mt-auto w-full">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-4 px-2">
                    <span className="flex items-center gap-1 uppercase"><MdBolt className="text-sm" /> +50% XP</span>
                    <span className="flex items-center gap-1 uppercase"><MdLeaderboard className="text-sm" /> Pro Mode</span>
                  </div>
                  <button className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white font-bold py-4 rounded-lg transition-all flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(13,185,242,0.4)]">
                    <span>COMENZAR</span>
                    <MdPlayArrow className="text-xl" />
                  </button>
                </div>
              </div>

              {/* Mode: Sin Tiempo */}
              <div
                onClick={() => startGame('untimed')}
                className="group relative overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900/50 border-2 border-slate-300 dark:border-slate-800 p-8 transition-all hover:border-primary-pink/60 hover:scale-[1.02] flex flex-col items-center text-center cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-slate-500/5 to-transparent pointer-events-none"></div>
                <div className="mb-6 flex size-24 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  <MdAllInclusive className="text-6xl" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white uppercase tracking-wider">Sin Tiempo</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-xs leading-relaxed">
                  Relájate y aprende. Tómate el tiempo necesario para leer y reflexionar cada respuesta.
                </p>
                <div className="mt-auto w-full">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-4 px-2">
                    <span className="flex items-center gap-1 uppercase"><MdSchool className="text-sm" /> Práctica</span>
                    <span className="flex items-center gap-1 uppercase"><MdSelfImprovement className="text-sm" /> Relax</span>
                  </div>
                  <button className="w-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-4 rounded-lg transition-all flex items-center justify-center gap-2">
                    <span>EXPLORAR</span>
                    <MdMenuBook className="text-xl" />
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Mini-Bar */}
            <div className="mt-16 w-full max-w-lg p-4 rounded-xl bg-slate-200/50 dark:bg-slate-800/30 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-full border-2 border-primary-blue bg-slate-400 bg-cover bg-center" style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuB1gt77Dt4i2riP3j187U8cQuD7bQyL6MSllpIPVywpB-_06N1CxwAZWyXnvmmZ775CEHBp3XwtkLi8VWHtDfYE5epi9P2fa4PCKW4hq6SQl_KjfsZyFAU8RGYQAqYcWYCuV8YaS0SC39y21wZqPQNdohijd4xJNZgfXGlvlWdBfDG6Ls5vVXsMghAYyp3jJznLzu93jftAeWRj0yPgvRWuZP_ZCEPLcct4jYl9wkf8c0VCYTjC5K7iMf6O9iAeOEhe-rELrR2r_WI')` }}></div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 dark:text-white">{playerName || 'Invitado'}</span>
                  <span className="text-xs text-slate-500">Online</span>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="text-center px-3 py-1 bg-slate-200 dark:bg-slate-800 rounded-lg">
                  <div className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Racha</div>
                  <div className="text-primary-blue font-bold">5 🔥</div>
                </div>
                <div className="text-center px-3 py-1 bg-slate-200 dark:bg-slate-800 rounded-lg">
                  <div className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Global</div>
                  <div className="text-slate-900 dark:text-white font-bold">#124</div>
                </div>
              </div>
            </div>
          </main>
        </div>

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

        {/* Bottom Navigation (Mobile Friendly) */}
        <nav className="flex justify-around items-center border-t border-slate-200 dark:border-slate-800 py-3 px-6 md:hidden">
          <button
            onClick={() => setCategory(null)}
            className="flex flex-col items-center gap-1 text-primary-blue"
          >
            <MdHome className="text-xl" />
            <span className="text-[10px] font-bold uppercase">Inicio</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-400">
            <MdEmojiEvents className="text-xl" />
            <span className="text-[10px] font-bold uppercase">Ranking</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-400">
            <MdShoppingBag className="text-xl" />
            <span className="text-[10px] font-bold uppercase">Tienda</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-400">
            <MdPerson className="text-xl" />
            <span className="text-[10px] font-bold uppercase">Perfil</span>
          </button>
        </nav>
      </div>
    );
  }

  const getStatusMessage = (value: number) => {
    switch (value) {
      case 3: return t('games.trivia.countdownReady');
      case 2: return t('games.trivia.countdownSet');
      case 1: return t('games.trivia.countdownSteady');
      case 0: return t('games.trivia.countdownGo');
      default: return '';
    }
  };

  if (isCountingDown) {
    return (
      <div className="flex flex-col items-center justify-center mt-25 md:mt-33 gap-10">
        <div className="relative h-40 md:h-56 flex items-center justify-center">
          <div
            key={countValue}
            className="flex items-center justify-center animate-bounce duration-500"
          >
            <span className={`font-black italic leading-none drop-shadow-sm transition-colors
                ${countValue === 0
                ? 'text-[10rem] md:text-[14rem] text-primary-blue'
                : 'text-[12rem] md:text-[16rem] text-[#1a1c2c] dark:text-white'
              }`}
            >
              {countValue === 0 ? 'GO!' : countValue}
            </span>
          </div>
        </div>

        {/* Mensaje dinámico inferior */}
        <div
          key={`msg-${countValue}`}
          className="flex flex-col items-center animate-fade-in-up"
        >
          <span className="text-sm md:text-base font-black uppercase tracking-[0.8em] text-primary-pink transition-all">
            {getStatusMessage(countValue)}
          </span>
        </div>

      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center animate-fade-in-up">
              <h1 className="text-4xl md:text-6xl font-black neon-text-pink mb-6 uppercase italic tracking-tighter">
                {t('games.shuraRun.gameOver')}
              </h1>
              <h2 className="text-3xl font-bold text-primary-pink mb-2">{playerName}</h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                {t('common.score')}: <span className="font-bold text-primary-blue">{score}</span>
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={resetToSelection}
                  className="poke-button-pink"
                >
                  {t('common.backToSelection')}
                </button>
              </div>
            </div>
          </div>
          <div className="md:col-span-1">
            <Leaderboard category={category === 'music' ? `${category}:${gameMode}` : (category || undefined)} currentPlayer={playerName} game="trivia" />
          </div>
        </div>

        {/* Overwrite Confirmation Modal */}
        <ScoreOverwriteModal
          isOpen={showOverwriteModal}
          onConfirm={confirmOverwrite}
          onCancel={() => setShowOverwriteModal(false)}
          playerName={playerName}
          gameType="trivia"
          oldScore={pendingScoreData?.oldScore || 0}
          newScore={pendingScoreData?.score || 0}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto relative">
      <>
        {feedback && (
          <div
            className={`absolute top-[50%] left-1/3 -translate-x-1/2 -translate-y-1/2 z-[80] 
          text-2xl md:text-3xl font-black italic tracking-tighter border-4 border-black 
          p-4 md:p-2 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ring-4 ring-primary-pink/10 animate-fade-in
          ${feedback.type === 'correct' ? 'text-primary-pink' : 'text-gray-500'}`}
          >
            {feedback.text}
          </div>
        )}
      </>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-3">
          {gameMode === 'untimed' ? (
            <div className="flex flex-col gap-6 w-full relative animate-fade-in text-slate-900 dark:text-slate-100">
              {/* Overlay Feedback from parent (top of relative block) */}

              {/* Progress & Stats */}
              <div className="bg-primary-blue/5 backdrop-blur-md border border-primary-blue/10 rounded-2xl p-6 border-l-4 border-l-primary-blue shadow-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h1 className="text-primary-blue font-bold uppercase tracking-wider text-xs">Modo Activo</h1>
                    <h2 className="text-2xl font-bold dark:text-white mb-2">Modo Sin Tiempo</h2>
                    <button
                      onClick={() => setShowPauseMenu(true)}
                      className="px-3 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded flex items-center gap-1 text-xs font-bold uppercase text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      <MdArrowBack /> {t('games.trivia.back')}
                    </button>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-lg font-bold text-primary-blue border border-primary-blue/20 bg-primary-blue/10 px-3 py-1 rounded-lg flex items-center gap-1 shadow-sm relative">
                      <span className="text-[10px] uppercase tracking-widest text-primary-blue/70 block absolute -top-4 right-1">{t('common.score')}</span>
                      {score} PTS
                      {scoreChange !== null && (
                        <div className="absolute right-full mr-2 -translate-y-1/2 top-1/2">
                          <ScoreIndicator points={scoreChange} onComplete={() => setScoreChange(null)} />
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-bold bg-primary-blue/20 text-primary-blue px-3 py-1 rounded-full shadow-sm">
                      Pregunta {index + 1}/{TOTAL_QUESTIONS}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden mt-4 shadow-inner">
                  <div
                    className="bg-primary-blue h-full shadow-[0_0_15px_rgba(13,185,242,0.5)] transition-all duration-500"
                    style={{ width: `${(index / TOTAL_QUESTIONS) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Question Area */}
              <div className="flex-1 flex flex-col justify-center items-center py-10 px-6 gap-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl transition-colors border border-gray-100 dark:border-gray-700 relative overflow-hidden">

                {/* Internal Glows */}
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-blue/5 rounded-full blur-[100px] pointer-events-none"></div>

                <h2 className="text-3xl md:text-4xl font-bold text-center leading-tight max-w-2xl text-slate-900 dark:text-white z-10">
                  {current?.question}
                </h2>
                {isMultipleAnswer && !answered && (
                  <p className="text-sm text-primary-pink font-semibold mt-1 animate-pulse z-10">
                    ({t('games.options.selectMultiple')})
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl z-10">
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
                      <button
                        key={i}
                        disabled={answered}
                        onClick={() => handleOptionClick(i)}
                        className={btnClass}
                      >
                        {isSelected && !answered && (
                          <div className="absolute inset-0 bg-gradient-to-r from-primary-blue/10 to-transparent pointer-events-none opacity-50"></div>
                        )}
                        <span className={iconClass}>{String.fromCharCode(65 + i)}</span>
                        <span className={textClass}>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {showCorrectAnswer && (
                  <div className={`mt-2 w-full max-w-2xl p-4 rounded-xl border-l-4 border-red-500 bg-red-500/10 animate-fade-in z-10`}>
                    <p className="font-bold mb-1 text-red-600 dark:text-red-400">{t('games.trivia.incorrect')}</p>
                    <p className="text-sm opacity-90 text-slate-700 dark:text-slate-300">
                      {t('games.trivia.correctAnswerIs')}: <span className="font-bold">{correctAnswerIndexes.map(idx => current.options[idx]).join(', ')}</span>
                    </p>
                  </div>
                )}

                {/* Legend block for Untimed */}
                {index === 0 && !answered && (
                  <div className="w-full max-w-2xl mt-2 flex items-center justify-center gap-6 text-[10px] uppercase font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 py-2 px-4 rounded-lg z-10">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />Correcto: 5pts</div>
                    {isMultipleAnswer && (
                      <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500 shadow-sm shadow-yellow-500/50" />Parcial: 1pt</div>
                    )}
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />Incorrecto: 0pts</div>
                  </div>
                )}

                <div className="flex w-full max-w-2xl justify-between pt-6 border-t border-slate-200 dark:border-slate-800 mt-2 z-10 items-center">
                  {isMultipleAnswer && !answered ? (
                    <button
                      onClick={() => submitAnswer()}
                      disabled={selectedAnswers.length === 0}
                      className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-lg transition-all
                           ${selectedAnswers.length === 0
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                          : 'bg-primary-blue hover:bg-primary-blue/80 text-white active:scale-95 shadow-lg shadow-primary-blue/20'}`}
                    >
                      <MdCatchingPokemon className={selectedAnswers.length > 0 ? "animate-spin-slow" : ""} />
                      {t('games.trivia.submitAnswer')}
                    </button>
                  ) : <div />}

                  <button
                    onClick={nextQuestion}
                    disabled={!answered}
                    className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-lg uppercase tracking-wide transition-all ml-auto
                        ${!answered
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 border border-slate-300 dark:border-slate-600 cursor-not-allowed opacity-50'
                        : 'bg-primary-blue hover:bg-primary-blue/80 text-white shadow-lg shadow-primary-blue/20 active:scale-95'}`}
                  >
                    Siguiente
                    <MdArrowForward className="text-xl" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors border border-gray-100 dark:border-gray-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-pink/5 rounded-full blur-3xl -z-0 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-blue/5 rounded-full blur-3xl -z-0 pointer-events-none" />

              <div className="relative z-10">
                <>
                  {updateMessage && (
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-4 bg-pokemon-yellow text-black px-6 py-2 rounded-full font-black text-sm border-4 border-black shadow-[4px_4px_0px_0px_black] z-[100] whitespace-nowrap animate-fade-in-up"
                    >
                      {updateMessage}
                    </div>
                  )}
                </>
                <div className="flex items-center justify-between mb-8">
                  <button
                    onClick={() => setShowPauseMenu(true)}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-xs font-black uppercase tracking-widest transition-all border-2 border-black shadow-[2px_2px_0px_0px_black] active:translate-y-0.5 active:shadow-none"
                  >
                    {t('games.trivia.back')}
                  </button>

                  <div className="flex items-center gap-4">
                    <div className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                      {category}
                    </div>
                    <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-bold">
                      {index + 1}/{gameMode === 'chaos' ? CHAOS_MODE_QUESTIONS : TOTAL_QUESTIONS}
                    </div>
                  </div>

                  <div className="text-lg relative font-bold text-primary-blue dark:text-primary-pink">
                    {t('common.score')}: {score}
                    {scoreChange !== null && (
                      <ScoreIndicator
                        points={scoreChange}
                        onComplete={() => setScoreChange(null)}
                      />
                    )}
                  </div>
                </div>

                {/* BARRA DE TIEMPO / JUGADOR DE MUSICA */}
                {gameMode === 'insane' ? (
                  <div className="mb-8">
                    <div className="flex flex-col items-center gap-4">
                      <button
                        onClick={handleManualPlay}
                        disabled={hasPlayedAudio || isAudioPlaying || answered}
                        className={`px-8 py-4 rounded-xl font-black uppercase tracking-widest text-white shadow-[4px_4px_0px_0px_black] transition-all
                                    ${hasPlayedAudio ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 active:translate-y-1 active:shadow-none animate-pulse'}
                                `}
                      >
                        {isAudioPlaying ? t('games.trivia.audioPlaying') : hasPlayedAudio ? t('games.trivia.audioUsed') : t('games.trivia.playTrack')}
                      </button>

                      {hasPlayedAudio && !answered && (
                        <div className="w-full bg-black border-4 border-black rounded-xl h-8 flex items-center shadow-[4px_4px_0px_0px_black] overflow-hidden relative mt-2">
                          <div
                            className="h-full bg-red-500 transition-all duration-1000 ease-linear"
                            style={{ width: `${(remaining / INSANE_MODE_TIMER) * 100}%` }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white font-black text-xs">
                            {remaining}s
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : gameMode === 'chaos' ? (
                  <div className="mb-8">
                    <div className="w-full bg-black border-4 border-black rounded-xl h-12 flex items-center shadow-[4px_4px_0px_0px_black] overflow-hidden relative">
                      <div
                        className="h-full bg-purple-600 transition-all duration-1000 ease-linear"
                        style={{ width: `${(remaining / CHAOS_MODE_TIMER) * 100}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white font-black text-lg">
                        {t('games.trivia.totalTime')}: {remaining}s
                      </div>
                    </div>
                    <div className="flex justify-center gap-4 mt-2 text-xs font-bold uppercase">
                      <span className="text-green-500">{t('games.trivia.chaosCorrect')}: {chaosStats.correct}</span>
                      <span className="text-red-500">{t('games.trivia.chaosIncorrect')}: {chaosStats.incorrect}</span>
                    </div>
                    <div className="flex justify-center mt-4">
                      <button
                        onClick={handleManualPlay}
                        disabled={isAudioPlaying || answered}
                        className={`px-6 py-2 rounded-lg font-black uppercase tracking-widest text-white shadow-[2px_2px_0px_0px_black] transition-all text-xs
                            ${answered ? 'bg-gray-500 cursor-not-allowed opacity-50' : 'bg-purple-600 hover:bg-purple-500 active:translate-y-0.5 active:shadow-none'}
                          `}
                      >
                        {isAudioPlaying ? t('games.trivia.audioPlaying') : t('games.trivia.playSong')}
                      </button>
                    </div>
                  </div>
                ) : gameMode === 'timed' && (
                  <div className="w-full bg-black border-4 border-black rounded-xl h-12 flex items-center shadow-[4px_4px_0px_0px_black] overflow-hidden mb-8 relative">
                    {/* Progress Bar */}
                    <div
                      className={`h-full transition-all duration-1000 ease-linear ${remaining < 5
                        ? 'bg-red-500 shadow-[inset_-10px_0_20px_rgba(0,0,0,0.2)]'
                        : 'bg-[#ff00ff] shadow-[inset_-10px_0_20px_rgba(0,0,0,0.2)]'
                        }`}
                      style={{ width: `${(remaining / TIMER_PER_QUESTION) * 100}%` }}
                    />

                    {/* Centered Text */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-sm font-black uppercase tracking-[0.2em] text-white drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] z-10">
                        TIME: {remaining}S
                      </span>
                    </div>
                  </div>
                )}

                {index === 0 && !answered && (
                  <div className="mb-10 p-4 border-4 border-black bg-white dark:bg-black rounded-2xl shadow-[4px_4px_0px_0px_black] flex flex-wrap justify-center gap-6 text-[10px] uppercase tracking-[0.2em] font-black">
                    {gameMode === 'insane' ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-green-500 border-2 border-black" />
                          <span>{t('games.trivia.legendInsaneRight')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-yellow-500 border-2 border-black" />
                          <span>{t('games.trivia.legendInsaneAudio')}</span>
                        </div>
                      </>
                    ) : gameMode === 'chaos' ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-green-500 border-2 border-black" />
                          <span>{t('games.trivia.legendChaosRight')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-red-500 border-2 border-black" />
                          <span>{t('games.trivia.legendChaosWrong')}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-green-500 border-2 border-black" />
                          <span>{t('games.options.legendCorrect')}: {gameMode === 'timed' ? 'UP TO 5pts' : '5pts'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-yellow-500 border-2 border-black" />
                          <span>{t('games.options.legendPartial')}: 1pt</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-red-500 border-2 border-black" />
                          <span>{t('games.options.legendIncorrect')}: {gameMode === 'timed' ? '-2pts' : '0pts'}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="mb-8 text-center">
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white leading-tight">
                    {current?.question}
                  </h3>
                  {isMultipleAnswer && !answered && (
                    <p className="text-sm text-primary-pink font-semibold mt-3 animate-pulse">
                      ({t('games.options.selectMultiple')})
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {current?.options.map((opt, i) => {
                    const isCorrectOption = correctAnswerIndexes.includes(i);
                    const isSelected = selectedAnswers.includes(i);
                    let cls = "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-primary-blue/50 hover:shadow-lg";

                    if (answered) {
                      if (isCorrectOption) {
                        cls = "bg-green-500/10 border-green-500 text-green-600 dark:text-green-400";
                      } else if (isSelected && !isCorrectOption) {
                        cls = "bg-red-500/10 border-red-500 text-red-600 dark:text-red-400";
                      } else {
                        cls = "opacity-50 border-gray-200 dark:border-gray-800";
                      }
                    } else if (isSelected) {
                      cls = "bg-primary-blue/10 border-primary-blue text-primary-blue";
                    }

                    return (
                      <button
                        key={i}
                        disabled={answered}
                        onClick={() => handleOptionClick(i)}
                        className={`w-full p-4 rounded-xl border-4 font-bold uppercase tracking-wide transition-all duration-200 transform shadow-[4px_4px_0px_0px_black] active:translate-y-1 active:shadow-none flex items-center gap-4 ${cls}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-4 ${isSelected || (answered && isCorrectOption)
                          ? 'border-black bg-white text-black'
                          : 'border-black bg-gray-200 text-gray-500'
                          }`}>
                          {String.fromCharCode(65 + i)}
                        </div>
                        <span className="text-left flex-1 leading-tight">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {showCorrectAnswer && (
                <div className={`mb-6 p-4 rounded-xl border-l-4 ${selectedAnswers.length === 0 && gameMode === 'timed' ? 'bg-yellow-500/10 border-yellow-500' : 'bg-red-500/10 border-red-500'} animate-fade-in`}>
                  <p className="font-bold mb-1">
                    {selectedAnswers.length === 0 && gameMode === 'timed' ? t('games.trivia.timeUp') : t('games.trivia.incorrect')}
                  </p>
                  <p className="text-sm opacity-90">
                    {t('games.trivia.correctAnswerIs')}: <span className="font-bold">{correctAnswerIndexes.map(idx => current.options[idx]).join(', ')}</span>
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center mt-6">
                {isMultipleAnswer && !answered && (
                  <button
                    onClick={() => submitAnswer()}
                    disabled={selectedAnswers.length === 0}
                    className={`poke-button-blue ${selectedAnswers.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                  >
                    <MdCatchingPokemon className="animate-spin-slow mr-2" />
                    {t('games.trivia.submitAnswer')}
                  </button>
                )}

                <button
                  onClick={nextQuestion}
                  disabled={!answered}
                  className={`poke-button-pink ml-auto ${!answered ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95 animate-pulse-subtle'}`}
                >
                  {t('common.next')}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-1">
          <Leaderboard category={category === 'music' ? `${category}:${gameMode}` : (category || undefined)} currentPlayer={playerName} game="trivia" />
        </div>
      </div>

      {/* PAUSE MENU OVERLAY */}
      <PauseMenu
        isOpen={showPauseMenu}
        onResume={() => setShowPauseMenu(false)}
        onRestart={() => setShowRestartConfirm(true)}
        onExit={() => setShowExitConfirm(true)}
      />

      {/* RESTART CONFIRMATION */}
      {showRestartConfirm && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in"
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-4 border-black shadow-[8px_8px_0px_0px_black] max-w-xs w-full text-center animate-fade-in-up"
          >
            <p className="text-xl font-black mb-6 dark:text-white uppercase italic">{t('games.puzzle.restartConfirm')}</p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowRestartConfirm(false);
                  setShowPauseMenu(false);
                  setIsCountingDown(true);
                  setCountValue(3);
                }}
                className="flex-1 py-3 bg-green-500 text-white font-black uppercase rounded-xl border-2 border-black"
              >
                {t('games.puzzle.yes')}
              </button>
              <button
                onClick={() => setShowRestartConfirm(false)}
                className="flex-1 py-3 bg-gray-400 text-white font-black uppercase rounded-xl border-2 border-black"
              >
                {t('games.puzzle.no')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXIT CONFIRMATION */}
      {showExitConfirm && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in"
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-4 border-black shadow-[8px_8px_0px_0px_black] max-w-xs w-full text-center animate-fade-in-up"
          >
            <p className="text-xl font-black mb-6 dark:text-white uppercase italic">{t('games.puzzle.exitConfirm')}</p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  setShowPauseMenu(false);
                  resetToSelection();
                }}
                className="flex-1 py-3 bg-red-600 text-white font-black uppercase rounded-xl border-2 border-black"
              >
                {t('games.puzzle.yes')}
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-3 bg-gray-400 text-white font-black uppercase rounded-xl border-2 border-black"
              >
                {t('games.puzzle.no')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TriviaGame;