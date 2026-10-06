import { MetricStatus } from '@/src/components/Common/MetricCard/models';

// Tailwind text-color classes for value text rendered as HTML (not ECharts).
export const STATUS_TEXT_CLASS: Record<MetricStatus, string> = {
  [MetricStatus.Ok]: 'text-success',
  [MetricStatus.Warn]: 'text-warning',
  [MetricStatus.Crit]: 'text-error',
  [MetricStatus.Neutral]: 'text-accent',
  [MetricStatus.NoData]: 'text-secondary',
};
