import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getIP, rateLimit } from '@/utils/rateLimit';
import { loadExam, readTicket } from '@/server/exam/exam';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
    token: z.string().min(20).max(4000),
    // question id -> picked option ids
    answers: z.record(z.string().max(32), z.array(z.string().max(24)).max(4)),
});

/**
 * Grades an attempt. Stateless and anonymous: nothing is stored.
 * It answers right/wrong per question, never which option was the right one.
 */
export async function POST(req: Request) {
    if (!rateLimit(`exam-grade:${getIP(req)}`, 30, 60_000).success) {
        return NextResponse.json({ error: 'too_many_requests' }, { status: 429 });
    }

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

    try {
        const ticket = await readTicket(parsed.data.token);
        if (!ticket) return NextResponse.json({ error: 'invalid_token' }, { status: 400 });

        const exam = loadExam();

        // A real attempt cannot take much longer than its questions allow
        const maxMs = ticket.order.length * (exam.secondsPerQuestion + 4) * 1000 + 60_000;
        if (Date.now() - ticket.startedAt > maxMs) return NextResponse.json({ error: 'expired' }, { status: 400 });

        const byId = new Map(exam.questions.map((q) => [q.id, q]));
        const results = ticket.order.map((id) => {
            const q = byId.get(id);
            const valid = new Set(q?.options.map((o) => o.id) ?? []);
            const picked = (parsed.data.answers[id] ?? []).filter((optionId) => valid.has(optionId));
            const correctSet = new Set(q?.options.filter((o) => o.correct).map((o) => o.id) ?? []);
            const pickedSet = new Set(picked);
            const correct = !!q && pickedSet.size > 0 && pickedSet.size === correctSet.size && [...pickedSet].every((p) => correctSet.has(p));
            return { id, correct, picked: [...pickedSet] };
        });

        const correctCount = results.filter((r) => r.correct).length;
        const total = results.length;
        const passed = total > 0 && correctCount / total >= exam.passMinRatio;

        return NextResponse.json({ results, correctCount, total, passed }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        console.error('Exam grading failed:', error);
        return NextResponse.json({ error: 'exam_unavailable' }, { status: 500 });
    }
}
