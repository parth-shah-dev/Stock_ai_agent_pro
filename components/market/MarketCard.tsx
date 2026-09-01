'use client';
import { MarketIndex } from '@/types';
import { formatPercent, formatLargeNumber } from '@/lib/formatters';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MarketCardProps {
  index: MarketIndex;
}

export function MarketCard({ index }: MarketCardProps) {
  const isPositive = index.change >= 0;
  const color = isPositive ? '#10B981' : '#EF4444';

  return (
    <div className="glass card-hover rounded-xl p-4 min-w-[160px] flex-shrink-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400 font-medium">{index.name}</span>
        <span className="text-xs text-slate-500">{index.currency}</span>
      </div>
      <div className="text-lg font-bold text-slate-100" style={{ fontFamily: 'Syne, sans-serif' }}>
        {index.value > 0 ? formatLargeNumber(index.value) : '—'}
      </div>
      <div className="flex items-center gap-1 mt-1">
        {isPositive
          ? <TrendingUp size={12} color={color} />
          : <TrendingDown size={12} color={color} />
        }
        <span className="text-xs font-semibold" style={{ color }}>
          {index.value > 0 ? formatPercent(index.changePercent) : '—'}
        </span>
      </div>
    </div>
  );
}

interface TickerItemProps {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  currency: string;
}

export function TickerItem({ symbol, name, price, changePercent, currency }: TickerItemProps) {
  const isPositive = changePercent >= 0;
  return (
    <span className="inline-flex items-center gap-2 px-4 border-r border-white/5">
      <span className="text-xs font-semibold text-slate-300">{symbol.replace('.NS', '').replace('.BO', '')}</span>
      <span className="text-xs text-slate-400">{currency} {price.toFixed(price < 10 ? 4 : 2)}</span>
      <span className={`text-xs font-medium ${isPositive ? 'text-positive' : 'text-negative'}`}>
        {formatPercent(changePercent)}
      </span>
    </span>
  );
}
