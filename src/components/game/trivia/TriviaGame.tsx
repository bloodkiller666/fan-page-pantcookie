'use client';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MdArrowBack, MdBolt, MdHeadphones, MdHeadset, MdHelp, MdLogout, MdMilitaryTech, MdPriorityHigh, MdPsychology, MdQuiz, MdRefresh, MdStar, MdStars, MdTimer } from 'react-icons/md';
import { triviaQuestions } from '../../../utils/triviaQuestions';
import { useLanguage } from '../../../context/LanguageContext';
import { useGameSounds } from '../../../hooks/useGameSounds';
import { submitGameScore, checkExistingScore } from '../../../utils/supabaseScoreService';
import Leaderboard from '../Leaderboard';
import ScoreOverwriteModal from '../ScoreOverwriteModal';
import RulesModal from '../RulesModal';
import PauseMenu from '../PauseMenu';
import ConfirmDialog from '../ConfirmDialog';
import QuestionStage from './QuestionStage';
import { CategoryPicker, ModePicker, Countdown } from './Pickers';
import { GameOverScreen, SessionStats, leaderboardKey } from './Results';
import type { Category, GameMode, TriviaQuestion } from './types';

export type { Category, GameMode, TriviaQuestion } from './types';

const TIMER_PER_QUESTION = 15;
const TOTAL_QUESTIONS = 20;
const INSANE_MODE_QUESTIONS = 20;
const INSANE_MODE_TIMER = 10;
const CHAOS_MODE_QUESTIONS = 100;
const CHAOS_MODE_TIMER = 2400;

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

const TriviaGame = ({ playerName }: { playerName: string }) => {
  const { t } = useLanguage();
  const router = useRouter();
  const { playSelect, playCorrect, playIncorrect, playVictory, playCountdown } = useGameSounds();
  const [category, setCategory] = useState<Category | null>(null);
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
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

  // Randomization session state
  const [gameSessionId, setGameSessionId] = useState<number>(0);

  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const questions = useMemo(() => {
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
  }, [category, gameMode, gameSessionId]);

  const current = questions[index];

  useEffect(() => {
    if (category === 'music' && (gameMode === 'insane' || gameMode === 'chaos')) {
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
        audio.currentTime = 15;

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

  useEffect(() => {
    if (answered && audioRef.current) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    }
  }, [answered]);

  useEffect(() => {
    if (showPauseMenu && audioRef.current) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    }
  }, [showPauseMenu]);

  const isMultipleAnswer = current && Array.isArray(current.correctIndexes);
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
      if (!hasPlayedAudio) return;
    } else {
      setRemaining(TIMER_PER_QUESTION);
    }

    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [index, started, gameOver, answered, gameMode, hasPlayedAudio, showPauseMenu]);

  const searchParams = useSearchParams();

  // Sync state with URL on mount and when URL changes
  useEffect(() => {
    if (!searchParams) return;
    const cat = searchParams.get('category');
    const mode = searchParams.get('mode');

    // Detect if we were playing and just hit back
    if (started && !gameOver && gameMode && !mode) {
      // Restore the URL to keep the game state and show pause menu
      router.forward();
      setShowPauseMenu(true);
      return;
    }

    if (cat) {
      setCategory(cat as Category);
    } else {
      setCategory(null);
      setGameMode(null);
      setStarted(false);
      setGameOver(false);
    }

    if (mode) {
      setGameMode(mode as GameMode);
      setPendingMode(mode as GameMode);
    } else {
      setGameMode(null);
      setStarted(false);
      setGameOver(false);
    }
  }, [searchParams, started, gameOver, gameMode, router]);

  const selectCategory = (cat: Category) => {
    playSelect();
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set('category', cat);
    router.push(`/games?${params.toString()}`, { scroll: false });
  };

  const realStartGame = useCallback(() => {
    setGameSessionId(Date.now());
    setStarted(true);
    setIndex(0);
    setScore(0);
    setAnswered(false);
    setSelectedAnswers([]);
    setChaosStats({ correct: 0, incorrect: 0 });
    setTimedStats({ correct: 0, incorrect: 0, streak: 0 });
    setMaxStreak(0);

    if (pendingMode === 'chaos') {
      setRemaining(CHAOS_MODE_TIMER);
    } else if (pendingMode === 'insane') {
      setRemaining(0);
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
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.set('mode', pendingMode);
      router.push(`/games?${params.toString()}`, { scroll: false });
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

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = 0.5;
    }

    const audio = audioRef.current;

    audio.src = current.audioUrl;

    audio.load();

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
      });
  };

  useEffect(() => {
    if (!isCountingDown) {
      setCountValue(3);
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

  useEffect(() => {
    if (!isCountingDown) return;
    playCountdown(countValue);
  }, [countValue, isCountingDown, playCountdown]);


  const handleOptionClick = (optIndex: number) => {
    if (answered && gameMode !== 'chaos') return;

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

    if (gameMode === 'insane') {
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

    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete('category');
    params.delete('mode');
    router.push(`/games?${params.toString()}`, { scroll: false });

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

  // ---------------------------------------------------------------------------
  // View
  // ---------------------------------------------------------------------------

  /** Run an action, asking first when it would throw away a game in progress. */
  const requestLeave = (action: () => void) => {
    if (started && !gameOver) {
      setPendingNavigationAction(() => action);
      setShowNavigationConfirm(true);
    } else {
      action();
    }
  };

  const totalForMode = gameMode === 'chaos' ? CHAOS_MODE_QUESTIONS : TOTAL_QUESTIONS;
  const timeTotal =
    gameMode === 'timed' ? TIMER_PER_QUESTION
      : gameMode === 'chaos' ? CHAOS_MODE_TIMER
        : gameMode === 'insane' && hasPlayedAudio && !answered ? INSANE_MODE_TIMER
          : 0;
  const isMusic = category === 'music';
  const categoryLabel = category === 'music' ? t('games.trivia.categoryMusicTitle') : category === 'shurahiwa' ? 'ShuraHiwa' : 'pantcake';

  const isMusicRapid = isMusic && (gameMode === 'insane' || gameMode === 'chaos');

  const rulesInstructions = isMusic
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
    ];

  let screen;
  if (!category) {
    screen = <CategoryPicker onSelect={selectCategory} />;
  } else if (!started && !isCountingDown) {
    screen = <ModePicker category={category} onStart={startGame} />;
  } else if (isCountingDown) {
    screen = <Countdown value={countValue} />;
  } else if (gameOver) {
    screen = (
      <GameOverScreen
        score={score}
        maxStreak={maxStreak}
        correct={timedStats.correct}
        incorrect={timedStats.incorrect}
        category={category}
        mode={gameMode}
        playerName={playerName}
        updateMessage={updateMessage}
        onPlayAgain={resetToSelection}
        onBack={resetToSelection}
      />
    );
  } else if (current && gameMode) {
    screen = (
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <QuestionStage
          mode={gameMode}
          category={category}
          question={current}
          index={index}
          total={totalForMode}
          score={score}
          scoreChange={scoreChange}
          onScoreChangeDone={() => setScoreChange(null)}
          remaining={remaining}
          timeTotal={timeTotal}
          answered={answered}
          selected={selectedAnswers}
          correctIndexes={correctAnswerIndexes}
          isMultiple={!!isMultipleAnswer}
          showCorrect={showCorrectAnswer}
          streak={timedStats.streak}
          chaos={chaosStats}
          audio={isMusic ? { isPlaying: isAudioPlaying, hasPlayed: hasPlayedAudio, onPlay: handleManualPlay } : undefined}
          onOption={handleOptionClick}
          onSubmit={() => submitAnswer()}
          onNext={nextQuestion}
          onPause={() => setShowPauseMenu(true)}
        />
        <aside className="flex flex-col gap-8 lg:sticky lg:top-24">
          <Leaderboard game="trivia" category={leaderboardKey(category, gameMode)} mode={gameMode} currentPlayer={playerName} className="w-full" />
          {!isMusicRapid || gameMode === 'insane' || gameMode === 'chaos' ? (
            <SessionStats correct={timedStats.correct} incorrect={timedStats.incorrect} streak={timedStats.streak} />
          ) : null}
        </aside>
      </div>
    );
  } else {
    screen = null;
  }

  return (
    <div className="w-full">
      {category && !isCountingDown && !gameOver && (
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => requestLeave(() => (started ? resetToSelection() : setCategory(null)))}
            className="btn btn--ghost !min-h-11 !px-4 !py-2 !text-sm"
          >
            <MdArrowBack className="text-xl" aria-hidden />
            {t('games.trivia.categories')}
          </button>
          <p className="tag tag--pink">{categoryLabel}</p>
        </div>
      )}

      {screen}

      {/* Answer stamp */}
      {feedback && (
        <div className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center" role="status">
          <div key={feedback.text} className="pop-in cart-shell">
            <div className={`cart ${feedback.type === 'correct' ? 'cart--cyan' : 'cart--pink'}`}>
              <div className="cart__face px-8 py-5">
                <span className="font-display text-4xl font-bold uppercase sm:text-6xl">{feedback.text}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <PauseMenu
        isOpen={showPauseMenu}
        onResume={() => setShowPauseMenu(false)}
        onRestart={() => setShowRestartConfirm(true)}
        onExit={() => setShowExitConfirm(true)}
      />

      <ConfirmDialog
        open={showRestartConfirm}
        title={t('games.puzzle.restartConfirm')}
        body={t('games.trivia.restartBody')}
        icon={<MdRefresh />}
        onYes={() => {
          setShowRestartConfirm(false);
          setShowPauseMenu(false);
          setIsCountingDown(true);
          setCountValue(3);
        }}
        onNo={() => setShowRestartConfirm(false)}
      />

      <ConfirmDialog
        open={showExitConfirm}
        title={t('games.puzzle.exitConfirm')}
        body={t('games.trivia.exitBody')}
        icon={<MdLogout />}
        onYes={() => {
          setShowExitConfirm(false);
          setShowPauseMenu(false);
          resetToSelection();
        }}
        onNo={() => setShowExitConfirm(false)}
      />

      <ConfirmDialog
        open={showNavigationConfirm}
        title={t('games.trivia.leaveTitle')}
        body={t('games.trivia.leaveBody')}
        icon={<MdHelp />}
        onYes={() => {
          setShowNavigationConfirm(false);
          pendingNavigationAction?.();
          setPendingNavigationAction(null);
        }}
        onNo={() => {
          setShowNavigationConfirm(false);
          setPendingNavigationAction(null);
        }}
      />

      <RulesModal
        isOpen={showRules}
        onContinue={confirmStartGame}
        title={isMusic ? t('games.trivia.musicRulesTitle') : t('games.trivia.rulesTitle')}
        icon={isMusic ? <MdHeadset /> : <MdPsychology />}
        instructions={rulesInstructions}
      />

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
};

export default TriviaGame;
