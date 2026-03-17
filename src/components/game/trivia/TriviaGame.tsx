'use client';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';

import { triviaQuestions } from '../../../utils/triviaQuestions';
import { useLanguage } from '../../../context/LanguageContext';
import PlayerInput from '../PlayerInput';
import Leaderboard from '../Leaderboard';
import { FiUsers, FiCpu, FiGlobe, FiArrowLeft, FiHeadphones } from 'react-icons/fi';
import { MdCatchingPokemon } from 'react-icons/md';
import { useGameSounds } from '../../../hooks/useGameSounds';
import { submitGameScore, checkExistingScore } from '../../../utils/supabaseScoreService';
import ScoreOverwriteModal from '../ScoreOverwriteModal';

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
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 transition-colors border-4 border-black shadow-[8px_8px_0px_0px_black]">
        <div className="mb-8">
          <PlayerInput
            playerName={playerName}
            onNameChange={setPlayerName}
            onStartGame={() => { }} // No auto-start, just name setting
            hideButton={true}
          />
        </div>

        <h3 className="text-2xl font-bold text-center mb-8 neon-text-blue uppercase tracking-widest">
          {t('games.options.selectCategory')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => selectCategory('pantcookie')}
            className="group relative overflow-hidden bg-white/50 dark:bg-black/40 backdrop-blur-xl p-6 rounded-2xl border border-primary-blue/30 hover:border-primary-blue transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:-translate-y-2"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-primary-blue/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FiUsers className="w-8 h-8 text-primary-blue" />
              </div>
              <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-2">PantCookie</h4>
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">{t('games.trivia.categoryPantcookie')}</p>
            </div>
          </button>

          <button
            onClick={() => selectCategory('shurahiwa')}
            className="group relative overflow-hidden bg-white/50 dark:bg-black/40 backdrop-blur-xl p-6 rounded-2xl border border-primary-pink/30 hover:border-primary-pink transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,0,255,0.3)] hover:-translate-y-2"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-pink/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-primary-pink/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FiCpu className="w-8 h-8 text-primary-pink" />
              </div>
              <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-2">ShuraHiwa</h4>
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">{t('games.trivia.categoryShura')}</p>
            </div>
          </button>

          <button
            onClick={() => selectCategory('music')}
            className="group relative overflow-hidden bg-white/50 dark:bg-black/40 backdrop-blur-xl p-6 rounded-2xl border-purple-500/30 hover:border-purple-500 transition-all duration-300 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:-translate-y-2"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FiGlobe className="w-8 h-8 text-purple-500" />
              </div>
              <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t('games.trivia.categoryMusicTitle')}</h4>
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">{t('games.trivia.categoryMusic')}</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (!started && !isCountingDown) {
    if (category === 'music') {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors text-center animate-fade-in relative">
          <button onClick={() => setCategory(null)} className="absolute top-8 left-8 text-gray-400 hover:text-gray-600 dark:hover:text-white transition">
            <FiArrowLeft size={24} />
          </button>

          <h3 className="text-2xl font-bold mb-8 neon-text-pink uppercase tracking-widest">
            {t('games.options.chooseMode')} (Música)
          </h3>

          <div className="flex flex-col md:flex-row gap-6 justify-center max-w-2xl mx-auto">
            <button
              onClick={() => startGame('insane')}
              className="flex-1 p-8 rounded-2xl border-4 border-red-600/30 hover:border-red-600 bg-red-600/5 hover:bg-red-600/10 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] px-2 py-1 font-bold uppercase">Hardcore</div>
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🔥</div>
              <h4 className="text-xl font-bold mb-2 text-red-600">{t('games.trivia.insaneMode')}</h4>
              <p className="text-sm text-gray-500 whitespace-pre-line">
                {t('games.trivia.insaneModeDesc')}
              </p>
            </button>

            <button
              onClick={() => startGame('chaos')}
              className="flex-1 p-8 rounded-2xl border-4 border-purple-600/30 hover:border-purple-600 bg-purple-600/5 hover:bg-purple-600/10 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] px-2 py-1 font-bold uppercase">Speedrun</div>
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">⚡</div>
              <h4 className="text-xl font-bold mb-2 text-purple-600">{t('games.trivia.chaosMode')}</h4>
              <p className="text-sm text-gray-500 whitespace-pre-line">
                {t('games.trivia.chaosModeDesc')}
              </p>
            </button>
          </div>

          {/* Rules Modal */}
          {showRules && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up border border-primary-blue/20">
                <h3 className="text-2xl font-bold text-primary-blue mb-4 text-center">
                  🧠 {t('games.trivia.musicRulesTitle')}
                </h3>
                <div className="space-y-4 text-gray-600 dark:text-gray-300 mb-8 text-left">
                  {pendingMode === 'insane' ? (
                    <>
                      <p>{t('games.trivia.musicInsane1')}</p>
                      <p dangerouslySetInnerHTML={{ __html: t('games.trivia.musicInsane2') }} />
                      <p dangerouslySetInnerHTML={{ __html: t('games.trivia.musicInsane3') }} />
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center gap-3 border border-blue-200 dark:border-blue-800">
                        <FiHeadphones className="w-6 h-6 text-primary-blue animate-pulse" />
                        <p className="text-xs font-bold text-primary-blue">{t('games.trivia.headphonesRecommended')}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p>{t('games.trivia.musicChaos1')}</p>
                      <p>{t('games.trivia.musicChaos2')}</p>
                      <p dangerouslySetInnerHTML={{ __html: t('games.trivia.musicChaos3') }} />
                      <p>{t('games.trivia.musicChaos4')}</p>
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center gap-3 border border-blue-200 dark:border-blue-800">
                        <FiHeadphones className="w-6 h-6 text-primary-blue animate-pulse" />
                        <p className="text-xs font-bold text-primary-blue">{t('games.trivia.headphonesRecommended')}</p>
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={confirmStartGame}
                  className="w-full btn-modern bg-primary-blue text-white shadow-lg hover:bg-blue-600 py-3 rounded-xl font-bold text-lg"
                >
                  {t('games.trivia.go')}
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors text-center animate-fade-in relative">
        <button onClick={() => setCategory(null)} className="absolute top-8 left-8 text-gray-400 hover:text-gray-600 dark:hover:text-white transition">
          <FiArrowLeft size={24} />
        </button>

        <h3 className="text-2xl font-bold mb-8 neon-text-pink uppercase tracking-widest">
          {t('games.options.chooseMode')}
        </h3>

        <div className="flex flex-col md:flex-row gap-6 justify-center max-w-2xl mx-auto">
          <button
            onClick={() => startGame('timed')}
            className="flex-1 p-8 rounded-2xl border-2 border-primary-blue/30 hover:border-primary-blue bg-primary-blue/5 hover:bg-primary-blue/10 transition-all group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">⏱️</div>
            <h4 className="text-xl font-bold mb-2">{t('games.options.timedMode')}</h4>
            <p className="text-sm text-gray-500">{t('games.options.legendTimedBonus')}</p>
          </button>

          <button
            onClick={() => startGame('untimed')}
            className="flex-1 p-8 rounded-2xl border-2 border-primary-pink/30 hover:border-primary-pink bg-primary-pink/5 hover:bg-primary-pink/10 transition-all group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">♾️</div>
            <h4 className="text-xl font-bold mb-2">{t('games.options.untimedMode')}</h4>
            <p className="text-sm text-gray-500">{t('games.options.untimedDesc')}</p>
          </button>
        </div>

        {/* Rules Modal */}
        {showRules && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up border border-primary-blue/20">
              <h3 className="text-2xl font-bold text-primary-blue mb-4 text-center">
                🧠 {t('games.trivia.rulesTitle')}
              </h3>
              <div className="space-y-4 text-gray-600 dark:text-gray-300 mb-8 text-left">
                <p>{t('games.trivia.rule1')}</p>
                <p>{t('games.trivia.rule2')}</p>
                <p>{t('games.trivia.rule3')}</p>
                {pendingMode === 'timed' && (
                  <p className="text-sm font-bold text-primary-pink">⚠️ {t('games.trivia.timedWarning').replace('{time}', TIMER_PER_QUESTION.toString())}</p>
                )}
              </div>
              <button
                onClick={confirmStartGame}
                className="w-full btn-modern bg-primary-blue text-white shadow-lg hover:bg-blue-600 py-3 rounded-xl font-bold text-lg"
              >
                {t('games.puzzle.continue')}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isCountingDown) {
    const getStatusMessage = (value) => {
      switch (value) {
        case 3: return t('games.trivia.countdownReady');
        case 2: return t('games.trivia.countdownSet');
        case 1: return t('games.trivia.countdownSteady');
        case 0: return t('games.trivia.countdownGo');
        default: return '';
      }
    };

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
            <Leaderboard category={category === 'music' ? `${category}:${gameMode}` : category} currentPlayer={playerName} game="trivia" />
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
        </div>

        <div className="md:col-span-1">
          <Leaderboard category={category === 'music' ? `${category}:${gameMode}` : (category || undefined)} currentPlayer={playerName} game="trivia" />
        </div>
      </div>

      {/* PAUSE MENU OVERLAY */}
      <>
        {showPauseMenu && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in"
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-sm w-full p-8 border-4 border-black animate-fade-in-up"
            >
              <h3 className="text-3xl font-black text-center mb-8 uppercase italic tracking-tighter dark:text-white">{t('games.puzzle.pause')}</h3>
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => setShowPauseMenu(false)}
                  className="w-full py-4 bg-primary-blue text-white font-black uppercase tracking-widest rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_black] hover:translate-y-0.5 hover:shadow-none transition-all"
                >
                  {t('games.puzzle.continue')}
                </button>
                <button
                  onClick={() => setShowRestartConfirm(true)}
                  className="w-full py-4 bg-yellow-500 text-white font-black uppercase tracking-widest rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_black] hover:translate-y-0.5 hover:shadow-none transition-all"
                >
                  {t('games.puzzle.restart')}
                </button>
                <button
                  onClick={() => setShowExitConfirm(true)}
                  className="w-full py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_black] hover:translate-y-0.5 hover:shadow-none transition-all"
                >
                  {t('games.puzzle.exit')}
                </button>
              </div>
            </div>
          </div>
        )}

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
      </>
    </div>
  );
};

export default TriviaGame;