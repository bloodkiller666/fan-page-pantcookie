export interface ExamOption {
    id: string;
    text: string;
}

export interface ExamQuestion {
    id: string;
    text: string;
    multiple: boolean;
    options: ExamOption[];
}

export interface ExamStart {
    token: string;
    secondsPerQuestion: number;
    questions: ExamQuestion[];
}

export interface ExamResult {
    results: { id: string; correct: boolean; picked: string[] }[];
    correctCount: number;
    total: number;
    passed: boolean;
}

/** question id -> picked option ids */
export type ExamAnswers = Record<string, string[]>;
