import { NextRequest, NextResponse } from 'next/server';
import { fetchMarketIndices, fetchQuote } from '@/lib/market-data';

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol');

  if (symbol) {
    const quote = await fetchQuote(symbol);
    if (!quote) return NextResponse.json({ error: 'Symbol not found' }, { status: 404 });
    return NextResponse.json({ quote });
  }

  // Return all market indices
  const indices = await fetchMarketIndices();
  return NextResponse.json({ indices });
}
