import { useState, useEffect } from 'react';
import { MdEmojiEvents } from 'react-icons/md';
import { getGameLeaderboard, GameType } from '../../utils/supabaseScoreService';
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
    mode?: string;
    className?: string;
}

const RANK_STYLE = ['bg-[var(--yellow)] text-[var(--ink)]', 'bg-[var(--cyan)] text-[var(--ink)]', 'bg-[var(--pink)] text-[var(--ink)]'];

const Leaderboard = ({ difficulty, category, currentPlayer, game = 'puzzle', className }: LeaderboardProps) => {
    const { t } = useLanguage();
    const [scores, setScores] = useState<Score[]>([]);
    const [loading, setLoading] = useState(true);

    const activeFilter = game === 'puzzle' || game === 'shura-run' ? difficulty : category;
    const gameType = (game === 'shura-run' ? 'shura_run' : game) as GameType;

    useEffect(() => {
        if (game === 'puzzle' && !activeFilter) return;
        if (game === 'trivia' && !activeFilter) return;

        const fetchScores = async () => {
            setLoading(true);
            try {
                const data = await getGameLeaderboard(gameType, activeFilter, 10);
                setScores(
                    data.map((s) => ({
                        id: s.id,
                        playerName: s.player_name,
                        time: s.game_type === 'puzzle' ? s.score : undefined,
                        score: s.game_type !== 'puzzle' ? s.score : undefined,
                    }))
                );
            } catch (error) {
                console.error('Failed to fetch leaderboard', error);
            } finally {
                setLoading(false);
            }
        };
        fetchScores();

        const interval = setInterval(fetchScores, 30000);
        return () => clearInterval(interval);
    }, [activeFilter, gameType, game]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <aside className={className || 'mt-6 h-fit w-full shrink-0 lg:sticky lg:top-24 lg:mt-0 lg:w-80'} aria-label={t('games.leaderboard.title')}>
            <div className="cart-shell">
                <div className="cart">
                    <div className="cart__face">
                        <div className="flex items-center justify-between gap-3 border-b-[3px] border-[var(--line)] bg-[var(--yellow)] px-4 py-3 text-[var(--ink)] [--line:var(--ink)]">
                            <h2 className="flex items-center gap-2 font-display text-xl font-bold uppercase leading-none">
                                <MdEmojiEvents className="text-2xl" aria-hidden />
                                {t('games.leaderboard.title')}
                            </h2>
                            <span className="tag !bg-[var(--ink)] !text-[var(--yellow)]">Global</span>
                        </div>

                        <div className="max-h-[calc(100vh-380px)] min-h-[300px] overflow-y-auto p-3">
                            {loading ? (
                                <ul className="space-y-2" aria-busy="true" aria-label={t('games.leaderboard.loading')}>
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <li key={i} className="h-11 animate-pulse border-[3px] border-[var(--line)] bg-[var(--surface-2)]" />
                                    ))}
                                </ul>
                            ) : scores.length > 0 ? (
                                <ol className="space-y-2">
                                    {scores.map((score, index) => {
                                        const isCurrent = score.playerName === currentPlayer;
                                        const rank = index + 1;
                                        return (
                                            <li
                                                key={score.id || index}
                                                className={`flex items-center gap-3 border-[3px] border-[var(--line)] p-2 ${
                                                    isCurrent ? 'bg-[var(--pink)] text-[var(--ink)] shadow-[3px_3px_0_var(--shadow)]' : 'bg-[var(--surface)]'
                                                }`}
                                            >
                                                <span className={`score flex h-8 w-8 shrink-0 items-center justify-center border-[3px] border-[var(--ink)] text-[0.6rem] ${RANK_STYLE[index] ?? 'bg-[var(--ink)] text-[#fde0f6]'}`}>
                                                    {rank}
                                                </span>
                                                <span className="min-w-0 flex-1 truncate font-display text-sm font-bold uppercase">{score.playerName}</span>
                                                <span className="score shrink-0 text-[0.6rem]">
                                                    {game === 'puzzle' ? formatTime(score.time || 0) : `${score.score} PTS`}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ol>
                            ) : (
                                <div className="py-10 text-center">
                                    <p className="font-display text-lg font-bold uppercase">{t('games.leaderboard.noScores')}</p>
                                    <p className="mt-1 text-sm text-[var(--muted)]">{t('games.leaderboard.beFirst')}</p>
                                </div>
                            )}
                        </div>
                        <div className="pins" aria-hidden />
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Leaderboard;
