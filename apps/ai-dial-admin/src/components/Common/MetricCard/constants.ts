import { MetricStatus } from '@/src/components/Common/MetricCard/models';

// ECharts needs concrete colors; these mirror the theme token fallbacks (tailwind.config.js).
export const CHART_COLOR = {
  success: '#37BABC',
  warning: '#EEC840',
  error: '#F76464',
  accent: '#7DA4FF',
  neutral: '#9FA6BD',
  value: '#EEF1F7',
  track: '#242C42',
};

export const STATUS_COLOR: Record<MetricStatus, string> = {
  [MetricStatus.Ok]: CHART_COLOR.success,
  [MetricStatus.Warn]: CHART_COLOR.warning,
  [MetricStatus.Crit]: CHART_COLOR.error,
  [MetricStatus.Neutral]: CHART_COLOR.accent,
  [MetricStatus.NoData]: CHART_COLOR.neutral,
};

// Tailwind text-color classes for value text rendered as HTML (not ECharts).
export const STATUS_TEXT_CLASS: Record<MetricStatus, string> = {
  [MetricStatus.Ok]: 'text-success',
  [MetricStatus.Warn]: 'text-warning',
  [MetricStatus.Crit]: 'text-error',
  [MetricStatus.Neutral]: 'text-accent-primary',
  [MetricStatus.NoData]: 'text-secondary',
};
