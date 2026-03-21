import { useState, useEffect } from 'react';
import { getGameLeaderboard, GameType } from '../../utils/supabaseScoreService';
import { FiAward, FiClock, FiUser, FiZap } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import { MdEmojiEvents, MdHistory, MdTrendingUp } from 'react-icons/md';

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

    const activeFilter = (game === 'puzzle' || game === 'shura-run') ? difficulty : category;
    const gameType = (game === 'shura-run' ? 'shura_run' : game) as GameType;

    useEffect(() => {
        if (game === 'puzzle' && !activeFilter) return;
        if (game === 'trivia' && !activeFilter) return;

        const fetchScores = async () => {
            setLoading(true);
            try {
                const data = await getGameLeaderboard(gameType, activeFilter, 10);
                const mappedScores: Score[] = data.map(s => ({
                    id: s.id,
                    playerName: s.player_name,
                    time: s.game_type === 'puzzle' ? s.score : undefined,
                    score: s.game_type !== 'puzzle' ? s.score : undefined
                }));
                setScores(mappedScores);
            } catch (error) {
                console.error("Failed to fetch leaderboard", error);
            } finally {
                setLoading(false);
            }
        };
        fetchScores();

        const interval = setInterval(fetchScores, 30000);
        return () => clearInterval(interval);
    }, [activeFilter, gameType]);

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
        <aside className="w-full lg:w-80 shrink-0 h-full animate-fade-in">
            <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] h-full flex flex-col overflow-hidden border border-primary/20 shadow-2xl dark:shadow-none relative group/sidebar">
                <div className="p-6 border-b border-primary/20 flex items-center justify-between bg-primary/5">
                    <h2 className="font-black text-xl flex items-center gap-3 italic tracking-tighter text-slate-900 dark:text-slate-100">
                        <MdEmojiEvents className="text-primary text-2xl drop-shadow-[0_0_8px_rgba(13,185,242,0.4)]" />
                        {t('Ranking') || 'Ranking'}
                    </h2>
                    <span className="text-[10px] bg-primary/20 text-primary font-black px-2.5 py-1 rounded-full tracking-[0.2em] uppercase border border-primary/30">
                        Global
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] animate-pulse">Sincronizando...</p>
                        </div>
                    ) : scores.length > 0 ? (
                        scores.map((score, index) => {
                            const isCurrent = score.playerName === currentPlayer;
                            const rank = index + 1;
                            
                            return (
                                <div
                                    key={score.id || index}
                                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 border group/item
                                        ${isCurrent 
                                            ? 'bg-primary/20 border-primary/50 shadow-[0_0_20px_rgba(13,185,242,0.15)] translate-x-1' 
                                            : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-primary/30 hover:bg-primary/5 hover:translate-x-1 shadow-sm dark:shadow-none'
                                        }
                                    `}
                                >
                                    <div className={`flex items-center justify-center w-9 h-9 rounded-xl font-black text-xs shrink-0 shadow-lg transform group-hover/item:scale-110 transition-transform
                                        ${rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white dark:text-background-dark shadow-yellow-500/20' : 
                                          rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white dark:text-background-dark shadow-slate-400/20' :
                                          rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-amber-700/20' :
                                          'bg-slate-200 dark:bg-background-dark/50 text-slate-500 border border-slate-300 dark:border-primary/20'}
                                    `}>
                                        {rank}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className={`text-sm font-black truncate tracking-tight transition-colors
                                                ${isCurrent ? 'text-primary' : 'text-slate-800 dark:text-slate-200 group-hover/item:text-primary'}
                                            `}>
                                                {score.playerName}
                                            </p>
                                            {isCurrent && (
                                                <div className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(13,185,242,1)]"></div>
                                            )}
                                        </div>
                                        <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest mt-0.5 opacity-70 group-hover/item:opacity-100 transition-opacity">
                                            {game === 'puzzle' ? (difficulty === 'hard' ? 'DIFICIL' : difficulty === 'medium' ? 'MEDIO' : 'FÁCIL') : 'GLOBAL'}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className={`text-sm font-black italic tracking-tighter
                                            ${isCurrent || rank === 1 ? 'text-primary drop-shadow-[0_0_8px_rgba(13,185,242,0.3)]' : 'text-slate-900 dark:text-slate-300 group-hover/item:text-primary'}
                                        `}>
                                            {game === 'puzzle' 
                                                ? formatTime(score.time)
                                                : `${score.score} pts`}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                            <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 border border-white/5">
                                <MdHistory className="text-4xl text-slate-600" />
                            </div>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
                                <span>{t('noScores') || 'Sin registros aún'}</span>
                            </p>
                            <p className="text-[9px] text-slate-600 mt-2 font-bold uppercase tracking-widest">¡Sé el primero en el ranking!</p>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-primary/5 border-t border-primary/10">
                    <button className="w-full py-3 bg-white/5 dark:bg-slate-800/20 hover:bg-primary/10 border border-primary/20 rounded-xl text-[10px] font-black text-primary uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group-hover/sidebar:gap-3 group/btn shadow-sm dark:shadow-none">
                        <span>{t('common.viewFullRanking') || 'Ver Ranking Completo'}</span>
                        <MdTrendingUp className="text-sm group-hover/btn:translate-x-1 transition-transform normal-case" />
                    </button>
                </div>

                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
            </div>
        </aside>
    );
};

export default Leaderboard;