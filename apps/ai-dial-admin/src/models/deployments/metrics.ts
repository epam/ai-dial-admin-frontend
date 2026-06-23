import { MetricsBlockKey } from '@/src/types/deployments/metrics';

// Mirrors the deployment-manager `DeploymentMetricsDto` — a live, engine-neutral metrics snapshot.
export interface DeploymentMetrics {
  collectedAt: string | null;
  engine: string | null;
  scrapedPod: string | null;
  window: string | null;
  availability: Partial<Record<MetricsBlockKey, MetricsAvailability>>;
  serving: ServingMetrics | null;
  resources: ResourceMetrics | null;
  operational: OperationalMetrics | null;
  rawCounters: Record<string, number> | null;
}

export interface MetricsAvailability {
  available: boolean;
  reason?: string | null;
}

export interface DistributionSummary {
  mean: number | null;
  p50: number | null;
  p95: number | null;
  p99: number | null;
  count: number;
}

export interface ServingMetrics {
  ttft: DistributionSummary | null;
  interTokenLatency: DistributionSummary | null;
  tokensPerSecond: TokensPerSecond | null;
  queueDepth: number | null;
  runningRequests: number | null;
  kvCacheUsage: number | null;
  requestLatency: DistributionSummary | null;
  requestsPerSecond: number | null;
}

export interface TokensPerSecond {
  prompt: number | null;
  generation: number | null;
}

export interface OperationalMetrics {
  requestErrorRatio: number | null;
  e2eLatency: DistributionSummary | null;
}

export interface ResourceMetrics {
  replicas: Replicas;
  pods: PodResourceUsage[];
}

export interface Replicas {
  total: number;
  ready: number;
}

export interface PodResourceUsage {
  name: string;
  cpuMillicores: number | null;
  memoryBytes: number | null;
  gpuUtilization: number | null;
  gpuMemoryBytes: number | null;
}
