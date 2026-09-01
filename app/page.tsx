'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, TrendingDown, Brain, Shield, BarChart3, Newspaper, Zap, Star, ArrowRight, Activity } from 'lucide-react';
import { SearchBar } from '@/components/ui/SearchBar';
import { MarketCard, TickerItem } from '@/components/market/MarketCard';
import { AutoSuggestSection } from '@/components/analysis/AutoSuggest';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { MarketIndex } from '@/types';

const FEATURES = [
  { icon: Brain, title: 'AI Analysis', desc: 'Gemini-powered deep analysis with BUY/SELL/HOLD verdict and confidence score', color: '#3B82F6' },
  { icon: Shield, title: 'Risk Scoring', desc: 'Multi-factor risk assessment: volatility, sentiment, technicals & fundamentals', color: '#10B981' },
  { icon: BarChart3, title: 'Technical + Fundamental', desc: 'RSI, MACD, EMA, support/resistance + P/E, revenue growth, debt ratios', color: '#8B5CF6' },
  { icon: Newspaper, title: 'News Sentiment', desc: 'Real-time news with AI sentiment scoring — positive, negative, neutral', color: '#F59E0B' },
  { icon: Zap, title: 'Auto-Suggest', desc: 'AI scans 30+ stocks and suggests best risk-adjusted opportunities daily', color: '#EF4444' },
  { icon: Star, title: 'Pros & Cons Report', desc: 'Comprehensive bullish/bearish analysis with price targets for 1M, 3M, 1Y', color: '#06B6D4' },
];

const ASSET_TYPES = [
  { label: 'Stocks', emoji: '📈', example: 'RELIANCE', query: 'RELIANCE.NS' },
  { label: 'IPO', emoji: '🚀', example: 'Latest IPOs', query: 'BAJAJHFL.NS' },
  { label: 'Crypto', emoji: '₿', example: 'Bitcoin', query: 'BTC-USD' },
  { label: 'Forex', emoji: '💱', example: 'USD/INR', query: 'USDINR=X' },
  { label: 'ETFs', emoji: '🏛️', example: 'Nifty ETF', query: 'NIFTYBEES.NS' },
  { label: 'Indices', emoji: '📊', example: 'Nifty 50', query: '^NSEI' },
  { label: 'F&O', emoji: '⚡', example: 'Options', query: 'BANKNIFTY.NS' },
  { label: 'Gold', emoji: '🥇', example: 'Gold Futures', query: 'GC=F' },
];

export default function HomePage() {
  const router = useRouter();
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [loadingIndices, setLoadingIndices] = useState(true);

  useEffect(() => {
    fetch('/api/market-data')
      .then(r => r.json())
      .then(d => { setIndices(d.indices ?? []); setLoadingIndices(false); })
      .catch(() => setLoadingIndices(false));
  }, []);

  return (
    <div className="min-h-screen">
      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 glass-bright border-b border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Activity size={15} className="text-white" />
            </div>
            <span className="font-bold text-slate-100" style={{ fontFamily: 'Syne, sans-serif', fontSize: 16 }}>
              Stock<span className="text-blue-400">AI</span> Pro
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <a href="#features" className="hover:text-slate-200 transition-colors">Features</a>
            <a href="#markets" className="hover:text-slate-200 transition-colors">Markets</a>
            <a href="#suggest" className="hover:text-slate-200 transition-colors">AI Picks</a>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
            Live Data
          </div>
        </div>
      </nav>

      {/* ── Ticker Tape ────────────────────────────────────────────── */}
      <div className="border-b border-white/5 bg-black/20 overflow-hidden">
        <div className="py-2 flex whitespace-nowrap ticker-tape">
          {/* Duplicate for seamless loop */}
          {[...indices, ...indices].map((idx, i) => (
            <TickerItem
              key={`${idx.symbol}-${i}`}
              symbol={idx.name}
              name={idx.name}
              price={idx.value}
              changePercent={idx.changePercent}
              currency={idx.currency}
            />
          ))}
        </div>
      </div>

      {/* ── Hero Section ───────────────────────────────────────────── */}
      <section className="relative pt-20 pb-16 px-4 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/8 blur-[100px] rounded-full" />
          <div className="absolute top-20 left-1/4 w-[300px] h-[200px] bg-purple-600/5 blur-[80px] rounded-full" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 text-xs text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
            <Brain size={12} className="text-blue-400" />
            Powered by Google Gemini AI
            <span className="w-1 h-1 rounded-full bg-blue-400" />
            NSE · BSE · NYSE · NASDAQ · Crypto
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-4 leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
            Your <span className="gradient-text">AI-Powered</span>
            <br />Market Intelligence
          </h1>
          <p className="text-base sm:text-lg text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
            Get real-time AI analysis on any stock, IPO, crypto, or forex. Risk scores, news sentiment, price targets, and personalized suggestions — all in one place.
          </p>

          {/* Search Bar */}
          <SearchBar autoFocus />

          {/* Asset Type Pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {ASSET_TYPES.map(at => (
              <button
                key={at.label}
                onClick={() => router.push(`/analyze/${encodeURIComponent(at.query)}`)}
                className="flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/15 rounded-xl px-3 py-2 transition-all"
              >
                <span>{at.emoji}</span>
                {at.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Market Overview ─────────────────────────────────────────── */}
      <section id="markets" className="px-4 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Market Overview</h2>
          </div>
          {loadingIndices ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="skeleton rounded-xl min-w-[160px] h-20" />
              ))}
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {indices.map(idx => <MarketCard key={idx.symbol} index={idx} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── Auto-Suggest Section ────────────────────────────────────── */}
      <section id="suggest" className="px-4 pb-12">
        <div className="max-w-7xl mx-auto">
          <AutoSuggestSection />
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section id="features" className="px-4 py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-100 mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
              Everything You Need to Invest Smarter
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm">
              From technical indicators to AI-generated narratives — StockAI Pro gives you institutional-grade analysis.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="glass card-hover rounded-xl p-5">
                <div className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center"
                  style={{ backgroundColor: `${f.color}15`, border: `1px solid ${f.color}30` }}>
                  <f.icon size={18} style={{ color: f.color }} />
                </div>
                <h3 className="text-sm font-semibold text-slate-100 mb-1.5" style={{ fontFamily: 'Syne, sans-serif' }}>{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="px-4 py-16 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass-bright rounded-2xl p-10 border border-blue-400/10">
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-3 py-1 mb-5">
              <Zap size={11} fill="currentColor" />
              Try for free — no account needed
            </div>
            <h2 className="text-3xl font-bold text-slate-100 mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
              Start Analyzing Now
            </h2>
            <p className="text-sm text-slate-400 mb-6">Search any stock, IPO, crypto, or forex and get a full AI-powered report instantly.</p>
            <SearchBar />
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 px-4 py-8 text-center text-xs text-slate-600">
        <p>StockAI Pro © 2025 · Market data via Yahoo Finance · AI by Google Gemini</p>
        <p className="mt-1">⚠️ For educational purposes only. Not financial advice.</p>
      </footer>

      {/* ── AI Chat Widget ───────────────────────────────────────────── */}
      <ChatWidget />
    </div>
  );
}
