import { describe, expect, test } from 'vitest';

import { FILTERABLE_EVENT_TYPES } from '@/src/constants/analytics/conversations-trace';
import {
  ConversationSpanRow,
  HopEventType,
  HopNodeKind,
  HopTreeNode,
  ModelCallOutput,
} from '@/src/models/analytics/conversations-trace';
import { buildHopTree, isConversationHop } from '@/src/utils/analytics/conversation-hop-stream';
import { isFailedHop } from '@/src/utils/analytics/conversation-spans';
import { categoriesOf } from '@/src/utils/analytics/conversation-span-tree';

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

const output = (id: string, over: Partial<ModelCallOutput> = {}): ModelCallOutput => ({
  core_span_id: id,
  text: null,
  toolCalls: [],
  isUnread: false,
  ...over,
});

const tree = (spans: ConversationSpanRow[], modelOutputs: ModelCallOutput[] = []): HopTreeNode[] =>
  buildHopTree({ spans, modelOutputs });

const walk = (nodes: HopTreeNode[]): HopTreeNode[] => nodes.flatMap((node) => [node, ...walk(node.children)]);

const hopsOf = (nodes: HopTreeNode[]): HopTreeNode[] => walk(nodes).filter(({ kind }) => kind === HopNodeKind.Hop);

// Every category the tree states, in the order the nodes appear. Nodes rather than events, because a hop that
// kept a node of its own carries a category too — and a hop that collapsed into its single event carries that
// event's.
const typesOf = (nodes: HopTreeNode[]): HopEventType[] =>
  walk(nodes)
    .filter(({ type }) => type !== null)
    .map(({ type }) => type as HopEventType);

const typed = (nodes: HopTreeNode[], type: HopEventType): HopTreeNode[] =>
  walk(nodes).filter((node) => node.type === type);

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

describe('buildHopTree', () => {
  // A hop is not an event: one model call emits a reasoning marker, its text, and a node per tool requested.
  test('a model call emits one event per thing it produced, all beneath it', () => {
    const built = tree(
      [row({ core_span_id: 'm', reasoning_tokens: 264 })],
      [output('m', { text: 'an answer', toolCalls: [{ name: 'rag_search', argumentsPreview: '{"q":"x"}' }] })],
    );

    expect(built).toHaveLength(1);
    expect(built[0].kind).toBe(HopNodeKind.Hop);
    expect(built[0].children.map(({ type }) => type)).toEqual([
      HopEventType.Thinking,
      HopEventType.Text,
      HopEventType.ToolCall,
    ]);
  });

  // The reasoning text is not recorded anywhere; the token count is its only trace.
  test('a reasoning event carries its token count rather than empty content', () => {
    const [thinking] = typed(
      tree([row({ reasoning_tokens: 264 })], [output('s1', { text: 'x' })]),
      HopEventType.Thinking,
    );

    expect(thinking.reasoningTokens).toBe(264);
  });

  // A call whose only event is its reasoning collapses like any other one-event hop, so the count has to
  // survive onto the node that replaced it.
  test('a collapsed reasoning-only call keeps its token count', () => {
    const [node] = tree([row({ response_body_bytes: 0, reasoning_tokens: 120 })]);

    expect(node.type).toBe(HopEventType.Thinking);
    expect(node.reasoningTokens).toBe(120);
    expect(node.children).toEqual([]);
  });

  // Figures a span states about itself belong to the hop, so an event does not restate them.
  test('a hop states its own tokens and cost, and its events do not restate them', () => {
    const [hop] = tree([row({ total_tokens: 18 })], [output('s1', { text: 'x' })]);

    expect(hop.tokens).toBe(18);
    expect(hop.cost).toBe('0.001');
    expect(hop.children.every(({ tokens, cost }) => tokens === null && cost === null)).toBe(true);
  });

  test('a model call that produced neither text nor a tool request is empty', () => {
    expect(typesOf(tree([row()], [output('s1')]))).toContain(HopEventType.Empty);
  });

  test.each([
    ['initialize', HopEventType.Session],
    ['tools/list', HopEventType.Session],
    ['resources/list', HopEventType.Session],
    ['ping', HopEventType.Session],
  ])('types the %s protocol method as session', (mcp_method, expected) => {
    expect(typesOf(tree([row({ event_kind: 'mcp', mcp_method })]))).toContain(expected);
  });

  test('types an MCP tool call as a tool result', () => {
    const built = tree([row({ event_kind: 'mcp', mcp_method: 'tools/call', mcp_tool_call_name: 'rag_search' })]);

    expect(typesOf(built)).toContain(HopEventType.ToolResult);
  });

  test('types an embedding as an embedding', () => {
    expect(typesOf(tree([row({ event_kind: 'embedding' })]))).toContain(HopEventType.Embedding);
  });

  // A failure must never be buried inside the nodes of the work it was attempting.
  // One node, and it keeps the kind of call that failed: a failed tool call and a failed model call are
  // different problems, and typing both as an undifferentiated error said neither.
  test('a failed hop emits one node carrying its own kind', () => {
    const built = tree([row({ success: false })], [output('s1', { text: 'ignored' })]);

    expect(typesOf(built)).toEqual([HopEventType.ModelCall]);
  });

  test('a failed hop of another kind keeps that kind', () => {
    expect(typesOf(tree([row({ event_kind: 'embedding', success: false })]))).toEqual([HopEventType.Embedding]);
  });

  // The failure is the hop's, so the hop wears it — not only the event beneath it.
  test('a failed hop reports itself as failed', () => {
    expect(hopsOf(tree([row({ success: false })]))[0].isFailed).toBe(true);
  });

  // One failure, one node: the hop absorbed its single error event, so the child hop nests under that node
  // rather than beside a duplicate of it.
  test('a failed hop keeps the hops that nest under it as its children', () => {
    const built = tree([
      row({ core_span_id: 'failed', success: false, request_time: 1000 }),
      row({ core_span_id: 'child', core_parent_span_id: 'failed', event_kind: 'embedding', request_time: 2000 }),
    ]);

    expect(built).toHaveLength(1);
    expect(hopsOf(built[0].children).map(({ span }) => span?.core_span_id)).toEqual(['child']);
    // Emphasising Failed marks the failing call itself, and marks it once.
    expect(typesOf(built)).toEqual([HopEventType.ModelCall, HopEventType.Embedding]);
  });

  // 53 179 hops table-wide carry no event kind and are ordinary completions.
  test('an unlabelled hop at a model endpoint is treated as a model call', () => {
    const built = tree(
      [row({ event_kind: '', request_uri: '/anthropic/v1/messages' })],
      [output('s1', { text: 'answered' })],
    );

    expect(typesOf(built)).toContain(HopEventType.Text);
  });

  // Utility, not conversation: 1 621 hops table-wide asking what a prompt would cost.
  test('a count_tokens call is typed generically rather than as conversation', () => {
    const built = tree([row({ event_kind: '', request_uri: '/v1/deployments/gpt/count_tokens' })]);

    expect(typesOf(built)).toContain(HopEventType.Other);
    expect(typesOf(built)).not.toContain(HopEventType.Text);
  });

  // A deny-list at every level: dropping something unfamiliar is the worse failure.
  test('an unrecognised event kind is shown, generically typed', () => {
    expect(typesOf(tree([row({ event_kind: 'rerank' })]))).toContain(HopEventType.Other);
  });

  test('a route hop contributes nothing to the tree', () => {
    expect(tree([row({ event_kind: 'route' })])).toEqual([]);
  });

  // A non-route hop must not be excluded because its parent was: excluding the parent orphans it, and an
  // orphan is hoisted rather than dropped.
  test('a route hop excluded from the tree does not take its non-route children with it', () => {
    const built = tree([
      row({ core_span_id: 'r', event_kind: 'route', request_time: 1000 }),
      row({ core_span_id: 'kept', core_parent_span_id: 'r', event_kind: 'embedding', request_time: 2000 }),
    ]);

    expect(hopsOf(built)).toHaveLength(1);
    expect(hopsOf(built)[0].span?.event_kind).toBe('embedding');
    expect(hopsOf(built)[0].depth).toBe(0);
  });

  // Past the derivation cap the body was never read, so what the call produced is unknown, not absent.
  test('a model call whose body was not read is typed generically, not empty', () => {
    const built = tree([row()], [output('s1', { isUnread: true })]);

    expect(typesOf(built)).toContain(HopEventType.Other);
    expect(typesOf(built)).not.toContain(HopEventType.Empty);
  });

  // The log records the size, so a call that returned nothing is a known fact — and the body derivation skips
  // it deliberately. Typing it from the missing output made it indistinguishable from one past the cap.
  test('a model call the log records as returning no bytes is empty, not generic', () => {
    const built = tree([row({ response_body_bytes: 0 })]);

    expect(typesOf(built)).toContain(HopEventType.Empty);
    expect(typesOf(built)).not.toContain(HopEventType.Other);
  });

  test('a model call that returned no bytes but reasoned states the reasoning alone', () => {
    const built = tree([row({ response_body_bytes: 0, reasoning_tokens: 120 })]);

    expect(typesOf(built)).toContain(HopEventType.Thinking);
    expect(typesOf(built)).not.toContain(HopEventType.Empty);
  });

  // 85 tools requested against 57 MCP results: the rest are functions the calling application handles itself.
  // Counted across the whole turn, which is why the seeds are marked before any of them is nested.
  test('marks a tool request for which no result was logged, anywhere in the turn', () => {
    const built = tree(
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
    const calls = typed(built, HopEventType.ToolCall);

    expect(calls.map(({ label, hasNoRecordedResult }) => [label, hasNoRecordedResult])).toEqual([
      ['rag_search', false],
      ['finish_iteration', true],
    ]);
  });

  // The result answering the request sits under a different hop, so the count has to cross the tree — a
  // request paired only within its own hop would have been reported unanswered.
  test('pairs a request with a result recorded under a different hop', () => {
    const built = tree(
      [
        row({ core_span_id: 'm', request_time: 1000 }),
        row({
          core_span_id: 'r',
          core_parent_span_id: 'm',
          event_kind: 'mcp',
          mcp_method: 'tools/call',
          mcp_tool_call_name: 'rag_search',
          request_time: 2000,
        }),
      ],
      [output('m', { toolCalls: [{ name: 'rag_search', argumentsPreview: null }] })],
    );

    expect(typed(built, HopEventType.ToolCall)[0].hasNoRecordedResult).toBe(false);
  });

  // Resolved by count per name, never by identity — the log pairs nothing.
  test('marks only the surplus requests for a name', () => {
    const built = tree(
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

    expect(typed(built, HopEventType.ToolCall).map(({ hasNoRecordedResult }) => hasNoRecordedResult)).toEqual([
      false,
      true,
    ]);
  });

  // The turn's question and its totals are the trace view's heading and figures, stated once.
  test('holds no node standing for the turn itself', () => {
    const built = tree([row()], [output('s1', { text: 'x' })]);

    expect(walk(built).every(({ kind }) => kind !== HopNodeKind.UnrecordedRoot)).toBe(true);
    // One call that answered, one node: no frame above it and no totals below.
    expect(walk(built)).toHaveLength(1);
  });

  test('a hop nests under the hop its parent span id names', () => {
    const built = tree([
      row({ core_span_id: 'parent', event_kind: 'embedding', request_time: 1000 }),
      row({ core_span_id: 'child', core_parent_span_id: 'parent', event_kind: 'embedding', request_time: 2000 }),
    ]);

    expect(built).toHaveLength(1);
    expect(hopsOf(built[0].children)).toHaveLength(1);
  });

  // The common shape: every hop at one level. A call with more than one event still owns them beneath it; a
  // call with exactly one is that one row.
  test('a trace with no nesting renders as one level, a multi-event call still owning its events', () => {
    const built = tree(
      [
        row({ core_span_id: 'a', event_kind: 'embedding', request_time: 1000 }),
        row({ core_span_id: 'b', reasoning_tokens: 264, request_time: 2000 }),
      ],
      [output('b', { text: 'answered' })],
    );

    expect(built).toHaveLength(2);
    expect(built.every(({ depth }) => depth === 0)).toBe(true);
    expect(built[0].children).toEqual([]);
    expect(built[1].children.map(({ type }) => type)).toEqual([HopEventType.Thinking, HopEventType.Text]);
  });

  test('orders hops by when they were recorded', () => {
    const built = tree([
      row({ core_span_id: 'late', event_kind: 'embedding', request_time: 9000 }),
      row({ core_span_id: 'early', event_kind: 'embedding', request_time: 1000 }),
    ]);

    expect(hopsOf(built).map(({ span }) => span?.core_span_id)).toEqual(['early', 'late']);
  });

  test('numbers every node by its place in the whole turn', () => {
    const built = tree(
      [
        row({ core_span_id: 'a', event_kind: 'embedding', request_time: 1000 }),
        row({ core_span_id: 'b', request_time: 2000 }),
      ],
      [output('b', { text: 'answered' })],
    );

    expect(walk(built).map(({ position }) => position)).toEqual([1, 2]);
  });

  test('a turn with no hops produces no tree', () => {
    expect(tree([])).toEqual([]);
  });
});

describe('FILTERABLE_EVENT_TYPES', () => {
  // Not the rendered set any more — the order whichever categories are present are offered in.
  test('orders every category a turn can record, and nothing that is not one', () => {
    expect(FILTERABLE_EVENT_TYPES).toContain(HopEventType.Session);
    expect(FILTERABLE_EVENT_TYPES).toContain(HopEventType.Embedding);
    expect(FILTERABLE_EVENT_TYPES).toHaveLength(Object.values(HopEventType).length);
  });

  test('offers only the categories a turn actually recorded', () => {
    const built = tree(
      [
        row({ core_span_id: 'e', event_kind: 'embedding', request_time: 1000 }),
        row({ core_span_id: 'p', event_kind: 'mcp', mcp_method: 'initialize', request_time: 1100 }),
        row({ core_span_id: 'm', request_time: 1200 }),
      ],
      [output('m', { text: 'answered' })],
    );

    expect(categoriesOf(built)).toEqual([HopEventType.Text, HopEventType.Session, HopEventType.Embedding]);
  });

  // A multi-event call is the only kind the derivation ever names a model call, so it is the only thing that
  // puts the control on screen.
  test('offers the model-call category only where a call emitted several events', () => {
    const single = tree([row({ core_span_id: 'm' })], [output('m', { text: 'answered' })]);
    const several = tree([row({ core_span_id: 'm', reasoning_tokens: 264 })], [output('m', { text: 'answered' })]);

    expect(categoriesOf(single)).not.toContain(HopEventType.ModelCall);
    expect(categoriesOf(several)).toContain(HopEventType.ModelCall);
  });

  // Children keep a one-event hop's node, but they do not turn it into a model call — so no control appears
  // for one, and the categories on offer are the two the turn actually recorded.
  test('offers no model-call category for a one-event hop that merely acquired a child', () => {
    const built = tree([
      row({
        core_span_id: 'mcp',
        event_kind: 'mcp',
        mcp_method: 'tools/call',
        mcp_tool_call_name: 'rag_search',
        request_time: 1000,
      }),
      row({ core_span_id: 'inner', core_parent_span_id: 'mcp', event_kind: 'embedding', request_time: 2000 }),
    ]);

    expect(categoriesOf(built)).toEqual([HopEventType.ToolResult, HopEventType.Embedding]);
  });
});
