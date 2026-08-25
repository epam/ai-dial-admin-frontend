import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getEvaluator, getEvaluatorVersion, getTable, getTables } from '@/src/app/[lang]/enrichment-rules/actions';
import { useRuleForm } from '@/src/components/Analytics/EnrichmentRules/use-rule-form';
import { GROUP_FETCH_MAX_ROWS } from '@/src/constants/analytics/enrichment-rules';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { Evaluator, EvaluatorType } from '@/src/models/analytics/evaluator';
import { EnrichmentRule, RulePriority, TriggerKind } from '@/src/models/analytics/rule';
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
  source_table: 'dial_usage_log',
  grain: { grain_key: 'response_id' },
  columns: [{ source_name: 'rate_event_count', name: 'rate_event_count', type: AnalyticsFieldType.Long }],
};

const otherEnrichment: AnalyticsTable = {
  name: 'conversation_insights',
  type: AnalyticsTableType.Enrichment,
  source_table: 'dial_usage_log',
  grain: { grain_key: 'chat_id' },
  columns: [{ source_name: 'title', name: 'title', type: AnalyticsFieldType.String }],
};

const sourceTable: AnalyticsTable = {
  name: 'dial_usage_log',
  type: AnalyticsTableType.Source,
  version_column: 'ingested_at',
  columns: [{ source_name: 'chat_id', name: 'chat_id', type: AnalyticsFieldType.String }],
};

const otherSource: AnalyticsTable = {
  name: 'legacy_log',
  type: AnalyticsTableType.Source,
  columns: [{ source_name: 'legacy_id', name: 'legacy_id', type: AnalyticsFieldType.String }],
};

const allTables = [enrichment, otherEnrichment, sourceTable, otherSource];

const renderForm = (params?: Parameters<typeof useRuleForm>[0]) => renderHook(() => useRuleForm(params));

type Form = { current: ReturnType<typeof useRuleForm> };

const fillRequired = async (result: Form) => {
  act(() =>
    result.current.onChange({
      name: 'my-rule',
      evaluator_name: 'feedback-rollup',
      target_enrichment: 'turn_feedback',
      trigger_kind: TriggerKind.OnIngest,
      enabled: true,
    }),
  );
  await waitFor(() => expect(result.current.targetColumns).toHaveLength(1));
};

const bindOutput = (result: Form, column: string, varName: string) =>
  act(() => result.current.onChange({ output_bindings: [{ column, var: varName }] }));

const mockAll = () => {
  vi.clearAllMocks();
  vi.mocked(getTables).mockResolvedValue(allTables);
  vi.mocked(getTable).mockImplementation(async (name) => allTables.find((table) => table.name === name) ?? null);
  vi.mocked(getEvaluator).mockResolvedValue(sqlEvaluator);
  vi.mocked(getEvaluatorVersion).mockResolvedValue({ ...sqlEvaluator, version: 1 });
};

describe('useRuleForm — resolution', () => {
  beforeEach(mockAll);

  test('offers only enrichment tables as targets', async () => {
    const { result } = renderForm();

    await waitFor(() => expect(result.current.availableTargets).toHaveLength(2));
    expect(result.current.availableTargets.map((table) => table.name)).toEqual([
      'turn_feedback',
      'conversation_insights',
    ]);
  });

  test('withholds an enrichment that already has a rule', async () => {
    const { result } = renderForm({ takenTargets: ['turn_feedback'] });

    await waitFor(() => expect(result.current.availableTargets).toHaveLength(1));
    expect(result.current.availableTargets[0].name).toBe('conversation_insights');
  });

  test('still offers the edited rule its own target', async () => {
    const rule = { ...baseRule, target_enrichment: 'turn_feedback' };
    const { result } = renderForm({ rule, takenTargets: ['turn_feedback', 'conversation_insights'] });

    await waitFor(() => expect(result.current.availableTargets).toHaveLength(1));
    expect(result.current.availableTargets[0].name).toBe('turn_feedback');
  });

  test('resolves the evaluator definition when one is selected', async () => {
    const { result } = renderForm();

    act(() => result.current.onChange({ evaluator_name: 'feedback-rollup' }));

    await waitFor(() => expect(result.current.outputVars).toHaveLength(1));
    expect(getEvaluator).toHaveBeenCalledWith('feedback-rollup');
  });

  test('reads the pinned version when the version is no longer latest', async () => {
    const { result } = renderForm();

    act(() => result.current.onChange({ evaluator_name: 'feedback-rollup' }));
    await waitFor(() => expect(result.current.evaluator).not.toBeNull());

    act(() => result.current.onChange({ evaluator_version: 1 }));

    await waitFor(() => expect(getEvaluatorVersion).toHaveBeenCalledWith('feedback-rollup', 1));
  });

  test('caches a resolved table so re-selecting it issues no second read', async () => {
    const { result } = renderForm();

    act(() => result.current.onChange({ target_enrichment: 'turn_feedback' }));
    await waitFor(() => expect(result.current.grainKey).toBe('response_id'));

    act(() => result.current.onChange({ target_enrichment: 'conversation_insights' }));
    await waitFor(() => expect(result.current.grainKey).toBe('chat_id'));

    act(() => result.current.onChange({ target_enrichment: 'turn_feedback' }));
    await waitFor(() => expect(result.current.grainKey).toBe('response_id'));

    expect(vi.mocked(getTable).mock.calls.filter(([name]) => name === 'turn_feedback')).toHaveLength(1);
  });

  test('caches a resolved evaluator version so re-selecting it issues no second read', async () => {
    const { result } = renderForm();

    act(() => result.current.onChange({ evaluator_name: 'feedback-rollup' }));
    await waitFor(() => expect(result.current.evaluator?.version).toBe(2));

    act(() => result.current.onChange({ evaluator_version: 1 }));
    await waitFor(() => expect(result.current.evaluator?.version).toBe(1));

    act(() => result.current.onChange({ evaluator_version: undefined }));
    await waitFor(() => expect(result.current.evaluator?.version).toBe(2));

    expect(getEvaluator).toHaveBeenCalledOnce();
    expect(getEvaluatorVersion).toHaveBeenCalledOnce();
    expect(result.current.isEvaluatorPending).toBe(false);
  });

  test('returns the version pin to latest when the evaluator changes', async () => {
    const { result } = renderForm();

    act(() => result.current.onChange({ evaluator_name: 'feedback-rollup' }));
    act(() => result.current.onChange({ evaluator_version: 2 }));
    expect(result.current.draft.evaluator_version).toBe(2);

    act(() => result.current.onChange({ evaluator_name: 'conversation-insights' }));

    expect(result.current.draft.evaluator_version).toBeUndefined();
  });

  test('reports a failed evaluator resolution', async () => {
    vi.mocked(getEvaluator).mockResolvedValue(null);
    const { result } = renderForm();

    act(() => result.current.onChange({ evaluator_name: 'feedback-rollup' }));

    await waitFor(() => expect(result.current.hasEvaluatorError).toBe(true));
    expect(result.current.outputVars).toEqual([]);
    expect(result.current.isEvaluatorPending).toBe(false);
  });

  test('clears the pending flag when the selection is emptied', async () => {
    const { result } = renderForm();

    act(() => result.current.onChange({ evaluator_name: 'feedback-rollup' }));
    await waitFor(() => expect(result.current.evaluator).not.toBeNull());

    act(() => result.current.onChange({ evaluator_name: '' }));

    expect(result.current.isEvaluatorPending).toBe(false);
    expect(result.current.evaluator).toBeNull();
  });

  test('reports a failed target resolution', async () => {
    vi.mocked(getTable).mockResolvedValue(null);
    const { result } = renderForm();

    act(() => result.current.onChange({ target_enrichment: 'turn_feedback' }));

    await waitFor(() => expect(result.current.hasTargetError).toBe(true));
  });

  test('derives group-by from the target table grain key', async () => {
    const { result } = renderForm();

    act(() => result.current.onChange({ target_enrichment: 'conversation_insights' }));

    await waitFor(() => expect(result.current.grainKey).toBe('chat_id'));
  });
});

describe('useRuleForm — the read source leg', () => {
  beforeEach(mockAll);

  test('follows the target enrichment when the rule declares no source', async () => {
    const { result } = renderForm();

    act(() => result.current.onChange({ target_enrichment: 'turn_feedback' }));

    await waitFor(() => expect(result.current.sourceColumns.map((column) => column.name)).toEqual(['chat_id']));
    expect(result.current.sourceName).toBe('dial_usage_log');
  });

  test('reads the declared source when the rule pins one', async () => {
    const { result } = renderForm();

    act(() => result.current.onChange({ target_enrichment: 'turn_feedback', source: 'legacy_log' }));

    await waitFor(() => expect(result.current.sourceColumns.map((column) => column.name)).toEqual(['legacy_id']));
    expect(result.current.sourceName).toBe('legacy_log');
  });

  test('re-resolves a followed source when the target changes', async () => {
    vi.mocked(getTable).mockImplementation(async (name) => {
      if (name === 'conversation_insights') return { ...otherEnrichment, source_table: 'legacy_log' };
      return allTables.find((table) => table.name === name) ?? null;
    });
    const { result } = renderForm();

    act(() => result.current.onChange({ target_enrichment: 'turn_feedback' }));
    await waitFor(() => expect(result.current.sourceName).toBe('dial_usage_log'));

    act(() => result.current.onChange({ target_enrichment: 'conversation_insights' }));

    await waitFor(() => expect(result.current.sourceName).toBe('legacy_log'));
  });

  test('stays unresolved until the target it derives from lands', () => {
    const { result } = renderForm();

    act(() => result.current.onChange({ target_enrichment: 'turn_feedback' }));

    // The source name is only knowable from the target's `source_table`, so nothing is read for it yet.
    expect(result.current.sourceName).toBeUndefined();
    expect(result.current.sourceColumns).toEqual([]);
  });

  test('reports a failed source resolution', async () => {
    vi.mocked(getTable).mockImplementation(async (name) => (name === 'turn_feedback' ? enrichment : null));
    const { result } = renderForm();

    act(() => result.current.onChange({ target_enrichment: 'turn_feedback' }));

    await waitFor(() => expect(result.current.hasSourceError).toBe(true));
    expect(result.current.sourceColumns).toEqual([]);
  });
});

describe('useRuleForm — isValid', () => {
  beforeEach(mockAll);

  test('blocks until every required value is present', async () => {
    const { result } = renderForm();
    expect(result.current.isValid).toBe(false);

    await fillRequired(result);
    bindOutput(result, 'rate_event_count', 'rate_event_count');

    await waitFor(() => expect(result.current.isValid).toBe(true));
  });

  test('blocks while enabled is unchosen', async () => {
    const { result } = renderForm();
    await fillRequired(result);
    bindOutput(result, 'rate_event_count', 'rate_event_count');
    await waitFor(() => expect(result.current.isValid).toBe(true));

    act(() => result.current.onChange({ enabled: undefined }));

    expect(result.current.isValid).toBe(false);
  });

  test('blocks a sql evaluator with no output binding', async () => {
    const { result } = renderForm();
    await fillRequired(result);

    expect(result.current.isSqlWithoutBindings).toBe(true);
    expect(result.current.isValid).toBe(false);
  });

  test('allows an llm evaluator with no output binding but warns', async () => {
    vi.mocked(getEvaluator).mockResolvedValue(llmEvaluator);
    const { result } = renderForm();
    await fillRequired(result);

    await waitFor(() => expect(result.current.isLlmWithoutBindings).toBe(true));
    expect(result.current.isValid).toBe(true);
  });

  test('blocks a schedule rule without a valid cron expression', async () => {
    const { result } = renderForm();
    await fillRequired(result);
    bindOutput(result, 'rate_event_count', 'rate_event_count');

    act(() => result.current.onChange({ trigger_kind: TriggerKind.Schedule }));
    expect(result.current.isValid).toBe(false);

    act(() => result.current.onChange({ trigger_cron: '*/5 * * * *' }));
    expect(result.current.isValid).toBe(false);

    act(() => result.current.onChange({ trigger_cron: '0 */5 * * * *' }));
    expect(result.current.isValid).toBe(true);
  });

  test('blocks a group rule with no readiness condition', async () => {
    const { result } = renderForm();
    await fillRequired(result);
    bindOutput(result, 'rate_event_count', 'rate_event_count');

    act(() => result.current.onChange({ trigger_kind: TriggerKind.Group }));
    expect(result.current.isValid).toBe(false);

    act(() => result.current.onChange({ ready_when: { idle: '30m' } }));
    expect(result.current.isValid).toBe(true);
  });

  test('accepts a readiness signal on its own', async () => {
    const { result } = renderForm();
    await fillRequired(result);
    bindOutput(result, 'rate_event_count', 'rate_event_count');

    act(() => result.current.onChange({ trigger_kind: TriggerKind.Group }));
    act(() => result.current.onChange({ ready_when: { signal: 'turns >= 2' } }));

    expect(result.current.isValid).toBe(true);
  });

  test('blocks a group rule whose cost ceiling is not a positive integer', async () => {
    const { result } = renderForm();
    await fillRequired(result);
    bindOutput(result, 'rate_event_count', 'rate_event_count');
    act(() => result.current.onChange({ trigger_kind: TriggerKind.Group }));

    act(() => result.current.onChange({ ready_when: { idle: '30m', cost_ceiling: 0 } }));
    expect(result.current.isValid).toBe(false);

    act(() => result.current.onChange({ ready_when: { idle: '30m', cost_ceiling: 100 } }));
    expect(result.current.isValid).toBe(true);
  });

  test('blocks while an evaluator resolution has failed', async () => {
    vi.mocked(getEvaluator).mockResolvedValue(null);
    const { result } = renderForm();

    act(() =>
      result.current.onChange({
        name: 'my-rule',
        evaluator_name: 'feedback-rollup',
        target_enrichment: 'turn_feedback',
        trigger_kind: TriggerKind.OnIngest,
        enabled: true,
      }),
    );

    await waitFor(() => expect(result.current.hasEvaluatorError).toBe(true));
    expect(result.current.isValid).toBe(false);
  });

  test('blocks while a binding names a value the evaluator or table no longer has', async () => {
    const { result } = renderForm();
    await fillRequired(result);

    bindOutput(result, 'removed_column', 'rate_event_count');

    expect(result.current.hasStrandedBinding).toBe(true);
    expect(result.current.isValid).toBe(false);
  });

  test('blocks a sampling fraction outside 0 to 1', async () => {
    const { result } = renderForm();
    await fillRequired(result);
    bindOutput(result, 'rate_event_count', 'rate_event_count');
    await waitFor(() => expect(result.current.isValid).toBe(true));

    act(() => result.current.onChange({ sampling: 1.5 }));
    expect(result.current.isValid).toBe(false);

    act(() => result.current.onChange({ sampling: 0.25 }));
    expect(result.current.isValid).toBe(true);
  });

  test('blocks a group rule whose member selection has no limit', async () => {
    const { result } = renderForm();
    await fillRequired(result);
    bindOutput(result, 'rate_event_count', 'rate_event_count');
    act(() => result.current.onChange({ trigger_kind: TriggerKind.Group, ready_when: { idle: '30m' } }));
    await waitFor(() => expect(result.current.isValid).toBe(true));

    act(() => result.current.onChange({ member_select: { limit: 0, prefer_sql: 'x > 1' } }));

    expect(result.current.isValid).toBe(false);
  });

  test('ignores a stale member selection once the trigger is no longer group', async () => {
    const { result } = renderForm();
    await fillRequired(result);
    bindOutput(result, 'rate_event_count', 'rate_event_count');
    act(() => result.current.onChange({ trigger_kind: TriggerKind.Group, ready_when: { idle: '30m' } }));
    act(() => result.current.onChange({ member_select: { limit: 0, prefer_sql: 'x > 1' } }));
    expect(result.current.isValid).toBe(false);

    act(() => result.current.onChange({ trigger_kind: TriggerKind.OnIngest }));

    // The control is unmounted and the member is dropped from the DTO, so it must not block the save.
    expect(result.current.isValid).toBe(true);
  });

  test('blocks a member limit above the service ceiling', async () => {
    const { result } = renderForm();
    await fillRequired(result);
    bindOutput(result, 'rate_event_count', 'rate_event_count');
    act(() => result.current.onChange({ trigger_kind: TriggerKind.Group, ready_when: { idle: '30m' } }));

    act(() => result.current.onChange({ member_select: { limit: GROUP_FETCH_MAX_ROWS + 1 } }));
    expect(result.current.isValid).toBe(false);

    act(() => result.current.onChange({ member_select: { limit: GROUP_FETCH_MAX_ROWS } }));
    expect(result.current.isValid).toBe(true);
  });
});

const baseRule: EnrichmentRule = {
  id: 'rule-1',
  name: 'existing-rule',
  evaluator_name: 'feedback-rollup',
  evaluator: sqlEvaluator,
  target_enrichment: 'turn_feedback',
  trigger_kind: TriggerKind.OnIngest,
  enabled: true,
  grain_key: 'response_id',
  version_column: 'ingested_at',
  generation: 7,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-02-01T00:00:00Z',
  output_bindings: [{ column: 'rate_event_count', var: 'rate_event_count' }],
};

describe('useRuleForm — editing an existing rule', () => {
  beforeEach(mockAll);

  test('seeds the draft from the rule without its read-only members', () => {
    const { result } = renderForm({ rule: baseRule });

    expect(result.current.draft.name).toBe('existing-rule');
    expect(result.current.draft).not.toHaveProperty('id');
    expect(result.current.draft).not.toHaveProperty('generation');
    expect(result.current.draft).not.toHaveProperty('grain_key');
    expect(result.current.draft).not.toHaveProperty('evaluator');
  });

  test('carries a member no control presents through to the saved rule', async () => {
    const rule = { ...baseRule, filter_sql: 'score > 0.5', cadence: 'PT1H' };
    const { result } = renderForm({ rule });
    await waitFor(() => expect(result.current.targetColumns).toHaveLength(1));

    act(() => result.current.onChange({ name: 'renamed' }));
    const dto = result.current.buildDto();

    expect(dto.name).toBe('renamed');
    expect(dto.filter_sql).toBe('score > 0.5');
    expect(dto.cadence).toBe('PT1H');
  });

  test('never sends a read-only member', async () => {
    const { result } = renderForm({ rule: baseRule });
    await waitFor(() => expect(result.current.targetColumns).toHaveLength(1));

    const dto = result.current.buildDto() as Record<string, unknown>;

    ['id', 'evaluator', 'grain_key', 'version_column', 'generation', 'created_at', 'updated_at'].forEach((key) =>
      expect(dto).not.toHaveProperty(key),
    );
  });

  test('reset re-seeds the draft from a freshly read rule', async () => {
    const { result } = renderForm({ rule: baseRule });

    act(() => result.current.onChange({ name: 'edited' }));
    expect(result.current.draft.name).toBe('edited');

    act(() => result.current.reset({ ...baseRule, name: 'from-server', generation: 8 }));

    expect(result.current.draft.name).toBe('from-server');
    expect(result.current.draft).not.toHaveProperty('generation');
  });
});

describe('useRuleForm — buildDto', () => {
  beforeEach(mockAll);

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

    act(() => result.current.onChange({ evaluator_version: 2 }));

    expect(result.current.buildDto().evaluator_version).toBe(2);
  });

  test('sends trigger_cron for a schedule rule', async () => {
    const { result } = renderForm();
    await fillRequired(result);
    act(() => result.current.onChange({ trigger_kind: TriggerKind.Schedule, trigger_cron: '0 0 * * * *' }));

    const dto = result.current.buildDto();

    expect(dto.trigger_cron).toBe('0 0 * * * *');
    expect(dto).not.toHaveProperty('group_by');
    expect(dto).not.toHaveProperty('ready_when');
  });

  test('sends the derived group_by and ready_when for a group rule', async () => {
    const { result } = renderForm();
    await fillRequired(result);
    act(() =>
      result.current.onChange({
        trigger_kind: TriggerKind.Group,
        ready_when: { idle: '30m', cost_ceiling: 500 },
      }),
    );

    const dto = result.current.buildDto();

    expect(dto.group_by).toBe('response_id');
    expect(dto.ready_when).toEqual({ idle: '30m', cost_ceiling: 500 });
    expect(dto).not.toHaveProperty('trigger_cron');
  });

  test('strips the abandoned branch after the trigger kind changes', async () => {
    const { result } = renderForm();
    await fillRequired(result);

    act(() => result.current.onChange({ trigger_kind: TriggerKind.Schedule, trigger_cron: '0 0 * * * *' }));
    act(() => result.current.onChange({ trigger_kind: TriggerKind.Group, ready_when: { idle: '30m' } }));

    const dto = result.current.buildDto();

    expect(dto).not.toHaveProperty('trigger_cron');
    expect(dto.group_by).toBe('response_id');
    // The abandoned value stays on the draft so switching back does not lose it.
    expect(result.current.draft.trigger_cron).toBe('0 0 * * * *');
  });

  test('drops member_select when the trigger is not group', async () => {
    const { result } = renderForm();
    await fillRequired(result);

    act(() => result.current.onChange({ member_select: { limit: 10 } }));

    expect(result.current.buildDto()).not.toHaveProperty('member_select');
  });

  test('omits output_bindings entirely when there are none', async () => {
    const { result } = renderForm();
    await fillRequired(result);

    act(() => result.current.onChange({ output_bindings: [] }));

    expect(result.current.buildDto()).not.toHaveProperty('output_bindings');
  });

  test('trims the rule name', async () => {
    const { result } = renderForm();
    await fillRequired(result);

    act(() => result.current.onChange({ name: '  spaced  ' }));

    expect(result.current.buildDto().name).toBe('spaced');
  });

  test('omits a cleared numeric knob rather than sending zero', async () => {
    const { result } = renderForm();
    await fillRequired(result);

    act(() => result.current.onChange({ rate_rpm: 60, batch_chunk: 500 }));
    expect(result.current.buildDto().rate_rpm).toBe(60);

    act(() => result.current.onChange({ rate_rpm: undefined }));

    const dto = result.current.buildDto();
    expect(dto).not.toHaveProperty('rate_rpm');
    expect(dto.batch_chunk).toBe(500);
  });

  test('keeps a knob deliberately set to zero', async () => {
    const { result } = renderForm();
    await fillRequired(result);

    act(() => result.current.onChange({ batch_scan_limit: 0 }));

    expect(result.current.buildDto().batch_scan_limit).toBe(0);
  });

  test('round-trips priority', async () => {
    const { result } = renderForm();
    await fillRequired(result);

    act(() => result.current.onChange({ priority: RulePriority.Backfill }));
    expect(result.current.buildDto().priority).toBe(RulePriority.Backfill);

    act(() => result.current.onChange({ priority: undefined }));
    expect(result.current.buildDto()).not.toHaveProperty('priority');
  });

  test('drops a cadence cleared to an empty string', async () => {
    const { result } = renderForm();
    await fillRequired(result);

    act(() => result.current.onChange({ cadence: 'PT1H' }));
    expect(result.current.buildDto().cadence).toBe('PT1H');

    act(() => result.current.onChange({ cadence: '' }));
    expect(result.current.buildDto()).not.toHaveProperty('cadence');
  });

  test('omits a source equal to the target enrichment default', async () => {
    const { result } = renderForm();
    await fillRequired(result);
    await waitFor(() => expect(result.current.target?.source_table).toBe('dial_usage_log'));

    act(() => result.current.onChange({ source: 'dial_usage_log' }));

    expect(result.current.buildDto()).not.toHaveProperty('source');
  });

  test('sends a source that differs from the target enrichment default', async () => {
    const { result } = renderForm();
    await fillRequired(result);
    await waitFor(() => expect(result.current.target?.source_table).toBe('dial_usage_log'));

    act(() => result.current.onChange({ source: 'legacy_log' }));

    expect(result.current.buildDto().source).toBe('legacy_log');
  });
});
