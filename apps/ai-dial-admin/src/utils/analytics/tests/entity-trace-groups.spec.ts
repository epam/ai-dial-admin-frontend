import { describe, expect, test } from 'vitest';

import { EntityCallRow } from '@/src/models/analytics/entity-traces';
import { SessionTraceFigureRow } from '@/src/models/analytics/sessions-trace';
import {
  entityTraceCursorOf,
  entityTraceGroupsOf,
  mergeEntityTraceGroups,
} from '@/src/utils/analytics/entity-trace-groups';

const call = (over: Partial<EntityCallRow> = {}): EntityCallRow => ({
  trace_id: 't1',
  core_span_id: 's1',
  request_time: 3000,
  operation_duration_ms: 1200,
  success: true,
  response_status: 200,
  total_tokens: 40,
  total_price: 0.02,
  deployment_price: 0.01,
  request_uri: '/openai/deployments/a-model/chat/completions',
  event_kind: 'llm_call',
  number_request_messages: 2,
  deployment: 'a-model',
  parent_deployment: 'an-app',
  project_id: 'a-project',
  ...over,
});

const figure = (over: Partial<SessionTraceFigureRow> = {}): SessionTraceFigureRow => ({
  trace_id: 't1',
  event_kind: 'llm_call',
  spans: 3,
  tokens: 100,
  price: 0.05,
  failed_spans: 1,
  response_ids: ['r1'],
  ...over,
});

describe('entityTraceGroupsOf', () => {
  test('makes each call a card stating its caller and project', () => {
    const [group] = entityTraceGroupsOf([call()], [figure()]);

    expect(group.cards).toEqual([
      expect.objectContaining({
        coreSpanId: 's1',
        caller: 'an-app',
        projectId: 'a-project',
        hasSessionLabel: false,
        isCoreInternal: false,
      }),
    ]);
  });

  test('states the trace figures from the figures pass, not from the call', () => {
    const [group] = entityTraceGroupsOf(
      [call()],
      [figure(), figure({ event_kind: 'mcp', spans: 2, tokens: 0, price: 0, failed_spans: 0 })],
    );

    expect(group).toEqual(expect.objectContaining({ spans: 5, tokens: 100, price: 0.05, failedSpans: 1 }));
  });

  test('puts two calls in one trace under one group, in arrival order', () => {
    const groups = entityTraceGroupsOf(
      [call({ core_span_id: 'late' }), call({ trace_id: 't2' }), call({ core_span_id: 'early' })],
      [],
    );

    expect(groups.map(({ traceId }) => traceId)).toEqual(['t1', 't2']);
    expect(groups[0].cards.map(({ coreSpanId }) => coreSpanId)).toEqual(['late', 'early']);
  });

  test('states an unrecorded caller as null', () => {
    const [group] = entityTraceGroupsOf([call({ parent_deployment: null })], []);

    expect(group.cards[0].caller).toBeNull();
  });

  test('yields no groups for no calls', () => {
    expect(entityTraceGroupsOf([], [figure()])).toEqual([]);
  });
});

describe('entityTraceCursorOf', () => {
  test('points after the page last call', () => {
    expect(entityTraceCursorOf([call({ core_span_id: 'a' }), call({ core_span_id: 'b', request_time: 1000 })])).toEqual(
      { requestTime: 1000, coreSpanId: 'b' },
    );
  });

  test('yields no cursor for an empty page or an unrecorded time', () => {
    expect(entityTraceCursorOf([])).toBeNull();
    expect(entityTraceCursorOf([call({ request_time: null })])).toBeNull();
  });
});

describe('mergeEntityTraceGroups', () => {
  const [first] = entityTraceGroupsOf([call({ core_span_id: 'a' })], [figure()]);

  test('appends a new trace after those shown', () => {
    const [second] = entityTraceGroupsOf([call({ trace_id: 't2' })], []);

    expect(mergeEntityTraceGroups([first], [second]).map(({ traceId }) => traceId)).toEqual(['t1', 't2']);
  });

  test('joins a straddling trace later call to the group already shown', () => {
    const [later] = entityTraceGroupsOf([call({ core_span_id: 'b', request_time: 1000 })], [figure({ spans: 7 })]);

    const [merged] = mergeEntityTraceGroups([first], [later]);

    expect(merged.cards.map(({ coreSpanId }) => coreSpanId)).toEqual(['a', 'b']);
    expect(merged.startedAt).toBe(first.startedAt);
    expect(merged.spans).toBe(7);
  });

  test('discards a call already shown', () => {
    const [again] = entityTraceGroupsOf([call({ core_span_id: 'a' })], [figure()]);

    expect(mergeEntityTraceGroups([first], [again])).toEqual([first]);
  });
});
