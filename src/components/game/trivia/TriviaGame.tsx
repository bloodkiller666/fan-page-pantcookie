'use client';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triviaQuestions } from '../../../utils/triviaQuestions';
import { useLanguage } from '../../../context/LanguageContext';
import PlayerInput from '../PlayerInput';
import Leaderboard from '../Leaderboard';
import { FiUsers, FiCpu, FiGlobe, FiArrowLeft } from 'react-icons/fi';
import { MdCatchingPokemon } from 'react-icons/md';
import { useGameSounds } from '../../../hooks/useGameSounds';
import { submitTriviaScore } from '../../../utils/localScoreService';

const TIMER_PER_QUESTION = 15;
const TOTAL_QUESTIONS = 20;

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
  const [category, setCategory] = useState(null); // null, 'music', 'pantcookie', 'shurahiwa'
  const [gameMode, setGameMode] = useState(null); // null, 'timed', 'untimed'
  const [started, setStarted] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
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

  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Memoize questions based on selected category
  const questions = useMemo(() => {
    if (!category || !triviaQuestions[category]) return [];
    return pickQuestions(triviaQuestions[category], TOTAL_QUESTIONS);
  }, [category]);

  const current = questions[index];

  // Handle music category audio fragment
  useEffect(() => {
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
  }, [index, started, gameOver, current]);

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

  useEffect(() => {
    if (!started || gameOver || answered || gameMode === 'untimed') return;
    setRemaining(TIMER_PER_QUESTION);
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
  }, [index, started, gameOver, answered, gameMode]);

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
    setRemaining(TIMER_PER_QUESTION);
    setIsCountingDown(false); // Ensure countdown is off
  }, []);

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
        setCountValue(3); // Start countdown from 3
    }
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
    if (answered) return;

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
    if (answered || selectedIndexes.length === 0) return;

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
    if (gameMode === 'timed') {
      if (isCorrect) {
        pts = getPointsByRemainingTime(remaining, true);
      } else if (isPartial) {
        pts = 1;
      } else {
        pts = -2;
      }
    } else {

      if (isCorrect) pts = 5;
      else if (isPartial) pts = 1;
      else pts = 0;
    }

    setScore(s => s + pts);
    setScoreChange(pts);
    setAnswered(true);

    if (!isCorrect) {
      playIncorrect();
      setFeedback({ type: 'incorrect', text: 'Incorrecto' });
      setShowCorrectAnswer(true);
    } else {
      playCorrect();
      setFeedback({ type: 'correct', text: gameMode === 'timed' && remaining > 10 ? 'Excelente' : 'Correcto' });
    }

    setTimeout(() => setFeedback(null), 1500);
  };

  const handleTimeout = () => {
    if (answered) return;
    setAnswered(true);
    setScoreChange(0);
    playIncorrect();
    setShowCorrectAnswer(true);
  };

  const nextQuestion = async () => {
    playSelect();
    if (index + 1 >= questions.length || index + 1 >= TOTAL_QUESTIONS) {
      setGameOver(true);
      playVictory();
      // Submit score
      await submitTriviaScore(playerName, score, category);
      return;
    }
    setIndex(i => i + 1);
    setAnswered(false);
    setSelectedAnswers([]);
    setShowCorrectAnswer(false);
    setScoreChange(null);
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
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">Preguntas sobre la comunidad</p>
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
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">Todo sobre tu VTuber favorita</p>
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
              <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Canciones</h4>
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">Adivina la canción o el artista</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (!started && !isCountingDown) {
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
            <p className="text-sm text-gray-500">Sin prisas, solo diversión</p>
          </button>
        </div>

        {/* Rules Modal */}
        {showRules && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up border border-primary-blue/20">
                    <h3 className="text-2xl font-bold text-primary-blue mb-4 text-center">
                        🧠 Reglas de Trivia
                    </h3>
                    <div className="space-y-4 text-gray-600 dark:text-gray-300 mb-8 text-left">
                        <p>1. Selecciona la respuesta correcta antes de que se acabe el tiempo (si eliges modo con tiempo).</p>
                        <p>2. Cada respuesta correcta suma puntos. ¡Las rachas dan bonificación!</p>
                        <p>3. Diviértete y demuestra cuánto sabes de la ShakeGang.</p>
                        {pendingMode === 'timed' && (
                             <p className="text-sm font-bold text-primary-pink">⚠️ Modo Con Tiempo: Tienes {TIMER_PER_QUESTION} segundos por pregunta.</p>
                        )}
                    </div>
                    <button
                        onClick={confirmStartGame}
                        className="w-full btn-modern bg-primary-blue text-white shadow-lg hover:bg-blue-600 py-3 rounded-xl font-bold text-lg"
                    >
                        Continuar
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
        case 3: return 'Prepárate';
        case 2: return 'Concentrate';
        case 1: return 'Listos';
        case 0: return 'A jugar';
        default: return '';
      }
    };

    return (
      <div className="flex flex-col items-center justify-center mt-25 md:mt-33 gap-10">
        <div className="relative h-40 md:h-56 flex items-center justify-center">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={countValue}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="flex items-center justify-center"
            >
              <span className={`font-black italic leading-none drop-shadow-sm transition-colors
                ${countValue === 0
                  ? 'text-[10rem] md:text-[14rem] text-primary-blue'
                  : 'text-[12rem] md:text-[16rem] text-[#1a1c2c] dark:text-white'
                }`}
              >
                {countValue === 0 ? 'GO!' : countValue}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mensaje dinámico inferior */}
        <motion.div
          key={`msg-${countValue}`}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <span className="text-sm md:text-base font-black uppercase tracking-[0.8em] text-primary-pink transition-all">
            {getStatusMessage(countValue)}
          </span>
        </motion.div>

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
                FIN DE JUEGO
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
            <Leaderboard category={category} currentPlayer={playerName} game="trivia" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto relative">
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ scale: 0, rotate: -5, y: 20 }}
            animate={{ scale: 1, rotate: 0, y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            /* Ajustes realizados:
               - Posición: 'top-[65%]' lo baja hacia la zona de las opciones.
               - Tamaño: 'text-2xl md:text-3xl' (antes era 6xl).
               - Padding: 'p-2 md:p-3' (antes era p-6).
               - Sombra: Reducida de 8px a 4px para que no se vea tan pesado.
            */
            className={`absolute top-[50%] left-1/3 -translate-x-1/2 -translate-y-1/2 z-[80] 
        text-2xl md:text-3xl font-black italic tracking-tighter border-4 border-black 
        p-4 md:p-2 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ring-4 ring-primary-pink/10 
        ${feedback.type === 'correct' ? 'text-primary-pink' : 'text-gray-500'}`}
          >
            {feedback.text}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors border border-gray-100 dark:border-gray-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-pink/5 rounded-full blur-3xl -z-0 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-blue/5 rounded-full blur-3xl -z-0 pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={resetToSelection}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-xs font-black uppercase tracking-widest transition-all border-2 border-black shadow-[2px_2px_0px_0px_black] active:translate-y-0.5 active:shadow-none"
                >
                  Regresar
                </button>

                <div className="flex items-center gap-4">
                  <div className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                    {category}
                  </div>
                  <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-bold">
                    {index + 1}/{TOTAL_QUESTIONS}
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

              {gameMode === 'timed' && (
                <div className="w-full bg-black border-4 border-black rounded-xl h-12 flex items-center shadow-[4px_4px_0px_0px_black] overflow-hidden mb-8 relative">
                  {/* Progress Bar */}
                  <motion.div
                    className={`h-full ${remaining < 5
                      ? 'bg-red-500 shadow-[inset_-10px_0_20px_rgba(0,0,0,0.2)]'
                      : 'bg-[#ff00ff] shadow-[inset_-10px_0_20px_rgba(0,0,0,0.2)]'
                      }`}
                    initial={{ width: "100%" }}
                    animate={{ width: `${(remaining / TIMER_PER_QUESTION) * 100}%` }}
                    transition={{ ease: "linear", duration: 1 }}
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
                  {selectedAnswers.length === 0 && gameMode === 'timed' ? '⏰ ¡Tiempo agotado!' : '❌ Incorrecto'}
                </p>
                <p className="text-sm opacity-90">
                  Respuesta correcta: <span className="font-bold">{correctAnswerIndexes.map(idx => current.options[idx]).join(', ')}</span>
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
                  {t('Enviar Respuesta')}
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
          <Leaderboard category={category} currentPlayer={playerName} game="trivia" />
        </div>
      </div>
    </div>
  );
};

export default TriviaGame;
