import { NextRequest, NextResponse } from 'next/server';
import { fetchQuote, fetchHistorical, fetchFundamentals, fetchAlphaVantageFundamentals } from '@/lib/market-data';
import { fetchNewsAndSentiment } from '@/lib/news';
import { generateAIAnalysis } from '@/lib/gemini';
import { calculateTechnicals, calculateRiskScore, calcProfitPotential } from '@/lib/risk-calculator';
import { getRiskLabel } from '@/lib/formatters';
import { RiskLevel } from '@/types';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { symbol, assetType = 'stock' } = body;

    if (!symbol) return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });

    // Fetch all data in parallel — Yahoo Finance + Alpha Vantage
    const [quote, historicalData, fundamentals, avFundamentals] = await Promise.all([
      fetchQuote(symbol),
      fetchHistorical(symbol, '1y', '1d'),
      fetchFundamentals(symbol),
      fetchAlphaVantageFundamentals(symbol),
    ]);

    if (!quote) {
      return NextResponse.json({ error: `Could not fetch data for symbol: ${symbol}` }, { status: 404 });
    }

    // Merge fundamentals: Alpha Vantage takes priority for US stocks (richer data)
    const mergedFundamentals = {
      ...fundamentals,
      // Alpha Vantage overrides where available
      pe: avFundamentals?.pe ?? fundamentals?.pe ?? null,
      eps: avFundamentals?.eps ?? fundamentals?.eps ?? null,
      marketCap: avFundamentals?.marketCap ?? fundamentals?.marketCap ?? null,
      beta: avFundamentals?.beta ?? fundamentals?.beta ?? 1,
      dividendYield: avFundamentals?.dividendYield ?? fundamentals?.dividendYield ?? null,
      revenueGrowth: avFundamentals?.revenueGrowth ?? fundamentals?.revenueGrowth ?? null,
      profitMargins: avFundamentals?.profitMargins ?? fundamentals?.profitMargins ?? null,
      roe: avFundamentals?.roe ?? fundamentals?.roe ?? null,
      description: avFundamentals?.description || fundamentals?.description || '',
      sector: avFundamentals?.sector || fundamentals?.sector || '',
      industry: avFundamentals?.industry || fundamentals?.industry || '',
      weekHigh52: avFundamentals?.weekHigh52 ?? null,
      weekLow52: avFundamentals?.weekLow52 ?? null,
      analystTarget: avFundamentals?.analystTarget ?? null,
    };

    // Fetch news (after we have the name)
    const newsSentiment = await fetchNewsAndSentiment(symbol, quote.name);

    // Technical analysis
    const technicals = historicalData.length > 30 ? calculateTechnicals(historicalData) : undefined;

    // Risk score
    const riskScoreNum = calculateRiskScore(
      technicals ?? { rsi: 50, macd: { value: 0, signal: 0, histogram: 0 }, ema20: quote.price, ema50: quote.price, ema200: quote.price, sma20: quote.price, sma50: quote.price, bollingerBands: { upper: quote.price * 1.1, middle: quote.price, lower: quote.price * 0.9 }, support: quote.weekLow52 ?? quote.price * 0.9, resistance: quote.weekHigh52 ?? quote.price * 1.1, trend: 'sideways' },
      newsSentiment.score,
      mergedFundamentals?.beta ?? 1,
      mergedFundamentals?.pe ?? 20,
      mergedFundamentals?.debtToEquity ? mergedFundamentals.debtToEquity / 100 : 0.5
    );

    // AI analysis
    const aiResult = await generateAIAnalysis({
      symbol,
      name: quote.name,
      assetType,
      quote,
      technicals,
      newsSentiment,
      fundamentals: mergedFundamentals,
      riskScore: riskScoreNum,
    });

    // Price targets
    const priceTargets = technicals
      ? calcProfitPotential(quote.price, technicals, mergedFundamentals?.beta ?? 1)
      : [];

    // Risk level mapping
    function getRiskLevel(score: number): RiskLevel {
      if (score <= 2) return 'very-low';
      if (score <= 4) return 'low';
      if (score <= 6) return 'medium';
      if (score <= 8) return 'high';
      return 'very-high';
    }

    const analysis = {
      symbol,
      name: quote.name,
      assetType,
      quote: {
        ...quote,
        marketCap: mergedFundamentals?.marketCap ?? undefined,
        pe: mergedFundamentals?.pe ?? undefined,
        eps: mergedFundamentals?.eps ?? undefined,
        beta: mergedFundamentals?.beta ?? undefined,
        dividendYield: mergedFundamentals?.dividendYield ?? undefined,
        sector: mergedFundamentals?.sector ?? undefined,
        industry: mergedFundamentals?.industry ?? undefined,
        description: mergedFundamentals?.description ?? undefined,
        analystTarget: (mergedFundamentals as any)?.analystTarget ?? undefined,
      },
      verdict: aiResult.verdict,
      verdictConfidence: aiResult.verdictConfidence,
      summary: aiResult.summary,
      riskScore: {
        overall: riskScoreNum,
        level: getRiskLevel(riskScoreNum),
        volatilityScore: fundamentals?.beta ?? 1,
        sentimentScore: newsSentiment.score,
        technicalScore: technicals?.rsi ?? 50,
        fundamentalScore: fundamentals?.pe ?? 20,
        breakdown: getRiskLabel(riskScoreNum),
      },
      priceTargets,
      technicals,
      news: newsSentiment,
      prosCons: { pros: aiResult.pros, cons: aiResult.cons },
      historicalData: historicalData.slice(-90), // last 90 days for chart
      keyMetrics: aiResult.keyMetrics,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({ analysis });
  } catch (e: any) {
    console.error('[analyze] error:', e);
    return NextResponse.json({ error: e?.message ?? 'Analysis failed' }, { status: 500 });
  }
}
