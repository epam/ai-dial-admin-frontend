import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getTable, getTables } from '@/src/app/[lang]/pipelines/actions';
import { AggregateMode } from '@/src/components/Analytics/Pipelines/Aggregate/models';
import { useAggregateForm } from '@/src/components/Analytics/Pipelines/Aggregate/use-aggregate-form';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { PipelineKind, TriggerKind } from '@/src/models/analytics/pipeline';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';
vi.mock('@/src/app/[lang]/pipelines/actions');
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
  permissions: { get: true, read: true, sensitive: false, write: false, modify: false, rows_restricted: false },
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
    await waitFor(() => expect(result.current.isTablesLoading).toBe(false));
    expect(getTables).toHaveBeenCalled();
    expect(result.current.availableTargets).toEqual([]);
  });
});
describe('useAggregateForm — what the console still judges', () => {
  const complete = {
    kind: PipelineKind.Aggregate,
    name: 'sessions_rollup',
    target: 'sessions',
    inputs: ['dial_usage_log'],
    trigger: { kind: TriggerKind.Schedule, cron: '0 3/15 * * * *' },
    group_by: [{ column: 'client_session_id' }],
    measures: [{ name: 'turn_count', fn: 'count' }],
  };
  test('registration takes the identity and the target', async () => {
    const { result } = renderForm({ initialDraft: complete });
    await waitFor(() => expect(result.current.isRegistrationValid).toBe(true));
  });
  test('an input the author has not chosen yet is left to the service', async () => {
    const { result } = renderForm({ initialDraft: { ...complete, inputs: undefined } });
    await waitFor(() => expect(result.current.isTargetResolved).toBe(true));
    expect(result.current.isRegistrationValid).toBe(true);
    expect(result.current.hasDistinctWithoutColumn).toBe(false);
  });
  test('a declaration with no measure is not withheld either', async () => {
    const { result } = renderForm({ initialDraft: { ...complete, measures: [] } });
    await waitFor(() => expect(result.current.isTargetResolved).toBe(true));
    expect(result.current.hasDistinctWithoutColumn).toBe(false);
  });
  test('a distinct measure that names no column is reported', async () => {
    const { result } = renderForm({
      initialDraft: { ...complete, measures: [{ name: 'x', fn: 'count', distinct: true }] },
    });
    await waitFor(() => expect(result.current.isTargetResolved).toBe(true));
    expect(result.current.hasDistinctWithoutColumn).toBe(true);
  });
});
describe('useAggregateForm — declaration mode', () => {
  const formDraft = {
    kind: PipelineKind.Aggregate,
    name: 'sessions_rollup',
    target: 'sessions',
    group_by: [{ column: 'client_session_id' }],
    measures: [{ name: 'turn_count', fn: 'count' }],
    filter: "client_session_id <> ''",
  };
  const sqlDraft = {
    kind: PipelineKind.Aggregate,
    name: 'sessions_rollup',
    target: 'sessions',
    sql: 'INSERT INTO sessions (a) SELECT 1',
  };
  test('a draft with no statement is in Form mode', () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Aggregate } });
    expect(result.current.mode).toBe(AggregateMode.Form);
  });
  test('a draft carrying a statement is in SQL mode, even a blank one', () => {
    expect(renderForm({ initialDraft: sqlDraft }).result.current.mode).toBe(AggregateMode.Sql);
    expect(renderForm({ initialDraft: { ...sqlDraft, sql: '' } }).result.current.mode).toBe(AggregateMode.Sql);
  });
  test('leaving an empty Form mode switches without asking and starts an empty statement', () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Aggregate } });
    act(() => result.current.onModeChange(AggregateMode.Sql));
    expect(result.current.isModeChangePending).toBe(false);
    expect(result.current.mode).toBe(AggregateMode.Sql);
    expect(result.current.draft.sql).toBe('');
  });
  test('leaving a Form mode that holds content asks first and keeps everything until confirmed', () => {
    const { result } = renderForm({ initialDraft: formDraft });
    act(() => result.current.onModeChange(AggregateMode.Sql));
    expect(result.current.isModeChangePending).toBe(true);
    expect(result.current.mode).toBe(AggregateMode.Form);
    expect(result.current.draft.measures).toEqual(formDraft.measures);
  });
  test('confirming discards the form members and the filter', () => {
    const { result } = renderForm({ initialDraft: formDraft });
    act(() => result.current.onModeChange(AggregateMode.Sql));
    act(() => result.current.onConfirmModeChange());
    expect(result.current.isModeChangePending).toBe(false);
    expect(result.current.mode).toBe(AggregateMode.Sql);
    expect(result.current.draft.sql).toBe('');
    ['group_by', 'measures', 'filter'].forEach((key) =>
      expect(result.current.draft[key as keyof typeof formDraft]).toBeUndefined(),
    );
  });
  test('cancelling leaves the mode and the content as they were', () => {
    const { result } = renderForm({ initialDraft: formDraft });
    act(() => result.current.onModeChange(AggregateMode.Sql));
    act(() => result.current.onCancelModeChange());
    expect(result.current.isModeChangePending).toBe(false);
    expect(result.current.mode).toBe(AggregateMode.Form);
    expect(result.current.draft.measures).toEqual(formDraft.measures);
  });
  test('leaving a SQL mode that holds a statement asks, and confirming drops the statement', () => {
    const { result } = renderForm({ initialDraft: sqlDraft });
    act(() => result.current.onModeChange(AggregateMode.Form));
    expect(result.current.isModeChangePending).toBe(true);
    act(() => result.current.onConfirmModeChange());
    expect(result.current.mode).toBe(AggregateMode.Form);
    expect(result.current.draft.sql).toBeUndefined();
  });
  test('a blank statement counts as empty when leaving SQL mode', () => {
    const { result } = renderForm({ initialDraft: { ...sqlDraft, sql: '  ' } });
    act(() => result.current.onModeChange(AggregateMode.Form));
    expect(result.current.isModeChangePending).toBe(false);
    expect(result.current.mode).toBe(AggregateMode.Form);
  });
  test('choosing the active mode changes nothing', () => {
    const { result } = renderForm({ initialDraft: formDraft });
    act(() => result.current.onModeChange(AggregateMode.Form));
    expect(result.current.isModeChangePending).toBe(false);
  });
  test('SQL mode is not withheld for want of a measure', async () => {
    const { result } = renderForm({ initialDraft: sqlDraft });
    await waitFor(() => expect(result.current.isTargetResolved).toBe(true));
    expect(result.current.hasFieldErrors).toBe(false);
  });
});
