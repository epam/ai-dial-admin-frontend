import { describe, expect, test } from 'vitest';

import {
  ConversationSpanRow,
  HopBodyGrants,
  HopFactsShape,
  HopSideSuppression,
  SpanBodyTab,
  SpanKind,
} from '@/src/models/analytics/conversations-trace';
import {
  areSpansPartial,
  hopFactsOf,
  hopSideSuppressionsOf,
  hopTransportOf,
  isFailedHop,
  mcpToolCallTallyOf,
  spanBodyTabsOf,
  spanKindOf,
  spanLabelOf,
  spanPhaseOf,
  unansweredToolNamesOf,
} from '@/src/utils/analytics/conversation-spans';

const span = (overrides: Partial<ConversationSpanRow> = {}): ConversationSpanRow => ({
  core_span_id: 's1',
  core_parent_span_id: null,
  event_kind: 'llm_call',
  deployment: 'a-model',
  parent_deployment: null,
  request_method: 'POST',
  request_uri: '/openai/deployments/a-model/chat/completions',
  response_upstream_uri: 'https://an-upstream.example/openai/deployments/a-model',
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
  total_price: null,
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
    expect(spanLabelOf(span())).toBe('a-model');
  });

  test('falls back to the request uri, then to the span id', () => {
    expect(spanLabelOf(span({ deployment: '' }))).toBe('/openai/deployments/a-model/chat/completions');
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
  // The server, not the method: two protocol messages of different servers in the same second are otherwise
  // indistinguishable, which is the whole reason the preference was inverted.
  test('names an MCP hop by its server even when it called a tool', () => {
    const label = spanLabelOf(span({ event_kind: 'mcp', mcp_tool_call_name: 'get_page', mcp_method: 'tools/call' }));

    expect(label).toBe('a-model');
  });

  test('names a protocol message by its server rather than its method', () => {
    expect(spanLabelOf(span({ event_kind: 'mcp', mcp_method: 'tools/list' }))).toBe('a-model');
  });
});

describe('spanPhaseOf', () => {
  test('states the tool an MCP hop called', () => {
    expect(spanPhaseOf(span({ mcp_tool_call_name: 'get_page', mcp_method: 'tools/call' }))).toBe('get_page');
  });

  test('states the method when no tool was called', () => {
    expect(spanPhaseOf(span({ mcp_method: 'tools/list' }))).toBe('tools/list');
  });

  test('ignores a blank tool name rather than returning an empty phase', () => {
    expect(spanPhaseOf(span({ mcp_tool_call_name: '   ', mcp_method: 'initialize' }))).toBe('initialize');
  });

  test('states nothing for a hop whose kind records no phase', () => {
    expect(spanPhaseOf(span({ mcp_tool_call_name: null, mcp_method: null }))).toBeNull();
  });
});

describe('hopFactsOf', () => {
  test('states tokens, request messages and cost for a hop that metered its own', () => {
    expect(hopFactsOf(span())).toEqual({
      shape: HopFactsShape.Metered,
      tokens: 18,
      requestMessages: 3,
      cost: '0.001',
    });
  });

  // The boundary the rule exists for: zero tokens and no own price, with a real chain price beneath.
  test('states the chain cost for a hop that metered nothing of its own', () => {
    const facts = hopFactsOf(span({ total_tokens: 0, deployment_price: null, total_price: '0.0375' }));

    expect(facts).toEqual({ shape: HopFactsShape.Unmetered, chainCost: '0.0375' });
  });

  test('counts a hop with tokens but no own price as metered', () => {
    expect(hopFactsOf(span({ deployment_price: null }))?.shape).toBe(HopFactsShape.Metered);
  });

  test('counts a span with a price but no tokens as metered', () => {
    expect(hopFactsOf(span({ total_tokens: null }))?.shape).toBe(HopFactsShape.Metered);
  });

  // `0 tok` beside a real price is the same broken reading the unmetered shape exists to avoid.
  test('states no token count for a span that priced work against zero tokens', () => {
    expect(hopFactsOf(span({ total_tokens: 0, deployment_price: '0.001' }))).toEqual({
      shape: HopFactsShape.Metered,
      tokens: null,
      requestMessages: 3,
      cost: '0.001',
    });
  });

  // Nothing metered and nothing spent. The row has its name, its kind and its duration and needs no second
  // line at all — deciding that here rather than in the row is what keeps a blank line off the screen.
  test('states nothing for a hop that metered nothing and spent nothing', () => {
    expect(hopFactsOf(span({ total_tokens: 0, deployment_price: null, total_price: null }))).toBeNull();
  });

  test('states nothing for an MCP hop, which meters and prices nothing', () => {
    const facts = hopFactsOf(
      span({ event_kind: 'mcp', total_tokens: null, deployment_price: null, mcp_method: 'tools/list' }),
    );

    expect(facts).toBeNull();
  });
});

describe('mcpToolCallTallyOf', () => {
  test('counts the MCP calls recorded per tool name', () => {
    const tally = mcpToolCallTallyOf(
      [
        span({ event_kind: 'mcp', mcp_tool_call_name: 'search' }),
        span({ event_kind: 'mcp', mcp_tool_call_name: 'search' }),
        span({ event_kind: 'mcp', mcp_tool_call_name: 'fetch' }),
      ],
      true,
    );

    expect(tally).toEqual({ counts: { search: 2, fetch: 1 }, isComplete: true });
  });

  test('counts no protocol message and no non-MCP span', () => {
    const tally = mcpToolCallTallyOf(
      [
        span({ event_kind: 'mcp', mcp_method: 'tools/list', mcp_tool_call_name: null }),
        span({ event_kind: 'llm_call', mcp_tool_call_name: 'search' }),
      ],
      true,
    );

    expect(tally.counts).toEqual({});
  });

  test('counts nothing for a turn with no spans', () => {
    expect(mcpToolCallTallyOf([], true)).toEqual({ counts: {}, isComplete: true });
  });

  test('carries the completeness of the read it was built from', () => {
    expect(mcpToolCallTallyOf([], false).isComplete).toBe(false);
  });
});

describe('unansweredToolNamesOf', () => {
  const tally = (counts: Record<string, number>, isComplete = true) => ({ counts, isComplete });

  test('reports a requested tool the turn recorded no call of', () => {
    expect(unansweredToolNamesOf(['internal_tool'], tally({}))).toEqual(['internal_tool']);
  });

  test('reports nothing when every request was matched by a recorded call', () => {
    expect(unansweredToolNamesOf(['search'], tally({ search: 1 }))).toEqual([]);
  });

  // By count per name, never by identity: the log pairs nothing, so two requests against one recorded call
  // leave exactly one unanswered.
  test('reports the surplus by count when a name was requested more often than recorded', () => {
    expect(unansweredToolNamesOf(['search', 'search'], tally({ search: 1 }))).toEqual(['search']);
  });

  test('reports nothing when more calls were recorded than requested', () => {
    expect(unansweredToolNamesOf(['search'], tally({ search: 3 }))).toEqual([]);
  });

  test('reports nothing for a response that requested no tool', () => {
    expect(unansweredToolNamesOf([], tally({ search: 1 }))).toEqual([]);
  });

  // The note this feeds states a cause. On a capped read an absent call may simply be unread, so the claim
  // is withheld rather than made wrongly.
  test('reports nothing when the span read was bounded', () => {
    expect(unansweredToolNamesOf(['internal_tool'], tally({}, false))).toEqual([]);
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

describe('hopTransportOf', () => {
  test('states the recorded status with the protocol phrase for it', () => {
    const transport = hopTransportOf(span({ response_status: 200, success: true }));

    expect(transport.status).toBe(200);
    expect(transport.reason).toBe('OK');
    expect(transport.hasFailed).toBe(false);
  });

  // 202 is outside the failure floor: reading it as anything else marks every handshake in the tree failed.
  test('an accepted notification is a success, not a failure', () => {
    expect(hopTransportOf(span({ response_status: 202, success: true }))).toMatchObject({
      reason: 'Accepted',
      hasFailed: false,
    });
  });

  test('a status at or above the failure floor reads as failed', () => {
    expect(hopTransportOf(span({ response_status: 502, success: true })).hasFailed).toBe(true);
  });

  // The other half of the same test the tree uses, so one hop cannot read differently in the two surfaces.
  test('a false success flag reads as failed whatever the status says', () => {
    expect(hopTransportOf(span({ response_status: 200, success: false })).hasFailed).toBe(true);
  });

  test('a status this console does not name still states its number', () => {
    expect(hopTransportOf(span({ response_status: 418 }))).toMatchObject({ status: 418, reason: null });
  });

  test('carries the recorded sizes and duration, and nothing derived from a body', () => {
    expect(
      hopTransportOf(span({ request_body_bytes: 2048, response_body_bytes: 4096, operation_duration_ms: 89 })),
    ).toMatchObject({ requestBytes: 2048, responseBytes: 4096, durationMs: 89 });
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

  // These used to settle both sides on the claim that they carry no content; they do carry it.
  test.each(['initialize', 'tools/list'])('the %s handshake is read rather than settled', (method) => {
    expect(hopSideSuppressionsOf(hop({ event_kind: 'mcp', mcp_method: method }))).toEqual({
      request: null,
      response: null,
    });
  });

  // The one protocol message with no response, which is a different fact from "the log recorded nothing".
  test('a notification states that the protocol defines no response body', () => {
    expect(
      hopSideSuppressionsOf(
        hop({ event_kind: 'mcp', mcp_method: 'notifications/initialized', response_body_bytes: 0 }),
      ),
    ).toEqual({
      request: null,
      response: HopSideSuppression.ProtocolNoBody,
    });
  });

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

describe('spanBodyTabsOf', () => {
  const grants = (isRequestReadable: boolean, isResponseReadable: boolean): HopBodyGrants => ({
    isRequestReadable,
    isResponseReadable,
  });

  const mcp = span({ event_kind: 'mcp', mcp_method: 'tools/call', mcp_tool_call_name: 'search' });
  const embedding = span({ event_kind: 'embedding', request_uri: '/openai/deployments/an-embedder/embeddings' });
  const unrecognised = span({ event_kind: 'something-new', request_uri: '/openai/deployments/x/unknown' });

  test('offers every tab in a fixed order for a model call the caller can read whole', () => {
    expect(spanBodyTabsOf(span(), grants(true, true))).toEqual([
      SpanBodyTab.Request,
      SpanBodyTab.Response,
      SpanBodyTab.Chat,
    ]);
  });

  test('drops the response tab and keeps the rest in order when only the request column is granted', () => {
    expect(spanBodyTabsOf(span(), grants(true, false))).toEqual([SpanBodyTab.Request, SpanBodyTab.Chat]);
  });

  test('offers no chat when the request column is withheld', () => {
    expect(spanBodyTabsOf(span(), grants(false, true))).toEqual([SpanBodyTab.Response]);
  });

  test('offers nothing when no body column is granted', () => {
    expect(spanBodyTabsOf(span(), grants(false, false))).toEqual([]);
  });

  test('offers both sides but no chat for an MCP hop', () => {
    expect(spanBodyTabsOf(mcp, grants(true, true))).toEqual([SpanBodyTab.Request, SpanBodyTab.Response]);
  });

  test('offers both sides but no chat for an embedding probe', () => {
    expect(spanBodyTabsOf(embedding, grants(true, true))).toEqual([SpanBodyTab.Request, SpanBodyTab.Response]);
  });

  test('offers chat for an event kind it does not recognise', () => {
    expect(spanBodyTabsOf(unrecognised, grants(true, true))).toContain(SpanBodyTab.Chat);
  });

  test('offers the tabs a suppressed side is entitled to, since the tab is where the absence is stated', () => {
    expect(spanBodyTabsOf(span({ response_body_bytes: 0 }), grants(true, true))).toEqual([
      SpanBodyTab.Request,
      SpanBodyTab.Response,
      SpanBodyTab.Chat,
    ]);
  });
});
