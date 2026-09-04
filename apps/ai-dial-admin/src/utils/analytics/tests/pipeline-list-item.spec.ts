import { describe, expect, test } from 'vitest';

import { Evaluator, EvaluatorType } from '@/src/models/analytics/evaluator';
import { FreshnessMode, Pipeline, PipelineKind, TriggerKind } from '@/src/models/analytics/pipeline';
import { toPipelineListItem } from '@/src/utils/analytics/pipeline-list-item';

const evaluator: Evaluator = {
  name: 'conversation-insights',
  version: 4,
  type: EvaluatorType.Llm,
  request_template: 'a very long prompt template'.repeat(200),
  response_schema: { type: 'object' },
  input_vars: [{ name: 'request', type: 'string' }],
  output_vars: [{ name: 'title', type: 'string' }],
};

const enrichPipeline: Pipeline = {
  name: 'conversation-insights-live',
  kind: PipelineKind.Enrich,
  evaluator_name: 'conversation-insights',
  evaluator_version: 4,
  evaluator,
  target: 'conversation_insights',
  inputs: ['dial_usage_log'],
  grain_key: 'chat_id',
  version_column: '_ingested_at',
  trigger: { kind: TriggerKind.Group, group_by: 'chat_id', ready_when: { idle: '30m' } },
  filter: 'length(chat_id) > 0',
  output_bindings: [{ column: 'title', var: 'title' }],
  enabled: true,
  generation: 10,
  created_at: '2026-08-17T11:59:13Z',
  updated_at: '2026-08-24T16:33:41Z',
};

const aggregatePipeline: Pipeline = {
  name: 'sessions_rollup',
  kind: PipelineKind.Aggregate,
  target: 'sessions',
  inputs: ['dial_usage_log'],
  trigger: { kind: TriggerKind.Schedule, cron: '0 3/15 * * * *' },
  group_by: [{ column: 'client_session_id' }],
  measures: [{ name: 'turn_count', fn: 'count', column: 'trace_id', distinct: true }],
  freshness: { mode: FreshnessMode.Periodic },
  enabled: true,
  generation: 2,
  created_at: '2026-08-27T15:02:41Z',
  updated_at: '2026-09-04T07:48:01Z',
};

describe('Utils :: analytics :: toPipelineListItem', () => {
  test('keeps the fields the listing grid reads', () => {
    expect(toPipelineListItem(enrichPipeline)).toEqual({
      name: 'conversation-insights-live',
      kind: PipelineKind.Enrich,
      evaluator_name: 'conversation-insights',
      evaluator_version: 4,
      evaluator: { name: 'conversation-insights', version: 4, type: EvaluatorType.Llm },
      target: 'conversation_insights',
      inputs: ['dial_usage_log'],
      grain_key: 'chat_id',
      version_column: '_ingested_at',
      trigger: { kind: TriggerKind.Group, group_by: 'chat_id', ready_when: { idle: '30m' } },
      enabled: true,
      generation: 10,
      updated_at: '2026-08-24T16:33:41Z',
    });
  });

  test('drops the evaluator definition beyond name, version and type', () => {
    const item = toPipelineListItem(enrichPipeline);

    expect(item.evaluator).not.toHaveProperty('request_template');
    expect(item.evaluator).not.toHaveProperty('response_schema');
    expect(item.evaluator).not.toHaveProperty('input_vars');
    expect(item.evaluator).not.toHaveProperty('output_vars');
  });

  test('drops the members the listing does not show', () => {
    const item = toPipelineListItem(enrichPipeline) as Record<string, unknown>;

    expect(item).not.toHaveProperty('filter');
    expect(item).not.toHaveProperty('output_bindings');
    expect(item).not.toHaveProperty('created_at');
  });

  test('leaves the enrichment members absent on an aggregate pipeline', () => {
    const item = toPipelineListItem(aggregatePipeline);

    expect(item.kind).toBe(PipelineKind.Aggregate);
    expect(item.evaluator).toBeUndefined();
    expect(item.evaluator_name).toBeUndefined();
    expect(item.grain_key).toBeUndefined();
    expect(item.version_column).toBeUndefined();
  });

  test('carries an absent version column through as undefined', () => {
    expect(toPipelineListItem({ ...enrichPipeline, version_column: undefined }).version_column).toBeUndefined();
  });
});
