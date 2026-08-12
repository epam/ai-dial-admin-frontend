/** Dual-run statistic card for the Distribution section. */
export interface CompareMetricStatCard {
  name: string;
  primaryValue: number | null;
  comparedValue: number | null;
}

/** One metric group aligned for DialAnalyticsBarGroup compare mode. */
export interface CompareBarGroup {
  name: string;
  data: Record<string, number | null>;
  compareData: Record<string, number | null>;
  description?: string;
  barDescriptions?: Record<string, string>;
}
