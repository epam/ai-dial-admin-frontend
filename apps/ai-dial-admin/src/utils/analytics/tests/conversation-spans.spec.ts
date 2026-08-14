import { describe, expect, test } from 'vitest';

import { ConversationSpanRow, SpanCategory } from '@/src/models/analytics/conversations-trace';
import {
  areSpansPartial,
  buildSpanTree,
  spanCategoryOf,
  spanLabelOf,
  traceTotalsOf,
} from '@/src/utils/analytics/conversation-spans';

const span = (overrides: Partial<ConversationSpanRow> = {}): ConversationSpanRow => ({
  core_span_id: 's1',
  core_parent_span_id: null,
  event_kind: 'llm_call',
  deployment: 'switchyard-model',
  parent_deployment: null,
  request_method: 'POST',
  request_uri: '/openai/deployments/switchyard-model/chat/completions',
  response_upstream_uri: 'https://core.dial.parts/openai/deployments/switchyard',
  response_status: 200,
  success: true,
  operation_duration_ms: 5215,
  total_tokens: 18,
  deployment_price: '0.001',
  request_time: '2026-08-13T10:59:05.600Z',
  ...overrides,
});

describe('spanCategoryOf', () => {
  test.each([
    ['llm_call', SpanCategory.Deployment],
    ['embedding', SpanCategory.Embedding],
    ['mcp', SpanCategory.Retrieval],
    ['route', SpanCategory.Route],
    ['', SpanCategory.Other],
  ])('maps event kind %s to its category', (event_kind, expected) => {
    expect(spanCategoryOf(span({ event_kind }))).toBe(expected);
  });

  // On a trace the reader is scanning for what broke, so failure outranks what the hop was doing.
  test('a failed hop is categorised as an error whatever its kind', () => {
    expect(spanCategoryOf(span({ event_kind: 'embedding', success: false }))).toBe(SpanCategory.Error);
  });

  test('an unknown kind falls back rather than throwing', () => {
    expect(spanCategoryOf(span({ event_kind: 'something-new' }))).toBe(SpanCategory.Other);
  });
});

describe('spanLabelOf', () => {
  test('prefers the deployment name', () => {
    expect(spanLabelOf(span())).toBe('switchyard-model');
  });

  test('falls back to the request uri, then to the span id', () => {
    expect(spanLabelOf(span({ deployment: '' }))).toBe('/openai/deployments/switchyard-model/chat/completions');
    expect(spanLabelOf(span({ deployment: null, request_uri: null }))).toBe('s1');
  });
});

describe('buildSpanTree', () => {
  const parent = span({ core_span_id: 'root', request_time: 1000 });
  const child = span({ core_span_id: 'child', core_parent_span_id: 'root', request_time: 1200 });
  const grandchild = span({ core_span_id: 'grand', core_parent_span_id: 'child', request_time: 1300 });

  test('nests children under their parent and records depth', () => {
    const nodes = buildSpanTree([parent, child, grandchild]);

    expect(nodes.map(({ span: { core_span_id }, depth }) => [core_span_id, depth])).toEqual([
      ['root', 0],
      ['child', 1],
      ['grand', 2],
    ]);
  });

  // A chain's first hop is often recorded elsewhere, so a span whose parent is absent must still appear.
  test('a span whose parent is outside the result set is treated as a root', () => {
    const nodes = buildSpanTree([span({ core_span_id: 'orphan', core_parent_span_id: 'missing' })]);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].depth).toBe(0);
  });

  test('offsets are measured from the earliest span in the trace', () => {
    const nodes = buildSpanTree([parent, child]);

    expect(nodes.map(({ offsetMs }) => offsetMs)).toEqual([0, 200]);
  });

  test('an unparseable timestamp yields no offset rather than a wrong one', () => {
    const nodes = buildSpanTree([span({ request_time: 'not-a-time' })]);

    expect(nodes[0].offsetMs).toBeNull();
  });

  test('no spans yields no nodes', () => {
    expect(buildSpanTree([])).toEqual([]);
  });
});

describe('traceTotalsOf', () => {
  // Spans of one trace overlap, so the enclosing hop's duration is the latency; summing would double-count.
  test('reports the longest span as the latency', () => {
    const totals = traceTotalsOf([
      span({ operation_duration_ms: 5215 }),
      span({ core_span_id: 's2', operation_duration_ms: 2890 }),
    ]);

    expect(totals.latencyMs).toBe(5215);
  });

  test('sums tokens and each hop own cost', () => {
    const totals = traceTotalsOf([
      span({ total_tokens: 18, deployment_price: '0.001' }),
      span({ core_span_id: 's2', total_tokens: 1060, deployment_price: '0.0005' }),
    ]);

    expect(totals.tokens).toBe(1078);
    expect(totals.cost).toBe('0.0015');
    expect(totals.spanCount).toBe(2);
  });

  test('reports failure when any hop failed', () => {
    expect(traceTotalsOf([span(), span({ core_span_id: 's2', success: false })]).isFailed).toBe(true);
    expect(traceTotalsOf([span()]).isFailed).toBe(false);
  });

  test('missing durations leave the latency unknown rather than zero', () => {
    expect(traceTotalsOf([span({ operation_duration_ms: null })]).latencyMs).toBeNull();
  });

  test('no spans totals to nothing', () => {
    expect(traceTotalsOf([])).toEqual({
      latencyMs: null,
      tokens: 0,
      cost: '0',
      spanCount: 0,
      isFailed: false,
    });
  });
});

describe('areSpansPartial', () => {
  test('a total above the span count is partial', () => {
    expect(areSpansPartial([span()], 922)).toBe(true);
  });

  test('a matching total is complete, and an absent total cannot be judged', () => {
    expect(areSpansPartial([span()], 1)).toBe(false);
    expect(areSpansPartial([span()], null)).toBe(false);
  });
});
