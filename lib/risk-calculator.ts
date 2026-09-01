import { OHLCVData, TechnicalIndicators } from '@/types';

// ── Simple RSI Calculation ────────────────────────────────────────────────────
function calcRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// ── EMA Calculation ───────────────────────────────────────────────────────────
function calcEMA(closes: number[], period: number): number {
  if (closes.length < period) return closes[closes.length - 1] ?? 0;
  const k = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
  }
  return ema;
}

// ── SMA Calculation ───────────────────────────────────────────────────────────
function calcSMA(closes: number[], period: number): number {
  const slice = closes.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

// ── Bollinger Bands ───────────────────────────────────────────────────────────
function calcBollingerBands(closes: number[], period = 20, stdDev = 2) {
  const sma = calcSMA(closes, period);
  const slice = closes.slice(-period);
  const variance = slice.reduce((acc, val) => acc + Math.pow(val - sma, 2), 0) / period;
  const sd = Math.sqrt(variance);
  return { upper: sma + stdDev * sd, middle: sma, lower: sma - stdDev * sd };
}

// ── MACD Calculation ──────────────────────────────────────────────────────────
function calcMACD(closes: number[]) {
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const macdLine = ema12 - ema26;
  // Simplified signal (9-period EMA of MACD)
  const signal = macdLine * 0.9; // simplified
  return { value: macdLine, signal, histogram: macdLine - signal };
}

// ── Support / Resistance ──────────────────────────────────────────────────────
function calcSupportResistance(data: OHLCVData[]) {
  const lows = data.slice(-20).map(d => d.low);
  const highs = data.slice(-20).map(d => d.high);
  const support = Math.min(...lows);
  const resistance = Math.max(...highs);
  return { support, resistance };
}

// ── Main Technical Analysis ───────────────────────────────────────────────────
export function calculateTechnicals(data: OHLCVData[]): TechnicalIndicators {
  const closes = data.map(d => d.close);
  const rsi = calcRSI(closes);
  const ema20 = calcEMA(closes, 20);
  const ema50 = calcEMA(closes, 50);
  const ema200 = calcEMA(closes, 200);
  const sma20 = calcSMA(closes, 20);
  const sma50 = calcSMA(closes, 50);
  const macd = calcMACD(closes);
  const bollingerBands = calcBollingerBands(closes);
  const { support, resistance } = calcSupportResistance(data);

  const lastClose = closes[closes.length - 1];
  let trend: 'bullish' | 'bearish' | 'sideways' = 'sideways';
  if (lastClose > ema50 && ema50 > ema200) trend = 'bullish';
  else if (lastClose < ema50 && ema50 < ema200) trend = 'bearish';

  return { rsi, macd, ema20, ema50, ema200, sma20, sma50, bollingerBands, support, resistance, trend };
}

// ── Risk Score Engine ─────────────────────────────────────────────────────────
export function calculateRiskScore(
  technicals: TechnicalIndicators,
  sentimentScore: number,
  beta: number = 1,
  peRatio: number = 20,
  debtRatio: number = 0.5
): number {
  // Volatility risk (beta-based) → 30%
  const volScore = Math.min(10, beta * 3);

  // News sentiment → 20% (higher negative sentiment = higher risk)
  const sentRisk = ((1 - sentimentScore) / 2) * 10;

  // Technical risk → 25%
  let techRisk = 5;
  if (technicals.rsi > 70) techRisk += 2; // overbought
  if (technicals.rsi < 30) techRisk -= 2; // oversold (lower risk for reversal)
  if (technicals.trend === 'bearish') techRisk += 2;
  if (technicals.trend === 'bullish') techRisk -= 1;
  techRisk = Math.max(0, Math.min(10, techRisk));

  // Fundamental risk → 25%
  let fundRisk = 3;
  if (peRatio > 50) fundRisk += 3;
  else if (peRatio < 0) fundRisk += 4;
  if (debtRatio > 1) fundRisk += 2;
  fundRisk = Math.max(0, Math.min(10, fundRisk));

  const overall = volScore * 0.3 + sentRisk * 0.2 + techRisk * 0.25 + fundRisk * 0.25;
  return Math.max(1, Math.min(10, Math.round(overall * 10) / 10));
}

// ── Profit Potential ──────────────────────────────────────────────────────────
export function calcProfitPotential(
  currentPrice: number,
  technicals: TechnicalIndicators,
  beta: number = 1
) {
  const { support, resistance, ema50, ema200 } = technicals;
  const upside = ((resistance - currentPrice) / currentPrice) * 100;
  const downside = ((currentPrice - support) / currentPrice) * 100;

  const targets = [
    {
      timeframe: '1 month' as const,
      baseTarget: currentPrice * (1 + (upside / 100) * 0.2),
      bullTarget: currentPrice * (1 + (upside / 100) * 0.4),
      bearTarget: currentPrice * (1 - (downside / 100) * 0.3),
      upside: upside * 0.2,
      downside: downside * 0.3,
    },
    {
      timeframe: '3 months' as const,
      baseTarget: currentPrice * (1 + (upside / 100) * 0.5),
      bullTarget: currentPrice * (1 + (upside / 100) * 0.8),
      bearTarget: currentPrice * (1 - (downside / 100) * 0.5),
      upside: upside * 0.5,
      downside: downside * 0.5,
    },
    {
      timeframe: '6 months' as const,
      baseTarget: Math.max(ema50, ema200) * 1.05,
      bullTarget: resistance * 1.1,
      bearTarget: Math.min(ema50, ema200) * 0.95,
      upside: upside * 0.8,
      downside: downside * 0.6,
    },
    {
      timeframe: '1 year' as const,
      baseTarget: Math.max(ema200, currentPrice) * 1.12,
      bullTarget: resistance * 1.3,
      bearTarget: support * 0.9,
      upside: upside,
      downside: downside,
    },
  ];
  return targets;
}
