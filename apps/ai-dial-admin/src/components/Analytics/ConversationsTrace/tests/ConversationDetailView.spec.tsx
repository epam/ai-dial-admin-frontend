import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentProps } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import ConversationDetailView from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationDetailView';
import { BasicI18nKey, ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { ConversationDetailRow, HopDialect, HopReadState } from '@/src/models/analytics/conversations-trace';

const getConversationSpans = vi.fn();
const getConversationHopRequest = vi.fn();
const getConversationHopResponse = vi.fn();
const getConversationHopProperty = vi.fn();
const getConversationHopRawBody = vi.fn();
const getConversationHopMcp = vi.fn();
const getConversationHopEmbedding = vi.fn();
const getConversationTracePage = vi.fn();

vi.mock('@/src/app/[lang]/conversations-trace/actions', () => ({
  getConversationSpans: (...args: unknown[]) => getConversationSpans(...args),
  getConversationHopRequest: (...args: unknown[]) => getConversationHopRequest(...args),
  getConversationHopResponse: (...args: unknown[]) => getConversationHopResponse(...args),
  getConversationHopProperty: (...args: unknown[]) => getConversationHopProperty(...args),
  getConversationHopRawBody: (...args: unknown[]) => getConversationHopRawBody(...args),
  getConversationHopMcp: (...args: unknown[]) => getConversationHopMcp(...args),
  getConversationHopEmbedding: (...args: unknown[]) => getConversationHopEmbedding(...args),
  getConversationTracePage: (...args: unknown[]) => getConversationTracePage(...args),
}));

// Counting stub: the header sits above the trace listing, so its render count is the direct measure of
// whether opening a trace re-renders the page around it.
const headerRenders = vi.fn();

vi.mock('@/src/components/Analytics/ConversationsTrace/Detail/ConversationDetailHeader', () => ({
  default: () => {
    headerRenders();
    return <h1>conversation header</h1>;
  },
}));

const CONVERSATION = {
  client_session_id: 'chat-1',
  client_session_source: 'chat_id',
  project_id: 'project',
  user_hash: 'user',
  turn_count: 2,
  first_request_time: 1,
  last_request_time: 2,
  prompt_tokens: 1,
  completion_tokens: 1,
  total_tokens: 2,
  total_price: '0.01',
  success_count: 2,
  duration_ms: 100,
  avg_duration_ms: 50,
  deployments: ['gpt'],
} as ConversationDetailRow;

const traceGroup = (traceId: string, deployment: string) => ({
  traceId,
  startedAt: 1,
  spans: 2,
  tokens: 10,
  price: 0.001,
  failedSpans: 0,
  chips: [{ eventKind: 'llm_call', spans: 2 }],
  responseIds: [],
  cards: [
    {
      traceId,
      coreSpanId: `${traceId}-root`,
      startedAt: 1,
      durationMs: 100,
      isSuccess: true,
      responseStatus: 200,
      ownTokens: 10,
      ownPrice: 0.001,
      chainPrice: 0.001,
      deployment,
      requestUri: '/openai/deployments/gpt/chat/completions',
      eventKind: 'llm_call',
      requestMessages: 1,
      hasConversationLabel: true,
      isCoreInternal: false,
    },
  ],
  elidedCardCount: 0,
  isRootRecorded: true,
});

const renderView = (props: Partial<ComponentProps<typeof ConversationDetailView>> = {}) =>
  render(
    <ConversationDetailView
      conversation={CONVERSATION}
      insightColumns={[]}
      feedback={null}
      bodyGrants={{ isRequestReadable: true, isResponseReadable: true }}
      nowMs={1000}
      {...props}
    />,
  );

beforeEach(() => {
  vi.clearAllMocks();
  getConversationSpans.mockResolvedValue({
    success: true,
    response: { spans: [{ core_span_id: 's1', core_parent_span_id: null, request_time: 1 }], total: 1 },
  });
  // Opening a chain selects its first hop, which reads that hop's request — one hop, on demand.
  getConversationHopRequest.mockResolvedValue({
    success: true,
    response: {
      state: HopReadState.Available,
      dialect: HopDialect.ChatCompletions,
      params: { stated: [], rest: [] },
      messages: [],
      roleCounts: [],
      recordedBytes: 10,
      isClamped: false,
    },
  });
  getConversationTracePage.mockResolvedValue({
    success: true,
    response: { groups: [traceGroup('t1', 'gpt-one'), traceGroup('t2', 'gpt-two')], hasMore: false },
  });
});

describe('ConversationDetailView', () => {
  // A conversation's readable exchange is the request history of its entry span, and the trace's own Chat tab
  // states it where everything else about that trace is stated — so this view offers no second way in.
  test('opens on the trace listing, with no view switch', async () => {
    renderView();

    expect(await screen.findByText('gpt-one')).toBeInTheDocument();
    expect(screen.queryByRole('tab')).toBeNull();
  });

  // The listing renders from the conversation's own recorded calls, so the page opens without a body read
  // and without dropping into one trace's hop chain.
  test('names each recorded call and reads no spans yet', async () => {
    renderView();

    expect(await screen.findByText('gpt-one')).toBeInTheDocument();
    expect(screen.getByText('gpt-two')).toBeInTheDocument();
    expect(getConversationSpans).not.toHaveBeenCalled();
  });

  test('a card in the listing opens that trace hop chain', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(await screen.findByText('gpt-two'));

    expect(getConversationSpans).toHaveBeenCalledWith('t2');
  });

  // A Core-internal root can fire long after the hop it belongs to, so the earliest span is not reliably the
  // entry hop — and the entry hop is the one whose history is the conversation.
  test('opens a trace on its entry hop rather than on its earliest span', async () => {
    const user = userEvent.setup();
    getConversationSpans.mockResolvedValue({
      success: true,
      response: {
        spans: [
          { core_span_id: 'child', core_parent_span_id: 'root', request_time: 1, deployment: 'a-child-call' },
          { core_span_id: 'root', core_parent_span_id: null, request_time: 9, deployment: 'the-entry-hop' },
        ],
        total: 2,
      },
    });
    renderView();

    await user.click(await screen.findByText('gpt-two'));

    // The rail states the selected span, so the name it shows is the selection.
    expect(await screen.findByRole('button', { name: /the-entry-hop/, current: true })).toBeInTheDocument();
  });

  test('closing an open hop chain returns to the listing', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(await screen.findByText('gpt-two'));
    await user.click(await screen.findByRole('button', { name: ConversationsTraceI18nKey.TraceBackToList }));

    expect(screen.getByText('gpt-two')).toBeInTheDocument();
  });

  // Two stacked headers would leave the reader unsure which of them the figures belong to. The body stays
  // mounted, so it is the hiding that has to be asserted.
  test('hides the conversation header and the listing while a trace is open', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(await screen.findByText('gpt-two'));
    await screen.findByRole('button', { name: ConversationsTraceI18nKey.TraceBackToList });

    const hidden = screen.getByText('conversation header').closest('.hidden');

    expect(hidden).toBeTruthy();
    expect(hidden).toHaveAttribute('inert');
  });

  // Body grants reach only the span inspector's tabs inside an open trace, so a caller holding none of them
  // changes nothing here: the listing renders from the conversation's recorded calls, with no body read to
  // withhold and so nothing to explain.
  test('renders the listing unchanged for a caller who can read no body column', async () => {
    renderView({ bodyGrants: { isRequestReadable: false, isResponseReadable: false } });

    expect(await screen.findByText('gpt-one')).toBeInTheDocument();
    expect(screen.queryByRole('tab')).toBeNull();
  });

  // Nothing to open, but the view still has something to say. The listing resolves its own traces, so
  // emptiness is a property of that read.
  test('a conversation with no recorded traces states so rather than reporting an error', async () => {
    getConversationTracePage.mockResolvedValue({ success: true, response: { groups: [], hasMore: false } });
    renderView();

    expect(await screen.findByText(ConversationsTraceI18nKey.TraceListEmpty)).toBeInTheDocument();
    expect(screen.getByText(ConversationsTraceI18nKey.TraceListEmptyHintLive)).toBeInTheDocument();
    expect(getConversationSpans).not.toHaveBeenCalled();
  });

  test('a failed trace read is reported as a failure, distinctly from an empty listing', async () => {
    getConversationTracePage.mockResolvedValue({ success: false });
    renderView();

    expect(await screen.findByText(ConversationsTraceI18nKey.TraceListLoadFailed)).toBeInTheDocument();
    expect(screen.queryByText(ConversationsTraceI18nKey.TraceListEmpty)).toBeNull();
  });

  // Paging the listing is a local change and must not re-render the page above it.
  test('loading the listing does not re-render the page around it', async () => {
    renderView();

    await screen.findByText('gpt-one');

    expect(headerRenders).toHaveBeenCalledOnce();
  });

  // Opening a trace does re-render the page: the header has to give way to the trace's own identity.
  test('opening a trace does re-render the page', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(await screen.findByText('gpt-two'));
    await screen.findByRole('button', { name: ConversationsTraceI18nKey.TraceBackToList });

    expect(headerRenders.mock.calls.length).toBeGreaterThan(1);
  });
});

// The overlay is the only thing standing between the reader and the view, so every path out of loading has to
// clear it. A read that rejects rather than returning a failed result — the service unreachable, the session
// gone — used to leave it up for good.
describe('ConversationDetailView — opening a trace', () => {
  const openFirstTrace = async () => {
    const user = userEvent.setup();
    await user.click(await screen.findByText('gpt-one'));
  };

  test('clears the loader when the read rejects, and says the trace could not be read', async () => {
    getConversationSpans.mockRejectedValue(new Error('fetch failed'));
    renderView();

    await openFirstTrace();

    expect(screen.queryByRole('status', { name: BasicI18nKey.Loading })).toBeNull();
    expect(screen.getByText(ConversationsTraceI18nKey.TraceLoadFailed)).toBeInTheDocument();
  });

  test('clears the loader when the read reports a failure', async () => {
    getConversationSpans.mockResolvedValue({ success: false, response: undefined });
    renderView();

    await openFirstTrace();

    expect(screen.queryByRole('status', { name: BasicI18nKey.Loading })).toBeNull();
    expect(screen.getByText(ConversationsTraceI18nKey.TraceLoadFailed)).toBeInTheDocument();
  });

  // A loaded chain under a spinner reads as a chain that never loaded.
  test('shows no overlay over an opened trace', async () => {
    renderView();

    await openFirstTrace();

    expect(screen.queryByRole('status', { name: BasicI18nKey.Loading })).toBeNull();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });
});
