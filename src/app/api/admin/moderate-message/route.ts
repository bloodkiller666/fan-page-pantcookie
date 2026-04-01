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
          content: `Eres un moderador de mensajes para una comunidad de fans. 
          Analiza el contexto y sentimiento del mensaje. 
          Si el mensaje es positivo, neutro, de apoyo o gracioso (sin ser ofensivo), márcalo como "approved".
          Si el mensaje contiene insultos, odio, acoso, spam, contenido sexual explícito o es extremadamente negativo/tóxico, márcalo como "banned".
          
          Responde ÚNICAMENTE en formato JSON plano:
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
      response_format: { type: 'json_object' }
    });

    const moderationResult = JSON.parse(completion.choices[0].message.content || '{}');
    
    return NextResponse.json(moderationResult);

  } catch (error) {
    console.error('Moderation error:', error);
    return NextResponse.json({ 
      status: 'approved', 
      reason: 'Error en el servicio de moderación, se aprueba por defecto.' 
    }, { status: 200 });
  }
}

