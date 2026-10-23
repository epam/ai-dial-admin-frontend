/** Formats a suite run duration for KPI display (ms under 1s, otherwise seconds). */
export const formatSuiteRunTime = (durationMs: number): string => {
  if (durationMs < 1000) {
    return `${Math.round(durationMs)}ms`;
  }
  const seconds = Math.round(durationMs / 100) / 10;
  return `${seconds}s`;
};

export const formatComboRuntimeSeconds = (durationMs: number): string => {
  if (!Number.isFinite(durationMs)) {
    return '—';
  }
  const seconds = durationMs / 1000;
  const abs = Math.abs(seconds);
  if (abs === 0) {
    return '0s';
  }
  if (abs >= 100) {
    return `${Math.round(seconds)}s`;
  }
  if (abs >= 10) {
    const rounded = Math.round(seconds * 10) / 10;
    return `${rounded}s`;
  }
  if (abs >= 1) {
    const rounded = Math.round(seconds * 100) / 100;
    return `${rounded}s`;
  }

  const trimmed = Number(seconds.toPrecision(3));
  return `${trimmed}s`;
};

export const formatScore = (value: number): string => String(roundScore(value));

export const roundScore = (value: number): number => Math.round(value * 1000) / 1000;

/** Short month + 4-digit year for chart tooltip timestamps (e.g. "Feb 2026"). */
export const formatTrendAxisDate = (ms: number): string => {
  const date = new Date(ms);
  const month = date.toLocaleString(undefined, { month: 'short' });
  const year = String(date.getFullYear());
  return `${month} ${year}`;
};

/** Trend tooltip header timestamp like "Feb 2026, 10:12". */
export const formatMetricTrendTooltipDate = (ms: number): string => {
  const date = new Date(ms);
  const timePart = date.toLocaleString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  return `${formatTrendAxisDate(ms)}, ${timePart}`;
};

export const formatTrendAxisRunName = (runName: string): string => runName.replace(/^Run\s*/i, '');
