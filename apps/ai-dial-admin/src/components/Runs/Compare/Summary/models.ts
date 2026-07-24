/** Dual-run statistic card for the Distribution section. */
export interface CompareMetricStatCard {
  name: string;
  primaryValue: number | null;
  comparedValue: number | null;
}

/** One metric group aligned for DialAnalyticsBarGroup compare mode. */
export interface CompareBarGroup {
  name: string;
  data: Record<string, number>;
  compareData: Record<string, number>;
  description?: string;
  barDescriptions?: Record<string, string>;
}
