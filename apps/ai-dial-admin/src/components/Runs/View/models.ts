export interface MetricEntry {
  key: string;
  value: number | null;
  isError: boolean;
}

export interface MetricGroup {
  title: string;
  metrics: MetricEntry[];
  infos?: Record<string, unknown>;
  hasError: boolean;
  errorMessage?: string;
}
