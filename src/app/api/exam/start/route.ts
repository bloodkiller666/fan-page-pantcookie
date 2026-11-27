import { NextResponse } from 'next/server';
import { getIP, rateLimit } from '@/utils/rateLimit';
import { loadExam, shuffle, signTicket } from '@/server/exam/exam';

export const dynamic = 'force-dynamic';

/** Starts an attempt: returns the questions WITHOUT the answer key, in a fresh random order. */
export async function POST(req: Request) {
    if (!rateLimit(`exam-start:${getIP(req)}`, 30, 60_000).success) {
        return NextResponse.json({ error: 'too_many_requests' }, { status: 429 });
    }

    try {
        const exam = loadExam();
        const picked = shuffle(exam.questions).slice(0, exam.questionsPerRun ?? exam.questions.length);

        const questions = picked.map((q) => ({
            id: q.id,
            text: q.text,
            multiple: q.multiple,
            // Option order is shuffled per attempt; ids stay stable so grading does not depend on position
            options: shuffle(q.options).map((o) => ({ id: o.id, text: o.text })),
        }));

        const token = await signTicket({ order: questions.map((q) => q.id), startedAt: Date.now() });

        return NextResponse.json(
            { token, secondsPerQuestion: exam.secondsPerQuestion, questions },
            { headers: { 'Cache-Control': 'no-store' } }
        );
    } catch (error) {
        console.error('Exam start failed:', error);
        return NextResponse.json({ error: 'exam_unavailable' }, { status: 500 });
    }
}
