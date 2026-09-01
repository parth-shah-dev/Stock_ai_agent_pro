'use client';
import { getVerdictColor, getVerdictBgColor } from '@/lib/formatters';
import { Zap } from 'lucide-react';

interface VerdictBadgeProps {
  verdict: string;
  confidence: number;
  size?: 'sm' | 'md' | 'lg';
}

export function VerdictBadge({ verdict, confidence, size = 'md' }: VerdictBadgeProps) {
  const color = getVerdictColor(verdict);
  const bg = getVerdictBgColor(verdict);

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3.5 py-1.5',
    lg: 'text-base px-5 py-2.5',
  };

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <div
        className={`verdict-badge inline-flex items-center gap-1.5 rounded-lg border ${sizeClasses[size]}`}
        style={{ color, backgroundColor: bg, borderColor: `${color}40` }}
      >
        <Zap size={size === 'lg' ? 16 : 13} fill={color} />
        {verdict}
      </div>
      <div className="text-xs text-slate-500">
        <span className="text-slate-300 font-medium">{confidence}%</span> confidence
      </div>
    </div>
  );
}

interface RiskMeterProps {
  score: number; // 1–10
  size?: 'sm' | 'md' | 'lg';
}

export function RiskMeter({ score, size = 'md' }: RiskMeterProps) {
  const getRiskColor = (s: number) => {
    if (s <= 3) return '#10B981';
    if (s <= 5) return '#22C55E';
    if (s <= 7) return '#F59E0B';
    if (s <= 9) return '#F97316';
    return '#EF4444';
  };
  const getRiskLabel = (s: number) => {
    if (s <= 2) return 'Very Low';
    if (s <= 4) return 'Low';
    if (s <= 6) return 'Medium';
    if (s <= 8) return 'High';
    return 'Very High';
  };

  const color = getRiskColor(score);
  const pct = ((score - 1) / 9) * 100;
  const dim = size === 'lg' ? 140 : size === 'md' ? 110 : 80;
  const strokeWidth = size === 'lg' ? 10 : 8;
  const r = (dim / 2) - strokeWidth - 2;
  const circumference = Math.PI * r; // half circle
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: dim, height: dim / 2 + 20 }}>
        <svg width={dim} height={dim / 2 + strokeWidth} viewBox={`0 0 ${dim} ${dim / 2 + strokeWidth}`}>
          {/* Track */}
          <path
            d={`M ${strokeWidth + 2} ${dim / 2} A ${r} ${r} 0 0 1 ${dim - strokeWidth - 2} ${dim / 2}`}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Fill */}
          <path
            d={`M ${strokeWidth + 2} ${dim / 2} A ${r} ${r} 0 0 1 ${dim - strokeWidth - 2} ${dim / 2}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.34,1.56,0.64,1), stroke 0.5s ease', filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        {/* Score text */}
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
          <span className="text-2xl font-bold" style={{ color, fontFamily: 'Syne, sans-serif' }}>{score.toFixed(1)}</span>
          <span className="text-xs" style={{ color: `${color}99` }}>/10</span>
        </div>
      </div>
      <div className="text-xs font-semibold" style={{ color }}>{getRiskLabel(score)} Risk</div>
    </div>
  );
}

interface ProsConsCardProps {
  pros: string[];
  cons: string[];
}

export function ProsConsCard({ pros, cons }: ProsConsCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Pros */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
          <h4 className="text-sm font-semibold text-emerald-400">Bullish Factors</h4>
        </div>
        <ul className="space-y-2">
          {pros.map((pro, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
              {pro}
            </li>
          ))}
        </ul>
      </div>
      {/* Cons */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-red-400 pulse-dot" />
          <h4 className="text-sm font-semibold text-red-400">Risk Factors</h4>
        </div>
        <ul className="space-y-2">
          {cons.map((con, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>
              {con}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
