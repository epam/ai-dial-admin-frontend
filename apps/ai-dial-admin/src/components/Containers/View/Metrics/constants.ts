import {
  MetricCardConfig,
  MetricCardKind,
  MetricsSectionConfig,
  SectionWidth,
} from '@/src/components/Containers/View/Metrics/models';
import {
  errorRatioStatus,
  formatMemoryBytes,
  kvCacheStatus,
  replicaStatus,
  sumPodValue,
} from '@/src/components/Containers/View/Metrics/utils';
import { DeploymentMetrics, PodResourceUsage } from '@/src/models/deployments/metrics';
import { DeploymentMetricsI18nKey } from '@/src/constants/i18n';
import { INFERENCE_TASK } from '@/src/types/deployments/containers';

// Gauge matrix (issue #3895): cards without `tasks` are universal; vLLM-sourced gauges are
// generation-only; request latency is classification-only (generation reads E2E + TTFT/ITL instead).
const GENERATION_ONLY: INFERENCE_TASK[] = [INFERENCE_TASK.TEXT_GENERATION];
const CLASSIFICATION_ONLY: INFERENCE_TASK[] = [INFERENCE_TASK.TEXT_CLASSIFICATION];

// A memory card: sums a per-pod byte field and renders it in the most readable unit (Mb/Gb/…).
const memoryCard = (
  labelKey: DeploymentMetricsI18nKey,
  pick: (pod: PodResourceUsage) => number | null,
): MetricCardConfig => ({
  kind: MetricCardKind.Single,
  labelKey,
  getValue: (m: DeploymentMetrics) => formatMemoryBytes(sumPodValue(m, pick))?.value ?? null,
  getUnit: (m: DeploymentMetrics) => formatMemoryBytes(sumPodValue(m, pick))?.unit,
});

// --- Scale & Health ---
const REPLICAS_CARD: MetricCardConfig = {
  kind: MetricCardKind.Ratio,
  labelKey: DeploymentMetricsI18nKey.ReadyReplicas,
  getNumerator: (m) => m.resources?.replicas?.ready ?? null,
  getDenominator: (m) => m.resources?.replicas?.total ?? null,
  getStatus: (ready, total) => replicaStatus(ready, total),
};
// Inference-only — value rendered as a percentage.
const ERROR_RATIO_CARD: MetricCardConfig = {
  kind: MetricCardKind.Single,
  tasks: GENERATION_ONLY,
  labelKey: DeploymentMetricsI18nKey.RequestErrorRatio,
  unit: '%',
  getValue: (m) => {
    const ratio = m.operational?.requestErrorRatio;
    return ratio === null || ratio === undefined ? null : Math.round(ratio * 1000) / 10;
  },
  getStatus: (percent) => errorRatioStatus(percent),
};

// --- Compute ---
const CPU_CARD: MetricCardConfig = {
  kind: MetricCardKind.Single,
  labelKey: DeploymentMetricsI18nKey.Cpu,
  unit: 'm',
  getValue: (m) => sumPodValue(m, (p) => p.cpuMillicores),
};
const MEMORY_CARD = memoryCard(DeploymentMetricsI18nKey.Memory, (p) => p.memoryBytes);
// Inference-only (GPU placeholder until DCGM).
const GPU_MEMORY_CARD = memoryCard(DeploymentMetricsI18nKey.GpuMemory, (p) => p.gpuMemoryBytes);

export const SCALE_HEALTH_BASE_CARDS: MetricCardConfig[] = [REPLICAS_CARD];
export const SCALE_HEALTH_INFERENCE_CARDS: MetricCardConfig[] = [ERROR_RATIO_CARD];
export const COMPUTE_BASE_CARDS: MetricCardConfig[] = [CPU_CARD, MEMORY_CARD];
export const COMPUTE_INFERENCE_CARDS: MetricCardConfig[] = [GPU_MEMORY_CARD];

export const SCALE_HEALTH_TITLE = DeploymentMetricsI18nKey.SectionScaleHealth;
export const COMPUTE_TITLE = DeploymentMetricsI18nKey.SectionCompute;

// --- Latency (inference) — distribution cards (p50/p95/p99) ---
export const LATENCY_SECTION: MetricsSectionConfig = {
  titleKey: DeploymentMetricsI18nKey.SectionLatency,
  cards: [
    {
      kind: MetricCardKind.Distribution,
      tasks: GENERATION_ONLY,
      labelKey: DeploymentMetricsI18nKey.Ttft,
      unit: 's',
      getDistribution: (m) => m.serving?.ttft ?? null,
    },
    {
      kind: MetricCardKind.Distribution,
      tasks: GENERATION_ONLY,
      labelKey: DeploymentMetricsI18nKey.InterTokenLatency,
      unit: 's',
      getDistribution: (m) => m.serving?.interTokenLatency ?? null,
    },
    {
      kind: MetricCardKind.Distribution,
      labelKey: DeploymentMetricsI18nKey.E2eLatencyMean,
      unit: 's',
      getDistribution: (m) => m.operational?.e2eLatency ?? null,
    },
    {
      kind: MetricCardKind.Distribution,
      tasks: CLASSIFICATION_ONLY,
      labelKey: DeploymentMetricsI18nKey.RequestLatency,
      unit: 's',
      getDistribution: (m) => m.serving?.requestLatency ?? null,
    },
  ],
};

// --- Throughput (inference) ---
export const THROUGHPUT_SECTION: MetricsSectionConfig = {
  titleKey: DeploymentMetricsI18nKey.SectionThroughput,
  width: SectionWidth.Half,
  cards: [
    {
      kind: MetricCardKind.Dual,
      tasks: GENERATION_ONLY,
      labelKey: DeploymentMetricsI18nKey.TokensPerSecond,
      unit: 'tok/s',
      primaryLabelKey: DeploymentMetricsI18nKey.Prompt,
      secondaryLabelKey: DeploymentMetricsI18nKey.Generation,
      getPrimary: (m) => m.serving?.tokensPerSecond?.prompt ?? null,
      getSecondary: (m) => m.serving?.tokensPerSecond?.generation ?? null,
    },
    {
      kind: MetricCardKind.Single,
      labelKey: DeploymentMetricsI18nKey.RequestsPerSecond,
      unit: 'req/s',
      getValue: (m) => m.serving?.requestsPerSecond ?? null,
    },
  ],
};

// --- Load (inference) ---
export const LOAD_SECTION: MetricsSectionConfig = {
  titleKey: DeploymentMetricsI18nKey.SectionLoad,
  cards: [
    {
      kind: MetricCardKind.Single,
      tasks: GENERATION_ONLY,
      labelKey: DeploymentMetricsI18nKey.RunningRequests,
      getValue: (m) => m.serving?.runningRequests ?? null,
    },
    {
      kind: MetricCardKind.Single,
      tasks: GENERATION_ONLY,
      labelKey: DeploymentMetricsI18nKey.QueueDepth,
      getValue: (m) => m.serving?.queueDepth ?? null,
    },
    {
      kind: MetricCardKind.Gauge,
      tasks: GENERATION_ONLY,
      labelKey: DeploymentMetricsI18nKey.KvCacheUsage,
      getValue: (m) => m.serving?.kvCacheUsage ?? null,
      thresholds: { warn: 0.7, crit: 0.9 },
      getStatus: (v) => kvCacheStatus(v),
    },
  ],
};
