import { useState, useEffect } from 'react';
import { subscribeToLeaderboard, subscribeToTriviaLeaderboard } from '../../utils/localScoreService';
import { FiAward, FiClock, FiUser, FiZap } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';

interface Score {
    id: string;
    playerName: string;
    time?: number;
    score?: number;
}

interface LeaderboardProps {
    difficulty?: string;
    category?: string;
    currentPlayer: string;
    game?: string;
}

const Leaderboard = ({ difficulty, category, currentPlayer, game = 'puzzle' }: LeaderboardProps) => {
    const { t } = useLanguage();
    const [scores, setScores] = useState<Score[]>([]);
    const [loading, setLoading] = useState(true);

    const activeFilter = game === 'puzzle' ? difficulty : category;

    useEffect(() => {
        if (!activeFilter) return;
        setLoading(true);

        const subFn = game === 'puzzle' ? subscribeToLeaderboard : subscribeToTriviaLeaderboard;
        const unsubscribe = subFn(activeFilter, (newScores) => {
            setScores(newScores);
            setLoading(false);
        }, 10);

        return () => unsubscribe();
    }, [activeFilter, game]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getMedalColor = (index) => {
        if (index === 0) return 'text-yellow-500';
        if (index === 1) return 'text-gray-400';
        if (index === 2) return 'text-orange-600';
        return 'text-gray-300';
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sticky top-24 transition-colors duration-300">
            <div className="flex items-center gap-2 mb-6">
                <FiAward className="w-6 h-6 text-primary-pink" />
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{t('games.leaderboard.title')}</h3>
            </div>

            <div className="mb-4 text-center">
                <span className="inline-block bg-gradient-to-r from-primary-pink to-primary-blue text-white px-4 py-2 rounded-full text-sm font-semibold capitalize">
                    {game === 'puzzle'
                        ? t(`games.difficultyOptions.${difficulty}`)
                        : (category ? (category.charAt(0).toUpperCase() + category.slice(1)) : '')}
                </span>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary-pink mx-auto"></div>
                    <p className="text-gray-500 dark:text-gray-400 mt-4">{t('games.leaderboard.loading')}</p>
                </div>
            ) : scores.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">{t('games.leaderboard.noScores')}</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{t('games.leaderboard.beFirst')}</p>
                </div>
            ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                    {scores.map((score, index) => (
                        <div
                            key={score.id}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${score.playerName === currentPlayer
                                ? 'bg-gradient-to-r from-primary-pink/20 to-primary-blue/20 ring-2 ring-primary-pink dark:ring-primary-pink/50'
                                : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                                }`}
                        >
                            {/* Rank */}
                            <div className="flex-shrink-0 w-8 text-center">
                                {index < 3 ? (
                                    <FiAward className={`w-6 h-6 ${getMedalColor(index)}`} />
                                ) : (
                                    <span className="text-gray-500 dark:text-gray-400 font-semibold">{index + 1}</span>
                                )}
                            </div>

                            {/* Player Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <FiUser className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                    <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                                        {score.playerName}
                                    </p>
                                </div>
                            </div>

                            {/* Score/Time */}
                            <div className="flex items-center gap-1 text-primary-blue dark:text-blue-400 font-mono font-semibold">
                                {game === 'puzzle' ? (
                                    <>
                                        <FiClock className="w-4 h-4" />
                                        <span>{formatTime(score.time)}</span>
                                    </>
                                ) : (
                                    <>
                                        <FiZap className="w-4 h-4 text-yellow-500" />
                                        <span>{score.score} pts</span>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
