import { MetricStatus } from '@/src/components/Common/MetricCard/models';
import { fallbackDarkTheme } from '@/src/utils/themes/constant';

// ECharts paints on a canvas, which cannot resolve CSS variables, so it gets the dark palette's
// concrete values.
export const CHART_COLOR = {
  success: fallbackDarkTheme['text-success'],
  warning: fallbackDarkTheme['text-warning'],
  error: fallbackDarkTheme['text-error'],
  accent: fallbackDarkTheme['text-accent-primary'],
  neutral: fallbackDarkTheme['text-secondary'],
  value: fallbackDarkTheme['text-primary'],
  track: fallbackDarkTheme['bg-layer-4'],
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
  [MetricStatus.Neutral]: 'text-accent',
  [MetricStatus.NoData]: 'text-secondary',
};
