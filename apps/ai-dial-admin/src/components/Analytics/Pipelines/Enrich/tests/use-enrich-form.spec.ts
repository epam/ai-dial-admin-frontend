import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getTable, getTables } from '@/src/app/[lang]/pipelines/actions';
import { getEntitySchema } from '@/src/app/[lang]/queries/actions';
import { useEnrichForm } from '@/src/components/Analytics/Pipelines/Enrich/use-enrich-form';
import { GROUP_FETCH_MAX_ROWS } from '@/src/constants/analytics/pipelines';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { MemberSelect, Pipeline, PipelineKind, TransformType, TriggerKind } from '@/src/models/analytics/pipeline';
import { PipelineDraft, TransformDraft } from '@/src/models/analytics/pipeline-ui';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';

vi.mock('@/src/app/[lang]/pipelines/actions');
vi.mock('@/src/app/[lang]/queries/actions');

const sqlTransform: TransformDraft = {
  type: TransformType.Sql,
  outputs: [{ name: 'rate_event_count', sql: 'count(*)' }],
};

const llmTransform: TransformDraft = {
  type: TransformType.Llm,
  model: 'gpt-4o',
  request_template: '{"messages":[{"role":"user","content":"{{title}}"}]}',
  outputs: [{ name: 'title', prose: 'Title of the session.' }],
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

const sourceEntityFields = [
  { name: 'chat_id', source: 'chat_id', type: AnalyticsFieldType.String },
  { name: 'dial_usage_log_payload.request_body', source: 'request_body', type: AnalyticsFieldType.String },
];

const renderForm = (params?: Parameters<typeof useEnrichForm>[0]) => renderHook(() => useEnrichForm(params));

type Form = { current: ReturnType<typeof useEnrichForm> };

const fillRequired = async (result: Form) => {
  act(() =>
    result.current.onChange({
      name: 'my-rule',
      kind: PipelineKind.Enrich,
      target: 'turn_feedback',
      trigger: { kind: TriggerKind.OnIngest },
      enabled: true,
      transform: sqlTransform,
    }),
  );
  await waitFor(() => expect(result.current.targetColumns).toHaveLength(1));
};

const mockAll = () => {
  vi.clearAllMocks();
  vi.mocked(getTables).mockResolvedValue(allTables);
  vi.mocked(getTable).mockImplementation(async (name) => allTables.find((table) => table.name === name) ?? null);
  vi.mocked(getEntitySchema).mockResolvedValue({ success: true, response: { fields: sourceEntityFields } });
};

describe('useEnrichForm — resolution', () => {
  beforeEach(mockAll);

  test('offers only enrichment tables as targets', async () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });

    await waitFor(() => expect(result.current.availableTargets).toHaveLength(2));
    expect(result.current.availableTargets.map((table) => table.name)).toEqual([
      'turn_feedback',
      'conversation_insights',
    ]);
  });

  test('withholds an enrichment that already has a rule', async () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich }, takenTargets: ['turn_feedback'] });

    await waitFor(() => expect(result.current.availableTargets).toHaveLength(1));
    expect(result.current.availableTargets[0].name).toBe('conversation_insights');
  });

  test('still offers the edited rule its own target', async () => {
    const rule = { ...baseRule, target: 'turn_feedback' };
    const { result } = renderForm({ pipeline: rule, takenTargets: ['turn_feedback', 'conversation_insights'] });

    await waitFor(() => expect(result.current.availableTargets).toHaveLength(1));
    expect(result.current.availableTargets[0].name).toBe('turn_feedback');
  });

  test('drops the transform inputs once the type is sql, which declares none', async () => {
    const { result } = renderForm({
      initialDraft: {
        kind: PipelineKind.Enrich,
        transform: { ...llmTransform, inputs: { rate: { column: 'rate' } } },
      },
    });

    act(() => result.current.onTransformChange({ type: TransformType.Sql }));

    await waitFor(() => expect(result.current.draft.transform?.inputs).toBeUndefined());
  });

  test('keeps the inputs for an llm transform', async () => {
    const { result } = renderForm({
      initialDraft: {
        kind: PipelineKind.Enrich,
        transform: { ...llmTransform, inputs: { title: { column: 'title' } } },
      },
    });

    act(() => result.current.onTransformChange({ model: 'gpt-4o-mini' }));

    await waitFor(() => expect(result.current.draft.transform?.model).toBe('gpt-4o-mini'));
    expect(result.current.draft.transform?.inputs).toEqual({ title: { column: 'title' } });
  });

  test('issues no evaluator read at all, the transform being on the declaration', async () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });

    act(() => result.current.onChange({ target: 'turn_feedback' }));
    await waitFor(() => expect(result.current.grainKey).toBe('response_id'));

    expect(vi.mocked(getTable).mock.calls.every(([name]) => name !== 'feedback-rollup')).toBe(true);
  });

  test('caches a resolved table so re-selecting it issues no second read', async () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });

    act(() => result.current.onChange({ target: 'turn_feedback' }));
    await waitFor(() => expect(result.current.grainKey).toBe('response_id'));

    act(() => result.current.onChange({ target: 'conversation_insights' }));
    await waitFor(() => expect(result.current.grainKey).toBe('chat_id'));

    act(() => result.current.onChange({ target: 'turn_feedback' }));
    await waitFor(() => expect(result.current.grainKey).toBe('response_id'));

    expect(vi.mocked(getTable).mock.calls.filter(([name]) => name === 'turn_feedback')).toHaveLength(1);
  });

  test('reports a failed target resolution', async () => {
    vi.mocked(getTable).mockResolvedValue(null);
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });

    act(() => result.current.onChange({ target: 'turn_feedback' }));

    await waitFor(() => expect(result.current.hasTargetError).toBe(true));
  });

  test('derives group-by from the target table grain key', async () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });

    act(() => result.current.onChange({ target: 'conversation_insights' }));

    await waitFor(() => expect(result.current.grainKey).toBe('chat_id'));
  });
});

describe('useEnrichForm — the read source leg', () => {
  beforeEach(mockAll);

  test('reads the source as an entity, so its enrichments’ columns are bindable', async () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });

    act(() => result.current.onChange({ target: 'turn_feedback' }));

    await waitFor(() => expect(getEntitySchema).toHaveBeenCalledWith('dial_usage_log'));
    expect(result.current.sourceFields.map((field) => field.name)).toContain('dial_usage_log_payload.request_body');
  });

  test('caches the entity so re-selecting the same source issues no second read', async () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });

    act(() => result.current.onChange({ target: 'turn_feedback' }));
    await waitFor(() => expect(result.current.sourceFields).toHaveLength(2));

    act(() => result.current.onChange({ inputs: ['legacy_log'] }));
    await waitFor(() => expect(result.current.sourceName).toBe('legacy_log'));

    act(() => result.current.onChange({ inputs: undefined }));
    await waitFor(() => expect(result.current.sourceName).toBe('dial_usage_log'));

    expect(vi.mocked(getEntitySchema).mock.calls.filter(([name]) => name === 'dial_usage_log')).toHaveLength(1);
  });

  test('reports a failed entity read rather than binding against nothing', async () => {
    vi.mocked(getEntitySchema).mockResolvedValue({ success: false, status: 500 });
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });

    act(() => result.current.onChange({ target: 'turn_feedback' }));

    await waitFor(() => expect(result.current.hasSourceEntityError).toBe(true));
    expect(result.current.sourceFields).toEqual([]);
    expect(result.current.isVariablesReady).toBe(false);
  });

  test('follows the target enrichment when the rule declares no source', async () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });

    act(() => result.current.onChange({ target: 'turn_feedback' }));

    await waitFor(() => expect(result.current.sourceColumns.map((column) => column.name)).toEqual(['chat_id']));
    expect(result.current.sourceName).toBe('dial_usage_log');
  });

  test('reads the declared source when the rule pins one', async () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });

    act(() => result.current.onChange({ target: 'turn_feedback', inputs: ['legacy_log'] }));

    await waitFor(() => expect(result.current.sourceColumns.map((column) => column.name)).toEqual(['legacy_id']));
    expect(result.current.sourceName).toBe('legacy_log');
  });

  test('re-resolves a followed source when the target changes', async () => {
    vi.mocked(getTable).mockImplementation(async (name) => {
      if (name === 'conversation_insights') return { ...otherEnrichment, source_table: 'legacy_log' };
      return allTables.find((table) => table.name === name) ?? null;
    });
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });

    act(() => result.current.onChange({ target: 'turn_feedback' }));
    await waitFor(() => expect(result.current.sourceName).toBe('dial_usage_log'));

    act(() => result.current.onChange({ target: 'conversation_insights' }));

    await waitFor(() => expect(result.current.sourceName).toBe('legacy_log'));
  });

  test('stays unresolved until the target it derives from lands', () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });

    act(() => result.current.onChange({ target: 'turn_feedback' }));

    // The source name is only knowable from the target's `source_table`, so nothing is read for it yet.
    expect(result.current.sourceName).toBeUndefined();
    expect(result.current.sourceColumns).toEqual([]);
  });

  test('reports a failed source resolution', async () => {
    vi.mocked(getTable).mockImplementation(async (name) => (name === 'turn_feedback' ? enrichment : null));
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });

    act(() => result.current.onChange({ target: 'turn_feedback' }));

    await waitFor(() => expect(result.current.hasSourceError).toBe(true));
    expect(result.current.sourceColumns).toEqual([]);
  });
});

describe('useEnrichForm — what the console still judges', () => {
  beforeEach(mockAll);

  test('registration takes the identity and the target, and asks for no declaration', async () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });
    expect(result.current.isRegistrationValid).toBe(false);

    act(() => result.current.onChange({ name: 'my-rule', target: 'turn_feedback' }));

    await waitFor(() => expect(result.current.isRegistrationValid).toBe(true));
  });

  test('a declaration with no trigger and no transform is not withheld', async () => {
    const { result } = renderForm({
      initialDraft: { kind: PipelineKind.Enrich, name: 'my-rule', target: 'turn_feedback' },
    });
    await waitFor(() => expect(result.current.isTargetResolved).toBe(true));

    expect(result.current.hasInvalidCron).toBe(false);
    expect(result.current.hasDuplicateOutputName).toBe(false);
    expect(result.current.isSampleFractionValid).toBe(true);
  });

  test('a cron that was typed and does not parse is refused by the console alone', async () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });

    act(() => result.current.onTriggerChange({ kind: TriggerKind.Schedule }));
    expect(result.current.hasInvalidCron).toBe(false);

    act(() => result.current.onTriggerChange({ cron: '0 * * * *' }));
    expect(result.current.hasInvalidCron).toBe(true);

    act(() => result.current.onTriggerChange({ cron: '0 0 * * * *' }));
    expect(result.current.hasInvalidCron).toBe(false);
  });

  test('a member selection declared without a limit is reported', () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });

    act(() => result.current.onTriggerChange({ kind: TriggerKind.Group, ready_when: { idle: '30m' } }));
    expect(result.current.isMemberSelectValid).toBe(true);

    act(() => result.current.onTriggerChange({ member_select: { prefer_sql: 'score > 0.5' } as MemberSelect }));
    expect(result.current.isMemberSelectValid).toBe(false);

    act(() => result.current.onTriggerChange({ member_select: { limit: 5, prefer_sql: 'score > 0.5' } }));
    expect(result.current.isMemberSelectValid).toBe(true);
  });

  test('a member limit above the service ceiling is reported', () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });

    act(() =>
      result.current.onTriggerChange({
        kind: TriggerKind.Group,
        ready_when: { idle: '30m' },
        member_select: { limit: GROUP_FETCH_MAX_ROWS + 1 },
      }),
    );
    expect(result.current.isMemberSelectValid).toBe(false);

    act(() => result.current.onTriggerChange({ member_select: { limit: GROUP_FETCH_MAX_ROWS } }));
    expect(result.current.isMemberSelectValid).toBe(true);
  });

  test('a cost ceiling that is not a positive integer is reported', () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });

    act(() => result.current.onTriggerChange({ kind: TriggerKind.Group, ready_when: { idle: '30m' } }));
    expect(result.current.isCostCeilingValid).toBe(true);

    act(() => result.current.onTriggerChange({ ready_when: { idle: '30m', cost_ceiling: 0.5 } }));
    expect(result.current.isCostCeilingValid).toBe(false);

    act(() => result.current.onTriggerChange({ ready_when: { idle: '30m', cost_ceiling: 500 } }));
    expect(result.current.isCostCeilingValid).toBe(true);
  });

  test('two outputs bound to one column are reported, which the wire shape would hide', async () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });

    act(() =>
      result.current.onTransformChange({
        type: TransformType.Llm,
        outputs: [{ name: 'title' }, { name: 'title' }],
      }),
    );

    expect(result.current.hasDuplicateOutputName).toBe(true);
  });
});

const baseRule: Pipeline = {
  name: 'existing-rule',
  kind: PipelineKind.Enrich,
  transform: { type: TransformType.Sql, outputs: { rate_event_count: 'count(*)' } },
  target: 'turn_feedback',
  trigger: { kind: TriggerKind.OnIngest },
  enabled: true,
  grain_key: 'response_id',
  version_column: 'ingested_at',
  generation: 7,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-02-01T00:00:00Z',
};

describe('useEnrichForm — editing an existing rule', () => {
  beforeEach(mockAll);

  test('seeds the draft from the rule without its read-only members', () => {
    const { result } = renderForm({ pipeline: baseRule });

    expect(result.current.draft.name).toBe('existing-rule');
    expect(result.current.draft).not.toHaveProperty('id');
    expect(result.current.draft).not.toHaveProperty('generation');
    expect(result.current.draft).not.toHaveProperty('grain_key');
    expect(result.current.draft).not.toHaveProperty('response_schema');
  });

  test('seeds the transform outputs as rows, which the wire keys by target column', () => {
    const { result } = renderForm({ pipeline: baseRule });

    expect(result.current.draft.transform?.outputs).toEqual([{ name: 'rate_event_count', sql: 'count(*)' }]);
  });

  test('carries a member no control presents through to the saved rule', async () => {
    const rule = { ...baseRule, filter: 'score > 0.5', advanced: { scan_every: 'PT1H' } };
    const { result } = renderForm({ pipeline: rule });
    await waitFor(() => expect(result.current.targetColumns).toHaveLength(1));

    act(() => result.current.onChange({ name: 'renamed' }));
    const dto = result.current.buildDto();

    expect(dto.name).toBe('renamed');
    expect(dto.filter).toBe('score > 0.5');
    expect(dto.advanced?.scan_every).toBe('PT1H');
  });

  test('never sends a read-only member', async () => {
    const { result } = renderForm({ pipeline: baseRule });
    await waitFor(() => expect(result.current.targetColumns).toHaveLength(1));

    const dto = result.current.buildDto() as unknown as Record<string, unknown>;

    ['id', 'response_schema', 'grain_key', 'version_column', 'generation', 'created_at', 'updated_at'].forEach((key) =>
      expect(dto).not.toHaveProperty(key),
    );
  });

  test('reset re-seeds the draft from a freshly read rule', async () => {
    const { result } = renderForm({ pipeline: baseRule });

    act(() => result.current.onChange({ name: 'edited' }));
    expect(result.current.draft.name).toBe('edited');

    act(() => result.current.reset({ ...baseRule, name: 'from-server', generation: 8 }));

    expect(result.current.draft.name).toBe('from-server');
    expect(result.current.draft).not.toHaveProperty('generation');
  });
});

describe('useEnrichForm — buildDto', () => {
  beforeEach(mockAll);

  test('sends the required five and no trigger qualifier for an on-ingest rule', async () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });
    await fillRequired(result);

    const dto = result.current.buildDto();

    expect(dto).toEqual({
      name: 'my-rule',
      kind: PipelineKind.Enrich,
      target: 'turn_feedback',
      trigger: { kind: TriggerKind.OnIngest },
      enabled: true,
      transform: { type: TransformType.Sql, outputs: { rate_event_count: 'count(*)' } },
    });
  });

  test('sends neither retired evaluator member, which the service refuses at the binding', async () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });
    await fillRequired(result);

    const dto = result.current.buildDto() as unknown as Record<string, unknown>;

    expect(dto).not.toHaveProperty('evaluator_name');
    expect(dto).not.toHaveProperty('evaluator_version');
    expect(dto).not.toHaveProperty('vars');
  });

  test('keys the outputs by target column and drops the llm members from a sql transform', async () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });
    await fillRequired(result);

    act(() => result.current.onTransformChange({ model: 'gpt-4o', request_template: '{}' }));

    const transform = result.current.buildDto().transform as unknown as Record<string, unknown>;

    expect(transform.outputs).toEqual({ rate_event_count: 'count(*)' });
    expect(transform).not.toHaveProperty('model');
    expect(transform).not.toHaveProperty('request_template');
  });

  test('sends trigger_cron for a schedule rule', async () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });
    await fillRequired(result);
    act(() => result.current.onTriggerChange({ kind: TriggerKind.Schedule, cron: '0 0 * * * *' }));

    const dto = result.current.buildDto();

    expect(dto.trigger?.cron).toBe('0 0 * * * *');
    expect(dto.trigger).not.toHaveProperty('group_by');
    expect(dto.trigger).not.toHaveProperty('ready_when');
  });

  test('sends the derived group_by and ready_when for a group rule', async () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });
    await fillRequired(result);
    act(() =>
      result.current.onTriggerChange({ kind: TriggerKind.Group, ready_when: { idle: '30m', cost_ceiling: 500 } }),
    );

    const dto = result.current.buildDto();

    expect(dto.trigger?.group_by).toBe('response_id');
    expect(dto.trigger?.ready_when).toEqual({ idle: '30m', cost_ceiling: 500 });
    expect(dto.trigger).not.toHaveProperty('cron');
  });

  test('strips the abandoned branch after the trigger kind changes', async () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });
    await fillRequired(result);

    act(() => result.current.onTriggerChange({ kind: TriggerKind.Schedule, cron: '0 0 * * * *' }));
    act(() => result.current.onTriggerChange({ kind: TriggerKind.Group, ready_when: { idle: '30m' } }));

    const dto = result.current.buildDto();

    expect(dto.trigger).not.toHaveProperty('cron');
    expect(dto.trigger?.group_by).toBe('response_id');
    // The abandoned value stays on the draft so switching back does not lose it.
    expect(result.current.draft.trigger?.cron).toBe('0 0 * * * *');
  });

  test('drops member_select when the trigger is not group', async () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });
    await fillRequired(result);

    act(() => result.current.onTriggerChange({ member_select: { limit: 10 } }));

    expect(result.current.buildDto().trigger).not.toHaveProperty('member_select');
  });

  test('sends the transform inputs as a map keyed by variable name', async () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });
    await fillRequired(result);

    act(() =>
      result.current.onChange({
        transform: { ...llmTransform, inputs: { request: { column: 'request_body' } } },
      }),
    );

    expect(result.current.buildDto().transform?.inputs).toEqual({ request: { column: 'request_body' } });
  });

  test('sends no output mapping, which the service derives rather than accepts', async () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });
    await fillRequired(result);

    expect(result.current.buildDto()).not.toHaveProperty('outputs');
  });

  test('trims the rule name', async () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });
    await fillRequired(result);

    act(() => result.current.onChange({ name: '  spaced  ' }));

    expect(result.current.buildDto().name).toBe('spaced');
  });

  test('sends the execution knobs nested under advanced', async () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });
    await fillRequired(result);

    act(() => result.current.onChange({ advanced: { scan_every: 'PT1H', rate_rpm: 60 } }));

    expect(result.current.buildDto().advanced).toEqual({ scan_every: 'PT1H', rate_rpm: 60 });
  });

  test('keeps a knob deliberately set to zero', async () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });
    await fillRequired(result);

    act(() => result.current.onChange({ advanced: { rows_per_scan: 0 } }));

    expect(result.current.buildDto().advanced?.rows_per_scan).toBe(0);
  });

  test('drops an emptied advanced block, which means the runner defaults', async () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });
    await fillRequired(result);

    act(() => result.current.onChange({ advanced: { scan_every: 'PT1H' } }));
    expect(result.current.buildDto().advanced?.scan_every).toBe('PT1H');

    act(() => result.current.onChange({ advanced: {} }));
    expect(result.current.buildDto()).not.toHaveProperty('advanced');
  });

  test('omits a source equal to the target enrichment default', async () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });
    await fillRequired(result);
    await waitFor(() => expect(result.current.target?.source_table).toBe('dial_usage_log'));

    act(() => result.current.onChange({ inputs: ['dial_usage_log'] }));

    expect(result.current.buildDto()).not.toHaveProperty('source');
  });

  test('sends a source that differs from the target enrichment default', async () => {
    const { result } = renderForm({ initialDraft: { kind: PipelineKind.Enrich } });
    await fillRequired(result);
    await waitFor(() => expect(result.current.target?.source_table).toBe('dial_usage_log'));

    act(() => result.current.onChange({ inputs: ['legacy_log'] }));

    expect(result.current.buildDto().inputs).toEqual(['legacy_log']);
  });
});

describe('useEnrichForm — a draft that came from the JSON editor', () => {
  test.each([
    ['output_bindings as a string', { output_bindings: 'x' }],
    ['output_bindings as an object', { output_bindings: {} }],
    ['output_bindings holding null', { output_bindings: [null] }],
    ['output_bindings holding a string', { output_bindings: ['abc'] }],
    ['name as a number', { name: 5 }],
    ['trigger_cron as a number on a scheduled rule', { trigger: { kind: TriggerKind.Schedule }, trigger_cron: 5 }],
    ['a withdrawn member the JSON editor introduced', { output_bindings: 'x' }],
    ['advanced as a string', { advanced: 'x' }],
  ])('reading %s neither throws nor blanks the form', (_label, patch) => {
    const { result } = renderForm({ pipeline: baseRule });

    expect(() => {
      act(() => result.current.replaceDraft({ ...result.current.draft, ...patch } as PipelineDraft));
      void result.current.isRegistrationValid;
      void result.current.buildDto();
    }).not.toThrow();
  });

  // The document may name the cron anywhere; only `trigger.cron` is the schedule.
  test('a cron typed outside the trigger is not read as the schedule', () => {
    const { result } = renderForm({ pipeline: baseRule });

    act(() =>
      result.current.replaceDraft({
        ...result.current.draft,
        trigger: { kind: TriggerKind.Schedule },
        trigger_cron: 5,
      } as never),
    );

    expect(result.current.draft.trigger?.cron).toBeUndefined();
    expect(result.current.hasInvalidCron).toBe(false);
  });

  test('replaceDraft replaces rather than merging, so a deleted member is gone', () => {
    const { result } = renderForm({ pipeline: { ...baseRule, filter: 'score > 0.5' } });

    const withoutFilter = { ...result.current.draft };
    delete withoutFilter.filter;
    act(() => result.current.replaceDraft(withoutFilter));

    expect(result.current.draft.filter).toBeUndefined();
    expect(result.current.buildDto()).not.toHaveProperty('filter_sql');
  });
});
