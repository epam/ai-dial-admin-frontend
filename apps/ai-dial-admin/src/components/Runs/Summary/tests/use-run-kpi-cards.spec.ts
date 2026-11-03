import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { RunsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { DeploymentType } from '@/src/models/evaluation/deployment';
import { Run, RunStatus } from '@/src/models/evaluation/run';
import { StructuredQuery } from '@/src/models/evaluation/structured-query';
import { useRunKpiCards } from '../use-run-kpi-cards';

const executeStructuredQueryMock = vi.fn();
const getRunsTotalCostsMock = vi.fn();
const getPlatformModelMock = vi.fn();
const getEntityModelMock = vi.fn();

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  executeStructuredQuery: (query: StructuredQuery) => executeStructuredQueryMock(query),
  getRunsTotalCosts: (ids: string[]) => getRunsTotalCostsMock(ids),
}));
vi.mock('@/src/app/[lang]/platform-models/actions', () => ({
  getModel: (...args: unknown[]) => getPlatformModelMock(...args),
}));
vi.mock('@/src/app/[lang]/models/actions', () => ({
  getModel: (...args: unknown[]) => getEntityModelMock(...args),
}));

const STATUS_ROWS = {
  rows: [
    { execution_status: 'SUCCESS', passed: true, count: 37 },
    { execution_status: 'SUCCESS', passed: false, count: 3 },
    { execution_status: 'ERROR', passed: null, count: 3 },
  ],
};

const buildRun = (overrides: Partial<Run> = {}): Run => ({
  id: 'run-1',
  status: RunStatus.COMPLETED,
  completedAt: 1,
  suiteSnapshot: {
    overallScoreThreshold: 0.5,
    deploymentRef: { id: 'gpt-4', name: 'gpt-4', type: DeploymentType.Model },
  },
  ...overrides,
});

const mockQueries = (status: unknown = STATUS_ROWS, runTime: unknown = { rows: [{ total_duration_ms: 341000 }] }) => {
  executeStructuredQueryMock.mockImplementation((query: StructuredQuery) => {
    if (query.group_by) {
      return Promise.resolve(status);
    }
    const alias = query.select?.[0]?.as;
    if (alias === 'total_duration_ms') {
      return Promise.resolve(runTime);
    }
    return Promise.resolve({ rows: [] });
  });
};

const renderKpis = (run: Run) => renderHook(() => useRunKpiCards({ run, metricSnapshotCount: 2 }));

describe('useRunKpiCards', () => {
  beforeEach(() => {
    executeStructuredQueryMock.mockReset();
    getRunsTotalCostsMock.mockReset();
    getPlatformModelMock.mockReset();
    getEntityModelMock.mockReset();
    getPlatformModelMock.mockResolvedValue({ response: { name: 'gpt-4', pricing: { prompt: '0.001' } } });
    getEntityModelMock.mockResolvedValue(null);
    getRunsTotalCostsMock.mockResolvedValue([{ runId: 'run-1', totalCost: 1, testCaseCost: 1, metricEvalCost: 0 }]);
    mockQueries();
  });

  test('is null until the run analytics have loaded', async () => {
    const { result } = renderKpis(buildRun());

    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current).not.toBeNull());
  });

  test('derives the figures from the status counts and the runtime parts', async () => {
    const { result } = renderKpis(buildRun());

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current?.figures.breakdown).toEqual({ total: 43, completed: 40, above: 37, below: 3, errorOrNa: 3 });
    expect(result.current?.figures.threshold).toBe(0.5);
    expect(result.current?.figures.totalMs).toBe(341000);
  });

  test('titles the rate card by whether the snapshot has a threshold', async () => {
    const withThreshold = renderKpis(buildRun());
    const withoutThreshold = renderKpis(buildRun({ suiteSnapshot: {} }));

    await waitFor(() => expect(withThreshold.result.current).not.toBeNull());
    await waitFor(() => expect(withoutThreshold.result.current).not.toBeNull());
    expect(withThreshold.result.current?.rateTitleKey).toBe(RunsI18nKey.ThresholdPassRate);
    expect(withoutThreshold.result.current?.rateTitleKey).toBe(RunsI18nKey.CompletionRate);
  });

  test('names the source by the deployment kind and falls back to a generic label', async () => {
    const modelRun = renderKpis(buildRun());
    const unknownRun = renderKpis(buildRun({ suiteSnapshot: {} }));

    await waitFor(() => expect(modelRun.result.current).not.toBeNull());
    await waitFor(() => expect(unknownRun.result.current).not.toBeNull());
    expect(modelRun.result.current?.sourceLabel).toBe('Model');
    expect(unknownRun.result.current?.sourceLabel).toBe(TestSuitesI18nKey.TrendsSourceFallback);
  });

  test('flags a completed run with no results as Error on the data cards', async () => {
    mockQueries({ rows: [] }, { rows: [] });

    const { result } = renderKpis(buildRun());

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current?.hasNoTestCases).toBe(true);
    expect(result.current?.hasRuntimeError).toBe(true);
  });

  test('never flags an incomplete run as Error', async () => {
    mockQueries({ rows: [] }, { rows: [] });

    const { result } = renderKpis(buildRun({ status: RunStatus.CANCELLED }));

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current?.hasNoTestCases).toBe(false);
    expect(result.current?.hasRuntimeError).toBe(false);
  });

  test('exposes the run cost state', async () => {
    const { result } = renderKpis(buildRun());

    await waitFor(() => expect(result.current?.cost.isPending).toBe(false));
    expect(result.current?.cost.totalCost).toBe(1);
  });
});
