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
    let query = supabase
      .from('game_scores')
      .select('*')
      .eq('player_name', playerName)
      .eq('game_type', gameType);

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    } else {
      query = query.is('difficulty', null);
    }

    const { data: existingScores, error: fetchError } = await query;

    if (fetchError) throw fetchError;

    const existingScore = existingScores && existingScores.length > 0 ? existingScores[0] : null;

    let shouldUpdate = false;
    if (existingScore) {
      if (gameType === 'puzzle') {
        if (score < existingScore.score) shouldUpdate = true;
      } else {
        if (score > existingScore.score) shouldUpdate = true;
      }

      if (!shouldUpdate) {
        return { success: true, updated: false, ignored: true };
      }

      let deleteQuery = supabase
        .from('game_scores')
        .delete()
        .eq('player_name', playerName)
        .eq('game_type', gameType);

      if (difficulty) {
        deleteQuery = deleteQuery.eq('difficulty', difficulty);
      } else {
        deleteQuery = deleteQuery.is('difficulty', null);
      }

      const { error: deleteError } = await deleteQuery;

      if (deleteError) {
        console.error('Error deleting old scores:', deleteError);
        throw deleteError;
      }
    }

    const { data, error } = await supabase
      .from('game_scores')
      .insert([
        {
          player_name: playerName,
          game_type: gameType,
          score: score,
          difficulty: difficulty || null,
          metadata: metadata,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { success: true, updated: !!existingScore, data };
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

/**
 * Checks if a player already has a score for a specific game and difficulty.
 * @returns Object with existence status and existing score value
 */
export const checkExistingScore = async (
  gameType: GameType,
  playerName: string,
  difficulty?: string
) => {
  try {
    let query = supabase
      .from('game_scores')
      .select('score')
      .eq('player_name', playerName)
      .eq('game_type', gameType);

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    } else {
      query = query.is('difficulty', null);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (data && data.length > 0) {
      // Sort in memory to get the best one if multiple exist for some reason
      // For puzzle, lower is better. For others, higher is better.
      const scores = data.map(d => d.score);
      const bestScore = gameType === 'puzzle' ? Math.min(...scores) : Math.max(...scores);
      return { exists: true, score: bestScore };
    }

    return { exists: false, score: null };
  } catch (error) {
    console.error('Error checking existing score:', error);
    return { exists: false, score: null };
  }
};
