import { render, screen } from '@testing-library/react';
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
  ConversationTurnRow,
  SpanCategory,
} from '@/src/models/analytics/conversations-trace';

// The hop-body read is the component's only side effect: mocked so the trace view's own rendering is what is
// under test, and so a suppressed hop can be told apart from a hop whose read has not answered yet.
const getConversationHopBodies = vi.fn();

vi.mock('@/src/app/[lang]/conversations-trace/actions', () => ({
  getConversationHopBodies: (...args: unknown[]) => getConversationHopBodies(...args),
}));

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

// The turn as the rollup resolved it, which is the same row the trace list renders.
const TURN: ConversationTurnRow = {
  trace_id: TRACE_ID,
  started: 1787218895000,
  hops: 2,
  failed_hops: 0,
  tokens: 1078,
  cost: '0.0015',
  duration_ms: 1500,
};

describe('ConversationTraceView', () => {
  const renderTrace = (props: Partial<ComponentProps<typeof ConversationTraceView>> = {}) =>
    render(
      <ConversationTraceView
        chatId="chat-1"
        turnNumber={2}
        turn={TURN}
        spans={SPANS}
        modelOutputs={[]}
        hasLoadError={false}
        selectedSpanId={null}
        onSelectSpan={vi.fn()}
        onClose={vi.fn()}
        {...props}
      />,
    );

  test('names the turn it belongs to and the trace it is', () => {
    renderTrace();

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(ConversationsTraceI18nKey.TraceTurn);
    expect(screen.getByText(TRACE_ID)).toBeInTheDocument();
  });

  // A reader who arrived here from a list row should see the same thing they clicked.
  test('titles itself with the question the turn answered', () => {
    renderTrace({ question: 'what exactly have you updated in this plan?' });

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('what exactly have you updated in this plan?');
    expect(screen.getByText(TRACE_ID)).toBeInTheDocument();
    expect(screen.getByText(ConversationsTraceI18nKey.TraceTurn, { exact: false })).toBeInTheDocument();
  });

  test('falls back to the turn number when the turn has no question', () => {
    renderTrace();

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(ConversationsTraceI18nKey.TraceTurn);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('2');
  });

  // Every figure is the turn's own, from the rollup the list reads — so the two cannot disagree. Summing the
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
    renderTrace({ turn: { ...TURN, hops: 384, tokens: 3667333 }, spans: [span()] });

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
    renderTrace({ turn: { ...TURN, failed_hops: 1 } });

    expect(statFor(ConversationsTraceI18nKey.TraceStatus)).toHaveTextContent(ConversationsTraceI18nKey.TraceFailed);
  });

  // The span read is capped, and a trace that was cut off must say so rather than presenting a partial
  // tree as the whole turn.
  test('declares itself partial when the turn holds more hops than were read', () => {
    renderTrace({ turn: { ...TURN, hops: 922 } });

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

  test('returns to the transcript through its back control', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderTrace({ onClose });

    await user.click(screen.getByRole('button', { name: ConversationsTraceI18nKey.TraceBackToTranscript }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe('ConversationSpanDetail', () => {
  const nodes = SPANS.map((span) => ({
    span,
    category: SpanCategory.Deployment,
    startedAtMs: toMillis(span.request_time),
  }));

  test('asks for a selection while no hop is chosen', () => {
    render(<ConversationSpanDetail node={null} />);

    expect(screen.getByText(ConversationsTraceI18nKey.SpanSelected)).toBeInTheDocument();
  });

  test('reports where the hop went and what came back', () => {
    render(<ConversationSpanDetail node={nodes[0]} />);

    expect(screen.getByText('/openai/deployments/switchyard-model/chat/completions')).toBeInTheDocument();
    expect(screen.getByText('https://core.dial.parts/openai/deployments/switchyard')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('$0.001')).toBeInTheDocument();
  });

  // Its absolute recorded time, and nothing derived from `operation_duration_ms`: a recorded zero there is
  // indistinguishable between a real sub-millisecond operation and a producer that never reported one.
  test('places the hop by its own recorded time, stating no duration or offset', () => {
    render(<ConversationSpanDetail node={nodes[1]} />);

    expect(screen.getByText(ConversationsTraceI18nKey.SpanRecordedAt)).toBeInTheDocument();
    expect(screen.getByText(new Date('2026-08-13T10:59:07.100Z').toLocaleString())).toBeInTheDocument();
    expect(screen.queryByText('+1.5s')).toBeNull();
    expect(screen.queryByText('2.9s')).toBeNull();
  });

  test('marks metadata the log did not record as unavailable', () => {
    render(
      <ConversationSpanDetail
        node={{
          span: span({
            request_uri: null,
            response_upstream_uri: null,
            parent_deployment: null,
            response_status: null,
          }),
          category: SpanCategory.Deployment,
          startedAtMs: null,
        }}
      />,
    );

    expect(screen.getAllByText(UNAVAILABLE_VALUE).length).toBeGreaterThan(1);
  });

  test('reports a failed hop as failed rather than ok', () => {
    render(<ConversationSpanDetail node={{ ...nodes[0], span: span({ success: false }) }} />);

    expect(screen.getByText(ConversationsTraceI18nKey.TraceFailed)).toBeInTheDocument();
    expect(screen.queryByText(ConversationsTraceI18nKey.TraceOk)).not.toBeInTheDocument();
  });
});

describe('ConversationSpanDetail — MCP hops', () => {
  test('renders the routing chain in the order the log recorded it', () => {
    render(
      <ConversationSpanDetail
        node={{
          span: span({ execution_path: ['statgpt-deep-research', 'gpt-5.4-2026-03-05'] }),
          category: SpanCategory.Deployment,
          startedAtMs: 1000,
        }}
      />,
    );

    expect(screen.getByText(ConversationsTraceI18nKey.SpanRouting)).toBeInTheDocument();
    expect(screen.getByText('statgpt-deep-research → gpt-5.4-2026-03-05')).toBeInTheDocument();
  });

  test('states the MCP method and tool where the hop recorded them', () => {
    render(
      <ConversationSpanDetail
        node={{
          span: span({ event_kind: 'mcp', mcp_method: 'tools/call', mcp_tool_call_name: 'rag_search' }),
          category: SpanCategory.Retrieval,
          startedAtMs: 1000,
        }}
      />,
    );

    expect(screen.getByText(ConversationsTraceI18nKey.SpanMcpTool)).toBeInTheDocument();
    // Also the heading, which labels the hop by its tool.
    expect(screen.getAllByText('rag_search')).toHaveLength(2);
    expect(screen.getByText(ConversationsTraceI18nKey.SpanMcpMethod)).toBeInTheDocument();
    expect(screen.getByText('tools/call')).toBeInTheDocument();
  });

  test('omits the MCP rows for a hop that recorded none of them', () => {
    render(<ConversationSpanDetail node={{ span: span(), category: SpanCategory.Deployment, startedAtMs: 1 }} />);

    expect(screen.queryByText(ConversationsTraceI18nKey.SpanMcpTool)).toBeNull();
    expect(screen.queryByText(ConversationsTraceI18nKey.SpanMcpMethod)).toBeNull();
    expect(screen.queryByText(ConversationsTraceI18nKey.SpanRouting)).toBeNull();
  });
});
