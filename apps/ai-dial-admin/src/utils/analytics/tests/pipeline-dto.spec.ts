import { describe, expect, test } from 'vitest';

import { EvaluatorType } from '@/src/models/analytics/evaluator';
import { FreshnessMode, Pipeline, PipelineKind, PipelinePriority, TriggerKind } from '@/src/models/analytics/pipeline';
import { PipelineDraft, SourceMode } from '@/src/models/analytics/pipeline-ui';
import {
  buildPipelineDto,
  getPipelineInput,
  getReadOnlyMembers,
  getSourceMode,
  toPipelineDraft,
} from '@/src/utils/analytics/pipeline-dto';

const pipeline: Pipeline = {
  name: 'existing',
  kind: PipelineKind.Enrich,
  evaluator_name: 'feedback-rollup',
  evaluator: { name: 'feedback-rollup', version: 2, type: EvaluatorType.Sql },
  target: 'turn_feedback',
  trigger: { kind: TriggerKind.OnIngest },
  enabled: true,
  grain_key: 'response_id',
  version_column: 'ingested_at',
  generation: 3,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-02-01T00:00:00Z',
  state: { lag_seconds: 42 },
};

describe('Utils :: analytics :: toPipelineDraft', () => {
  test('drops every member the API refuses', () => {
    const draft = toPipelineDraft(pipeline) as Record<string, unknown>;

    getReadOnlyMembers().forEach((key) => expect(draft).not.toHaveProperty(key));
  });

  test('keeps a member no control presents', () => {
    expect(toPipelineDraft({ ...pipeline, cadence: '60s' }).cadence).toBe('60s');
  });

  test('does not mutate the pipeline it was given', () => {
    toPipelineDraft(pipeline);

    expect(pipeline.generation).toBe(3);
    expect(pipeline.state).toBeDefined();
  });
});

describe('Utils :: analytics :: getSourceMode', () => {
  test('reads no input as following', () => {
    expect(getSourceMode(undefined, 'log')).toBe(SourceMode.Follow);
    expect(getSourceMode([], 'log')).toBe(SourceMode.Follow);
  });

  test('reads an input equal to the target default as following', () => {
    expect(getSourceMode(['log'], 'log')).toBe(SourceMode.Follow);
  });

  test('reads a differing input as pinned', () => {
    expect(getSourceMode(['other'], 'log')).toBe(SourceMode.Pin);
  });

  test('reads an input as pinned when the default is not yet known', () => {
    expect(getSourceMode(['other'], undefined)).toBe(SourceMode.Pin);
  });

  test('reads the one input a declaration carries', () => {
    expect(getPipelineInput(['log'])).toBe('log');
    expect(getPipelineInput([])).toBeUndefined();
    expect(getPipelineInput(undefined)).toBeUndefined();
  });
});

describe('Utils :: analytics :: buildPipelineDto — the shared half', () => {
  const draft = toPipelineDraft(pipeline);

  test('trims the name', () => {
    expect(buildPipelineDto({ ...draft, name: '  spaced  ' }).name).toBe('spaced');
  });

  test('never sends a member the API refuses', () => {
    const dto = buildPipelineDto({ ...draft, generation: 9, state: {} } as PipelineDraft) as Record<string, unknown>;

    getReadOnlyMembers().forEach((key) => expect(dto).not.toHaveProperty(key));
  });

  test('drops an empty array rather than sending it', () => {
    expect(buildPipelineDto({ ...draft, output_bindings: [], input_bindings: [] })).not.toHaveProperty(
      'output_bindings',
    );
  });

  test('keeps a knob deliberately set to zero', () => {
    expect(buildPipelineDto({ ...draft, batch_chunk: 0 }).batch_chunk).toBe(0);
  });

  test('keeps enabled false', () => {
    expect(buildPipelineDto({ ...draft, enabled: false }).enabled).toBe(false);
  });
});

describe('Utils :: analytics :: buildPipelineDto — the trigger', () => {
  const draft = toPipelineDraft(pipeline);

  test('drops a member belonging to another trigger kind', () => {
    const dto = buildPipelineDto({ ...draft, trigger: { kind: TriggerKind.OnIngest, cron: '0 0 * * * *' } });

    expect(dto.trigger).toEqual({ kind: TriggerKind.OnIngest });
  });

  test('sends the cron of a scheduled trigger', () => {
    const dto = buildPipelineDto({ ...draft, trigger: { kind: TriggerKind.Schedule, cron: '0 0 * * * *' } });

    expect(dto.trigger.cron).toBe('0 0 * * * *');
  });

  test('sends the grouping key from the resolved grain key, not from the draft', () => {
    const dto = buildPipelineDto(
      { ...draft, trigger: { kind: TriggerKind.Group, group_by: 'stale_key', ready_when: { idle: '5m' } } },
      { grainKey: 'response_id' },
    );

    expect(dto.trigger.group_by).toBe('response_id');
  });

  test('omits ready_when when every condition is blank', () => {
    const dto = buildPipelineDto(
      { ...draft, trigger: { kind: TriggerKind.Group, ready_when: { signal: '   ' } } },
      { grainKey: 'response_id' },
    );

    expect(dto.trigger).not.toHaveProperty('ready_when');
  });

  test('omits member selection without a limit', () => {
    const dto = buildPipelineDto(
      {
        ...draft,
        trigger: {
          kind: TriggerKind.Group,
          ready_when: { idle: '5m' },
          member_select: { prefer_sql: 'x > 1' } as never,
        },
      },
      { grainKey: 'response_id' },
    );

    expect(dto.trigger).not.toHaveProperty('member_select');
  });

  test('drops an empty preference from member selection', () => {
    const dto = buildPipelineDto(
      {
        ...draft,
        trigger: { kind: TriggerKind.Group, ready_when: { idle: '5m' }, member_select: { limit: 5, prefer_sql: ' ' } },
      },
      { grainKey: 'response_id' },
    );

    expect(dto.trigger.member_select).toEqual({ limit: 5 });
  });
});

describe('Utils :: analytics :: buildPipelineDto — the read source', () => {
  const draft = toPipelineDraft(pipeline);

  test('omits an input that follows the target enrichment', () => {
    expect(buildPipelineDto({ ...draft, inputs: ['log'] }, { sourceTable: 'log' })).not.toHaveProperty('inputs');
  });

  test('sends a pinned input', () => {
    expect(buildPipelineDto({ ...draft, inputs: ['other'] }, { sourceTable: 'log' }).inputs).toEqual(['other']);
  });

  test('keeps an aggregate input even when it equals the target default', () => {
    const dto = buildPipelineDto(
      {
        kind: PipelineKind.Aggregate,
        name: 'rollup',
        target: 'sessions',
        inputs: ['log'],
        trigger: { kind: TriggerKind.Schedule, cron: '0 0 * * * *' },
      },
      { sourceTable: 'log' },
    );

    expect(dto.inputs).toEqual(['log']);
  });
});

describe('Utils :: analytics :: buildPipelineDto — the kinds do not leak', () => {
  test('an enrichment declaration sends no aggregate member', () => {
    const dto = buildPipelineDto({
      ...toPipelineDraft(pipeline),
      group_by: [{ column: 'chat_id' }],
      measures: [{ name: 'n', fn: 'count' }],
      freshness: { mode: FreshnessMode.Periodic },
    }) as Record<string, unknown>;

    ['group_by', 'measures', 'freshness'].forEach((key) => expect(dto).not.toHaveProperty(key));
  });

  test('an aggregate declaration sends no enrichment member', () => {
    const dto = buildPipelineDto({
      kind: PipelineKind.Aggregate,
      name: 'rollup',
      target: 'sessions',
      inputs: ['log'],
      trigger: { kind: TriggerKind.Schedule, cron: '0 0 * * * *' },
      evaluator_name: 'feedback-rollup',
      evaluator_version: 2,
      output_bindings: [{ column: 'a', var: 'a' }],
      cadence: '60s',
      priority: PipelinePriority.Live,
    }) as Record<string, unknown>;

    ['evaluator_name', 'evaluator_version', 'output_bindings', 'cadence', 'priority'].forEach((key) =>
      expect(dto).not.toHaveProperty(key),
    );
  });
});
