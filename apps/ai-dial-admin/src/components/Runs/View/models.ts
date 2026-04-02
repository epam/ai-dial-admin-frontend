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
