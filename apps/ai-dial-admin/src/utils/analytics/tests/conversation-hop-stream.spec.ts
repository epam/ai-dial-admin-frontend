import { describe, expect, test } from 'vitest';

import {
  ConversationSpanRow,
  ConversationTraceFigures,
  HopEvent,
  HopEventType,
  ModelCallOutput,
} from '@/src/models/analytics/conversations-trace';
import {
  FILTERABLE_EVENT_TYPES,
  buildHopEventStream,
  filterEvents,
  hasFilteredRows,
  isConversationHop,
  isFailedHop,
} from '@/src/utils/analytics/conversation-hop-stream';

const row = (overrides: Partial<ConversationSpanRow> = {}): ConversationSpanRow =>
  ({
    core_span_id: 's1',
    core_parent_span_id: null,
    event_kind: 'llm_call',
    deployment: 'gpt',
    request_method: 'POST',
    request_uri: '/openai/deployments/gpt/chat/completions',
    response_status: 200,
    success: true,
    total_tokens: 10,
    reasoning_tokens: 0,
    deployment_price: '0.001',
    request_time: 1000,
    response_body_bytes: 4096,
    ...overrides,
  }) as ConversationSpanRow;

const FIGURES: ConversationTraceFigures = {
  traceId: 'tr1',
  startedAt: 1000,
  spans: 3,
  failedSpans: 0,
  tokens: 3667333,
  price: '3.678',
  durationMs: 523263,
};

const output = (id: string, over: Partial<ModelCallOutput> = {}): ModelCallOutput => ({
  core_span_id: id,
  text: null,
  toolCalls: [],
  isUnread: false,
  ...over,
});

const stream = (spans: ConversationSpanRow[], modelOutputs: ModelCallOutput[] = [], title?: string): HopEvent[] =>
  buildHopEventStream({ spans, modelOutputs, figures: FIGURES, title });

const typesOf = (events: HopEvent[]): HopEventType[] => events.map(({ type }) => type);

describe('isConversationHop', () => {
  // 5 611 route hops exist table-wide and every one has an empty chat_id: they are dial_scheduler REST calls.
  test('excludes a route hop', () => {
    expect(isConversationHop(row({ event_kind: 'route' }))).toBe(false);
  });

  test('keeps every other kind, including one it does not recognise', () => {
    expect(isConversationHop(row({ event_kind: 'llm_call' }))).toBe(true);
    expect(isConversationHop(row({ event_kind: 'rerank' }))).toBe(true);
  });
});

describe('isFailedHop', () => {
  test.each([
    ['a false success flag', { success: false }],
    ['a client error status', { response_status: 429 }],
    ['a server error status', { response_status: 500 }],
  ])('reports %s as a failure', (_name, overrides) => {
    expect(isFailedHop(row(overrides))).toBe(true);
  });

  test('a successful hop is not a failure', () => {
    expect(isFailedHop(row())).toBe(false);
  });
});

describe('buildHopEventStream', () => {
  // A hop is not an event: one model call emits a reasoning marker, its text, and a row per tool requested.
  test('a model call emits one event per thing it produced', () => {
    const events = stream(
      [row({ core_span_id: 'm', reasoning_tokens: 264 })],
      [output('m', { text: 'an answer', toolCalls: [{ name: 'rag_search', argumentsPreview: '{"q":"x"}' }] })],
    );

    expect(typesOf(events)).toEqual([
      HopEventType.TurnStart,
      HopEventType.Thinking,
      HopEventType.Text,
      HopEventType.ToolCall,
      HopEventType.TurnComplete,
    ]);
  });

  // The reasoning text is not recorded anywhere; the token count is its only trace.
  test('a reasoning event carries its token count rather than empty content', () => {
    const [, thinking] = stream([row({ reasoning_tokens: 264 })], [output('s1', { text: 'x' })]);

    expect(thinking.type).toBe(HopEventType.Thinking);
    expect(thinking.reasoningTokens).toBe(264);
  });

  test('a model call that produced neither text nor a tool request is empty', () => {
    const events = stream([row()], [output('s1')]);

    expect(typesOf(events)).toContain(HopEventType.Empty);
  });

  test.each([
    ['initialize', HopEventType.Session],
    ['tools/list', HopEventType.Session],
    ['resources/list', HopEventType.Session],
    ['ping', HopEventType.Session],
  ])('types the %s protocol method as session', (mcp_method, expected) => {
    const events = stream([row({ event_kind: 'mcp', mcp_method })]);

    expect(typesOf(events)).toContain(expected);
  });

  test('types an MCP tool call as a tool result', () => {
    const events = stream([row({ event_kind: 'mcp', mcp_method: 'tools/call', mcp_tool_call_name: 'rag_search' })]);

    expect(typesOf(events)).toContain(HopEventType.ToolResult);
  });

  test('types an embedding as an embedding', () => {
    expect(typesOf(stream([row({ event_kind: 'embedding' })]))).toContain(HopEventType.Embedding);
  });

  // A failure must never be buried inside the rows of the work it was attempting.
  test('a failed hop emits one error event whatever its kind', () => {
    const events = stream([row({ success: false })], [output('s1', { text: 'ignored' })]);

    expect(typesOf(events)).toEqual([HopEventType.TurnStart, HopEventType.Error, HopEventType.TurnComplete]);
  });

  // 53 179 hops table-wide carry no event kind and are ordinary completions.
  test('an unlabelled hop at a model endpoint is treated as a model call', () => {
    const events = stream(
      [row({ event_kind: '', request_uri: '/anthropic/v1/messages' })],
      [output('s1', { text: 'answered' })],
    );

    expect(typesOf(events)).toContain(HopEventType.Text);
  });

  // Utility, not conversation: 1 621 hops table-wide asking what a prompt would cost.
  test('a count_tokens call is typed generically rather than as conversation', () => {
    const events = stream([row({ event_kind: '', request_uri: '/v1/deployments/gpt/count_tokens' })]);

    expect(typesOf(events)).toContain(HopEventType.Other);
    expect(typesOf(events)).not.toContain(HopEventType.Text);
  });

  // A deny-list at every level: dropping something unfamiliar is the worse failure.
  test('an unrecognised event kind is shown, generically typed', () => {
    expect(typesOf(stream([row({ event_kind: 'rerank' })]))).toContain(HopEventType.Other);
  });

  test('a route hop contributes nothing to the stream', () => {
    expect(typesOf(stream([row({ event_kind: 'route' })]))).toEqual([
      HopEventType.TurnStart,
      HopEventType.TurnComplete,
    ]);
  });

  // Past the derivation cap the body was never read, so what the call produced is unknown, not absent.
  test('a model call whose body was not read is typed generically, not empty', () => {
    const events = stream([row()], [output('s1', { isUnread: true })]);

    expect(typesOf(events)).toContain(HopEventType.Other);
    expect(typesOf(events)).not.toContain(HopEventType.Empty);
  });

  // The log records the size, so a call that returned nothing is a known fact — and the body derivation skips
  // it deliberately. Typing it from the missing output made it indistinguishable from one past the cap.
  test('a model call the log records as returning no bytes is empty, not generic', () => {
    const events = stream([row({ response_body_bytes: 0 })]);

    expect(typesOf(events)).toContain(HopEventType.Empty);
    expect(typesOf(events)).not.toContain(HopEventType.Other);
  });

  test('a model call that returned no bytes but reasoned states the reasoning alone', () => {
    const events = stream([row({ response_body_bytes: 0, reasoning_tokens: 120 })]);

    expect(typesOf(events)).toContain(HopEventType.Thinking);
    expect(typesOf(events)).not.toContain(HopEventType.Empty);
  });

  // 85 tools requested against 57 MCP results: the rest are functions the calling application handles itself.
  test('marks a tool request for which no result was logged', () => {
    const events = stream(
      [
        row({ core_span_id: 'm', request_time: 1000 }),
        row({
          core_span_id: 'r',
          event_kind: 'mcp',
          mcp_method: 'tools/call',
          mcp_tool_call_name: 'rag_search',
          request_time: 2000,
        }),
      ],
      [
        output('m', {
          toolCalls: [
            { name: 'rag_search', argumentsPreview: null },
            { name: 'finish_iteration', argumentsPreview: null },
          ],
        }),
      ],
    );
    const calls = events.filter(({ type }) => type === HopEventType.ToolCall);

    expect(calls.map(({ label, hasNoRecordedResult }) => [label, hasNoRecordedResult])).toEqual([
      ['rag_search', false],
      ['finish_iteration', true],
    ]);
  });

  // Resolved by count per name, never by identity — the log pairs nothing.
  test('marks only the surplus requests for a name', () => {
    const events = stream(
      [
        row({ core_span_id: 'm', request_time: 1000 }),
        row({
          core_span_id: 'r',
          event_kind: 'mcp',
          mcp_method: 'tools/call',
          mcp_tool_call_name: 'get_page',
          request_time: 2000,
        }),
      ],
      [
        output('m', {
          toolCalls: [
            { name: 'get_page', argumentsPreview: null },
            { name: 'get_page', argumentsPreview: null },
          ],
        }),
      ],
    );

    expect(
      events.filter(({ type }) => type === HopEventType.ToolCall).map(({ hasNoRecordedResult }) => hasNoRecordedResult),
    ).toEqual([false, true]);
  });

  test('frames the stream with the turn question and the rollup totals', () => {
    const events = stream([row()], [output('s1', { text: 'x' })], 'why 2021-2025?');
    const [first] = events;
    const last = events[events.length - 1];

    expect(first.type).toBe(HopEventType.TurnStart);
    expect(first.label).toBe('why 2021-2025?');
    expect(last.type).toBe(HopEventType.TurnComplete);
    expect(last.tokens).toBe(3667333);
    expect(last.cost).toBe('3.678');
  });

  // A filtered view still has to say where in the turn you are.
  test('numbers every event by its position in the unfiltered stream', () => {
    const events = stream(
      [
        row({ core_span_id: 'a', event_kind: 'embedding', request_time: 1000 }),
        row({ core_span_id: 'b', request_time: 2000 }),
      ],
      [output('b', { text: 'answered' })],
    );

    expect(events.map(({ line }) => line)).toEqual([1, 2, 3, 4]);
    // Narrowed to the text event alone, it keeps line 3 — its place in the whole turn.
    expect(filterEvents(events, [HopEventType.Text]).map(({ line }) => line)).toEqual([3]);
  });

  test('orders hops by when they were recorded', () => {
    const events = stream([
      row({ core_span_id: 'late', event_kind: 'embedding', request_time: 9000 }),
      row({ core_span_id: 'early', event_kind: 'embedding', request_time: 1000 }),
    ]);

    expect(events.slice(1, 3).map(({ span }) => span?.core_span_id)).toEqual(['early', 'late']);
  });

  test('a turn with no hops is still framed', () => {
    expect(typesOf(stream([]))).toEqual([HopEventType.TurnStart, HopEventType.TurnComplete]);
  });
});

describe('filterEvents', () => {
  const events = stream(
    [
      row({ core_span_id: 'e', event_kind: 'embedding', request_time: 1000 }),
      row({ core_span_id: 'p', event_kind: 'mcp', mcp_method: 'initialize', request_time: 1100 }),
      row({ core_span_id: 'm', request_time: 1200 }),
    ],
    [output('m', { text: 'answered' })],
  );

  // Every category is offered, and the frame is not among them — it is never filterable.
  test('offers every row type and not the frame', () => {
    expect(FILTERABLE_EVENT_TYPES).toContain(HopEventType.Session);
    expect(FILTERABLE_EVENT_TYPES).toContain(HopEventType.Embedding);
    expect(FILTERABLE_EVENT_TYPES).not.toContain(HopEventType.TurnStart);
    expect(FILTERABLE_EVENT_TYPES).not.toContain(HopEventType.TurnComplete);
  });

  test('selecting every category keeps every event of the turn', () => {
    expect(typesOf(filterEvents(events, FILTERABLE_EVENT_TYPES))).toEqual([
      HopEventType.Embedding,
      HopEventType.Session,
      HopEventType.Text,
    ]);
  });

  // Asking for the tool calls should answer with tool calls, not with tool calls between two rows about
  // something else.
  test('narrows to one category alone, frame included', () => {
    expect(typesOf(filterEvents(events, [HopEventType.Embedding]))).toEqual([HopEventType.Embedding]);
  });

  // The frame describes the whole turn, so it gets no exemption here — it is kept out of the view by never
  // being among the categories the filter offers, which `FILTERABLE_EVENT_TYPES` is asserted for above.
  test('selecting nothing leaves nothing, frame included', () => {
    expect(filterEvents(events, [])).toEqual([]);
    expect(typesOf(filterEvents(events, FILTERABLE_EVENT_TYPES))).not.toContain(HopEventType.TurnStart);
  });
});

describe('hasFilteredRows', () => {
  const frameOnly = stream([]);

  // The frame survives every selection, so a length test can never answer "did this find anything".
  test('a stream of nothing but the frame has no rows of its own', () => {
    expect(frameOnly).toHaveLength(2);
    expect(hasFilteredRows(frameOnly)).toBe(false);
  });

  test('a stream with any hop of its own has rows', () => {
    expect(hasFilteredRows(stream([row({ event_kind: 'embedding' })]))).toBe(true);
  });

  test('a selection that matched nothing has no rows at all', () => {
    const events = stream([row({ event_kind: 'embedding' })]);

    expect(filterEvents(events, [HopEventType.Error])).toEqual([]);
    expect(hasFilteredRows(filterEvents(events, [HopEventType.Error]))).toBe(false);
  });
});
