import { GoogleGenerativeAI } from '@google/generative-ai';
import { FullAnalysis, MarketQuote, TechnicalIndicators, NewsSentimentSummary, AssetType } from '@/types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';

let genAI: GoogleGenerativeAI | null = null;
function getGenAI() {
  if (!genAI && GEMINI_API_KEY) genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  return genAI;
}

// ── AI Full Analysis ──────────────────────────────────────────────────────────
export async function generateAIAnalysis(params: {
  symbol: string;
  name: string;
  assetType: AssetType;
  quote: MarketQuote;
  technicals?: TechnicalIndicators;
  newsSentiment: NewsSentimentSummary;
  fundamentals?: any;
  riskScore: number;
}): Promise<{
  verdict: string;
  verdictConfidence: number;
  summary: string;
  pros: string[];
  cons: string[];
  keyMetrics: { label: string; value: string; trend?: string }[];
}> {
  const ai = getGenAI();

  if (!ai) return generateFallbackAnalysis(params);

  const { symbol, name, assetType, quote, technicals, newsSentiment, fundamentals, riskScore } = params;

  const prompt = `
You are a world-class financial analyst. Analyze the following ${assetType} and provide a structured investment analysis.

## Asset: ${name} (${symbol})
- Current Price: ${quote.currency} ${quote.price.toFixed(2)}
- Change Today: ${quote.changePercent.toFixed(2)}%
- 52-Week High: ${quote.currency} ${quote.weekHigh52?.toFixed(2) ?? 'N/A'}
- 52-Week Low: ${quote.currency} ${quote.weekLow52?.toFixed(2) ?? 'N/A'}
- Volume: ${quote.volume?.toLocaleString() ?? 'N/A'}

## Technical Indicators:
- RSI: ${technicals?.rsi?.toFixed(1) ?? 'N/A'}
- Trend: ${technicals?.trend ?? 'N/A'}
- EMA20: ${technicals?.ema20?.toFixed(2) ?? 'N/A'}
- EMA50: ${technicals?.ema50?.toFixed(2) ?? 'N/A'}
- MACD: ${technicals?.macd?.value?.toFixed(2) ?? 'N/A'} (Signal: ${technicals?.macd?.signal?.toFixed(2) ?? 'N/A'})
- Support: ${technicals?.support?.toFixed(2) ?? 'N/A'}, Resistance: ${technicals?.resistance?.toFixed(2) ?? 'N/A'}

## Fundamentals:
- P/E Ratio: ${fundamentals?.pe?.toFixed(2) ?? 'N/A'}
- EPS: ${fundamentals?.eps?.toFixed(2) ?? 'N/A'}
- Beta: ${fundamentals?.beta?.toFixed(2) ?? 'N/A'}
- Revenue Growth: ${fundamentals?.revenueGrowth?.toFixed(1) ?? 'N/A'}%
- Profit Margin: ${fundamentals?.profitMargins?.toFixed(1) ?? 'N/A'}%
- Debt-to-Equity: ${fundamentals?.debtToEquity?.toFixed(2) ?? 'N/A'}
- Sector: ${fundamentals?.sector ?? 'N/A'}

## News Sentiment:
- Overall: ${newsSentiment.overall} (Score: ${newsSentiment.score.toFixed(2)})
- Positive Articles: ${newsSentiment.positiveCount}, Negative: ${newsSentiment.negativeCount}

## Risk Score: ${riskScore}/10

Provide a JSON response with this EXACT structure:
{
  "verdict": "STRONG BUY" | "BUY" | "HOLD" | "SELL" | "STRONG SELL" | "AVOID",
  "verdictConfidence": <number 50-95>,
  "summary": "<3-4 sentence comprehensive analysis>",
  "pros": ["<bullish reason 1>", "<bullish reason 2>", "<bullish reason 3>", "<bullish reason 4>", "<bullish reason 5>"],
  "cons": ["<bearish risk 1>", "<bearish risk 2>", "<bearish risk 3>", "<bearish risk 4>"],
  "keyMetrics": [
    {"label": "P/E Ratio", "value": "<value>", "trend": "up"|"down"|"neutral"},
    {"label": "Revenue Growth", "value": "<value>%", "trend": "up"|"down"|"neutral"},
    {"label": "Profit Margin", "value": "<value>%", "trend": "up"|"down"|"neutral"},
    {"label": "Beta (Volatility)", "value": "<value>", "trend": "neutral"},
    {"label": "RSI Signal", "value": "<RSI value> - <Overbought/Neutral/Oversold>", "trend": "up"|"down"|"neutral"},
    {"label": "52W Range Position", "value": "<percentage>% from low", "trend": "up"|"down"|"neutral"}
  ]
}

Return ONLY valid JSON, no markdown, no explanation.`;

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return generateFallbackAnalysis(params);
  }
}

// ── AI Chat ───────────────────────────────────────────────────────────────────
export async function chatWithAI(
  messages: { role: 'user' | 'model'; parts: { text: string }[] }[]
): Promise<string> {
  const ai = getGenAI();
  if (!ai) {
    return "I'm in demo mode (no Gemini API key). Please add your GEMINI_API_KEY to .env.local to enable full AI capabilities. For now, I can help you understand market concepts and navigate the platform!";
  }

  try {
    const model = ai.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: `You are StockAI Pro's intelligent financial assistant. You help users with:
- Stock analysis, IPO details, mutual funds, crypto, forex
- Risk assessment and portfolio advice
- Market news interpretation
- Investment strategies for Indian and global markets
- Technical and fundamental analysis explanations

Be concise, data-driven, and always mention risks. Format responses with markdown when helpful.
Current date: ${new Date().toLocaleDateString('en-IN')}.`,
    });

    const chat = model.startChat({ history: messages.slice(0, -1) });
    const lastMsg = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMsg.parts[0].text);
    return result.response.text();
  } catch (e: any) {
    return `Sorry, I encountered an error: ${e?.message ?? 'Unknown error'}. Please try again.`;
  }
}

// ── AI Auto-Suggest ───────────────────────────────────────────────────────────
export async function generateAutoSuggestions(stockData: {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  riskScore: number;
  trend: string;
  sentimentScore: number;
  pe?: number;
  revenueGrowth?: number;
}[]): Promise<{
  topPick: { symbol: string; reason: string; score: number };
  suggestions: {
    symbol: string;
    name: string;
    verdict: string;
    riskScore: number;
    profitPotential: string;
    shortReason: string;
    confidenceScore: number;
  }[];
  marketOutlook: string;
}> {
  const ai = getGenAI();
  if (!ai) return generateFallbackSuggestions(stockData);

  const prompt = `
You are a top quant analyst. Based on the following stocks data, identify the BEST investment opportunities with maximum profit potential and minimum risk.

Stocks data:
${JSON.stringify(stockData.slice(0, 15), null, 2)}

Scoring criteria:
- Low risk score (1-4 = best)
- Positive sentiment (> 0 = good)
- Bullish trend
- Reasonable P/E (10-30 for value, or high growth story)
- Positive revenue growth

Return ONLY this JSON (no markdown):
{
  "topPick": {
    "symbol": "<best symbol>",
    "reason": "<2 sentence why this is top pick>",
    "score": <composite score 1-100>
  },
  "suggestions": [
    {
      "symbol": "<symbol>",
      "name": "<name>",
      "verdict": "STRONG BUY" | "BUY" | "HOLD",
      "riskScore": <1-10>,
      "profitPotential": "<e.g. 15-25% upside>",
      "shortReason": "<one line reason>",
      "confidenceScore": <50-95>
    }
  ],
  "marketOutlook": "<2-3 sentence overall market analysis>"
}

Include top 5 suggestions sorted by risk-adjusted return. Return ONLY JSON.`;

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return generateFallbackSuggestions(stockData);
  }
}

// ── Fallback Analysis (no API key) ────────────────────────────────────────────
function generateFallbackAnalysis(params: any) {
  const { riskScore, technicals, newsSentiment } = params;
  const rsi = technicals?.rsi ?? 50;
  const trend = technicals?.trend ?? 'sideways';

  let verdict = 'HOLD';
  let confidence = 60;
  if (riskScore < 4 && trend === 'bullish' && newsSentiment.overall === 'positive') { verdict = 'BUY'; confidence = 72; }
  else if (riskScore < 3 && rsi < 40) { verdict = 'STRONG BUY'; confidence = 78; }
  else if (riskScore > 7 || (trend === 'bearish' && newsSentiment.overall === 'negative')) { verdict = 'SELL'; confidence = 65; }

  return {
    verdict,
    verdictConfidence: confidence,
    summary: `${params.name} (${params.symbol}) is showing a ${trend} trend with RSI at ${rsi.toFixed(0)}. The overall news sentiment is ${newsSentiment.overall}. Risk score is ${riskScore}/10 — ${riskScore < 4 ? 'relatively low risk' : riskScore < 7 ? 'moderate risk' : 'high risk'}. ${verdict === 'BUY' || verdict === 'STRONG BUY' ? 'Technical and fundamental indicators support a potential upside.' : 'Exercise caution before investing.'}`,
    pros: [
      `${trend === 'bullish' ? 'Bullish price trend above key moving averages' : 'Stock near key support levels'}`,
      `News sentiment is ${newsSentiment.overall} with ${newsSentiment.positiveCount} positive articles`,
      `RSI at ${rsi.toFixed(0)} — ${rsi < 30 ? 'oversold, potential reversal' : rsi > 70 ? 'strong momentum' : 'neutral zone'}`,
      `Market has shown ${params.quote?.changePercent > 0 ? 'positive' : 'mixed'} price action recently`,
      'Diversification opportunity in a balanced portfolio',
    ],
    cons: [
      `Risk score of ${riskScore}/10 requires careful position sizing`,
      `${newsSentiment.negativeCount} negative news articles in recent coverage`,
      'Market volatility could impact short-term performance',
      'Global macro headwinds could pose challenges',
    ],
    keyMetrics: [
      { label: 'RSI Signal', value: `${rsi.toFixed(0)} — ${rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral'}`, trend: rsi > 50 ? 'up' : 'down' },
      { label: 'Trend', value: trend.charAt(0).toUpperCase() + trend.slice(1), trend: trend === 'bullish' ? 'up' : trend === 'bearish' ? 'down' : 'neutral' },
      { label: 'Sentiment', value: newsSentiment.overall.charAt(0).toUpperCase() + newsSentiment.overall.slice(1), trend: newsSentiment.overall === 'positive' ? 'up' : 'down' },
      { label: 'Risk Level', value: `${riskScore}/10`, trend: riskScore < 5 ? 'up' : 'down' },
      { label: 'Support', value: `${params.quote?.currency} ${technicals?.support?.toFixed(2) ?? 'N/A'}`, trend: 'neutral' },
      { label: 'Resistance', value: `${params.quote?.currency} ${technicals?.resistance?.toFixed(2) ?? 'N/A'}`, trend: 'neutral' },
    ],
  };
}

function generateFallbackSuggestions(stockData: any[]) {
  const sorted = [...stockData]
    .filter(s => s.riskScore && s.trend)
    .sort((a, b) => {
      const scoreA = (10 - a.riskScore) * 0.5 + (a.sentimentScore + 1) * 2 + (a.trend === 'bullish' ? 3 : 0);
      const scoreB = (10 - b.riskScore) * 0.5 + (b.sentimentScore + 1) * 2 + (b.trend === 'bullish' ? 3 : 0);
      return scoreB - scoreA;
    });

  const top = sorted.slice(0, 5);
  return {
    topPick: {
      symbol: top[0]?.symbol ?? 'N/A',
      reason: `${top[0]?.name ?? 'This stock'} shows a strong combination of low risk (${top[0]?.riskScore?.toFixed(1) ?? 'N/A'}/10) and positive market momentum, making it the best risk-adjusted opportunity.`,
      score: 82,
    },
    suggestions: top.map((s, i) => ({
      symbol: s.symbol,
      name: s.name,
      verdict: i === 0 ? 'STRONG BUY' : s.riskScore < 5 ? 'BUY' : 'HOLD',
      riskScore: s.riskScore ?? 5,
      profitPotential: `${Math.round(10 + (10 - (s.riskScore ?? 5)) * 3)}–${Math.round(20 + (10 - (s.riskScore ?? 5)) * 4)}% upside`,
      shortReason: `${s.trend === 'bullish' ? 'Bullish trend' : 'Stable positioning'} with ${s.riskScore < 5 ? 'low' : 'moderate'} risk profile`,
      confidenceScore: Math.round(65 + (10 - (s.riskScore ?? 5)) * 2),
    })),
    marketOutlook: 'Markets are showing mixed signals with selective opportunities in quality stocks. Focus on companies with strong fundamentals, low debt, and positive earnings momentum for best risk-adjusted returns.',
  };
}
