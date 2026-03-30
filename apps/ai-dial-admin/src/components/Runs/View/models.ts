export interface MetricGroup {
  title: string;
  metrics: Array<{ key: string; value: number | null; isError: boolean }>;
  infos?: Record<string, unknown>;
  hasError: boolean;
  errorMessage?: string;
}
