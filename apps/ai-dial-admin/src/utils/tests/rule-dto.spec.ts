import { describe, expect, test } from 'vitest';

import { RuleDraft, SourceMode } from '@/src/models/analytics/enrichment-rules-ui';
import { EnrichmentRule, RulePriority, TriggerKind } from '@/src/models/analytics/rule';
import { EvaluatorType } from '@/src/models/analytics/evaluator';
import { buildRuleDto, getReadOnlyMembers, getSourceMode, toRuleDraft } from '@/src/utils/analytics/rule-dto';

const rule: EnrichmentRule = {
  id: 'rule-1',
  name: 'existing',
  evaluator_name: 'feedback-rollup',
  evaluator: { name: 'feedback-rollup', version: 2, type: EvaluatorType.Sql },
  target_enrichment: 'turn_feedback',
  trigger_kind: TriggerKind.OnIngest,
  enabled: true,
  grain_key: 'response_id',
  version_column: 'ingested_at',
  generation: 3,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-02-01T00:00:00Z',
};

describe('toRuleDraft', () => {
  test('drops every member the API refuses', () => {
    const draft = toRuleDraft(rule) as Record<string, unknown>;

    getReadOnlyMembers().forEach((key) => expect(draft).not.toHaveProperty(key));
  });

  test('keeps a member no control presents', () => {
    const draft = toRuleDraft({ ...rule, filter_sql: 'x > 1', rate_rpm: 60 });

    expect(draft.filter_sql).toBe('x > 1');
    expect(draft.rate_rpm).toBe(60);
  });

  test('does not mutate the rule it was given', () => {
    const input = { ...rule };
    toRuleDraft(input);

    expect(input.id).toBe('rule-1');
    expect(input.generation).toBe(3);
  });
});

describe('getSourceMode', () => {
  test('reads no source as following', () => {
    expect(getSourceMode(undefined, 'log')).toBe(SourceMode.Follow);
  });

  test('reads a source equal to the default as following', () => {
    expect(getSourceMode('log', 'log')).toBe(SourceMode.Follow);
  });

  test('reads a differing source as pinned', () => {
    expect(getSourceMode('other', 'log')).toBe(SourceMode.Pin);
  });

  test('reads a source as pinned when the default is not yet known', () => {
    expect(getSourceMode('other', undefined)).toBe(SourceMode.Pin);
  });
});

describe('buildRuleDto', () => {
  const draft = toRuleDraft(rule);

  test('trims the name', () => {
    expect(buildRuleDto({ ...draft, name: '  spaced  ' }).name).toBe('spaced');
  });

  test('drops a trigger member belonging to another kind', () => {
    const dto = buildRuleDto({ ...draft, trigger_kind: TriggerKind.OnIngest, trigger_cron: '0 0 * * * *' });

    expect(dto).not.toHaveProperty('trigger_cron');
  });

  test('sends group_by from the resolved grain key, not from the draft', () => {
    const dto = buildRuleDto(
      { ...draft, trigger_kind: TriggerKind.Group, group_by: 'stale_key', ready_when: { idle: '5m' } },
      { grainKey: 'response_id' },
    );

    expect(dto.group_by).toBe('response_id');
  });

  test('omits ready_when when every condition is blank', () => {
    const dto = buildRuleDto(
      { ...draft, trigger_kind: TriggerKind.Group, ready_when: { signal: '   ' } },
      { grainKey: 'response_id' },
    );

    expect(dto).not.toHaveProperty('ready_when');
  });

  test('omits member_select without a limit', () => {
    const dto = buildRuleDto(
      { ...draft, trigger_kind: TriggerKind.Group, ready_when: { idle: '5m' }, member_select: { limit: 0 } },
      { grainKey: 'response_id' },
    );

    expect(dto).not.toHaveProperty('member_select');
  });

  test('drops an empty prefer_sql from member_select', () => {
    const dto = buildRuleDto(
      {
        ...draft,
        trigger_kind: TriggerKind.Group,
        ready_when: { idle: '5m' },
        member_select: { limit: 5, prefer_sql: '  ' },
      },
      { grainKey: 'response_id' },
    );

    expect(dto.member_select).toEqual({ limit: 5 });
  });

  test('omits a source that follows the target enrichment', () => {
    expect(buildRuleDto({ ...draft, source: 'log' }, { sourceTable: 'log' })).not.toHaveProperty('source');
  });

  test('sends a pinned source', () => {
    expect(buildRuleDto({ ...draft, source: 'other' }, { sourceTable: 'log' }).source).toBe('other');
  });

  test('drops an empty array rather than sending it', () => {
    expect(buildRuleDto({ ...draft, output_bindings: [], input_bindings: [] })).not.toHaveProperty('output_bindings');
  });

  test('keeps a knob deliberately set to zero', () => {
    expect(buildRuleDto({ ...draft, batch_chunk: 0 }).batch_chunk).toBe(0);
  });

  test('keeps enabled false', () => {
    expect(buildRuleDto({ ...draft, enabled: false }).enabled).toBe(false);
  });

  test('drops a cleared string knob', () => {
    expect(buildRuleDto({ ...draft, cadence: '' })).not.toHaveProperty('cadence');
  });

  test('carries priority through', () => {
    expect(buildRuleDto({ ...draft, priority: RulePriority.Backfill }).priority).toBe(RulePriority.Backfill);
  });

  test('never sends a read-only member even if one is on the draft', () => {
    const dto = buildRuleDto({ ...draft, generation: 9 } as never) as Record<string, unknown>;

    expect(dto).not.toHaveProperty('generation');
  });

  test('does not mutate the draft it was given', () => {
    const input = { ...draft, trigger_kind: TriggerKind.Schedule, trigger_cron: '0 0 * * * *' };
    buildRuleDto({ ...input, trigger_kind: TriggerKind.OnIngest });

    expect(input.trigger_cron).toBe('0 0 * * * *');
  });
});

describe('buildRuleDto — a draft that came from the JSON editor', () => {
  test.each([
    ['name as a number', TriggerKind.OnIngest, { name: 5 }],
    ['name as an object', TriggerKind.OnIngest, { name: {} }],
    ['trigger_cron as a number on a scheduled rule', TriggerKind.Schedule, { trigger_cron: 5 }],
    ['prefer_sql as a number on a group rule', TriggerKind.Group, { member_select: { limit: 1, prefer_sql: 5 } }],
    ['order_by as a string on a group rule', TriggerKind.Group, { member_select: { limit: 1, order_by: 'x' } }],
    ['ready_when as a string on a group rule', TriggerKind.Group, { ready_when: 'x' }],
    ['ready_when.signal as a number on a group rule', TriggerKind.Group, { ready_when: { signal: 5 } }],
    ['source as a number', TriggerKind.OnIngest, { source: 5 }],
    ['input_bindings as an object', TriggerKind.OnIngest, { input_bindings: {} }],
  ])('does not throw on %s', (_label, kind, patch) => {
    const draft = { ...toRuleDraft(rule), trigger_kind: kind, ...patch } as unknown as RuleDraft;

    expect(() => buildRuleDto(draft, { grainKey: 'g', sourceTable: 'dial_usage_log' })).not.toThrow();
  });

  test('a member_select order_by that is not a list is dropped rather than sent', () => {
    const dto = buildRuleDto(
      {
        ...toRuleDraft(rule),
        trigger_kind: TriggerKind.Group,
        member_select: { limit: 1, order_by: 'x' },
      } as unknown as RuleDraft,
      { grainKey: 'g' },
    );

    expect(dto.member_select).toEqual({ limit: 1 });
  });

  test('a ready_when that is not an object is dropped rather than sent', () => {
    const dto = buildRuleDto(
      { ...toRuleDraft(rule), trigger_kind: TriggerKind.Group, ready_when: 'x' } as unknown as RuleDraft,
      { grainKey: 'g' },
    );

    expect(dto).not.toHaveProperty('ready_when');
  });

  test('a wrongly typed name is dropped rather than faulting, and the service refuses it', () => {
    // Narrowed to a blank string, then removed by the empty-member prune — so the name is absent rather
    // than blank, and `@NotBlank` on the service is what refuses it.
    const dto = buildRuleDto({ ...toRuleDraft(rule), name: 5 } as unknown as RuleDraft);

    expect(dto).not.toHaveProperty('name');
  });

  test('an assembled request is itself a valid draft, so it round-trips', () => {
    const context = { grainKey: 'response_id', sourceTable: 'dial_usage_log' };
    const first = buildRuleDto(toRuleDraft(rule), context);

    expect(buildRuleDto(first as RuleDraft, context)).toEqual(first);
  });

  test('a rule that follows its target does not come back pinned', () => {
    const context = { grainKey: 'response_id', sourceTable: 'dial_usage_log' };
    const followed = buildRuleDto({ ...toRuleDraft(rule), source: 'dial_usage_log' } as RuleDraft, context);

    expect(followed).not.toHaveProperty('source');
    expect(buildRuleDto(followed as RuleDraft, context)).not.toHaveProperty('source');
  });
});
