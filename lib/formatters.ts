// Currency formatting
export function formatCurrency(value: number, currency = 'INR'): string {
  if (!isFinite(value)) return 'N/A';
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

// Large number formatting (M, B, T)
export function formatLargeNumber(value: number, currency?: string): string {
  if (!isFinite(value) || value === 0) return 'N/A';
  const prefix = currency ? `${currency} ` : '';
  if (Math.abs(value) >= 1e12) return `${prefix}${(value / 1e12).toFixed(2)}T`;
  if (Math.abs(value) >= 1e9) return `${prefix}${(value / 1e9).toFixed(2)}B`;
  if (Math.abs(value) >= 1e6) return `${prefix}${(value / 1e6).toFixed(2)}M`;
  if (Math.abs(value) >= 1e3) return `${prefix}${(value / 1e3).toFixed(2)}K`;
  return `${prefix}${value.toFixed(2)}`;
}

// Percentage formatting
export function formatPercent(value: number, showSign = true): string {
  if (!isFinite(value)) return 'N/A';
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

// Volume formatting
export function formatVolume(value: number): string {
  return formatLargeNumber(value);
}

// Date formatting
export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// Relative time (e.g. "2 hours ago")
export function formatRelativeTime(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return dateStr;
  }
}

// Clamp to range
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// cn utility (Tailwind class merger)
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Risk level label
export function getRiskLabel(score: number): string {
  if (score <= 2) return 'Very Low';
  if (score <= 4) return 'Low';
  if (score <= 6) return 'Medium';
  if (score <= 8) return 'High';
  return 'Very High';
}

// Risk level color
export function getRiskColor(score: number): string {
  if (score <= 2) return '#10B981'; // emerald
  if (score <= 4) return '#22C55E'; // green
  if (score <= 6) return '#F59E0B'; // amber
  if (score <= 8) return '#F97316'; // orange
  return '#EF4444'; // red
}

// Verdict color
export function getVerdictColor(verdict: string): string {
  const map: Record<string, string> = {
    'STRONG BUY': '#10B981',
    'BUY': '#22C55E',
    'HOLD': '#F59E0B',
    'SELL': '#F97316',
    'STRONG SELL': '#EF4444',
    'AVOID': '#6B7280',
  };
  return map[verdict] ?? '#6B7280';
}

// Verdict background color (faded)
export function getVerdictBgColor(verdict: string): string {
  const map: Record<string, string> = {
    'STRONG BUY': 'rgba(16,185,129,0.15)',
    'BUY': 'rgba(34,197,94,0.15)',
    'HOLD': 'rgba(245,158,11,0.15)',
    'SELL': 'rgba(249,115,22,0.15)',
    'STRONG SELL': 'rgba(239,68,68,0.15)',
    'AVOID': 'rgba(107,114,128,0.15)',
  };
  return map[verdict] ?? 'rgba(107,114,128,0.15)';
}
