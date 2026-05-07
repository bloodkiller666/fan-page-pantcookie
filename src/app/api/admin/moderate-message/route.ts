import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { z } from 'zod';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const ModerationSchema = z.object({
  text: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  // 1. Basic Auth Shield
  const authHeader = req.headers.get('Authorization');
  const adminApiKey = process.env.ADMIN_API_KEY || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

  if (!authHeader || authHeader !== `Bearer ${adminApiKey}`) {
    return NextResponse.json({ error: 'Unauthorized - Shield Active' }, { status: 401 });
  }

  try {
    const body = await req.json();

    // 2. Input Validation Shield (Zod)
    const result = ModerationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({
        error: 'Invalid input',
        details: result.error.format()
      }, { status: 400 });
    }

    const { text } = result.data;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Eres un moderador estricto de mensajes para una comunidad de fans de pantcake (streamer).
          Tu función es proteger la comunidad de mensajes dañinos o que no aporten valor positivo.

          Debes marcar un mensaje como "banned" si cumple CUALQUIERA de estas condiciones:
          - Insultos, burlas o lenguaje despectivo hacia personas o la comunidad.
          - Críticas destructivas o comentarios que dañen el ánimo de la comunidad (ej: "esta página es una basura", "deben tirarla", "no sirve para nada").
          - Acoso, amenazas o contenido violento.
          - Spam, publicidad no solicitada o contenido sin sentido repetitivo.
          - Contenido sexual explícito.
          - Mensajes que desalienten la participación o el uso de la plataforma.
          - Negativismo extremo, trolling o comentarios desmoralizantes.

          Debes marcar un mensaje como "approved" SOLO si:
          - Es positivo, de apoyo, entusiasta o motivador hacia la comunidad.
          - Es neutro e informativo sin implicaciones negativas.
          - Es gracioso o bromista sin ofender a nadie.
          - Es una sugerencia constructiva y respetuosa.

          En caso de DUDA, siempre marca como "banned" por seguridad.

          Responde ÚNICAMENTE en formato JSON plano, sin texto extra:
          {
            "status": "approved" | "banned",
            "reason": "Breve explicación en español del porqué"
          }`
        },
        {
          role: 'user',
          content: text
        }
      ],
      model: 'llama-3.1-8b-instant',
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const rawContent = completion.choices[0].message.content || '{}';
    const moderationResult = JSON.parse(rawContent);

    // Validate that the response has the expected shape
    if (!moderationResult.status || !['approved', 'banned'].includes(moderationResult.status)) {
      console.warn('Unexpected moderation response shape:', moderationResult);
      return NextResponse.json({
        status: 'banned',
        reason: 'Respuesta inesperada del moderador, se requiere revisión manual.'
      });
    }

    return NextResponse.json(moderationResult);

  } catch (error) {
    // SAFETY-FIRST: On any error, default to BANNED, not approved.
    // This prevents content from slipping through during outages.
    console.error('Moderation error:', error);
    return NextResponse.json({
      status: 'banned',
      reason: 'Error en el servicio de moderación. Mensaje enviado a revisión manual por seguridad.'
    }, { status: 200 });
  }
}
