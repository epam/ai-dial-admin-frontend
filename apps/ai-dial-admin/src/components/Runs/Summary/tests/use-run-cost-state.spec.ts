import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { COST_AGGREGATION_STALE_AFTER_MS } from '@/src/constants/runs';
import { DeploymentType } from '@/src/models/evaluation/deployment';
import { Run, RunStatus } from '@/src/models/evaluation/run';
import { SuiteType } from '@/src/models/evaluation/test-suite';
import { useRunCostState } from '../use-run-cost-state';

const getRunsTotalCostsMock = vi.fn();
const getPlatformModelMock = vi.fn();
const getEntityModelMock = vi.fn();

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  getRunsTotalCosts: (ids: string[]) => getRunsTotalCostsMock(ids),
}));
vi.mock('@/src/app/[lang]/platform-models/actions', () => ({
  getModel: (...args: unknown[]) => getPlatformModelMock(...args),
}));
vi.mock('@/src/app/[lang]/models/actions', () => ({
  getModel: (...args: unknown[]) => getEntityModelMock(...args),
}));

const totals = (testCaseCost: number | null, metricEvalCost: number | null) => [
  { runId: 'run-1', totalCost: (testCaseCost ?? 0) + (metricEvalCost ?? 0), testCaseCost, metricEvalCost },
];

const COMPLETED_RUN: Run = {
  id: 'run-1',
  status: RunStatus.COMPLETED,
  completedAt: Date.now(),
  suiteSnapshot: {
    suiteType: SuiteType.Deployment,
    deploymentRef: { id: 'app', name: 'app', type: DeploymentType.Application },
  },
};

const renderState = (run: Run | null, params: { hasNoResults?: boolean; metricSnapshotCount?: number } = {}) =>
  renderHook(() => useRunCostState({ run, hasNoResults: params.hasNoResults ?? false, ...params }));

describe('useRunCostState', () => {
  beforeEach(() => {
    getRunsTotalCostsMock.mockReset();
    getPlatformModelMock.mockReset();
    getEntityModelMock.mockReset();
    getPlatformModelMock.mockResolvedValue(null);
    getEntityModelMock.mockResolvedValue(null);
  });

  test('exposes the total and both parts once the totals settle', async () => {
    getRunsTotalCostsMock.mockResolvedValue(totals(0.42, 0.08));

    const { result } = renderState(COMPLETED_RUN, { metricSnapshotCount: 2 });
    expect(result.current.isPending).toBe(true);

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.sourceCost).toBe(0.42);
    expect(result.current.metricsCost).toBe(0.08);
    expect(result.current.totalCost).toBeCloseTo(0.5);
    expect(result.current.hasError).toBe(false);
  });

  test('keeps the total and source when only the metrics cost is absent', async () => {
    getRunsTotalCostsMock.mockResolvedValue(totals(0.42, null));

    const { result } = renderState(COMPLETED_RUN, { metricSnapshotCount: 2 });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.totalCost).toBe(0.42);
    expect(result.current.metricsCost).toBeNull();
    expect(result.current.hasError).toBe(false);
  });

  test('settles the Metrics value immediately for a run with zero metrics while the card is pending', () => {
    getRunsTotalCostsMock.mockReturnValue(new Promise(() => undefined));

    const { result } = renderState(COMPLETED_RUN, { metricSnapshotCount: 0 });

    expect(result.current.isPending).toBe(true);
    expect(result.current.isMetricsPending).toBe(false);
  });

  test('keeps the Metrics value pending while the metric count is unknown', () => {
    getRunsTotalCostsMock.mockReturnValue(new Promise(() => undefined));

    const { result } = renderState(COMPLETED_RUN);

    expect(result.current.isMetricsPending).toBe(true);
  });

  test('does not fetch for a run that is still running', () => {
    const { result } = renderState({ ...COMPLETED_RUN, status: RunStatus.RUNNING });

    expect(getRunsTotalCostsMock).not.toHaveBeenCalled();
    expect(result.current.isPending).toBe(false);
    expect(result.current.totalCost).toBeNull();
    expect(result.current.hasError).toBe(false);
  });

  test.each([SuiteType.McpTool, SuiteType.Route])('does not fetch for a %s suite', (suiteType) => {
    const { result } = renderState({ ...COMPLETED_RUN, suiteSnapshot: { suiteType } });

    expect(getRunsTotalCostsMock).not.toHaveBeenCalled();
    expect(result.current.isPending).toBe(false);
  });

  test('does not keep waiting once the model is confirmed to have no pricing', async () => {
    getRunsTotalCostsMock.mockReturnValue(new Promise(() => undefined));
    getPlatformModelMock.mockResolvedValue({ response: { name: 'gpt-unpriced', pricing: undefined } });
    const modelRun: Run = {
      ...COMPLETED_RUN,
      suiteSnapshot: {
        suiteType: SuiteType.Deployment,
        deploymentRef: { id: 'm', name: 'm', type: DeploymentType.Model },
      },
    };

    const { result } = renderState(modelRun);

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.totalCost).toBeNull();
  });

  test('reads a long-completed run once and settles on a figureless payload', async () => {
    getRunsTotalCostsMock.mockResolvedValue(totals(null, null));
    const staleRun: Run = { ...COMPLETED_RUN, completedAt: Date.now() - COST_AGGREGATION_STALE_AFTER_MS - 1 };

    const { result } = renderState(staleRun);

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(getRunsTotalCostsMock).toHaveBeenCalledOnce();
    expect(result.current.totalCost).toBeNull();
    expect(result.current.hasError).toBe(false);
  });

  test('reports an endpoint error on a completed run', async () => {
    getRunsTotalCostsMock.mockResolvedValue(null);

    const { result } = renderState(COMPLETED_RUN);

    await waitFor(() => expect(result.current.hasError).toBe(true));
    expect(result.current.isPending).toBe(false);
  });

  test('reports an error for a completed run with no results and no cost figures', async () => {
    getRunsTotalCostsMock.mockResolvedValue(totals(null, null));
    const staleRun: Run = { ...COMPLETED_RUN, completedAt: Date.now() - COST_AGGREGATION_STALE_AFTER_MS - 1 };

    const { result } = renderState(staleRun, { hasNoResults: true });

    await waitFor(() => expect(result.current.hasError).toBe(true));
  });

  test('never errors an incomplete run, even on an endpoint error', async () => {
    getRunsTotalCostsMock.mockResolvedValue(null);

    const { result } = renderState({ ...COMPLETED_RUN, status: RunStatus.CANCELLED }, { hasNoResults: true });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.hasError).toBe(false);
  });
});
