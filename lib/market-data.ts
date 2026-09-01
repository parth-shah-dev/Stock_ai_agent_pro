import { MarketQuote, OHLCVData, SearchResult, AssetType, MarketIndex } from '@/types';

const YAHOO_BASE = 'https://query1.finance.yahoo.com';
const YAHOO_BASE2 = 'https://query2.finance.yahoo.com';
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY ?? '';
const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query';

// ── Alpha Vantage: Company Overview (fundamentals) ────────────────────────────
export async function fetchAlphaVantageFundamentals(symbol: string) {
  if (!ALPHA_VANTAGE_KEY) return null;
  try {
    // Strip .NS / .BO suffix for Alpha Vantage (US symbols only)
    const avSymbol = symbol.replace(/\.(NS|BO)$/, '');
    const url = `${ALPHA_VANTAGE_BASE}?function=OVERVIEW&symbol=${encodeURIComponent(avSymbol)}&apikey=${ALPHA_VANTAGE_KEY}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.Symbol) return null;
    return {
      pe: parseFloat(json.PERatio) || null,
      forwardPE: parseFloat(json.ForwardPE) || null,
      eps: parseFloat(json.EPS) || null,
      marketCap: parseInt(json.MarketCapitalization) || null,
      dividendYield: parseFloat(json.DividendYield) ? parseFloat(json.DividendYield) * 100 : null,
      beta: parseFloat(json.Beta) || null,
      debtToEquity: null,
      revenueGrowth: parseFloat(json.QuarterlyRevenueGrowthYOY) ? parseFloat(json.QuarterlyRevenueGrowthYOY) * 100 : null,
      profitMargins: parseFloat(json.ProfitMargin) ? parseFloat(json.ProfitMargin) * 100 : null,
      roe: parseFloat(json.ReturnOnEquityTTM) ? parseFloat(json.ReturnOnEquityTTM) * 100 : null,
      description: json.Description ?? '',
      sector: json.Sector ?? '',
      industry: json.Industry ?? '',
      weekHigh52: parseFloat(json['52WeekHigh']) || null,
      weekLow52: parseFloat(json['52WeekLow']) || null,
      analystTarget: parseFloat(json.AnalystTargetPrice) || null,
    };
  } catch {
    return null;
  }
}

// ── Alpha Vantage: Global Quote (real-time price) ─────────────────────────────
export async function fetchAlphaVantageQuote(symbol: string) {
  if (!ALPHA_VANTAGE_KEY) return null;
  try {
    const avSymbol = symbol.replace(/\.(NS|BO)$/, '');
    const url = `${ALPHA_VANTAGE_BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(avSymbol)}&apikey=${ALPHA_VANTAGE_KEY}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    const q = json['Global Quote'];
    if (!q || !q['05. price']) return null;
    return {
      price: parseFloat(q['05. price']),
      change: parseFloat(q['09. change']),
      changePercent: parseFloat(q['10. change percent']),
      open: parseFloat(q['02. open']),
      high: parseFloat(q['03. high']),
      low: parseFloat(q['04. low']),
      volume: parseInt(q['06. volume']),
      previousClose: parseFloat(q['08. previous close']),
    };
  } catch {
    return null;
  }
}

// ── Fetch Quote ────────────────────────────────────────────────────────────────
export async function fetchQuote(symbol: string): Promise<MarketQuote | null> {
  try {
    const url = `${YAHOO_BASE}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    return {
      symbol: meta.symbol ?? symbol,
      name: meta.longName ?? meta.shortName ?? symbol,
      price: meta.regularMarketPrice ?? 0,
      change: (meta.regularMarketPrice ?? 0) - (meta.previousClose ?? 0),
      changePercent:
        (((meta.regularMarketPrice ?? 0) - (meta.previousClose ?? 0)) /
          (meta.previousClose ?? 1)) *
        100,
      open: meta.regularMarketOpen ?? meta.previousClose ?? 0,
      high: meta.regularMarketDayHigh ?? 0,
      low: meta.regularMarketDayLow ?? 0,
      close: meta.previousClose ?? 0,
      volume: meta.regularMarketVolume ?? 0,
      weekHigh52: meta.fiftyTwoWeekHigh ?? 0,
      weekLow52: meta.fiftyTwoWeekLow ?? 0,
      currency: meta.currency ?? 'USD',
      exchange: meta.exchangeName ?? '',
      timestamp: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// ── Fetch Historical OHLCV ─────────────────────────────────────────────────────
export async function fetchHistorical(
  symbol: string,
  range = '1y',
  interval = '1d'
): Promise<OHLCVData[]> {
  try {
    const url = `${YAHOO_BASE}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return [];

    const timestamps: number[] = result.timestamp ?? [];
    const ohlcv = result.indicators?.quote?.[0] ?? {};

    return timestamps.map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      open: ohlcv.open?.[i] ?? 0,
      high: ohlcv.high?.[i] ?? 0,
      low: ohlcv.low?.[i] ?? 0,
      close: ohlcv.close?.[i] ?? 0,
      volume: ohlcv.volume?.[i] ?? 0,
    })).filter(d => d.close > 0);
  } catch {
    return [];
  }
}

// ── Fetch Fundamentals ────────────────────────────────────────────────────────
export async function fetchFundamentals(symbol: string) {
  try {
    const url = `${YAHOO_BASE2}/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=summaryDetail,financialData,defaultKeyStatistics,assetProfile`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.quoteSummary?.result?.[0];
    if (!result) return null;

    const summary = result.summaryDetail ?? {};
    const financial = result.financialData ?? {};
    const keyStats = result.defaultKeyStatistics ?? {};
    const profile = result.assetProfile ?? {};

    return {
      pe: summary.trailingPE?.raw ?? null,
      forwardPE: summary.forwardPE?.raw ?? null,
      eps: keyStats.trailingEps?.raw ?? null,
      marketCap: summary.marketCap?.raw ?? null,
      dividendYield: summary.dividendYield?.raw ? summary.dividendYield.raw * 100 : null,
      beta: summary.beta?.raw ?? 1,
      debtToEquity: financial.debtToEquity?.raw ?? null,
      revenueGrowth: financial.revenueGrowth?.raw ? financial.revenueGrowth.raw * 100 : null,
      profitMargins: financial.profitMargins?.raw ? financial.profitMargins.raw * 100 : null,
      roe: financial.returnOnEquity?.raw ? financial.returnOnEquity.raw * 100 : null,
      description: profile.longBusinessSummary ?? '',
      sector: profile.sector ?? '',
      industry: profile.industry ?? '',
    };
  } catch {
    return null;
  }
}

// ── Search Symbols ────────────────────────────────────────────────────────────
export async function searchSymbol(query: string): Promise<SearchResult[]> {
  try {
    const url = `${YAHOO_BASE}/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json = await res.json();
    const quotes = json?.quotes ?? [];

    return quotes
      .filter((q: any) => q.symbol && q.shortname)
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.shortname ?? q.longname ?? q.symbol,
        exchange: q.exchDisp ?? q.exchange ?? '',
        assetType: mapQuoteType(q.quoteType),
        currency: q.currency ?? 'USD',
      }));
  } catch {
    return [];
  }
}

function mapQuoteType(type: string): AssetType {
  const map: Record<string, AssetType> = {
    EQUITY: 'stock',
    ETF: 'etf',
    MUTUALFUND: 'mutual-fund',
    CRYPTOCURRENCY: 'crypto',
    CURRENCY: 'forex',
    FUTURE: 'commodity',
    INDEX: 'index',
  };
  return map[type?.toUpperCase()] ?? 'stock';
}

// ── Market Indices ─────────────────────────────────────────────────────────────
const INDEX_SYMBOLS = [
  { symbol: '^BSESN', name: 'Sensex', currency: 'INR' },
  { symbol: '^NSEI', name: 'Nifty 50', currency: 'INR' },
  { symbol: '^GSPC', name: 'S&P 500', currency: 'USD' },
  { symbol: '^DJI', name: 'Dow Jones', currency: 'USD' },
  { symbol: '^IXIC', name: 'NASDAQ', currency: 'USD' },
  { symbol: 'GC=F', name: 'Gold', currency: 'USD' },
  { symbol: 'BTC-USD', name: 'Bitcoin', currency: 'USD' },
  { symbol: 'ETH-USD', name: 'Ethereum', currency: 'USD' },
];

export async function fetchMarketIndices(): Promise<MarketIndex[]> {
  try {
    const symbols = INDEX_SYMBOLS.map(i => i.symbol).join(',');
    const url = `${YAHOO_BASE}/v7/finance/quote?symbols=${encodeURIComponent(symbols)}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return getFallbackIndices();
    const json = await res.json();
    const quotes = json?.quoteResponse?.result ?? [];

    return quotes.map((q: any) => {
      const meta = INDEX_SYMBOLS.find(i => i.symbol === q.symbol);
      return {
        symbol: q.symbol,
        name: meta?.name ?? q.shortName ?? q.symbol,
        value: q.regularMarketPrice ?? 0,
        change: q.regularMarketChange ?? 0,
        changePercent: q.regularMarketChangePercent ?? 0,
        currency: meta?.currency ?? q.currency ?? 'USD',
      };
    });
  } catch {
    return getFallbackIndices();
  }
}

function getFallbackIndices(): MarketIndex[] {
  return INDEX_SYMBOLS.map(i => ({
    symbol: i.symbol,
    name: i.name,
    value: 0,
    change: 0,
    changePercent: 0,
    currency: i.currency,
  }));
}

// ── Auto-Suggest: Top Picks by Risk/Reward ────────────────────────────────────
// Curated list of fundamentally strong stocks with good risk/reward profile
export const TOP_WATCHLIST_SYMBOLS = [
  // Indian Blue-chips
  'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
  'HINDUNILVR.NS', 'ITC.NS', 'SBIN.NS', 'BAJFINANCE.NS', 'WIPRO.NS',
  // US Large-caps
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK-B', 'JPM', 'V',
  // Crypto
  'BTC-USD', 'ETH-USD',
  // ETFs
  'SPY', 'QQQ',
];
