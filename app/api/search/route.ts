import { NextRequest, NextResponse } from 'next/server';
import { searchSymbol } from '@/lib/market-data';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] });
  }
  try {
    const results = await searchSymbol(query);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 });
  }
}
