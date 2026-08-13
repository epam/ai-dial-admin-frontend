import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentProps } from 'react';
import { describe, expect, test, vi } from 'vitest';

import ConversationSpanDetail from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationSpanDetail';
import ConversationSpanList from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationSpanList';
import ConversationTraceView from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationTraceView';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { ConversationSpanRow, SpanCategory } from '@/src/models/analytics/conversations-trace';
import { buildSpanTree } from '@/src/utils/analytics/conversation-spans';

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
  deployment_price: '0.001',
  request_time: '2026-08-13T10:59:05.600Z',
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

describe('ConversationTraceView', () => {
  const renderTrace = (props: Partial<ComponentProps<typeof ConversationTraceView>> = {}) =>
    render(
      <ConversationTraceView
        turnNumber={2}
        traceId={TRACE_ID}
        spans={SPANS}
        total={SPANS.length}
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
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('2');
    expect(screen.getByText(TRACE_ID)).toBeInTheDocument();
  });

  // Hops of one trace overlap, so the enclosing hop's duration is the latency and summing would report a
  // turn as slower than it was.
  test('reports the longest hop as the latency rather than the sum', () => {
    renderTrace();

    expect(statFor(ConversationsTraceI18nKey.TraceLatency)).toHaveTextContent('5.2s');
  });

  test('totals the tokens and each hop own cost across the trace', () => {
    renderTrace();

    expect(statFor(ConversationsTraceI18nKey.TraceTokens)).toHaveTextContent('1.1 K');
    expect(statFor(ConversationsTraceI18nKey.TraceCost)).toHaveTextContent('$0.0015');
  });

  test('counts the hops the trace is made of', () => {
    renderTrace();

    expect(statFor(ConversationsTraceI18nKey.TraceSpans)).toHaveTextContent('2');
  });

  test('reports the trace as ok when every hop succeeded', () => {
    renderTrace();

    expect(statFor(ConversationsTraceI18nKey.TraceStatus)).toHaveTextContent(ConversationsTraceI18nKey.TraceOk);
  });

  // One failed hop makes the turn a failure for the reader, whatever the other hops did.
  test('reports the trace as failed when any hop failed', () => {
    renderTrace({ spans: [span(), span({ core_span_id: 's2', success: false })] });

    expect(statFor(ConversationsTraceI18nKey.TraceStatus)).toHaveTextContent(ConversationsTraceI18nKey.TraceFailed);
  });

  // The span read is capped, and a trace that was cut off must say so rather than presenting a partial
  // tree as the whole turn.
  test('declares itself partial when the trace holds more hops than were read', () => {
    renderTrace({ total: 922 });

    expect(screen.getByText(ConversationsTraceI18nKey.TraceSpansPartial)).toBeInTheDocument();
  });

  test('makes no partial claim when it read every hop', () => {
    renderTrace();

    expect(screen.queryByText(ConversationsTraceI18nKey.TraceSpansPartial)).not.toBeInTheDocument();
  });

  test('reports a failed span query instead of an empty tree', () => {
    renderTrace({ spans: [], total: null, hasLoadError: true });

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

  // Colour is the only thing separating the categories in the tree, so the legend has to name all of them.
  test('names every span category in its legend', () => {
    renderTrace({ spans: [], total: null });

    for (const key of [
      ConversationsTraceI18nKey.SpanError,
      ConversationsTraceI18nKey.SpanEmbedding,
      ConversationsTraceI18nKey.SpanRetrieval,
      ConversationsTraceI18nKey.SpanRoute,
      ConversationsTraceI18nKey.SpanDeployment,
      ConversationsTraceI18nKey.SpanOther,
    ]) {
      expect(screen.getByText(key)).toBeInTheDocument();
    }
  });
});

describe('ConversationSpanList', () => {
  const renderList = (props: Partial<ComponentProps<typeof ConversationSpanList>> = {}) =>
    render(
      <ConversationSpanList nodes={buildSpanTree(SPANS)} selectedSpanId={null} onSelectSpan={vi.fn()} {...props} />,
    );

  test('renders a row per hop, naming its deployment and endpoint', () => {
    renderList();

    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByText('switchyard-model')).toBeInTheDocument();
    expect(screen.getByText('text-embedding-3')).toBeInTheDocument();
    expect(screen.getByText('POST /openai/deployments/switchyard-model/chat/completions')).toBeInTheDocument();
    expect(screen.getByText('POST /openai/deployments/text-embedding-3/embeddings')).toBeInTheDocument();
  });

  test('marks the selected hop as the current one', () => {
    renderList({ selectedSpanId: 's2' });

    const [parent, child] = screen.getAllByRole('button');
    expect(parent).toHaveAttribute('aria-current', 'false');
    expect(child).toHaveAttribute('aria-current', 'true');
  });

  test('reports which hop was chosen', async () => {
    const onSelectSpan = vi.fn();
    const user = userEvent.setup();
    renderList({ onSelectSpan });

    await user.click(screen.getAllByRole('button')[1]);

    expect(onSelectSpan).toHaveBeenCalledWith('s2');
  });

  test('indents a hop under the one that called it', () => {
    renderList();

    const [parent, child] = screen.getAllByRole('button');
    expect(parent.style.marginLeft).toBe('0px');
    expect(child.style.marginLeft).toBe('20px');
  });

  test('states when a turn recorded no hops at all', () => {
    renderList({ nodes: [] });

    expect(screen.getByText(ConversationsTraceI18nKey.TraceNoSpans)).toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});

describe('ConversationSpanDetail', () => {
  const nodes = buildSpanTree(SPANS);

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

  test('places the hop in the trace by its offset and its own duration', () => {
    render(<ConversationSpanDetail node={nodes[1]} />);

    expect(screen.getByText('+1.5s')).toBeInTheDocument();
    expect(screen.getByText('2.9s')).toBeInTheDocument();
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
          depth: 0,
          category: SpanCategory.Deployment,
          offsetMs: null,
          durationMs: null,
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
