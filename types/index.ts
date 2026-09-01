// ─── Market Data Types ───────────────────────────────────────────────────────

export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  marketCap?: number;
  pe?: number;
  eps?: number;
  weekHigh52?: number;
  weekLow52?: number;
  avgVolume?: number;
  dividendYield?: number;
  beta?: number;
  currency: string;
  exchange: string;
  sector?: string;
  industry?: string;
  description?: string;
  timestamp: string;
}

export interface OHLCVData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  currency: string;
}

// ─── News Types ───────────────────────────────────────────────────────────────

export type Sentiment = 'positive' | 'negative' | 'neutral';

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment: Sentiment;
  sentimentScore: number; // -1 to 1
  relevanceScore: number; // 0 to 1
  imageUrl?: string;
}

export interface NewsSentimentSummary {
  overall: Sentiment;
  score: number; // -1 to 1
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  articles: NewsArticle[];
}

// ─── Technical Analysis Types ─────────────────────────────────────────────────

export interface TechnicalIndicators {
  rsi: number; // 0–100
  macd: { value: number; signal: number; histogram: number };
  ema20: number;
  ema50: number;
  ema200: number;
  sma20: number;
  sma50: number;
  bollingerBands: { upper: number; middle: number; lower: number };
  support: number;
  resistance: number;
  trend: 'bullish' | 'bearish' | 'sideways';
}

// ─── Risk & Analysis Types ────────────────────────────────────────────────────

export type RiskLevel = 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
export type Verdict = 'STRONG BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG SELL' | 'AVOID';

export interface RiskScore {
  overall: number; // 1–10
  level: RiskLevel;
  volatilityScore: number;
  sentimentScore: number;
  technicalScore: number;
  fundamentalScore: number;
  breakdown: string;
}

export interface PriceTarget {
  timeframe: '1 month' | '3 months' | '6 months' | '1 year';
  bullTarget: number;
  bearTarget: number;
  baseTarget: number;
  upside: number; // %
  downside: number; // %
}

export interface ProsCons {
  pros: string[];
  cons: string[];
}

export interface FullAnalysis {
  symbol: string;
  name: string;
  query: string;
  assetType: AssetType;
  quote: MarketQuote;
  verdict: Verdict;
  verdictConfidence: number; // 0–100%
  summary: string;
  riskScore: RiskScore;
  priceTargets: PriceTarget[];
  technicals?: TechnicalIndicators;
  news: NewsSentimentSummary;
  prosCons: ProsCons;
  historicalData: OHLCVData[];
  keyMetrics: KeyMetric[];
  competitors?: CompetitorData[];
  timestamp: string;
}

export interface KeyMetric {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
  tooltip?: string;
}

export interface CompetitorData {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  marketCap?: number;
}

// ─── Asset Type ───────────────────────────────────────────────────────────────

export type AssetType =
  | 'stock'
  | 'ipo'
  | 'mutual-fund'
  | 'etf'
  | 'crypto'
  | 'forex'
  | 'commodity'
  | 'index';

// ─── Search Types ─────────────────────────────────────────────────────────────

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  assetType: AssetType;
  currency: string;
}

// ─── Chat Types ───────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

// ─── Watchlist Types ──────────────────────────────────────────────────────────

export interface WatchlistItem {
  symbol: string;
  name: string;
  addedAt: string;
  targetPrice?: number;
  notes?: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  loading?: boolean;
}

export interface AnalyzeRequest {
  query: string;
  symbol?: string;
  assetType?: AssetType;
}
