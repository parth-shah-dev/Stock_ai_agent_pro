'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, RefreshCw, ExternalLink, Activity, Clock,
  TrendingUp, TrendingDown, BarChart2, Newspaper, AlertTriangle,
  DollarSign, Target, Info
} from 'lucide-react';
import { FullAnalysis, NewsSentimentSummary } from '@/types';
import { VerdictBadge, RiskMeter, ProsConsCard } from '@/components/analysis/AnalysisBadges';
import { PriceChart } from '@/components/charts/PriceChart';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { formatCurrency, formatLargeNumber, formatPercent, formatRelativeTime, getRiskColor } from '@/lib/formatters';

interface PageProps { params: Promise<{ symbol: string }> }

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const styles: Record<string, string> = {
    positive: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    negative: 'text-red-400 bg-red-400/10 border-red-400/20',
    neutral: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded border capitalize ${styles[sentiment] ?? styles.neutral}`}>
      {sentiment}
    </span>
  );
}

function StatCard({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: 'up' | 'down' | 'neutral' }) {
  const trendColor = trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#94A3B8';
  return (
    <div className="glass rounded-xl p-4">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-base font-bold text-slate-100" style={{ fontFamily: 'Syne, sans-serif', color: trend ? trendColor : undefined }}>
        {value}
      </div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function SkeletonAnalysis() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="skeleton rounded-xl h-24" />
      ))}
    </div>
  );
}

export default function AnalyzePage({ params }: PageProps) {
  const router = useRouter();
  const { symbol } = use(params);
  const decodedSymbol = decodeURIComponent(symbol);

  const [analysis, setAnalysis] = useState<FullAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'technical' | 'news' | 'report'>('overview');

  const fetchAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: decodedSymbol }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setAnalysis(json.analysis);
    } catch (e: any) {
      setError(e.message ?? 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalysis(); }, [decodedSymbol]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'technical', label: 'Technicals', icon: BarChart2 },
    { id: 'news', label: 'News', icon: Newspaper },
    { id: 'report', label: 'Full Report', icon: Target },
  ] as const;

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-40 glass-bright border-b border-white/8">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Activity size={15} className="text-blue-400" />
            <span className="font-bold text-slate-100" style={{ fontFamily: 'Syne, sans-serif', fontSize: 16 }}>
              Stock<span className="text-blue-400">AI</span> Pro
            </span>
          </div>
          <div className="flex-1" />
          {analysis && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
              <span className="font-semibold text-slate-200">{decodedSymbol}</span>
              <span className="text-slate-600">·</span>
              <span>{analysis.quote.exchange}</span>
            </div>
          )}
          <button
            onClick={fetchAnalysis}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 transition-all"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 skeleton rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-5 w-48 rounded" />
                <div className="skeleton h-3 w-64 rounded" />
              </div>
            </div>
            <SkeletonAnalysis />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="glass rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
            <AlertTriangle size={36} className="text-amber-400" />
            <div>
              <h3 className="text-lg font-semibold text-slate-200 mb-1">Could not load analysis</h3>
              <p className="text-sm text-slate-400">{error}</p>
            </div>
            <button onClick={fetchAnalysis} className="flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 text-sm px-4 py-2 rounded-lg hover:bg-blue-600/30 transition-colors">
              <RefreshCw size={14} /> Try Again
            </button>
          </div>
        )}

        {/* Analysis Content */}
        {analysis && !loading && (
          <div className="space-y-5 fade-in-up">
            {/* ── Header Card ────────────────────────────────────────── */}
            <div className="glass-bright rounded-2xl p-6 border border-white/8">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                {/* Left: Symbol + Price */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-500 bg-white/5 border border-white/8 rounded px-2 py-0.5">{analysis.quote.exchange}</span>
                    {analysis.quote.sector && <span className="text-xs text-blue-400">{analysis.quote.sector}</span>}
                  </div>
                  <h1 className="text-3xl font-extrabold text-slate-100" style={{ fontFamily: 'Syne, sans-serif' }}>
                    {analysis.name}
                  </h1>
                  <div className="text-lg text-slate-400 mb-3">{decodedSymbol}</div>

                  {/* Price */}
                  <div className="flex items-end gap-3">
                    <div className="text-4xl font-bold text-slate-100" style={{ fontFamily: 'Syne, sans-serif' }}>
                      {formatCurrency(analysis.quote.price, analysis.quote.currency)}
                    </div>
                    <div className={`flex items-center gap-1 text-lg font-semibold ${analysis.quote.change >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {analysis.quote.change >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      {formatPercent(analysis.quote.changePercent)}
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 mt-1">
                    Change: {formatCurrency(analysis.quote.change, analysis.quote.currency)} today
                  </div>
                </div>

                {/* Right: Verdict + Risk */}
                <div className="flex sm:flex-col items-center gap-6 sm:items-end">
                  <VerdictBadge verdict={analysis.verdict} confidence={analysis.verdictConfidence} size="lg" />
                  <RiskMeter score={analysis.riskScore.overall} size="md" />
                </div>
              </div>

              {/* Key Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/5">
                <div>
                  <div className="text-xs text-slate-500">52W High</div>
                  <div className="text-sm font-semibold text-slate-200">{formatCurrency(analysis.quote.weekHigh52 ?? 0, analysis.quote.currency)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">52W Low</div>
                  <div className="text-sm font-semibold text-slate-200">{formatCurrency(analysis.quote.weekLow52 ?? 0, analysis.quote.currency)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Market Cap</div>
                  <div className="text-sm font-semibold text-slate-200">{formatLargeNumber(analysis.quote.marketCap ?? 0, analysis.quote.currency)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Volume</div>
                  <div className="text-sm font-semibold text-slate-200">{formatLargeNumber(analysis.quote.volume)}</div>
                </div>
                {(analysis.quote as any).analystTarget && (
                  <div className="col-span-2 sm:col-span-1">
                    <div className="text-xs text-slate-500">Analyst Target</div>
                    <div className="text-sm font-semibold text-amber-400">{formatCurrency((analysis.quote as any).analystTarget, analysis.quote.currency)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* ── AI Summary ─────────────────────────────────────────── */}
            <div className="glass rounded-xl p-5 border border-blue-400/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-blue-400/20 flex items-center justify-center">
                  <Activity size={11} className="text-blue-400" />
                </div>
                <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">AI Analysis Summary</h3>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{analysis.summary}</p>
            </div>

            {/* ── Tabs ───────────────────────────────────────────────── */}
            <div className="flex gap-1 bg-white/3 rounded-xl p-1 border border-white/8">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg transition-all font-medium ${activeTab === t.id ? 'bg-white/10 text-slate-100 border border-white/10' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <t.icon size={12} />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>

            {/* ── Tab Content: Overview ───────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-5">
                {/* Price Chart */}
                <div className="glass rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4">Price Chart (1 Year)</h3>
                  <PriceChart
                    data={analysis.historicalData}
                    currency={analysis.quote.currency}
                    support={analysis.technicals?.support}
                    resistance={analysis.technicals?.resistance}
                  />
                </div>

                {/* Pros & Cons */}
                <ProsConsCard pros={analysis.prosCons.pros} cons={analysis.prosCons.cons} />

                {/* Price Targets */}
                {analysis.priceTargets.length > 0 && (
                  <div className="glass rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-slate-200 mb-4">Price Targets</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {analysis.priceTargets.map(t => (
                        <div key={t.timeframe} className="bg-white/3 border border-white/5 rounded-xl p-3">
                          <div className="text-xs text-slate-500 mb-2 capitalize">{t.timeframe}</div>
                          <div className="text-sm font-bold text-slate-100">{formatCurrency(t.baseTarget, analysis.quote.currency)}</div>
                          <div className="mt-1.5 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-emerald-400">🐂 Bull</span>
                              <span className="text-emerald-400 font-medium">{formatCurrency(t.bullTarget, analysis.quote.currency)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-red-400">🐻 Bear</span>
                              <span className="text-red-400 font-medium">{formatCurrency(t.bearTarget, analysis.quote.currency)}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs text-emerald-400">↑{t.upside.toFixed(1)}%</span>
                            <span className="text-xs text-red-400">↓{t.downside.toFixed(1)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Tab Content: Technical ─────────────────────────────── */}
            {activeTab === 'technical' && (
              <div className="space-y-4">
                {analysis.technicals ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <StatCard label="RSI (14)" value={analysis.technicals.rsi.toFixed(1)}
                        sub={analysis.technicals.rsi > 70 ? 'Overbought' : analysis.technicals.rsi < 30 ? 'Oversold' : 'Neutral'}
                        trend={analysis.technicals.rsi > 50 ? 'up' : 'down'} />
                      <StatCard label="MACD" value={analysis.technicals.macd.value.toFixed(2)}
                        sub={`Signal: ${analysis.technicals.macd.signal.toFixed(2)}`}
                        trend={analysis.technicals.macd.value > 0 ? 'up' : 'down'} />
                      <StatCard label="Trend" value={analysis.technicals.trend.charAt(0).toUpperCase() + analysis.technicals.trend.slice(1)}
                        trend={analysis.technicals.trend === 'bullish' ? 'up' : analysis.technicals.trend === 'bearish' ? 'down' : 'neutral'} />
                      <StatCard label="EMA 20" value={formatCurrency(analysis.technicals.ema20, analysis.quote.currency)} />
                      <StatCard label="EMA 50" value={formatCurrency(analysis.technicals.ema50, analysis.quote.currency)} />
                      <StatCard label="EMA 200" value={formatCurrency(analysis.technicals.ema200, analysis.quote.currency)} />
                      <StatCard label="Support" value={formatCurrency(analysis.technicals.support, analysis.quote.currency)} trend="up" />
                      <StatCard label="Resistance" value={formatCurrency(analysis.technicals.resistance, analysis.quote.currency)} trend="down" />
                      <StatCard label="BB Upper" value={formatCurrency(analysis.technicals.bollingerBands.upper, analysis.quote.currency)} />
                    </div>
                  </>
                ) : (
                  <div className="glass rounded-xl p-6 text-center text-slate-500 text-sm">
                    Not enough historical data for technical indicators
                  </div>
                )}

                {/* Key Metrics */}
                {analysis.keyMetrics.length > 0 && (
                  <div className="glass rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-slate-200 mb-4">Key Metrics</h3>
                    <div className="space-y-2">
                      {analysis.keyMetrics.map((m, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                          <span className="text-xs text-slate-400">{m.label}</span>
                          <span className={`text-xs font-semibold ${m.trend === 'up' ? 'text-positive' : m.trend === 'down' ? 'text-negative' : 'text-slate-200'}`}>
                            {m.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Tab Content: News ──────────────────────────────────── */}
            {activeTab === 'news' && (
              <div className="space-y-4">
                {/* Sentiment Summary */}
                <div className="glass rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4">News Sentiment Overview</h3>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-400">{analysis.news.positiveCount}</div>
                      <div className="text-xs text-slate-500">Positive</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-400">{analysis.news.neutralCount}</div>
                      <div className="text-xs text-slate-500">Neutral</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">{analysis.news.negativeCount}</div>
                      <div className="text-xs text-slate-500">Negative</div>
                    </div>
                  </div>
                  {/* Sentiment bar */}
                  <div className="h-2 rounded-full overflow-hidden flex gap-0.5">
                    <div className="bg-emerald-400 rounded-l-full" style={{ width: `${(analysis.news.positiveCount / analysis.news.articles.length) * 100}%` }} />
                    <div className="bg-slate-600" style={{ width: `${(analysis.news.neutralCount / analysis.news.articles.length) * 100}%` }} />
                    <div className="bg-red-400 rounded-r-full" style={{ width: `${(analysis.news.negativeCount / analysis.news.articles.length) * 100}%` }} />
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-sm text-slate-400">Overall:</span>
                    <SentimentBadge sentiment={analysis.news.overall} />
                    <span className="text-xs text-slate-500">(score: {analysis.news.score.toFixed(2)})</span>
                  </div>
                </div>

                {/* Articles */}
                <div className="space-y-3">
                  {analysis.news.articles.map(article => (
                    <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer"
                      className="glass card-hover rounded-xl p-4 flex items-start gap-4 block">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-slate-500">{article.source}</span>
                          <span className="text-slate-700">·</span>
                          <span className="text-xs text-slate-600">{formatRelativeTime(article.publishedAt)}</span>
                        </div>
                        <h4 className="text-sm font-medium text-slate-200 leading-snug mb-1 line-clamp-2">{article.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">{article.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <SentimentBadge sentiment={article.sentiment} />
                        <ExternalLink size={12} className="text-slate-600" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* ── Tab Content: Full Report ───────────────────────────── */}
            {activeTab === 'report' && (
              <div className="space-y-4">
                {/* Fundamentals */}
                <div className="glass rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4">Fundamental Analysis</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'P/E Ratio', value: analysis.quote.pe?.toFixed(2) ?? 'N/A' },
                      { label: 'EPS', value: analysis.quote.eps?.toFixed(2) ?? 'N/A' },
                      { label: 'Beta', value: (analysis.quote as any).beta?.toFixed(2) ?? 'N/A' },
                      { label: 'Dividend Yield', value: analysis.quote.dividendYield ? `${analysis.quote.dividendYield.toFixed(2)}%` : 'N/A' },
                      { label: 'Sector', value: analysis.quote.sector ?? 'N/A' },
                      { label: 'Industry', value: analysis.quote.industry ?? 'N/A' },
                    ].map(m => (
                      <div key={m.label} className="bg-white/3 rounded-lg p-3 border border-white/5">
                        <div className="text-xs text-slate-500 mb-1">{m.label}</div>
                        <div className="text-sm font-semibold text-slate-200">{m.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* About */}
                {analysis.quote.description && (
                  <div className="glass rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-slate-200 mb-3">About {analysis.name}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{analysis.quote.description}</p>
                  </div>
                )}

                {/* Risk Breakdown */}
                <div className="glass rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4">Risk Assessment Breakdown</h3>
                  <div className="flex items-center gap-6 mb-5">
                    <RiskMeter score={analysis.riskScore.overall} size="lg" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-300 leading-relaxed">{analysis.riskScore.breakdown} risk with a composite score of {analysis.riskScore.overall.toFixed(1)}/10. This factors in market volatility, news sentiment, technical momentum, and fundamental health.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Volatility (Beta)', value: analysis.riskScore.volatilityScore.toFixed(2), max: 3 },
                      { label: 'News Sentiment', value: `${(analysis.riskScore.sentimentScore * 100).toFixed(0)}%`, max: 1 },
                    ].map(m => (
                      <div key={m.label} className="bg-white/3 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">{m.label}</div>
                        <div className="text-sm font-semibold text-slate-200">{m.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="glass rounded-xl p-4 border border-amber-400/10 flex items-start gap-3">
                  <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    This analysis is generated by AI for informational purposes only and does not constitute financial advice. Past performance is not indicative of future results. Always consult a SEBI-registered financial advisor before making investment decisions. Invest according to your risk profile.
                  </p>
                </div>
              </div>
            )}

            {/* Updated time */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 justify-center pt-2">
              <Clock size={11} />
              Last updated: {new Date(analysis.timestamp).toLocaleString('en-IN')}
            </div>
          </div>
        )}
      </div>

      <ChatWidget />
    </div>
  );
}
