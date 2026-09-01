'use client';
import { OHLCVData } from '@/types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { formatDate } from '@/lib/formatters';

interface PriceChartProps {
  data: OHLCVData[];
  currency?: string;
  support?: number;
  resistance?: number;
  height?: number;
}

const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as OHLCVData;
  return (
    <div className="glass-bright rounded-lg p-3 text-xs border border-white/10 shadow-xl">
      <div className="text-slate-400 mb-1">{formatDate(label)}</div>
      <div className="text-slate-100 font-semibold">{currency} {d.close?.toFixed(2)}</div>
      <div className="text-slate-400 mt-1 space-y-0.5">
        <div>O: {d.open?.toFixed(2)}  H: {d.high?.toFixed(2)}</div>
        <div>L: {d.low?.toFixed(2)}  V: {(d.volume / 1e6).toFixed(2)}M</div>
      </div>
    </div>
  );
};

export function PriceChart({ data, currency = 'INR', support, resistance, height = 280 }: PriceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] text-slate-500 text-sm">
        No chart data available
      </div>
    );
  }

  const closes = data.map(d => d.close);
  const minVal = Math.min(...closes) * 0.99;
  const maxVal = Math.max(...closes) * 1.01;
  const isPositive = (data[data.length - 1]?.close ?? 0) >= (data[0]?.close ?? 0);
  const color = isPositive ? '#10B981' : '#EF4444';
  const gradientId = `price-gradient-${isPositive ? 'green' : 'red'}`;

  // Downsample for performance
  const step = Math.max(1, Math.floor(data.length / 120));
  const chartData = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={d => {
            const date = new Date(d);
            return `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`;
          }}
          tick={{ fontSize: 10, fill: '#475569' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[minVal, maxVal]}
          tickFormatter={v => `${v.toFixed(0)}`}
          tick={{ fontSize: 10, fill: '#475569' }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip currency={currency} />} />
        {support && (
          <ReferenceLine y={support} stroke="#10B981" strokeDasharray="4 4" strokeOpacity={0.4}
            label={{ value: 'Support', position: 'insideRight', fontSize: 9, fill: '#10B981' }} />
        )}
        {resistance && (
          <ReferenceLine y={resistance} stroke="#F59E0B" strokeDasharray="4 4" strokeOpacity={0.4}
            label={{ value: 'Resistance', position: 'insideRight', fontSize: 9, fill: '#F59E0B' }} />
        )}
        <Area
          type="monotone"
          dataKey="close"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
