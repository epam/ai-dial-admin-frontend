// Health status of a metric, rolled up worst-of from card → section → overall.
export enum MetricStatus {
  Ok = 'ok',
  Warn = 'warn',
  Crit = 'crit',
  // No threshold defined — never drives the dashboard red.
  Neutral = 'neutral',
  // Value missing / block unavailable.
  NoData = 'no-data',
}

// Concrete colors for ECharts, which paints on a canvas and cannot resolve CSS variables.
export interface ChartColors {
  success: string;
  warning: string;
  error: string;
  accent: string;
  neutral: string;
  value: string;
  track: string;
}
