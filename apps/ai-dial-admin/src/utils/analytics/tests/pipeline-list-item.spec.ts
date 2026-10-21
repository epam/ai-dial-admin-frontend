import { describe, expect, test } from 'vitest';

import { Pipeline, PipelineKind, TransformType, TriggerKind } from '@/src/models/analytics/pipeline';
import { toPipelineListItem } from '@/src/utils/analytics/pipeline-list-item';

const enrichPipeline: Pipeline = {
  name: 'conversation-insights-live',
  kind: PipelineKind.Enrich,
  transform: {
    type: TransformType.Llm,
    model: 'gpt-4o',
    request_template: 'a very long prompt template'.repeat(200),
    outputs: { title: 'Title of the session.' },
  },
  target: 'conversation_insights',
  inputs: ['dial_usage_log'],
  grain_key: 'chat_id',
  version_column: '_ingested_at',
  trigger: { kind: TriggerKind.Group, group_by: 'chat_id', ready_when: { idle: '30m' } },
  filter: 'length(chat_id) > 0',
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
      transform_type: TransformType.Llm,
      target: 'conversation_insights',
      inputs: ['dial_usage_log'],
      trigger: { kind: TriggerKind.Group, group_by: 'chat_id', ready_when: { idle: '30m' } },
      enabled: true,
      generation: 10,
      updated_at: '2026-08-24T16:33:41Z',
    });
  });

  test('carries the transform type alone, not the declaration that holds the prompt', () => {
    const item = toPipelineListItem(enrichPipeline);

    expect(item.transform_type).toBe(TransformType.Llm);
    expect(item).not.toHaveProperty('transform');
  });

  test('drops the members the listing does not show', () => {
    const item = toPipelineListItem(enrichPipeline);

    expect(item).not.toHaveProperty('filter');
    expect(item).not.toHaveProperty('created_at');
  });

  test('leaves the enrichment members absent on an aggregate pipeline', () => {
    const item = toPipelineListItem(aggregatePipeline);

    expect(item.kind).toBe(PipelineKind.Aggregate);
    expect(item.transform_type).toBeUndefined();
  });

  test('carries no resolved-only member, which no column reads', () => {
    const item = toPipelineListItem(enrichPipeline);

    expect(item).not.toHaveProperty('grain_key');
    expect(item).not.toHaveProperty('version_column');
  });
});
