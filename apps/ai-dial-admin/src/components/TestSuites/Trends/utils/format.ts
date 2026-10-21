/** Formats a suite run duration for KPI display (ms under 1s, otherwise seconds). */
export const formatSuiteRunTime = (durationMs: number): string => {
  if (durationMs < 1000) {
    return `${Math.round(durationMs)}ms`;
  }
  const seconds = Math.round(durationMs / 100) / 10;
  return `${seconds}s`;
};

export const formatScore = (value: number): string => String(roundScore(value));

export const roundScore = (value: number): number => Math.round(value * 1000) / 1000;

/** Short month + 2-digit year label for chart axes (e.g. "Feb 26"). */
export const formatTrendAxisDate = (ms: number): string => {
  const date = new Date(ms);
  const month = date.toLocaleString(undefined, { month: 'short' });
  const year = String(date.getFullYear());
  return `${month} ${year}`;
};

export const buildCenteredTimelineLabels = (labels: string[]): string[] => {
  const centeredLabels = Array(labels.length).fill('');
  let startIndex = 0;

  while (startIndex < labels.length) {
    let endIndex = startIndex;

    while (endIndex + 1 < labels.length && labels[endIndex + 1] === labels[startIndex]) {
      endIndex += 1;
    }

    const middleIndex = Math.floor((startIndex + endIndex) / 2);
    centeredLabels[middleIndex] = labels[startIndex];
    startIndex = endIndex + 1;
  }

  return centeredLabels;
};

/** Tooltip date like "Feb 27". */
export const formatTrendTooltipDate = (ms: number): string => {
  const date = new Date(ms);
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric' });
};
