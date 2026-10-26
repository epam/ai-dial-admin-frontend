import { ComboTrendPoint } from '@/src/components/TestSuites/Trends/models';

/** Sum of present segments; null when both source and metrics are missing. */
export const comboTrendTotal = (point: Pick<ComboTrendPoint, 'source' | 'metrics'>): number | null => {
  const hasSource = point.source != null && Number.isFinite(point.source);
  const hasMetrics = point.metrics != null && Number.isFinite(point.metrics);
  if (!hasSource && !hasMetrics) {
    return null;
  }
  return (hasSource ? (point.source as number) : 0) + (hasMetrics ? (point.metrics as number) : 0);
};

export const comboTrendMaxTotal = (points: ComboTrendPoint[]): number => {
  let max = 0;
  for (const point of points) {
    const total = comboTrendTotal(point);
    if (total != null && total > max) {
      max = total;
    }
  }
  return max;
};

/** True when at least one run has a finite source or metrics value. */
export const hasComboTrendData = (points: ComboTrendPoint[]): boolean =>
  points.some((point) => comboTrendTotal(point) != null);
