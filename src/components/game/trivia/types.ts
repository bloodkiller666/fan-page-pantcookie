export type GameMode = 'timed' | 'untimed' | 'insane' | 'chaos';
export type Category = 'music' | 'pantcake' | 'shurahiwa' | string;

export interface TriviaQuestion {
    question: string;
    options: string[];
    correctIndex?: number;
    correctIndexes?: number[];
    image?: string;
    hint?: string;
    audioUrl?: string;
}
