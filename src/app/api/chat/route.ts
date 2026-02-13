import { Groq } from 'groq-sdk';
import { NextResponse } from 'next/server';
import { getBotResponse } from '@/utils/botLogic';

import knowledge from '@/data/botKnowledge.json';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || "",
});

const IDENTITY_PROMPT = `
Eres Pantcookie Bot 🤖🍪. ${knowledge.bot.role}
Tono: ${knowledge.bot.tone}
Protocolos:
${knowledge.bot.protocols.join('\n- ')}
`;

const CONTEXT_PROMPT = `
[SHURA]
${JSON.stringify(knowledge.shura)}

[PANTCOOKIES (n=nombre, i=info)]
${JSON.stringify(knowledge.pantcookies)}

[GLOSARIO]
${JSON.stringify(knowledge.glossary)}

[INFO]
${JSON.stringify(knowledge.links)}

[CONVERSACION]
${JSON.stringify(knowledge.conversation)}
`;

const SYSTEM_PROMPT = `${IDENTITY_PROMPT}\n\nDATA:\n${CONTEXT_PROMPT}`;

export async function POST(req: Request) {
    const body = await req.json().catch(() => ({ message: '' }));
    const { message } = body as { message: string };

    if (!message) {
        return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
        const fallback = getBotResponse(message);
        return NextResponse.json({ response: fallback });
    }

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: message }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 500,
        });

        const response = chatCompletion.choices[0]?.message?.content || '¡Oye, mis circuitos se cruzaron! ¿Puedes repetir eso? 🍪';
        return NextResponse.json({ response });
    } catch (error) {
        console.error('Groq API Error:', error);
        const fallback = getBotResponse(message);
        return NextResponse.json({ response: fallback });
    }
}
