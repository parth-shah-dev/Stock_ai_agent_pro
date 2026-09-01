'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, TrendingUp, Loader2, Star } from 'lucide-react';
import { SearchResult } from '@/types';

const POPULAR = [
  { symbol: 'RELIANCE.NS', label: 'Reliance' },
  { symbol: 'TCS.NS', label: 'TCS' },
  { symbol: 'INFY.NS', label: 'Infosys' },
  { symbol: 'AAPL', label: 'Apple' },
  { symbol: 'NVDA', label: 'NVIDIA' },
  { symbol: 'BTC-USD', label: 'Bitcoin' },
];

export function SearchBar({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q.length < 1) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      setResults(json.results ?? []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  const navigate = (symbol: string) => {
    setQuery('');
    setResults([]);
    setFocused(false);
    router.push(`/analyze/${encodeURIComponent(symbol)}`);
  };

  const assetTypeIcon: Record<string, string> = {
    stock: '📈', crypto: '₿', etf: '🏛️', 'mutual-fund': '📊', forex: '💱', commodity: '🛢️', index: '📉',
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Input */}
      <div className={`flex items-center gap-3 glass-bright rounded-2xl px-4 py-3.5 transition-all duration-300 ${focused ? 'glow-blue border-blue-500/30' : 'border-white/8'}`}
        style={{ border: `1px solid ${focused ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
        {loading
          ? <Loader2 size={18} className="text-blue-400 animate-spin flex-shrink-0" />
          : <Search size={18} className="text-slate-400 flex-shrink-0" />
        }
        <input
          autoFocus={autoFocus}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder="Search any stock, IPO, crypto, forex… e.g. Reliance, AAPL, Bitcoin"
          className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); }} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {focused && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-bright rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50">
          {results.length > 0 ? (
            <ul className="max-h-72 overflow-y-auto py-1">
              {results.map(r => (
                <li key={r.symbol}>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                    onMouseDown={() => navigate(r.symbol)}
                  >
                    <span className="text-lg">{assetTypeIcon[r.assetType] ?? '📈'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-100">{r.symbol}</span>
                        <span className="text-xs text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">{r.exchange}</span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{r.name}</p>
                    </div>
                    <span className="text-xs text-slate-600 capitalize">{r.assetType}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : query.length > 0 && !loading ? (
            <div className="px-4 py-6 text-center text-sm text-slate-500">
              No results for "{query}"
            </div>
          ) : (
            <div className="p-3">
              <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
                <Star size={12} className="text-amber-400" />
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Popular Searches</span>
              </div>
              <div className="flex flex-wrap gap-2 px-2">
                {POPULAR.map(p => (
                  <button
                    key={p.symbol}
                    onMouseDown={() => navigate(p.symbol)}
                    className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 hover:bg-white/10 border border-white/8 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    <TrendingUp size={11} className="text-blue-400" />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
