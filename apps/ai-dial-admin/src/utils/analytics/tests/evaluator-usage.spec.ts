import { describe, expect, test } from 'vitest';

import { EvaluatorSummary } from '@/src/models/analytics/evaluator';
import { PipelineKind, PipelineListItem, TriggerKind } from '@/src/models/analytics/pipeline';
import { getReferencingPipelines, toEvaluatorRows, toEvaluatorUsage } from '@/src/utils/analytics/evaluator-usage';

// The listing item is deliberately slimmer than a detail read: `toPipelineListItem` drops the nested
// `evaluator`, the `grain_key` and the filter, so a rule here is identified by `name`.
const rule = (over: Partial<PipelineListItem> = {}): PipelineListItem => ({
  name: 'turn-feedback-live',
  kind: PipelineKind.Enrich,
  target: 'turn_feedback',
  inputs: ['dial_usage_log'],
  trigger: { kind: TriggerKind.OnIngest },
  evaluator_name: 'feedback-rollup',
  evaluator_version: 2,
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
      rule({ name: 'rule-1' }),
      rule({ name: 'rule-2' }),
      rule({ name: 'rule-3', evaluator_name: 'conversation-insights' }),
    ]);

    expect([...usage]).toEqual([
      ['feedback-rollup', 2],
      ['conversation-insights', 1],
    ]);
  });

  test('counts across versions rather than per version', () => {
    const usage = toEvaluatorUsage([
      rule({ name: 'rule-1', evaluator_version: 2 }),
      rule({ name: 'rule-2', evaluator_version: undefined }),
      rule({ name: 'rule-3', evaluator_version: 4 }),
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
      rule({ name: 'rule-1', evaluator_name: name }),
      rule({ name: 'rule-2', evaluator_name: name }),
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

describe('getReferencingPipelines', () => {
  test('selects only the rules naming that evaluator', () => {
    const referencing = getReferencingPipelines(
      [rule({ name: 'rule-1' }), rule({ name: 'rule-2', evaluator_name: 'conversation-insights' })],
      'feedback-rollup',
    );

    expect(referencing.map((item) => item.name)).toEqual(['rule-1']);
  });

  test('keeps the whole rule so the grid can render its own columns', () => {
    const [referencing] = getReferencingPipelines([rule({ evaluator_version: 2 })], 'feedback-rollup');

    expect(referencing).toMatchObject({
      name: 'turn-feedback-live',
      kind: PipelineKind.Enrich,
      target: 'turn_feedback',
      trigger: { kind: TriggerKind.OnIngest },
      evaluator_version: 2,
    });
  });

  // The listing carries no resolved evaluator object, so "no declared version" is all a row can say:
  // a rule that pins none still belongs to the evaluator it names, and the column renders empty.
  test('keeps a rule that declares no version', () => {
    const [referencing] = getReferencingPipelines([rule({ evaluator_version: undefined })], 'feedback-rollup');

    expect(referencing.evaluator_name).toBe('feedback-rollup');
    expect(referencing.evaluator_version).toBeUndefined();
  });

  test('is empty when no rule names the evaluator', () => {
    expect(getReferencingPipelines([rule({})], 'conversation-insights')).toEqual([]);
  });
});
