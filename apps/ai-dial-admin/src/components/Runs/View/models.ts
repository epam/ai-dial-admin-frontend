import { AnalyticsResult } from '@/src/models/evaluation/run';

export interface MetricEntry {
  key: string;
  value: number | null;
  isError: boolean;
}

export interface MetricGroup {
  title: string;
  metrics: MetricEntry[];
  info?: Record<string, unknown>;
  hasError: boolean;
  errorMessage?: string;
}

export interface CompareAnalyticsRow extends AnalyticsResult {
  _compared?: AnalyticsResult | null;
}
