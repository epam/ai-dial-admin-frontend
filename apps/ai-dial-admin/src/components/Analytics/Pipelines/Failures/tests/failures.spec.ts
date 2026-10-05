import { describe, expect, test } from 'vitest';

import {
  countsOf,
  errorLines,
  hasDeadLetters,
  isRetryable,
  matchesSearch,
  pathOf,
  scopeOf,
  visibleFailures,
} from '@/src/components/Analytics/Pipelines/Failures/failures';
import { DlqItem, DlqLane, DlqScope, DlqStage } from '@/src/models/analytics/pipeline-dlq';
import { PipelineKind, TransformType, TriggerKind } from '@/src/models/analytics/pipeline';

const item = (overrides: Partial<DlqItem> = {}): DlqItem => ({
  id: 1,
  pipeline_name: 'usage-live',
  grain_key: null,
  pipeline_generation: 7,
  stage: DlqStage.DialCall,
  error: 'rate limit is exceeded',
  run_id: null,
  requeueable: true,
  created_at: '2026-10-02T10:00:00Z',
  ...overrides,
});

describe('hasDeadLetters', () => {
  test('accepts a model-calling enrichment, whose rows fail one at a time', () => {
    expect(hasDeadLetters(PipelineKind.Enrich, TransformType.Llm)).toBe(true);
  });

  // A statement either applies to the batch or fails it, so there is no single row to act on.
  test('rejects a SQL enrichment', () => {
    expect(hasDeadLetters(PipelineKind.Enrich, TransformType.Sql)).toBe(false);
  });

  test('rejects an aggregate, whatever it declares', () => {
    expect(hasDeadLetters(PipelineKind.Aggregate, TransformType.Llm)).toBe(false);
  });

  test('rejects an enrichment whose transform the read did not resolve', () => {
    expect(hasDeadLetters(PipelineKind.Enrich)).toBe(false);
  });
});

describe('isRetryable', () => {
  test('follows the service flag', () => {
    expect(isRetryable(item())).toBe(true);
    expect(isRetryable(item({ requeueable: false }))).toBe(false);
  });

  // The service refuses a pre-fold payload at requeue time and decides that on the payload, which it
  // does not serve; the generation column was renamed into place without the rows being rewritten, so
  // it says nothing about the era. Predicting the refusal is not possible, so nothing tries.
  test('does not read the declaration revision, which cannot predict the refusal', () => {
    expect(isRetryable(item({ pipeline_generation: 0 }))).toBe(true);
    expect(isRetryable(item({ pipeline_generation: null }))).toBe(true);
  });
});

describe('pathOf', () => {
  test('reads an item naming no run as live', () => {
    expect(pathOf(item())).toBe(DlqLane.Live);
  });

  test('reads an item naming a run as backfill', () => {
    expect(pathOf(item({ run_id: 'run-7' }))).toBe(DlqLane.Backfill);
  });
});

describe('scopeOf', () => {
  test('reads an item carrying a grain key as one row', () => {
    expect(scopeOf(item({ grain_key: 'chat-1' }), TriggerKind.Schedule)).toBe(DlqScope.Row);
  });

  test('reads a keyless write as the write-back', () => {
    expect(scopeOf(item({ stage: DlqStage.Upsert }), TriggerKind.Schedule)).toBe(DlqScope.Write);
  });

  test('reads any other keyless item as its chunk', () => {
    expect(scopeOf(item({ stage: DlqStage.Validate }), TriggerKind.Schedule)).toBe(DlqScope.Chunk);
  });

  // On a group pipeline the grain key holds the group's key, so the row/chunk reading inverts.
  test('states no scope on a group pipeline', () => {
    expect(scopeOf(item({ grain_key: 'group-1' }), TriggerKind.Group)).toBeUndefined();
  });
});

describe('countsOf', () => {
  test('takes the split from the service counters', () => {
    expect(countsOf({ total: 37, requeueable_total: 21 })).toEqual({ total: 37, retryable: 21, notRetryable: 16 });
  });

  test('counts nothing for a pipeline the service reports nothing for', () => {
    expect(countsOf({ total: 0, requeueable_total: 0 })).toEqual({ total: 0, retryable: 0, notRetryable: 0 });
  });

  // The two counters are read in one snapshot, so this cannot happen — but a negative remainder on
  // screen would be worse than a zero.
  test('never states a negative remainder', () => {
    expect(countsOf({ total: 2, requeueable_total: 5 }).notRetryable).toBe(0);
  });
});

describe('errorLines', () => {
  test('splits a message reporting several validation failures', () => {
    expect(errorLines('$.tokens_out: string found, integer expected; $.client_tier: not in the enumeration')).toEqual([
      '$.tokens_out: string found, integer expected',
      '$.client_tier: not in the enumeration',
    ]);
  });

  test('leaves a single-part message as one line', () => {
    expect(errorLines('response is not valid JSON')).toEqual(['response is not valid JSON']);
  });

  // The column is nullable and the service omits a null key, so an item without a message is ordinary.
  test('returns nothing for a failure the service recorded no message for', () => {
    expect(errorLines(undefined)).toEqual([]);
    expect(errorLines(null)).toEqual([]);
  });
});

describe('matchesSearch', () => {
  test('matches the failure message', () => {
    expect(matchesSearch(item({ error: 'Rate limit is exceeded' }), 'rate')).toBe(true);
  });

  test('matches the grain key', () => {
    expect(matchesSearch(item({ grain_key: 'chat-42' }), 'chat-4')).toBe(true);
  });

  test('matches everything on an empty term', () => {
    expect(matchesSearch(item(), '')).toBe(true);
  });

  test('survives a failure the service recorded no message for', () => {
    expect(matchesSearch(item({ error: undefined, grain_key: null }), 'rate')).toBe(false);
  });
});

describe('visibleFailures', () => {
  const items = [
    item({ id: 1, error: 'rate limit' }),
    item({ id: 2, error: 'not valid JSON' }),
    item({ id: 3, error: undefined }),
  ];

  test('narrows by search, ignoring case', () => {
    expect(visibleFailures(items, 'RATE').map(({ id }) => id)).toEqual([1]);
  });

  test('returns everything on an empty term', () => {
    expect(visibleFailures(items, '   ')).toHaveLength(3);
  });
});
