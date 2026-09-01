'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Zap, TrendingUp, RefreshCw, Loader2, AlertTriangle, Star, ChevronRight } from 'lucide-react';
import { getRiskColor, getRiskLabel } from '@/lib/formatters';

interface Suggestion {
  symbol: string;
  name: string;
  verdict: string;
  riskScore: number;
  profitPotential: string;
  shortReason: string;
  confidenceScore: number;
}

interface AutoSuggestData {
  topPick: { symbol: string; reason: string; score: number };
  suggestions: Suggestion[];
  marketOutlook: string;
}

export function AutoSuggestSection() {
  const router = useRouter();
  const [data, setData] = useState<AutoSuggestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchSuggestions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auto-suggest');
      if (!res.ok) throw new Error('Failed to fetch suggestions');
      const json = await res.json();
      setData(json.suggestions);
      setLastUpdated(new Date().toLocaleTimeString('en-IN'));
    } catch (e: any) {
      setError(e.message ?? 'Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuggestions(); }, []);

  const getVerdictStyle = (verdict: string) => {
    if (verdict.includes('STRONG BUY')) return { color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' };
    if (verdict === 'BUY') return { color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)' };
    return { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' };
  };

  return (
    <section className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
            <Zap size={16} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100" style={{ fontFamily: 'Syne, sans-serif' }}>
              AI Auto-Suggest
            </h2>
            <p className="text-xs text-slate-500">Best risk-adjusted picks · updated {lastUpdated || '...'}</p>
          </div>
        </div>
        <button
          onClick={fetchSuggestions}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 transition-all"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center gap-3">
          <Loader2 size={28} className="text-blue-400 animate-spin" />
          <p className="text-sm text-slate-400">AI scanning markets for best opportunities…</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="glass rounded-2xl p-6 flex items-center gap-3 text-amber-400 border border-amber-400/10">
          <AlertTriangle size={18} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Content */}
      {data && !loading && (
        <div className="space-y-4">
          {/* Market Outlook */}
          <div className="glass rounded-xl p-4 border border-blue-400/10">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-400/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <TrendingUp size={14} className="text-blue-400" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-blue-400 mb-1 uppercase tracking-wider">Market Outlook</h4>
                <p className="text-sm text-slate-300 leading-relaxed">{data.marketOutlook}</p>
              </div>
            </div>
          </div>

          {/* Top Pick */}
          {data.topPick && (
            <div
              className="suggest-card glass rounded-xl p-5 cursor-pointer transition-all hover:bg-white/5"
              onClick={() => router.push(`/analyze/${encodeURIComponent(data.topPick.symbol)}`)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center trophy-glow flex-shrink-0">
                    <Trophy size={18} className="text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">🏆 Top Pick</span>
                      <div className="flex items-center gap-1 text-xs bg-amber-400/10 text-amber-300 border border-amber-400/20 rounded px-1.5 py-0.5">
                        <Star size={9} fill="currentColor" />
                        Score: {data.topPick.score}/100
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-100" style={{ fontFamily: 'Syne, sans-serif' }}>
                      {data.topPick.symbol.replace('.NS', '').replace('.BO', '')}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-md">{data.topPick.reason}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-500 mt-1 flex-shrink-0" />
              </div>
            </div>
          )}

          {/* Suggestion Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(data.suggestions ?? []).map((s, i) => {
              const style = getVerdictStyle(s.verdict);
              const riskColor = getRiskColor(s.riskScore);
              return (
                <div
                  key={s.symbol}
                  className="glass card-hover rounded-xl p-4 cursor-pointer"
                  onClick={() => router.push(`/analyze/${encodeURIComponent(s.symbol)}`)}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-100" style={{ fontFamily: 'Syne, sans-serif' }}>
                          {s.symbol.replace('.NS', '').replace('.BO', '')}
                        </span>
                        <span className="text-xs text-slate-600">#{i + 1}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate max-w-[120px]">{s.name}</p>
                    </div>
                    <div className="text-xs font-bold px-2 py-0.5 rounded border"
                      style={{ color: style.color, backgroundColor: style.bg, borderColor: style.border }}>
                      {s.verdict}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-white/3 rounded-lg p-2">
                      <div className="text-xs text-slate-500 mb-0.5">Risk Score</div>
                      <div className="text-sm font-semibold" style={{ color: riskColor }}>
                        {s.riskScore.toFixed(1)}/10
                      </div>
                      <div className="text-xs" style={{ color: `${riskColor}99` }}>{getRiskLabel(s.riskScore)}</div>
                    </div>
                    <div className="bg-white/3 rounded-lg p-2">
                      <div className="text-xs text-slate-500 mb-0.5">Potential</div>
                      <div className="text-sm font-semibold text-emerald-400">{s.profitPotential}</div>
                      <div className="text-xs text-slate-500">{s.confidenceScore}% conf.</div>
                    </div>
                  </div>

                  {/* Reason */}
                  <p className="text-xs text-slate-400 leading-relaxed">{s.shortReason}</p>

                  {/* Confidence bar */}
                  <div className="mt-3">
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${s.confidenceScore}%`, backgroundColor: style.color, transition: 'width 1s ease' }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-slate-600">AI Confidence</span>
                      <span className="text-xs font-medium" style={{ color: style.color }}>{s.confidenceScore}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-slate-600 text-center px-4">
            ⚠️ AI suggestions are for informational purposes only. Always do your own research before investing. Past performance is not indicative of future results.
          </p>
        </div>
      )}
    </section>
  );
}
