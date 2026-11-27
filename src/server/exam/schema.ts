import { z } from 'zod';

const optionSchema = z.object({
    id: z.string().min(1).max(24),
    text: z.string().min(1).max(140),
    correct: z.boolean(),
});

const questionSchema = z
    .object({
        id: z.string().min(1).max(32),
        text: z.string().min(1).max(280),
        /** true: several options can be correct and the player marks them all. */
        multiple: z.boolean().default(false),
        /** 1 to 4 alternatives. */
        options: z.array(optionSchema).min(1).max(4),
    })
    .superRefine((q, ctx) => {
        const correct = q.options.filter((o) => o.correct).length;
        if (correct < 1) ctx.addIssue({ code: 'custom', message: `"${q.id}" needs at least one correct option` });
        if (!q.multiple && correct !== 1) ctx.addIssue({ code: 'custom', message: `"${q.id}" is single-answer: exactly one option must be correct` });
        if (new Set(q.options.map((o) => o.id)).size !== q.options.length) ctx.addIssue({ code: 'custom', message: `"${q.id}" has repeated option ids` });
    });

export const examSchema = z
    .object({
        secondsPerQuestion: z.number().int().min(5).max(60).default(15),
        /** Share of correct answers needed to pass. 0.5 means: pass unless there are MORE wrong than right. */
        passMinRatio: z.number().min(0).max(1).default(0.5),
        /** Ask only this many (random) questions per attempt. Omit to ask all of them. */
        questionsPerRun: z.number().int().min(1).optional(),
        questions: z.array(questionSchema).min(1),
    })
    .superRefine((exam, ctx) => {
        if (new Set(exam.questions.map((q) => q.id)).size !== exam.questions.length) ctx.addIssue({ code: 'custom', message: 'Repeated question ids' });
    });

export type Exam = z.infer<typeof examSchema>;
export type ExamQuestion = Exam['questions'][number];
