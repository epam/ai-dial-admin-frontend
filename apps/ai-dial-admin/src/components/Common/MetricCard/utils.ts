import { ChartColors, MetricStatus } from '@/src/components/Common/MetricCard/models';
import { ThemePalette } from '@/src/models/theme';

export const getChartColors = (palette: ThemePalette): ChartColors => ({
  success: palette['text-success'],
  warning: palette['text-warning'],
  error: palette['text-error'],
  accent: palette['text-accent-primary'],
  neutral: palette['text-secondary'],
  value: palette['text-primary'],
  track: palette['bg-layer-4'],
});

export const getStatusColor = (colors: ChartColors, status: MetricStatus): string => {
  const byStatus: Record<MetricStatus, string> = {
    [MetricStatus.Ok]: colors.success,
    [MetricStatus.Warn]: colors.warning,
    [MetricStatus.Crit]: colors.error,
    [MetricStatus.Neutral]: colors.accent,
    [MetricStatus.NoData]: colors.neutral,
  };
  return byStatus[status];
};
