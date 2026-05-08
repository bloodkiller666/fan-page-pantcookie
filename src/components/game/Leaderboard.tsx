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
    mode?: string;
    className?: string;
}

const Leaderboard = ({ difficulty, category, currentPlayer, game = 'puzzle', className }: LeaderboardProps) => {
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

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getMedalColor = (index: number) => {
        if (index === 0) return 'text-yellow-500';
        if (index === 1) return 'text-gray-400';
        if (index === 2) return 'text-orange-600';
        return 'text-gray-300';
    };

    return (
        <aside className={className || "w-full lg:w-80 shrink-0 animate-fade-in mt-6 lg:mt-0 lg:sticky lg:top-24 h-fit"}>
            <div className="bg-white dark:bg-zinc-900 border-[4px] border-black flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,0,127,0.3)] relative group/sidebar">

                <div className="p-3 border-b-[4px] border-black flex items-center justify-between bg-[#FF007F]/5">
                    <h2 className="font-black text-base flex items-center gap-2 italic uppercase tracking-tighter text-black dark:text-white">
                        <MdEmojiEvents className="text-[#FF007F] text-xl" />
                        {t('games.leaderboard.title')}
                    </h2>
                    <span className="text-[8px] bg-black text-white font-black px-1.5 py-0.5 uppercase italic border-2 border-black">
                        Global
                    </span>
                </div>

                <div className="overflow-y-auto p-2 space-y-2 custom-scrollbar bg-white dark:bg-zinc-900 min-h-[300px] max-h-[calc(100vh-350px)]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2">
                            <div className="w-8 h-8 border-[4px] border-black border-t-[#FF007F] animate-spin"></div>
                        </div>
                    ) : scores.length > 0 ? (
                        scores.map((score, index) => {
                            const isCurrent = score.playerName === currentPlayer;
                            const rank = index + 1;

                            return (
                                <div
                                    key={score.id || index}
                                    className={`flex items-center gap-2 p-2 border-[3px] transition-all
                                ${isCurrent
                                            ? 'bg-[#FF007F] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                                            : 'bg-white dark:bg-zinc-800 border-black hover:bg-zinc-50 dark:hover:bg-zinc-700'
                                        }
                            `}
                                >
                                    {/* Posición más compacta */}
                                    <div className={`flex items-center justify-center w-7 h-7 border-2 border-black font-black text-[10px] shrink-0 italic
                                ${rank === 1 ? 'bg-yellow-400' : rank === 2 ? 'bg-zinc-300' : rank === 3 ? 'bg-amber-600 text-white' : 'bg-black text-white'}
                            `}>
                                        {rank}
                                    </div>

                                    {/* Nombre con fuente compacta */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-[10px] font-black uppercase italic truncate tracking-tighter ${isCurrent ? 'text-white' : 'text-black dark:text-white'}`}>
                                            {score.playerName}
                                        </p>
                                    </div>

                                    {/* Puntos / Tiempo */}
                                     <div className="text-right">
                                         <p className={`text-[10px] font-black italic tracking-tighter ${isCurrent ? 'text-white' : 'text-black dark:text-white'}`}>
                                             {game === 'puzzle' ? formatTime(score.time || 0) : score.score}
                                             {game !== 'puzzle' && <span className="text-[8px] ml-1">PTS</span>}
                                         </p>
                                     </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-10 text-center">
                            <p className="text-[10px] font-black uppercase opacity-50">Sin registros aún</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 border-t-[4px] border-black">
                    <button className="w-full py-1.5 bg-white dark:bg-zinc-900 hover:bg-[#FF007F] hover:text-white border-[3px] border-black text-[9px] font-black uppercase italic tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1">
                        Ver Todo
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Leaderboard;