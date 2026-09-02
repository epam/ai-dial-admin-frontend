import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentProps } from 'react';
import { describe, expect, test, vi } from 'vitest';

import ConversationSpanDetail from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationSpanDetail';
import ConversationTraceView from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationTraceView';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { toMillis } from '@/src/utils/analytics/conversation-formatting';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import {
  ConversationSpanNode,
  ConversationSpanRow,
  ConversationTraceFigures,
  ConversationTranscriptAvailability,
  SessionScope,
  SpanKind,
} from '@/src/models/analytics/conversations-trace';

// The inspector's reads are the component's only side effects: mocked so the trace view's own rendering is
// what is under test, and so a suppressed side can be told apart from one whose read has not answered yet.
const getConversationHopRequest = vi.fn().mockResolvedValue({ success: true, response: undefined });
const getConversationHopResponse = vi.fn().mockResolvedValue({ success: true, response: undefined });
const getConversationHopProperty = vi.fn().mockResolvedValue({ success: true, response: undefined });
const getConversationHopRawBody = vi.fn().mockResolvedValue({ success: true, response: undefined });
const getConversationHopMcp = vi.fn().mockResolvedValue({ success: true, response: undefined });
const getConversationHopEmbedding = vi.fn().mockResolvedValue({ success: true, response: undefined });

vi.mock('@/src/app/[lang]/conversations-trace/actions', () => ({
  getConversationHopRequest: (...args: unknown[]) => getConversationHopRequest(...args),
  getConversationHopResponse: (...args: unknown[]) => getConversationHopResponse(...args),
  getConversationHopProperty: (...args: unknown[]) => getConversationHopProperty(...args),
  getConversationHopRawBody: (...args: unknown[]) => getConversationHopRawBody(...args),
  getConversationHopMcp: (...args: unknown[]) => getConversationHopMcp(...args),
  getConversationHopEmbedding: (...args: unknown[]) => getConversationHopEmbedding(...args),
}));

const SCOPE: SessionScope = { id: 'chat-1', source: null };

const GRANTS: ConversationTranscriptAvailability = {
  isReadable: true,
  isRequestReadable: true,
  isResponseReadable: true,
};

const TRACE_ID = '0a3f1d9c8b7e6a5f';

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
  reasoning_tokens: 0,
  request_body_bytes: 2048,
  number_request_messages: 2,
  deployment_price: '0.001',
  request_time: '2026-08-13T10:59:05.600Z',
  response_body_bytes: 4096,
  ...overrides,
});

const CHILD = span({
  core_span_id: 's2',
  core_parent_span_id: 's1',
  deployment: 'text-embedding-3',
  event_kind: 'embedding',
  request_uri: '/openai/deployments/text-embedding-3/embeddings',
  operation_duration_ms: 2890,
  total_tokens: 1060,
  deployment_price: '0.0005',
  request_time: '2026-08-13T10:59:07.100Z',
});

const SPANS = [span(), CHILD];

const statFor = (label: string) => screen.getByText(label).parentElement;

// The trace's figures as the listing states them, so the drawer and the card that opened it cannot disagree.
const FIGURES: ConversationTraceFigures = {
  traceId: TRACE_ID,
  startedAt: 1787218895000,
  spans: 2,
  failedSpans: 0,
  tokens: 1078,
  price: '0.0015',
  durationMs: 1500,
};

describe('ConversationTraceView', () => {
  const renderTrace = (props: Partial<ComponentProps<typeof ConversationTraceView>> = {}) =>
    render(
      <ConversationTraceView
        scope={SCOPE}
        bodyGrants={GRANTS}
        figures={FIGURES}
        spans={SPANS}
        hasLoadError={false}
        selectedSpanId={null}
        onSelectSpan={vi.fn()}
        onClose={vi.fn()}
        {...props}
      />,
    );

  test('names itself by its trace when the caller supplies no title', () => {
    renderTrace();

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(TRACE_ID);
    // Once, not twice: with no title the heading already is the trace id, so repeating it beneath says the
    // same thing twice. A `length > 0` assertion here tolerated exactly that.
    expect(screen.getAllByText(TRACE_ID)).toHaveLength(1);
  });

  // A reader who arrived from a card should see the same name they clicked.
  test('titles itself with the name the caller supplied', () => {
    renderTrace({ title: 'applications/public/pg-chat-hub__1.0.0' });

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('applications/public/pg-chat-hub__1.0.0');
    // With a title, the trace id is the subtitle — stated once, beneath a heading that is not it.
    expect(screen.getAllByText(TRACE_ID)).toHaveLength(1);
  });

  // The data records no turn index, so there is no ordinal to render and none to fall back to. An earlier
  // version passed 0 as a turn number alongside a title, and every drawer read "Turn 0".
  test('states no turn number, whether or not a title was supplied', () => {
    renderTrace({ title: 'echo' });

    expect(screen.queryByText(/Turn \d/)).toBeNull();

    renderTrace();

    expect(screen.queryByText(/Turn \d/)).toBeNull();
  });

  // Every figure is the trace's own, from the same figures read the listing renders — so the two cannot disagree. Summing the
  // hop rows instead disagreed with the list by a factor of five on one 384-hop turn, because the read stops
  // at `CONVERSATION_SPAN_LIMIT` and a sum over what it returned is a sum over part of the turn.
  test('states the turn own figures rather than re-deriving them from the hop rows', () => {
    renderTrace();

    expect(statFor(ConversationsTraceI18nKey.TraceDuration)).toHaveTextContent('1.5s');
    expect(statFor(ConversationsTraceI18nKey.TraceTokens)).toHaveTextContent('1.1 K');
    expect(statFor(ConversationsTraceI18nKey.TraceCost)).toHaveTextContent('$0.0015');
    expect(statFor(ConversationsTraceI18nKey.TraceSpans)).toHaveTextContent('2');
  });

  // The clipped sample below must not move a single figure in the header: a 384-hop turn reads 300 hops, and
  // summing those reported 700 K tokens against the list's 3.67 M.
  test('the figures do not move when the hop chain is clipped', () => {
    renderTrace({ figures: { ...FIGURES, spans: 384, tokens: 3667333 }, spans: [span()] });

    expect(statFor(ConversationsTraceI18nKey.TraceTokens)).toHaveTextContent('3.7 M');
    expect(statFor(ConversationsTraceI18nKey.TraceSpans)).toHaveTextContent('384');
  });

  test('reports the trace as ok when the rollup counted no failed hop', () => {
    renderTrace();

    expect(statFor(ConversationsTraceI18nKey.TraceStatus)).toHaveTextContent(ConversationsTraceI18nKey.TraceOk);
  });

  // One failed hop makes the turn a failure for the reader, whatever the other hops did — and the rollup
  // counts them across the whole turn, not only across the hops that were read.
  test('reports the trace as failed when the rollup counted a failed hop', () => {
    renderTrace({ figures: { ...FIGURES, failedSpans: 1 } });

    expect(statFor(ConversationsTraceI18nKey.TraceStatus)).toHaveTextContent(ConversationsTraceI18nKey.TraceFailed);
  });

  // The span read is capped, and a trace that was cut off must say so rather than presenting a partial
  // tree as the whole turn.
  test('declares itself partial when the turn holds more hops than were read', () => {
    renderTrace({ figures: { ...FIGURES, spans: 922 } });

    expect(screen.getByText(ConversationsTraceI18nKey.TraceSpansPartial)).toBeInTheDocument();
  });

  test('makes no partial claim when it read every hop', () => {
    renderTrace();

    expect(screen.queryByText(ConversationsTraceI18nKey.TraceSpansPartial)).not.toBeInTheDocument();
  });

  test('reports a failed span query instead of an empty tree', () => {
    renderTrace({ spans: [], hasLoadError: true });

    expect(screen.getByText(ConversationsTraceI18nKey.TraceLoadFailed)).toBeInTheDocument();
    expect(screen.queryByText(ConversationsTraceI18nKey.TraceNoSpans)).not.toBeInTheDocument();
  });

  // The view builds the tree from the recorded hops alone: the turn's question and totals are the heading and
  // the figures beside it, stated once.
  test('renders the turn hops as a tree, nesting a hop under the hop that called it', () => {
    renderTrace();

    const tree = within(screen.getByRole('group', { name: ConversationsTraceI18nKey.StreamLabel }));

    expect(tree.getAllByRole('button', { name: /switchyard-model/ }).length).toBeGreaterThan(0);
    expect(tree.getAllByRole('button', { name: /text-embedding-3/ }).length).toBeGreaterThan(0);
  });

  test('holds no tree node standing for the turn question or its totals', () => {
    renderTrace({ title: 'why 2021-2025?' });

    const tree = within(screen.getByRole('group', { name: ConversationsTraceI18nKey.StreamLabel }));

    expect(tree.queryByText('why 2021-2025?')).toBeNull();
    // The figures stay where they were — in the header, not repeated as a closing node.
    expect(statFor(ConversationsTraceI18nKey.TraceTokens)).toHaveTextContent('1.1 K');
  });

  test('reports a turn whose trace returned no hops', () => {
    renderTrace({ spans: [] });

    expect(screen.getByText(ConversationsTraceI18nKey.TraceNoSpans)).toBeInTheDocument();
  });

  test('returns to the transcript through its back control', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderTrace({ onClose });

    await user.click(screen.getByRole('button', { name: ConversationsTraceI18nKey.TraceBackToTranscript }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});

const renderDetail = (node: ConversationSpanNode | null) =>
  render(
    <ConversationSpanDetail
      node={node}
      scope={SCOPE}
      traceId={TRACE_ID}
      bodyGrants={GRANTS}
      mcpToolCalls={{ counts: {}, isComplete: true }}
    />,
  );

describe('ConversationSpanDetail', () => {
  const nodes: ConversationSpanNode[] = SPANS.map((span) => ({
    span,
    kind: SpanKind.Llm,
    hasFailed: false,
    startedAtMs: toMillis(span.request_time),
  }));

  test('asks for a selection while no hop is chosen', () => {
    renderDetail(null);

    expect(screen.getByText(ConversationsTraceI18nKey.SpanSelected)).toBeInTheDocument();
  });

  test('reports where the hop went and what came back', () => {
    renderDetail(nodes[0]);

    expect(screen.getByText('/openai/deployments/switchyard-model/chat/completions')).toBeInTheDocument();
    expect(screen.getByText('https://core.dial.parts/openai/deployments/switchyard')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('$0.001')).toBeInTheDocument();
  });

  // Its absolute recorded time, and nothing derived from `operation_duration_ms`: a recorded zero there is
  // indistinguishable between a real sub-millisecond operation and a producer that never reported one.
  // The recorded duration is stated; an offset from the start of the trace still is not, because hops
  // interleave and a bar would assert a timeline the ordering rule refuses to claim.
  test('places the hop by its own recorded time and states its duration, but no offset', () => {
    renderDetail(nodes[1]);

    expect(screen.getByText(ConversationsTraceI18nKey.SpanRecordedAt)).toBeInTheDocument();
    expect(screen.getByText(new Date('2026-08-13T10:59:07.100Z').toLocaleString())).toBeInTheDocument();
    expect(screen.getByText(ConversationsTraceI18nKey.DetailDuration)).toBeInTheDocument();
    expect(screen.queryByText('+1.5s')).toBeNull();
  });

  test('marks metadata the log did not record as unavailable', () => {
    renderDetail({
      span: span({
        request_uri: null,
        response_upstream_uri: null,
        parent_deployment: null,
        response_status: null,
      }),
      kind: SpanKind.Llm,
      hasFailed: false,
      startedAtMs: null,
    });

    expect(screen.getAllByText(UNAVAILABLE_VALUE).length).toBeGreaterThan(1);
  });

  // Kind and outcome, side by side. The badge no longer reports the failure in place of the kind, so a failed
  // model call and a failed tool call stay distinguishable.
  test('marks a failed hop as failed while keeping its kind', () => {
    renderDetail({ ...nodes[0], span: span({ success: false }), hasFailed: true });

    expect(screen.getByText(ConversationsTraceI18nKey.SpanFailedMarker)).toBeInTheDocument();
    expect(screen.getByText(ConversationsTraceI18nKey.SpanLlm)).toBeInTheDocument();
  });

  test('states the kind alone for a hop that succeeded', () => {
    renderDetail(nodes[0]);

    expect(screen.getByText(ConversationsTraceI18nKey.SpanLlm)).toBeInTheDocument();
    expect(screen.queryByText(ConversationsTraceI18nKey.SpanFailedMarker)).toBeNull();
  });
});

describe('ConversationSpanDetail — MCP hops', () => {
  test('renders the routing chain in the order the log recorded it', () => {
    renderDetail({
      span: span({ execution_path: ['deep-research-app', 'gpt-5.4-2026-03-05'] }),
      kind: SpanKind.Llm,
      hasFailed: false,
      startedAtMs: 1000,
    });

    expect(screen.getByText(ConversationsTraceI18nKey.SpanRouting)).toBeInTheDocument();
    expect(screen.getByText('deep-research-app → gpt-5.4-2026-03-05')).toBeInTheDocument();
  });

  test('states the MCP method and tool where the hop recorded them', () => {
    renderDetail({
      span: span({ event_kind: 'mcp', mcp_method: 'tools/call', mcp_tool_call_name: 'a_search_tool' }),
      kind: SpanKind.Mcp,
      hasFailed: false,
      startedAtMs: 1000,
    });

    expect(screen.getByText(ConversationsTraceI18nKey.SpanMcpTool)).toBeInTheDocument();
    // Once, in the fact row. The heading names the server that served the call, not the tool it called.
    expect(screen.getAllByText('a_search_tool')).toHaveLength(1);
    expect(screen.getByText(ConversationsTraceI18nKey.SpanMcpMethod)).toBeInTheDocument();
    expect(screen.getByText('tools/call')).toBeInTheDocument();
  });

  test('omits the MCP rows for a hop that recorded none of them', () => {
    renderDetail({ span: span(), kind: SpanKind.Llm, hasFailed: false, startedAtMs: 1 });

    expect(screen.queryByText(ConversationsTraceI18nKey.SpanMcpTool)).toBeNull();
    expect(screen.queryByText(ConversationsTraceI18nKey.SpanMcpMethod)).toBeNull();
    expect(screen.queryByText(ConversationsTraceI18nKey.SpanRouting)).toBeNull();
  });
});
