import { NextRequest, NextResponse } from 'next/server';
import { chatWithAI } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 });
    }
    const reply = await chatWithAI(messages);
    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Chat failed' }, { status: 500 });
  }
}
