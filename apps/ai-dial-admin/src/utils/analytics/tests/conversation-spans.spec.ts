import { describe, expect, test } from 'vitest';

import { ConversationSpanRow, HopSideSuppression, SpanKind } from '@/src/models/analytics/conversations-trace';
import {
  areSpansPartial,
  hopSideSuppressionsOf,
  isFailedHop,
  spanKindOf,
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
  request_body_bytes: 2048,
  number_request_messages: 3,
  reasoning_tokens: null,
  ...overrides,
});

describe('spanKindOf', () => {
  test.each([
    ['llm_call', SpanKind.Llm],
    ['embedding', SpanKind.Embeddings],
    ['mcp', SpanKind.Mcp],
    ['route', SpanKind.Route],
  ])('maps event kind %s to its category', (event_kind, expected) => {
    expect(spanKindOf(span({ event_kind }))).toBe(expected);
  });

  // A hop with no `event_kind` is not an unknown hop: 53 179 table-wide are ordinary model calls DIAL did not
  // label, and rendering them as `Other` reads as a hop the tool does not understand.
  test.each(['/anthropic/v1/messages', '/openai/v1/responses', '/claude_code_router/v1/messages'])(
    'classifies an unlabelled call to %s as a model call',
    (request_uri) => {
      expect(spanKindOf(span({ event_kind: '', request_uri }))).toBe(SpanKind.Llm);
    },
  );

  // The endpoint is what identifies it, so an unlabelled hop to something else is still unclassified rather
  // than guessed at.
  test('leaves an unlabelled hop to an unrecognised endpoint as other', () => {
    expect(spanKindOf(span({ event_kind: '', request_uri: '/v1/deployments/x/tokenize' }))).toBe(SpanKind.Other);
  });

  // Kind and outcome are two axes. A failed embedding is still an embedding — reporting it as an undammed
  // "error" was what made a failed tool call and a failed model call look like the same problem.
  test('a failed hop keeps its kind', () => {
    expect(spanKindOf(span({ event_kind: 'embedding', success: false }))).toBe(SpanKind.Embeddings);
  });

  test('an unknown kind falls back rather than throwing', () => {
    expect(spanKindOf(span({ event_kind: 'something-new' }))).toBe(SpanKind.Other);
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

describe('isFailedHop', () => {
  test('a false success flag and an error status are both failures', () => {
    expect(isFailedHop(span({ success: false }))).toBe(true);
    expect(isFailedHop(span({ response_status: 404 }))).toBe(true);
    expect(isFailedHop(span({ response_status: 500 }))).toBe(true);
  });

  test('a successful hop is not a failure', () => {
    expect(isFailedHop(span())).toBe(false);
  });
});

describe('hopSideSuppressionsOf', () => {
  const hop = (overrides: Partial<ConversationSpanRow> = {}) => span({ response_body_bytes: 4096, ...overrides });

  test('a hop that returned a body has both sides worth opening', () => {
    expect(hopSideSuppressionsOf(hop())).toEqual({ request: null, response: null });
  });

  // The case most worth opening: a call that returned nothing still sent something, and its request is the
  // only record of what it attempted.
  test('a hop that returned nothing keeps its request side', () => {
    expect(hopSideSuppressionsOf(hop({ response_body_bytes: 0 }))).toEqual({
      request: null,
      response: HopSideSuppression.NoResponse,
    });
  });

  test.each(['initialize', 'notifications/initialized', 'tools/list'])(
    'the %s handshake settles both sides',
    (method) => {
      expect(hopSideSuppressionsOf(hop({ event_kind: 'mcp', mcp_method: method }))).toEqual({
        request: HopSideSuppression.SessionSetup,
        response: HopSideSuppression.SessionSetup,
      });
    },
  );

  // Only the response is a vector. The request averages 352 B and is the probe text — the half the reader is
  // actually asking about.
  test('an embedding keeps its request side and suppresses only the vector', () => {
    expect(hopSideSuppressionsOf(hop({ event_kind: 'embedding' }))).toEqual({
      request: null,
      response: HopSideSuppression.Vector,
    });
  });

  test('a tools/call is not suppressed', () => {
    expect(hopSideSuppressionsOf(hop({ event_kind: 'mcp', mcp_method: 'tools/call' }))).toEqual({
      request: null,
      response: null,
    });
  });

  // A deny-list, not an allow-list. In an observability tool, silently hiding something unrecognised is the
  // worse failure: an empty panel is a puzzle a reader can resolve by looking, while a hop that never offers
  // its content is a fact they cannot discover.
  test('an unrecognised MCP method defaults to shown', () => {
    expect(hopSideSuppressionsOf(hop({ event_kind: 'mcp', mcp_method: 'resources/subscribe' }))).toEqual({
      request: null,
      response: null,
    });
  });
});
