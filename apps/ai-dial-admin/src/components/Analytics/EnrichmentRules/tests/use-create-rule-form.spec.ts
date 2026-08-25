import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getEvaluator, getEvaluatorVersion, getTable, getTables } from '@/src/app/[lang]/enrichment-rules/actions';
import { useCreateRuleForm } from '@/src/components/Analytics/EnrichmentRules/use-create-rule-form';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { Evaluator, EvaluatorType } from '@/src/models/analytics/evaluator';
import { TriggerKind } from '@/src/models/analytics/rule';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';

vi.mock('@/src/app/[lang]/enrichment-rules/actions');

const sqlEvaluator: Evaluator = {
  name: 'feedback-rollup',
  version: 2,
  type: EvaluatorType.Sql,
  output_vars: [{ name: 'rate_event_count', type: 'long' }],
};

const llmEvaluator: Evaluator = {
  name: 'conversation-insights',
  version: 4,
  type: EvaluatorType.Llm,
  output_vars: [{ name: 'title', type: 'string' }],
};

const enrichment: AnalyticsTable = {
  name: 'turn_feedback',
  type: AnalyticsTableType.Enrichment,
  grain: { grain_key: 'response_id' },
  columns: [{ source_name: 'rate_event_count', name: 'rate_event_count', type: AnalyticsFieldType.Long }],
};

const otherEnrichment: AnalyticsTable = {
  name: 'conversation_insights',
  type: AnalyticsTableType.Enrichment,
  grain: { grain_key: 'chat_id' },
  columns: [{ source_name: 'title', name: 'title', type: AnalyticsFieldType.String }],
};

const sourceTable: AnalyticsTable = { name: 'dial_usage_log', type: AnalyticsTableType.Source };

const renderForm = (takenTargets: string[] = []) => renderHook(() => useCreateRuleForm(takenTargets));

const fillRequired = async (result: { current: ReturnType<typeof useCreateRuleForm> }) => {
  act(() => result.current.setField('name', 'my-rule'));
  act(() => result.current.setField('evaluatorName', 'feedback-rollup'));
  act(() => result.current.setField('targetEnrichment', 'turn_feedback'));
  act(() => result.current.setField('triggerKind', TriggerKind.OnIngest));
  act(() => result.current.setField('enabled', true));
  await waitFor(() => expect(result.current.columns).toHaveLength(1));
};

const bindOutput = (result: { current: ReturnType<typeof useCreateRuleForm> }, column: string, varName: string) =>
  act(() => result.current.setField('bindings', [{ id: 'row-1', column, var: varName }]));

describe('useCreateRuleForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTables).mockResolvedValue([enrichment, otherEnrichment, sourceTable]);
    vi.mocked(getTable).mockImplementation(
      async (name) => [enrichment, otherEnrichment, sourceTable].find((table) => table.name === name) ?? null,
    );
    vi.mocked(getEvaluator).mockResolvedValue(sqlEvaluator);
    vi.mocked(getEvaluatorVersion).mockResolvedValue({ ...sqlEvaluator, version: 1 });
  });

  test('offers only enrichment tables as targets', async () => {
    const { result } = renderForm();

    await waitFor(() => expect(result.current.availableTargets).toHaveLength(2));
    expect(result.current.availableTargets.map((table) => table.name)).toEqual([
      'turn_feedback',
      'conversation_insights',
    ]);
  });

  test('withholds an enrichment that already has a rule', async () => {
    const { result } = renderForm(['turn_feedback']);

    await waitFor(() => expect(result.current.availableTargets).toHaveLength(1));
    expect(result.current.availableTargets[0].name).toBe('conversation_insights');
  });

  test('resolves the evaluator definition when one is selected', async () => {
    const { result } = renderForm();

    act(() => result.current.setField('evaluatorName', 'feedback-rollup'));

    await waitFor(() => expect(result.current.outputVars).toHaveLength(1));
    expect(getEvaluator).toHaveBeenCalledWith('feedback-rollup');
  });

  test('reads the pinned version when the version is no longer latest', async () => {
    const { result } = renderForm();

    act(() => result.current.setField('evaluatorName', 'feedback-rollup'));
    await waitFor(() => expect(result.current.evaluator).not.toBeNull());

    act(() => result.current.setField('evaluatorVersion', '1'));

    await waitFor(() => expect(getEvaluatorVersion).toHaveBeenCalledWith('feedback-rollup', 1));
  });

  test('caches a resolved table so re-selecting it issues no second read', async () => {
    const { result } = renderForm();

    act(() => result.current.setField('targetEnrichment', 'turn_feedback'));
    await waitFor(() => expect(result.current.groupBy).toBe('response_id'));

    act(() => result.current.setField('targetEnrichment', 'conversation_insights'));
    await waitFor(() => expect(result.current.groupBy).toBe('chat_id'));

    act(() => result.current.setField('targetEnrichment', 'turn_feedback'));
    await waitFor(() => expect(result.current.groupBy).toBe('response_id'));

    expect(vi.mocked(getTable).mock.calls.filter(([name]) => name === 'turn_feedback')).toHaveLength(1);
  });

  test('caches a resolved evaluator version so re-selecting it issues no second read', async () => {
    const { result } = renderForm();

    act(() => result.current.setField('evaluatorName', 'feedback-rollup'));
    await waitFor(() => expect(result.current.evaluator?.version).toBe(2));

    act(() => result.current.setField('evaluatorVersion', '1'));
    await waitFor(() => expect(result.current.evaluator?.version).toBe(1));

    act(() => result.current.setField('evaluatorVersion', 'latest'));
    await waitFor(() => expect(result.current.evaluator?.version).toBe(2));

    expect(getEvaluator).toHaveBeenCalledOnce();
    expect(getEvaluatorVersion).toHaveBeenCalledOnce();
    expect(result.current.isEvaluatorPending).toBe(false);
  });

  test('returns the version pin to latest when the evaluator changes', async () => {
    const { result } = renderForm();

    act(() => result.current.setField('evaluatorName', 'feedback-rollup'));
    act(() => result.current.setField('evaluatorVersion', '2'));
    expect(result.current.form.evaluatorVersion).toBe('2');

    act(() => result.current.setField('evaluatorName', 'conversation-insights'));

    expect(result.current.form.evaluatorVersion).toBe('latest');
  });

  test('reports a failed evaluator resolution', async () => {
    vi.mocked(getEvaluator).mockResolvedValue(null);
    const { result } = renderForm();

    act(() => result.current.setField('evaluatorName', 'feedback-rollup'));

    await waitFor(() => expect(result.current.hasEvaluatorError).toBe(true));
    expect(result.current.outputVars).toEqual([]);
    expect(result.current.isEvaluatorPending).toBe(false);
  });

  test('clears the pending flag when the selection is emptied', async () => {
    const { result } = renderForm();

    act(() => result.current.setField('evaluatorName', 'feedback-rollup'));
    await waitFor(() => expect(result.current.evaluator).not.toBeNull());

    act(() => result.current.setField('evaluatorName', ''));

    expect(result.current.isEvaluatorPending).toBe(false);
    expect(result.current.evaluator).toBeNull();
  });

  test('reports a failed target resolution', async () => {
    vi.mocked(getTable).mockResolvedValue(null);
    const { result } = renderForm();

    act(() => result.current.setField('targetEnrichment', 'turn_feedback'));

    await waitFor(() => expect(result.current.hasTargetError).toBe(true));
  });

  test('derives group-by from the target table grain key', async () => {
    const { result } = renderForm();

    act(() => result.current.setField('targetEnrichment', 'conversation_insights'));

    await waitFor(() => expect(result.current.groupBy).toBe('chat_id'));
  });
});

describe('useCreateRuleForm — canSubmit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTables).mockResolvedValue([enrichment, otherEnrichment]);
    vi.mocked(getTable).mockResolvedValue(enrichment);
    vi.mocked(getEvaluator).mockResolvedValue(sqlEvaluator);
  });

  test('blocks until every required value is present', async () => {
    const { result } = renderForm();
    expect(result.current.canSubmit).toBe(false);

    await fillRequired(result);
    bindOutput(result, 'rate_event_count', 'rate_event_count');

    await waitFor(() => expect(result.current.canSubmit).toBe(true));
  });

  test('blocks while enabled is unchosen', async () => {
    const { result } = renderForm();
    await fillRequired(result);
    bindOutput(result, 'rate_event_count', 'rate_event_count');
    await waitFor(() => expect(result.current.canSubmit).toBe(true));

    act(() => result.current.setField('enabled', null));

    expect(result.current.canSubmit).toBe(false);
  });

  test('blocks a sql evaluator with no output binding', async () => {
    const { result } = renderForm();
    await fillRequired(result);

    expect(result.current.isSqlWithoutBindings).toBe(true);
    expect(result.current.canSubmit).toBe(false);
  });

  test('allows an llm evaluator with no output binding but warns', async () => {
    vi.mocked(getEvaluator).mockResolvedValue(llmEvaluator);
    const { result } = renderForm();
    await fillRequired(result);

    await waitFor(() => expect(result.current.isLlmWithoutBindings).toBe(true));
    expect(result.current.canSubmit).toBe(true);
  });

  test('blocks a schedule rule without a valid cron expression', async () => {
    const { result } = renderForm();
    await fillRequired(result);
    bindOutput(result, 'rate_event_count', 'rate_event_count');

    act(() => result.current.setField('triggerKind', TriggerKind.Schedule));
    expect(result.current.canSubmit).toBe(false);

    act(() => result.current.setField('triggerCron', '*/5 * * * *'));
    expect(result.current.canSubmit).toBe(false);

    act(() => result.current.setField('triggerCron', '0 */5 * * * *'));
    expect(result.current.canSubmit).toBe(true);
  });

  test('blocks a group rule with no readiness condition', async () => {
    const { result } = renderForm();
    await fillRequired(result);
    bindOutput(result, 'rate_event_count', 'rate_event_count');

    act(() => result.current.setField('triggerKind', TriggerKind.Group));
    expect(result.current.canSubmit).toBe(false);

    act(() => result.current.setField('idle', '30m'));
    expect(result.current.canSubmit).toBe(true);
  });

  test('blocks a group rule whose cost ceiling is not a positive integer', async () => {
    const { result } = renderForm();
    await fillRequired(result);
    bindOutput(result, 'rate_event_count', 'rate_event_count');
    act(() => result.current.setField('triggerKind', TriggerKind.Group));
    act(() => result.current.setField('idle', '30m'));

    act(() => result.current.setField('costCeiling', '0'));
    expect(result.current.canSubmit).toBe(false);

    act(() => result.current.setField('costCeiling', '100'));
    expect(result.current.canSubmit).toBe(true);
  });

  test('blocks while an evaluator resolution has failed', async () => {
    vi.mocked(getEvaluator).mockResolvedValue(null);
    const { result } = renderForm();

    act(() => result.current.setField('name', 'my-rule'));
    act(() => result.current.setField('evaluatorName', 'feedback-rollup'));
    act(() => result.current.setField('targetEnrichment', 'turn_feedback'));
    act(() => result.current.setField('triggerKind', TriggerKind.OnIngest));
    act(() => result.current.setField('enabled', true));

    await waitFor(() => expect(result.current.hasEvaluatorError).toBe(true));
    expect(result.current.canSubmit).toBe(false);
  });

  test('blocks while a binding names a value the evaluator or table no longer has', async () => {
    const { result } = renderForm();
    await fillRequired(result);

    bindOutput(result, 'removed_column', 'rate_event_count');

    expect(result.current.canSubmit).toBe(false);
  });
});

describe('useCreateRuleForm — buildDto', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTables).mockResolvedValue([enrichment]);
    vi.mocked(getTable).mockResolvedValue(enrichment);
    vi.mocked(getEvaluator).mockResolvedValue(sqlEvaluator);
  });

  test('sends the required five and no trigger qualifier for an on-ingest rule', async () => {
    const { result } = renderForm();
    await fillRequired(result);
    bindOutput(result, 'rate_event_count', 'rate_event_count');

    const dto = result.current.buildDto();

    expect(dto).toEqual({
      name: 'my-rule',
      evaluator_name: 'feedback-rollup',
      target_enrichment: 'turn_feedback',
      trigger_kind: TriggerKind.OnIngest,
      enabled: true,
      output_bindings: [{ column: 'rate_event_count', var: 'rate_event_count' }],
    });
  });

  test('omits evaluator_version while the pin is latest', async () => {
    const { result } = renderForm();
    await fillRequired(result);

    expect(result.current.buildDto()).not.toHaveProperty('evaluator_version');
  });

  test('sends evaluator_version as a number once a version is pinned', async () => {
    const { result } = renderForm();
    await fillRequired(result);

    act(() => result.current.setField('evaluatorVersion', '2'));

    expect(result.current.buildDto().evaluator_version).toBe(2);
  });

  test('sends trigger_cron for a schedule rule', async () => {
    const { result } = renderForm();
    await fillRequired(result);
    act(() => result.current.setField('triggerKind', TriggerKind.Schedule));
    act(() => result.current.setField('triggerCron', '0 0 * * * *'));

    const dto = result.current.buildDto();

    expect(dto.trigger_cron).toBe('0 0 * * * *');
    expect(dto).not.toHaveProperty('group_by');
    expect(dto).not.toHaveProperty('ready_when');
  });

  test('sends the derived group_by and ready_when for a group rule', async () => {
    const { result } = renderForm();
    await fillRequired(result);
    act(() => result.current.setField('triggerKind', TriggerKind.Group));
    act(() => result.current.setField('idle', '30m'));
    act(() => result.current.setField('costCeiling', '500'));

    const dto = result.current.buildDto();

    expect(dto.group_by).toBe('response_id');
    expect(dto.ready_when).toEqual({ idle: '30m', cost_ceiling: 500 });
    expect(dto).not.toHaveProperty('trigger_cron');
  });

  test('strips the abandoned branch after the trigger kind changes', async () => {
    const { result } = renderForm();
    await fillRequired(result);

    act(() => result.current.setField('triggerKind', TriggerKind.Schedule));
    act(() => result.current.setField('triggerCron', '0 0 * * * *'));
    act(() => result.current.setField('triggerKind', TriggerKind.Group));
    act(() => result.current.setField('idle', '30m'));

    const dto = result.current.buildDto();

    expect(dto).not.toHaveProperty('trigger_cron');
    expect(dto.group_by).toBe('response_id');
    expect(result.current.form.triggerCron).toBe('0 0 * * * *');
  });

  test('omits output_bindings entirely when no row is complete', async () => {
    const { result } = renderForm();
    await fillRequired(result);

    expect(result.current.buildDto()).not.toHaveProperty('output_bindings');
  });

  test('trims the rule name', async () => {
    const { result } = renderForm();
    await fillRequired(result);

    act(() => result.current.setField('name', '  spaced  '));

    expect(result.current.buildDto().name).toBe('spaced');
  });
});
