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
