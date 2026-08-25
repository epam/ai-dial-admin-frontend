import { describe, expect, test } from 'vitest';

import { EvaluatorSummary, EvaluatorType } from '@/src/models/analytics/evaluator';
import { EnrichmentRuleListItem, TriggerKind } from '@/src/models/analytics/rule';
import { getReferencingRules, toEvaluatorRows, toEvaluatorUsage } from '@/src/utils/analytics/evaluator-usage';

const rule = (over: Partial<EnrichmentRuleListItem>): EnrichmentRuleListItem => ({
  id: 'r_1',
  name: 'turn-feedback-live',
  evaluator_name: 'feedback-rollup',
  evaluator_version: 2,
  evaluator: { name: 'feedback-rollup', version: 2, type: EvaluatorType.Sql },
  target_enrichment: 'turn_feedback',
  grain_key: 'response_id',
  trigger_kind: TriggerKind.OnIngest,
  enabled: true,
  generation: 5,
  updated_at: '2026-08-21T09:37:29Z',
  ...over,
});

const summary = (name: string, over: Partial<EvaluatorSummary> = {}): EvaluatorSummary => ({
  name,
  latest_version: 2,
  created_at: '2026-08-17T10:00:00Z',
  ...over,
});

describe('toEvaluatorUsage', () => {
  test('counts the rules naming each evaluator', () => {
    const usage = toEvaluatorUsage([
      rule({ id: 'r_1' }),
      rule({ id: 'r_2' }),
      rule({ id: 'r_3', evaluator_name: 'conversation-insights' }),
    ]);

    expect([...usage]).toEqual([
      ['feedback-rollup', 2],
      ['conversation-insights', 1],
    ]);
  });

  test('counts across versions rather than per version', () => {
    const usage = toEvaluatorUsage([
      rule({ id: 'r_1', evaluator_version: 2 }),
      rule({ id: 'r_2', evaluator_version: undefined }),
      rule({ id: 'r_3', evaluator_version: 4 }),
    ]);

    expect(usage.get('feedback-rollup')).toBe(3);
  });

  test('holds no entry for an evaluator no rule names', () => {
    expect(toEvaluatorUsage([rule({})]).get('conversation-insights')).toBeUndefined();
  });

  test('is empty for an empty rule list', () => {
    expect(toEvaluatorUsage([]).size).toBe(0);
  });

  // A name is only `@NotBlank` on the service, so these are registerable. A plain-object accumulator
  // resolves every one of them against `Object.prototype` and counts a function instead of a number.
  test.each(['constructor', 'toString', '__proto__', 'hasOwnProperty'])('counts an evaluator named %s', (name) => {
    const usage = toEvaluatorUsage([
      rule({ id: 'r_1', evaluator_name: name }),
      rule({ id: 'r_2', evaluator_name: name }),
    ]);

    expect(usage.get(name)).toBe(2);
  });
});

describe('toEvaluatorRows', () => {
  test('attaches the count to each evaluator', () => {
    const rows = toEvaluatorRows(
      [summary('feedback-rollup'), summary('conversation-insights')],
      new Map([['feedback-rollup', 2]]),
    );

    expect(rows.map((item) => [item.name, item.usedBy])).toEqual([
      ['feedback-rollup', 2],
      ['conversation-insights', 0],
    ]);
  });

  test('reports zero for an evaluator the usage map does not mention', () => {
    const [row] = toEvaluatorRows([summary('conversation-insights')], new Map());

    expect(row.usedBy).toBe(0);
  });

  test('reports null rather than zero when there is no usage map', () => {
    const [row] = toEvaluatorRows([summary('conversation-insights')], null);

    expect(row.usedBy).toBeNull();
  });

  test.each(['constructor', 'toString', '__proto__'])('reports zero for an unreferenced evaluator named %s', (name) => {
    const [row] = toEvaluatorRows([summary(name)], new Map([['feedback-rollup', 1]]));

    expect(row.usedBy).toBe(0);
  });

  test('carries the members the grid renders', () => {
    const [row] = toEvaluatorRows([summary('feedback-rollup', { latest_version: 4 })], new Map());

    expect(row).toEqual({
      name: 'feedback-rollup',
      latest_version: 4,
      created_at: '2026-08-17T10:00:00Z',
      usedBy: 0,
    });
  });
});

describe('getReferencingRules', () => {
  test('selects only the rules naming that evaluator', () => {
    const referencing = getReferencingRules(
      [rule({ id: 'r_1' }), rule({ id: 'r_2', evaluator_name: 'conversation-insights' })],
      'feedback-rollup',
    );

    expect(referencing.map((item) => item.id)).toEqual(['r_1']);
  });

  test('reports a pinned rule with the version it pins', () => {
    const [referencing] = getReferencingRules([rule({ evaluator_version: 2 })], 'feedback-rollup');

    expect(referencing).toMatchObject({ version: 2, isTrackingLatest: false });
  });

  test('reports a rule declaring no version as tracking the latest', () => {
    const [referencing] = getReferencingRules(
      [
        rule({
          evaluator_version: undefined,
          evaluator: { name: 'feedback-rollup', version: 4, type: EvaluatorType.Sql },
        }),
      ],
      'feedback-rollup',
    );

    expect(referencing).toMatchObject({ version: 4, isTrackingLatest: true });
  });

  test('is empty when no rule names the evaluator', () => {
    expect(getReferencingRules([rule({})], 'conversation-insights')).toEqual([]);
  });
});
