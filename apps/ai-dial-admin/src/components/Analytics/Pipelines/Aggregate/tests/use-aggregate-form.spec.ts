import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getTable, getTables } from '@/src/app/[lang]/pipelines/actions';
import { useAggregateForm } from '@/src/components/Analytics/Pipelines/Aggregate/use-aggregate-form';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { PipelineKind, TriggerKind } from '@/src/models/analytics/pipeline';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';
vi.mock('@/src/app/[lang]/pipelines/actions');
vi.mock('@/src/app/[lang]/evaluators/actions');
const enrichment: AnalyticsTable = {
  name: 'turn_feedback',
  type: AnalyticsTableType.Enrichment,
  source_table: 'turns',
  grain: { grain_key: 'response_id' },
  columns: [],
};
const rollupTarget: AnalyticsTable = {
  name: 'sessions',
  type: AnalyticsTableType.Source,
  columns: [{ source_name: 'client_session_id', name: 'client_session_id', type: AnalyticsFieldType.String }],
};
const systemTable: AnalyticsTable = {
  name: 'dial_usage_log',
  type: AnalyticsTableType.Source,
  columns: [],
  permissions: { write: false, modify: false },
};
const allTables = [enrichment, rollupTarget, systemTable];
const renderForm = (params?: Parameters<typeof useAggregateForm>[0]) => renderHook(() => useAggregateForm(params));
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getTables).mockResolvedValue(allTables);
  vi.mocked(getTable).mockImplementation(async (name) => allTables.find((table) => table.name === name) ?? null);
});
describe('useAggregateForm — candidate targets', () => {
  test('offers source tables rather than enrichments', async () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Aggregate } });
    await waitFor(() => expect(result.current.availableTargets.length).toBeGreaterThan(0));
    expect(result.current.availableTargets.map((table) => table.name)).toEqual(['sessions']);
  });
  test('withholds a table the caller cannot write', async () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Aggregate } });
    await waitFor(() => expect(result.current.availableTargets.length).toBeGreaterThan(0));
    expect(result.current.availableTargets.map((table) => table.name)).not.toContain('dial_usage_log');
  });
  test('withholds a target another pipeline already writes', async () => {
    const { result } = renderForm({
      initialDraft: { kind: PipelineKind.Aggregate },
      takenTargets: ['sessions'],
    });
    await waitFor(() => expect(getTables).toHaveBeenCalled());
    expect(result.current.availableTargets).toEqual([]);
  });
});
describe('useAggregateForm — validity', () => {
  const complete = {
    kind: PipelineKind.Aggregate,
    name: 'sessions_rollup',
    target: 'sessions',
    inputs: ['dial_usage_log'],
    trigger: { kind: TriggerKind.Schedule, cron: '0 3/15 * * * *' },
    group_by: [{ column: 'client_session_id' }],
    measures: [{ name: 'turn_count', fn: 'count' }],
  };
  test('accepts a complete declaration', async () => {
    const { result } = renderForm({ initialDraft: complete });
    await waitFor(() => expect(result.current.isValid).toBe(true));
  });
  test('blocks without an input', async () => {
    const { result } = renderForm({ initialDraft: { ...complete, inputs: undefined } });
    await waitFor(() => expect(result.current.isTargetResolved).toBe(true));
    expect(result.current.isValid).toBe(false);
  });
  test('blocks without a group key', async () => {
    const { result } = renderForm({ initialDraft: { ...complete, group_by: [] } });
    await waitFor(() => expect(result.current.isTargetResolved).toBe(true));
    expect(result.current.isValid).toBe(false);
  });
  test('blocks without a measure', async () => {
    const { result } = renderForm({ initialDraft: { ...complete, measures: [] } });
    await waitFor(() => expect(result.current.isTargetResolved).toBe(true));
    expect(result.current.isValid).toBe(false);
  });
  test('blocks a distinct measure that names no column', async () => {
    const { result } = renderForm({
      initialDraft: { ...complete, measures: [{ name: 'x', fn: 'count', distinct: true }] },
    });
    await waitFor(() => expect(result.current.isTargetResolved).toBe(true));
    expect(result.current.isValid).toBe(false);
  });
});
