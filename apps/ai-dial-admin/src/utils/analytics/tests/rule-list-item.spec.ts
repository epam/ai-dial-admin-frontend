import { describe, expect, test } from 'vitest';

import { Evaluator, EvaluatorType } from '@/src/models/analytics/evaluator';
import { EnrichmentRule, TriggerKind } from '@/src/models/analytics/rule';
import { toRuleListItem } from '@/src/utils/analytics/rule-list-item';

const evaluator: Evaluator = {
  name: 'conversation-insights',
  version: 4,
  type: EvaluatorType.Llm,
  request_template: 'a very long prompt template'.repeat(200),
  response_schema: { type: 'object' },
  input_vars: [{ name: 'request', type: 'string' }],
  output_vars: [{ name: 'title', type: 'string' }],
};

const rule: EnrichmentRule = {
  id: 'r_1',
  name: 'conversation-insights-live',
  evaluator_name: 'conversation-insights',
  evaluator_version: 4,
  evaluator,
  target_enrichment: 'conversation_insights',
  source: 'dial_usage_log',
  grain_key: 'chat_id',
  version_column: '_ingested_at',
  trigger_kind: TriggerKind.Group,
  group_by: 'chat_id',
  ready_when: { idle: '30m' },
  filter_sql: 'length(chat_id) > 0',
  output_bindings: [{ column: 'title', var: 'title' }],
  enabled: true,
  generation: 10,
  created_at: '2026-08-17T11:59:13Z',
  updated_at: '2026-08-24T16:33:41Z',
};

describe('Utils :: analytics :: toRuleListItem', () => {
  test('keeps the fields the listing grid reads', () => {
    expect(toRuleListItem(rule)).toEqual({
      id: 'r_1',
      name: 'conversation-insights-live',
      evaluator_name: 'conversation-insights',
      evaluator_version: 4,
      evaluator: { name: 'conversation-insights', version: 4, type: EvaluatorType.Llm },
      target_enrichment: 'conversation_insights',
      source: 'dial_usage_log',
      grain_key: 'chat_id',
      version_column: '_ingested_at',
      trigger_kind: TriggerKind.Group,
      trigger_cron: undefined,
      group_by: 'chat_id',
      enabled: true,
      generation: 10,
      updated_at: '2026-08-24T16:33:41Z',
    });
  });

  test('drops the evaluator definition beyond name, version and type', () => {
    const item = toRuleListItem(rule);

    expect(item.evaluator).not.toHaveProperty('request_template');
    expect(item.evaluator).not.toHaveProperty('response_schema');
    expect(item.evaluator).not.toHaveProperty('input_vars');
    expect(item.evaluator).not.toHaveProperty('output_vars');
  });

  test('drops the rule members the listing does not show', () => {
    const item = toRuleListItem(rule) as Record<string, unknown>;

    expect(item).not.toHaveProperty('filter_sql');
    expect(item).not.toHaveProperty('ready_when');
    expect(item).not.toHaveProperty('output_bindings');
  });

  test('carries an absent version column through as undefined', () => {
    expect(toRuleListItem({ ...rule, version_column: undefined }).version_column).toBeUndefined();
  });
});
