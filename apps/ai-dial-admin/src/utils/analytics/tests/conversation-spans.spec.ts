import { describe, expect, test } from 'vitest';

import { ConversationSpanRow, HopTextSuppression, SpanCategory } from '@/src/models/analytics/conversations-trace';
import {
  areSpansPartial,
  hopTextSuppressionOf,
  spanCategoryOf,
  spanLabelOf,
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
  response_body_bytes: 4096,
  ...overrides,
});

describe('spanCategoryOf', () => {
  test.each([
    ['llm_call', SpanCategory.Deployment],
    ['embedding', SpanCategory.Embedding],
    ['mcp', SpanCategory.Retrieval],
    ['route', SpanCategory.Route],
  ])('maps event kind %s to its category', (event_kind, expected) => {
    expect(spanCategoryOf(span({ event_kind }))).toBe(expected);
  });

  // A hop with no `event_kind` is not an unknown hop: 53 179 table-wide are ordinary model calls DIAL did not
  // label, and rendering them as `Other` reads as a hop the tool does not understand.
  test.each(['/anthropic/v1/messages', '/openai/v1/responses', '/claude_code_router/v1/messages'])(
    'classifies an unlabelled call to %s as a model call',
    (request_uri) => {
      expect(spanCategoryOf(span({ event_kind: '', request_uri }))).toBe(SpanCategory.Deployment);
    },
  );

  // The endpoint is what identifies it, so an unlabelled hop to something else is still unclassified rather
  // than guessed at.
  test('leaves an unlabelled hop to an unrecognised endpoint as other', () => {
    expect(spanCategoryOf(span({ event_kind: '', request_uri: '/v1/deployments/x/tokenize' }))).toBe(
      SpanCategory.Other,
    );
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

describe('areSpansPartial', () => {
  test('a hop count above the loaded chain is partial', () => {
    expect(areSpansPartial([span()], 922)).toBe(true);
  });

  test('a matching hop count is complete, and an absent one cannot be judged', () => {
    expect(areSpansPartial([span()], 1)).toBe(false);
    expect(areSpansPartial([span()], null)).toBe(false);
  });
});

// An MCP hop labelled by its server leaves invisible the one thing a reader opening a retrieval hop wants.
describe('spanLabelOf :: MCP hops', () => {
  test('names an MCP hop by the tool it called', () => {
    const label = spanLabelOf(span({ event_kind: 'mcp', mcp_tool_call_name: 'get_page', mcp_method: 'tools/call' }));

    expect(label).toBe('get_page');
  });

  test('falls back to the method for a hop that called no tool', () => {
    expect(spanLabelOf(span({ event_kind: 'mcp', mcp_method: 'tools/list' }))).toBe('tools/list');
  });

  test('falls back to the deployment for a hop with neither', () => {
    expect(spanLabelOf(span())).toBe('switchyard-model');
  });

  test('ignores a blank tool name rather than rendering an empty label', () => {
    expect(spanLabelOf(span({ mcp_tool_call_name: '   ', mcp_method: 'initialize' }))).toBe('initialize');
  });
});

describe('hopTextSuppressionOf', () => {
  const hop = (overrides: Partial<ConversationSpanRow> = {}) => span({ response_body_bytes: 4096, ...overrides });

  test('a hop that returned a body has text worth opening', () => {
    expect(hopTextSuppressionOf(hop())).toBeNull();
  });

  test('a hop that returned nothing is suppressed', () => {
    expect(hopTextSuppressionOf(hop({ response_body_bytes: 0 }))).toBe(HopTextSuppression.NoResponse);
  });

  test.each(['initialize', 'notifications/initialized', 'tools/list'])('the %s handshake is suppressed', (method) => {
    expect(hopTextSuppressionOf(hop({ event_kind: 'mcp', mcp_method: method }))).toBe(HopTextSuppression.SessionSetup);
  });

  // The response is a float vector and the request is the probe string that produced it. Neither is text.
  test('an embedding is suppressed', () => {
    expect(hopTextSuppressionOf(hop({ event_kind: 'embedding' }))).toBe(HopTextSuppression.Embedding);
  });

  test('a tools/call is not suppressed', () => {
    expect(hopTextSuppressionOf(hop({ event_kind: 'mcp', mcp_method: 'tools/call' }))).toBeNull();
  });

  // A deny-list, not an allow-list. In an observability tool, silently hiding something unrecognised is the
  // worse failure: an empty panel is a puzzle a reader can resolve by looking, while a hop that never offers
  // its text is a fact they cannot discover.
  test('an unrecognised MCP method defaults to shown', () => {
    expect(hopTextSuppressionOf(hop({ event_kind: 'mcp', mcp_method: 'resources/subscribe' }))).toBeNull();
  });

  test('an unrecognised event kind defaults to shown', () => {
    expect(hopTextSuppressionOf(hop({ event_kind: 'rerank' }))).toBeNull();
  });

  test('a hop that recorded neither a kind nor a method defaults to shown', () => {
    expect(hopTextSuppressionOf(hop({ event_kind: null, mcp_method: null }))).toBeNull();
  });

  // An unrecorded size is unknown, and an unknown size is not a claim that nothing came back.
  test('an unrecorded response size is not read as an empty response', () => {
    expect(hopTextSuppressionOf(hop({ response_body_bytes: null }))).toBeNull();
  });

  // Nothing came back at all, so there is no text whatever the hop was doing.
  test('an empty response outranks the kind of hop it was', () => {
    expect(hopTextSuppressionOf(hop({ response_body_bytes: 0, event_kind: 'embedding' }))).toBe(
      HopTextSuppression.NoResponse,
    );
  });
});
