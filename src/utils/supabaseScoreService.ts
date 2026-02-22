import { supabase } from './supabaseClient';

export type GameType = 'puzzle' | 'trivia' | 'shura_run';

export interface ScoreEntry {
  id: string;
  created_at: string;
  player_name: string;
  game_type: GameType;
  score: number;
  difficulty?: string;
  metadata?: any;
}

/**
 * Submits a score to Supabase.
 * @param gameType The type of game ('puzzle', 'trivia', 'shura_run')
 * @param playerName The player's name
 * @param score The score (time in seconds for puzzle, points for others)
 * @param difficulty Optional difficulty level or category
 * @param metadata Optional extra data (e.g. formatted time)
 */
export const submitGameScore = async (
  gameType: GameType,
  playerName: string,
  score: number,
  difficulty?: string,
  metadata?: any
) => {
  try {
    const { data, error } = await supabase
      .from('game_scores')
      .insert([
        {
          player_name: playerName,
          game_type: gameType,
          score: score,
          difficulty: difficulty,
          metadata: metadata,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error submitting score to Supabase:', error);
    return { success: false, error };
  }
};

/**
 * Retrieves the leaderboard for a specific game.
 * @param gameType The type of game
 * @param difficulty Optional difficulty filter
 * @param limit Number of entries to return (default 10)
 */
export const getGameLeaderboard = async (
  gameType: GameType,
  difficulty?: string,
  limit: number = 10
) => {
  try {
    let query = supabase
      .from('game_scores')
      .select('*')
      .eq('game_type', gameType);

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    // Sort order depends on game type
    // Puzzle: Lower time is better (ascending)
    // Others: Higher score is better (descending)
    if (gameType === 'puzzle') {
      query = query.order('score', { ascending: true });
    } else {
      query = query.order('score', { ascending: false });
    }

    const { data, error } = await query.limit(limit);

    if (error) throw error;
    return data as ScoreEntry[];
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
};
