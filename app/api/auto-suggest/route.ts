import { NextRequest, NextResponse } from 'next/server';
import { fetchQuote, fetchHistorical, fetchFundamentals, TOP_WATCHLIST_SYMBOLS } from '@/lib/market-data';
import { fetchNewsAndSentiment } from '@/lib/news';
import { calculateTechnicals, calculateRiskScore } from '@/lib/risk-calculator';
import { generateAutoSuggestions } from '@/lib/gemini';

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    // Fetch data for top symbols in parallel (batches to avoid rate limits)
    const symbols = TOP_WATCHLIST_SYMBOLS.slice(0, 12);

    const stockDataPromises = symbols.map(async (symbol) => {
      try {
        const [quote, historical, fundamentals] = await Promise.all([
          fetchQuote(symbol),
          fetchHistorical(symbol, '3mo', '1d'),
          fetchFundamentals(symbol),
        ]);

        if (!quote) return null;

        const technicals = historical.length > 30 ? calculateTechnicals(historical) : undefined;
        const newsSentiment = await fetchNewsAndSentiment(symbol, quote.name);

        const riskScore = calculateRiskScore(
          technicals ?? { rsi: 50, macd: { value: 0, signal: 0, histogram: 0 }, ema20: quote.price, ema50: quote.price, ema200: quote.price, sma20: quote.price, sma50: quote.price, bollingerBands: { upper: quote.price * 1.1, middle: quote.price, lower: quote.price * 0.9 }, support: quote.weekLow52 ?? quote.price * 0.9, resistance: quote.weekHigh52 ?? quote.price * 1.1, trend: 'sideways' },
          newsSentiment.score,
          fundamentals?.beta ?? 1,
          fundamentals?.pe ?? 20,
          0.5
        );

        return {
          symbol,
          name: quote.name,
          price: quote.price,
          changePercent: quote.changePercent,
          riskScore,
          trend: technicals?.trend ?? 'sideways',
          sentimentScore: newsSentiment.score,
          pe: fundamentals?.pe ?? undefined,
          revenueGrowth: fundamentals?.revenueGrowth ?? undefined,
          currency: quote.currency,
          exchange: quote.exchange,
        };
      } catch {
        return null;
      }
    });

    const results = (await Promise.all(stockDataPromises)).filter(Boolean) as any[];

    // Generate AI suggestions
    const suggestions = await generateAutoSuggestions(results);

    return NextResponse.json({ suggestions, stockData: results });
  } catch (e: any) {
    console.error('[auto-suggest] error:', e);
    return NextResponse.json({ error: e?.message ?? 'Auto-suggest failed' }, { status: 500 });
  }
}
