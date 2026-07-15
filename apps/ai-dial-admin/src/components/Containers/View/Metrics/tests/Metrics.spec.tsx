import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import Metrics from '@/src/components/Containers/View/Metrics/Metrics';
import { BasicI18nKey, ButtonsI18nKey, DeploymentMetricsI18nKey } from '@/src/constants/i18n';
import { DeploymentMetrics } from '@/src/models/deployments/metrics';
import { INFERENCE_TASK } from '@/src/types/deployments/containers';
import { MetricsBlockKey } from '@/src/types/deployments/metrics';
import { ApplicationRoute } from '@/src/types/routes';

const { getContainerMetricsMock } = vi.hoisted(() => ({ getContainerMetricsMock: vi.fn() }));

vi.mock('@/src/app/actions/deployments', () => ({
  getContainerMetrics: getContainerMetricsMock,
}));

const inferenceSnapshot = (): DeploymentMetrics =>
  ({
    collectedAt: '2026-06-12T00:00:00Z',
    engine: 'VLLM',
    scrapedPod: 'pod-1',
    window: 'lifetime',
    availability: {
      [MetricsBlockKey.Serving]: { available: true },
      [MetricsBlockKey.Operational]: { available: true },
      [MetricsBlockKey.Resources]: { available: true },
    },
    serving: {
      ttft: null,
      interTokenLatency: null,
      tokensPerSecond: { prompt: 100, generation: 50 },
      queueDepth: 2,
      runningRequests: 5,
      kvCacheUsage: 0.4,
      requestLatency: null,
      requestsPerSecond: null,
    },
    operational: { requestErrorRatio: 0, e2eLatency: { mean: 1.2, p50: 1.1, p95: 2, p99: 3, count: 10 } },
    resources: {
      replicas: { total: 1, ready: 1 },
      pods: [{ name: 'pod-1', cpuMillicores: 200, memoryBytes: 1000, gpuUtilization: null, gpuMemoryBytes: null }],
    },
    rawCounters: {},
  }) as DeploymentMetrics;

const nonInferenceSnapshot = (): DeploymentMetrics =>
  ({
    collectedAt: '2026-06-12T00:00:00Z',
    engine: 'UNKNOWN',
    scrapedPod: null,
    window: null,
    availability: {
      [MetricsBlockKey.Serving]: { available: false, reason: 'not inference' },
      [MetricsBlockKey.Operational]: { available: false, reason: 'not inference' },
      [MetricsBlockKey.Resources]: { available: true },
    },
    serving: null,
    operational: null,
    resources: { replicas: { total: 2, ready: 2 }, pods: [] },
    rawCounters: null,
  }) as DeploymentMetrics;

describe('Metrics', () => {
  beforeEach(() => {
    getContainerMetricsMock.mockReset();
  });

  test('shows all metric sections for a Model Serving', async () => {
    getContainerMetricsMock.mockResolvedValue(inferenceSnapshot());
    render(<Metrics containerId="c1" route={ApplicationRoute.ModelServings} />);

    expect(await screen.findByText(DeploymentMetricsI18nKey.SectionScaleHealth)).toBeInTheDocument();
    expect(await screen.findByText(DeploymentMetricsI18nKey.SectionCompute)).toBeInTheDocument();
    expect(await screen.findByText(DeploymentMetricsI18nKey.SectionLatency)).toBeInTheDocument();
    expect(await screen.findByText(DeploymentMetricsI18nKey.SectionThroughput)).toBeInTheDocument();
    expect(await screen.findByText(DeploymentMetricsI18nKey.SectionLoad)).toBeInTheDocument();
    expect(screen.getByText(DeploymentMetricsI18nKey.GpuMemory)).toBeInTheDocument();
    expect(screen.getByText(DeploymentMetricsI18nKey.RequestErrorRatio)).toBeInTheDocument();
  });

  test('shows only Scale & Health + Compute base cards (no inference sections/cards) on a non-inference view', async () => {
    getContainerMetricsMock.mockResolvedValue(nonInferenceSnapshot());
    render(<Metrics containerId="c1" route={ApplicationRoute.McpContainers} />);

    expect(await screen.findByText(DeploymentMetricsI18nKey.SectionScaleHealth)).toBeInTheDocument();
    expect(await screen.findByText(DeploymentMetricsI18nKey.SectionCompute)).toBeInTheDocument();
    await waitFor(() => expect(getContainerMetricsMock).toHaveBeenCalled());
    expect(screen.queryByText(DeploymentMetricsI18nKey.SectionLatency)).not.toBeInTheDocument();
    expect(screen.queryByText(DeploymentMetricsI18nKey.SectionThroughput)).not.toBeInTheDocument();
    expect(screen.queryByText(DeploymentMetricsI18nKey.SectionLoad)).not.toBeInTheDocument();
    expect(screen.queryByText(DeploymentMetricsI18nKey.GpuMemory)).not.toBeInTheDocument();
    expect(screen.queryByText(DeploymentMetricsI18nKey.RequestErrorRatio)).not.toBeInTheDocument();
  });

  test('text classification hides generation-only gauges and the Load section', async () => {
    getContainerMetricsMock.mockResolvedValue(inferenceSnapshot());
    render(
      <Metrics
        containerId="c1"
        route={ApplicationRoute.ModelServings}
        inferenceTask={INFERENCE_TASK.TEXT_CLASSIFICATION}
      />,
    );

    // Universal + classification cards stay.
    expect(await screen.findByText(DeploymentMetricsI18nKey.ReadyReplicas)).toBeInTheDocument();
    expect(screen.getByText(DeploymentMetricsI18nKey.RequestsPerSecond)).toBeInTheDocument();
    expect(screen.getByText(DeploymentMetricsI18nKey.RequestLatency)).toBeInTheDocument();
    expect(screen.getByText(DeploymentMetricsI18nKey.E2eLatencyMean)).toBeInTheDocument();
    expect(screen.getByText(DeploymentMetricsI18nKey.GpuMemory)).toBeInTheDocument();
    // Generation-only gauges are gone, and Load (all generation-only) drops with its title.
    expect(screen.queryByText(DeploymentMetricsI18nKey.RequestErrorRatio)).not.toBeInTheDocument();
    expect(screen.queryByText(DeploymentMetricsI18nKey.TokensPerSecond)).not.toBeInTheDocument();
    expect(screen.queryByText(DeploymentMetricsI18nKey.Ttft)).not.toBeInTheDocument();
    expect(screen.queryByText(DeploymentMetricsI18nKey.InterTokenLatency)).not.toBeInTheDocument();
    expect(screen.queryByText(DeploymentMetricsI18nKey.SectionLoad)).not.toBeInTheDocument();
    expect(screen.queryByText(DeploymentMetricsI18nKey.RunningRequests)).not.toBeInTheDocument();
    expect(screen.queryByText(DeploymentMetricsI18nKey.QueueDepth)).not.toBeInTheDocument();
    expect(screen.queryByText(DeploymentMetricsI18nKey.KvCacheUsage)).not.toBeInTheDocument();
  });

  test('text generation hides the request latency card but keeps generation gauges', async () => {
    getContainerMetricsMock.mockResolvedValue(inferenceSnapshot());
    render(
      <Metrics
        containerId="c1"
        route={ApplicationRoute.ModelServings}
        inferenceTask={INFERENCE_TASK.TEXT_GENERATION}
      />,
    );

    expect(await screen.findByText(DeploymentMetricsI18nKey.SectionLoad)).toBeInTheDocument();
    expect(screen.getByText(DeploymentMetricsI18nKey.Ttft)).toBeInTheDocument();
    expect(screen.getByText(DeploymentMetricsI18nKey.InterTokenLatency)).toBeInTheDocument();
    expect(screen.getByText(DeploymentMetricsI18nKey.E2eLatencyMean)).toBeInTheDocument();
    expect(screen.getByText(DeploymentMetricsI18nKey.RequestErrorRatio)).toBeInTheDocument();
    expect(screen.getByText(DeploymentMetricsI18nKey.TokensPerSecond)).toBeInTheDocument();
    expect(screen.getByText(DeploymentMetricsI18nKey.KvCacheUsage)).toBeInTheDocument();
    expect(screen.queryByText(DeploymentMetricsI18nKey.RequestLatency)).not.toBeInTheDocument();
  });

  test('a NONE inference task keeps the full card set', async () => {
    getContainerMetricsMock.mockResolvedValue(inferenceSnapshot());
    render(<Metrics containerId="c1" route={ApplicationRoute.ModelServings} inferenceTask={INFERENCE_TASK.NONE} />);

    expect(await screen.findByText(DeploymentMetricsI18nKey.SectionLoad)).toBeInTheDocument();
    expect(screen.getByText(DeploymentMetricsI18nKey.RequestLatency)).toBeInTheDocument();
    expect(screen.getByText(DeploymentMetricsI18nKey.Ttft)).toBeInTheDocument();
    expect(screen.getByText(DeploymentMetricsI18nKey.RequestErrorRatio)).toBeInTheDocument();
    expect(screen.getByText(DeploymentMetricsI18nKey.TokensPerSecond)).toBeInTheDocument();
  });

  test('task filtering does not affect non-Model-Serving routes', async () => {
    getContainerMetricsMock.mockResolvedValue(nonInferenceSnapshot());
    render(
      <Metrics
        containerId="c1"
        route={ApplicationRoute.McpContainers}
        inferenceTask={INFERENCE_TASK.TEXT_GENERATION}
      />,
    );

    expect(await screen.findByText(DeploymentMetricsI18nKey.SectionScaleHealth)).toBeInTheDocument();
    expect(screen.getByText(DeploymentMetricsI18nKey.SectionCompute)).toBeInTheDocument();
    expect(screen.queryByText(DeploymentMetricsI18nKey.SectionLatency)).not.toBeInTheDocument();
    expect(screen.queryByText(DeploymentMetricsI18nKey.SectionLoad)).not.toBeInTheDocument();
  });

  test('renders No Data for a null metric value', async () => {
    getContainerMetricsMock.mockResolvedValue(inferenceSnapshot());
    render(<Metrics containerId="c1" route={ApplicationRoute.ModelServings} />);

    // ttft is null in the snapshot → at least one No Data card.
    expect(await screen.findAllByText(BasicI18nKey.NoData)).not.toHaveLength(0);
  });

  test('stops loading and stays usable when the request throws', async () => {
    getContainerMetricsMock.mockRejectedValue(new Error('network down'));
    render(<Metrics containerId="c1" route={ApplicationRoute.ModelServings} />);

    await waitFor(() => expect(getContainerMetricsMock).toHaveBeenCalled());
    // Loading reset → Refresh button is not stuck disabled, and cards fall back to No Data.
    const refresh = await screen.findByRole('button', { name: ButtonsI18nKey.Refresh });
    await waitFor(() => expect(refresh).not.toBeDisabled());
    expect((await screen.findAllByText(BasicI18nKey.NoData)).length).toBeGreaterThan(0);
  });

  test('Refresh re-fetches the snapshot', async () => {
    const user = userEvent.setup();
    getContainerMetricsMock.mockResolvedValue(nonInferenceSnapshot());
    render(<Metrics containerId="c1" route={ApplicationRoute.McpContainers} />);

    await waitFor(() => expect(getContainerMetricsMock).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Refresh }));
    await waitFor(() => expect(getContainerMetricsMock).toHaveBeenCalledTimes(2));
  });
});
