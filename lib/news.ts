import { NewsArticle, NewsSentimentSummary, Sentiment } from '@/types';

const GNEWS_API_KEY = process.env.GNEWS_API_KEY ?? '';
const NEWSAPI_KEY = process.env.NEWSAPI_KEY ?? '';

// ── Sentiment Keywords ─────────────────────────────────────────────────────────
const POSITIVE_WORDS = [
  'surge', 'rally', 'gain', 'profit', 'growth', 'bullish', 'beat', 'record',
  'strong', 'upgrade', 'buy', 'outperform', 'positive', 'rise', 'jump', 'up',
  'increase', 'expansion', 'opportunity', 'robust', 'boom', 'soar', 'breakthrough',
];
const NEGATIVE_WORDS = [
  'fall', 'drop', 'decline', 'loss', 'bearish', 'miss', 'downgrade', 'sell',
  'underperform', 'negative', 'crash', 'plunge', 'risk', 'concern', 'weak',
  'decrease', 'contraction', 'recession', 'warning', 'debt', 'fraud', 'lawsuit',
];

function scoreSentiment(text: string): { sentiment: Sentiment; score: number } {
  const lower = text.toLowerCase();
  let score = 0;
  POSITIVE_WORDS.forEach(w => { if (lower.includes(w)) score += 1; });
  NEGATIVE_WORDS.forEach(w => { if (lower.includes(w)) score -= 1; });

  const maxWords = Math.max(POSITIVE_WORDS.length, NEGATIVE_WORDS.length);
  const normalized = score / maxWords; // -1 to 1

  let sentiment: Sentiment = 'neutral';
  if (normalized > 0.05) sentiment = 'positive';
  else if (normalized < -0.05) sentiment = 'negative';

  return { sentiment, score: normalized };
}

// ── Fetch News from GNews ─────────────────────────────────────────────────────
async function fetchFromGNews(query: string): Promise<NewsArticle[]> {
  if (!GNEWS_API_KEY) return [];
  try {
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=10&apikey=${GNEWS_API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.articles ?? []).map((a: any, i: number) => {
      const text = `${a.title} ${a.description ?? ''}`;
      const { sentiment, score } = scoreSentiment(text);
      return {
        id: `gnews-${i}`,
        title: a.title,
        description: a.description ?? '',
        url: a.url,
        source: a.source?.name ?? 'GNews',
        publishedAt: a.publishedAt,
        sentiment,
        sentimentScore: score,
        relevanceScore: 0.8,
        imageUrl: a.image ?? undefined,
      } satisfies NewsArticle;
    });
  } catch { return []; }
}

// ── Fetch News from NewsAPI ───────────────────────────────────────────────────
async function fetchFromNewsAPI(query: string): Promise<NewsArticle[]> {
  if (!NEWSAPI_KEY) return [];
  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWSAPI_KEY}`;
    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.articles ?? []).map((a: any, i: number) => {
      const text = `${a.title} ${a.description ?? ''}`;
      const { sentiment, score } = scoreSentiment(text);
      return {
        id: `newsapi-${i}`,
        title: a.title,
        description: a.description ?? '',
        url: a.url,
        source: a.source?.name ?? 'NewsAPI',
        publishedAt: a.publishedAt,
        sentiment,
        sentimentScore: score,
        relevanceScore: 0.9,
        imageUrl: a.urlToImage ?? undefined,
      } satisfies NewsArticle;
    });
  } catch { return []; }
}

// ── Fallback: Simulated news for demo ────────────────────────────────────────
function generateDemoNews(symbol: string): NewsArticle[] {
  const headlines = [
    { title: `${symbol} Reports Strong Q4 Earnings, Beats Estimates`, sentiment: 'positive' as Sentiment, score: 0.6 },
    { title: `Analysts Upgrade ${symbol} With Higher Price Target`, sentiment: 'positive' as Sentiment, score: 0.5 },
    { title: `${symbol} Announces Strategic Expansion Plans`, sentiment: 'positive' as Sentiment, score: 0.4 },
    { title: `Market Volatility Raises Concerns for ${symbol} Investors`, sentiment: 'negative' as Sentiment, score: -0.3 },
    { title: `${symbol} Stock Faces Regulatory Scrutiny`, sentiment: 'negative' as Sentiment, score: -0.4 },
    { title: `${symbol} Maintains Guidance Amid Macro Uncertainty`, sentiment: 'neutral' as Sentiment, score: 0.0 },
  ];

  return headlines.map((h, i) => ({
    id: `demo-${i}`,
    title: h.title,
    description: `${h.title}. Analysts and investors closely watch this development.`,
    url: '#',
    source: ['Reuters', 'Bloomberg', 'Economic Times', 'Moneycontrol', 'CNBC'][i % 5],
    publishedAt: new Date(Date.now() - i * 3600000 * 6).toISOString(),
    sentiment: h.sentiment,
    sentimentScore: h.score,
    relevanceScore: 0.7,
  }));
}

// ── Main News Fetcher ─────────────────────────────────────────────────────────
export async function fetchNewsAndSentiment(
  symbol: string,
  companyName: string
): Promise<NewsSentimentSummary> {
  const query = `${companyName} ${symbol} stock`;
  const [gnews, newsapi] = await Promise.all([
    fetchFromGNews(query),
    fetchFromNewsAPI(query),
  ]);

  let articles = [...gnews, ...newsapi];
  if (articles.length === 0) articles = generateDemoNews(symbol);

  // Deduplicate
  const seen = new Set<string>();
  articles = articles.filter(a => {
    const key = a.title.slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const scores = articles.map(a => a.sentimentScore);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  const positiveCount = articles.filter(a => a.sentiment === 'positive').length;
  const negativeCount = articles.filter(a => a.sentiment === 'negative').length;
  const neutralCount = articles.filter(a => a.sentiment === 'neutral').length;

  let overall: Sentiment = 'neutral';
  if (avgScore > 0.1) overall = 'positive';
  else if (avgScore < -0.1) overall = 'negative';

  return {
    overall,
    score: avgScore,
    positiveCount,
    negativeCount,
    neutralCount,
    articles: articles.slice(0, 8),
  };
}
