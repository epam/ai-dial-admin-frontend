import { TimeRange } from '@/src/models/time-range';

const UNITS = [
  { threshold: 1e9, suffix: 'B' },
  { threshold: 1e6, suffix: 'M' },
  { threshold: 1e3, suffix: 'K' },
];

export const formatCompactNumber = (value: number): { value: string; unit?: string } => {
  const unit = UNITS.find(({ threshold }) => Math.abs(value) >= threshold);

  if (!unit) {
    return { value: String(Math.round(value)) };
  }

  return { value: (value / unit.threshold).toFixed(1), unit: unit.suffix };
};

export const formatMoney = (value: number): { value: string; unit?: string } => {
  if (Math.abs(value) >= 1000) {
    const compact = formatCompactNumber(value);
    return { value: `$${compact.value}`, unit: compact.unit };
  }

  return { value: `$${value.toFixed(2)}` };
};

export const formatPercent = (ratio: number, fractionDigits = 1): string => `${(ratio * 100).toFixed(fractionDigits)}%`;

/**
 * The change from the previous window to the current one. `null` means there is nothing to state —
 * either window is unknown, or both are zero; growth from zero is reported separately as new
 * activity rather than as an infinite change.
 */
export const getDeltaRatio = (current: number | null, previous: number | null): number | null => {
  if (current == null || previous == null || previous === 0) {
    return null;
  }

  return (current - previous) / previous;
};

export const formatDuration = (milliseconds: number): { value: string; unit?: string } =>
  milliseconds < 1000
    ? { value: String(Math.round(milliseconds)), unit: 'ms' }
    : { value: (milliseconds / 1000).toFixed(1), unit: 's' };

export const formatWindowBound = (date: Date, isSameDay: boolean): string =>
  date.toLocaleString(
    void 0,
    isSameDay
      ? { hour: '2-digit', minute: '2-digit' }
      : { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
  );

/** Both bounds at once, so every widget states the same window the same way. */
export const getWindowBounds = (window: TimeRange): { from: string; to: string } => {
  const isSameDay = window.startDate.toDateString() === window.endDate.toDateString();

  return {
    from: formatWindowBound(window.startDate, isSameDay),
    to: formatWindowBound(window.endDate, isSameDay),
  };
};
