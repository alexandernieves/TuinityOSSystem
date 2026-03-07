import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { EVOLUTION_OS_SYSTEM_PROMPT, CHAT_CONFIG } from '@/lib/chat/constants';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: CHAT_CONFIG.model,
      messages: [
        { role: 'system', content: EVOLUTION_OS_SYSTEM_PROMPT },
        ...messages.map((msg: { role: string; content: string }) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      ],
      max_tokens: CHAT_CONFIG.maxTokens,
      temperature: CHAT_CONFIG.temperature,
    });

    const responseMessage = completion.choices[0]?.message?.content ||
      'Lo siento, no pude procesar tu mensaje. Por favor, intenta de nuevo.';

    return NextResponse.json({ message: responseMessage });
  } catch (error) {
    console.error('Chat API Error:', error);

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: 'Error al comunicarse con el servicio de IA' },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
