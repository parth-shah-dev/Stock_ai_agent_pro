import { NextRequest, NextResponse } from 'next/server';
import { fetchNewsAndSentiment } from '@/lib/news';

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol') ?? '';
  const name = req.nextUrl.searchParams.get('name') ?? symbol;

  if (!symbol) return NextResponse.json({ error: 'Symbol required' }, { status: 400 });

  const newsSentiment = await fetchNewsAndSentiment(symbol, name);
  return NextResponse.json({ newsSentiment });
}
