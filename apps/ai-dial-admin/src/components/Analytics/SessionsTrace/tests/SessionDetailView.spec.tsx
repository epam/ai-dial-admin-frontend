import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentProps } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import SessionDetailView from '@/src/components/Analytics/SessionsTrace/Detail/SessionDetailView';
import { BasicI18nKey, SessionsTraceI18nKey } from '@/src/constants/i18n';
import { SessionDetailRow, HopDialect, HopReadState } from '@/src/models/analytics/sessions-trace';

const getSessionSpans = vi.fn();
const getSessionHopRequest = vi.fn();
const getSessionHopResponse = vi.fn();
const getSessionHopProperty = vi.fn();
const getSessionHopRawBody = vi.fn();
const getSessionHopMcp = vi.fn();
const getSessionHopEmbedding = vi.fn();
const getSessionTracePage = vi.fn();

vi.mock('@/src/app/[lang]/sessions/actions', () => ({
  getSessionSpans: (...args: unknown[]) => getSessionSpans(...args),
  getSessionHopRequest: (...args: unknown[]) => getSessionHopRequest(...args),
  getSessionHopResponse: (...args: unknown[]) => getSessionHopResponse(...args),
  getSessionHopProperty: (...args: unknown[]) => getSessionHopProperty(...args),
  getSessionHopRawBody: (...args: unknown[]) => getSessionHopRawBody(...args),
  getSessionHopMcp: (...args: unknown[]) => getSessionHopMcp(...args),
  getSessionHopEmbedding: (...args: unknown[]) => getSessionHopEmbedding(...args),
  getSessionTracePage: (...args: unknown[]) => getSessionTracePage(...args),
}));

// Counting stub: the header sits above the trace listing, so its render count is the direct measure of
// whether opening a trace re-renders the page around it.
const headerRenders = vi.fn();

vi.mock('@/src/components/Analytics/SessionsTrace/Detail/SessionDetailHeader', () => ({
  default: () => {
    headerRenders();
    return <h1>session header</h1>;
  },
}));

const SESSION = {
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
} as SessionDetailRow;

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
      hasSessionLabel: true,
      isCoreInternal: false,
    },
  ],
  elidedCardCount: 0,
  isRootRecorded: true,
});

const renderView = (props: Partial<ComponentProps<typeof SessionDetailView>> = {}) =>
  render(
    <SessionDetailView
      session={SESSION}
      insightColumns={[]}
      feedback={null}
      bodyGrants={{ isRequestReadable: true, isResponseReadable: true }}
      nowMs={1000}
      {...props}
    />,
  );

beforeEach(() => {
  vi.clearAllMocks();
  getSessionSpans.mockResolvedValue({
    success: true,
    response: { spans: [{ core_span_id: 's1', core_parent_span_id: null, request_time: 1 }], total: 1 },
  });
  // Opening a chain selects its first hop, which reads that hop's request — one hop, on demand.
  getSessionHopRequest.mockResolvedValue({
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
  getSessionTracePage.mockResolvedValue({
    success: true,
    response: { groups: [traceGroup('t1', 'gpt-one'), traceGroup('t2', 'gpt-two')], hasMore: false },
  });
});

describe('SessionDetailView', () => {
  // A session's readable exchange is the request history of its entry span, and the trace's own Chat tab
  // states it where everything else about that trace is stated — so this view offers no second way in.
  test('opens on the trace listing, with no view switch', async () => {
    renderView();

    expect(await screen.findByText('gpt-one')).toBeInTheDocument();
    expect(screen.queryByRole('tab')).toBeNull();
  });

  // The listing renders from the session's own recorded calls, so the page opens without a body read
  // and without dropping into one trace's hop chain.
  test('names each recorded call and reads no spans yet', async () => {
    renderView();

    expect(await screen.findByText('gpt-one')).toBeInTheDocument();
    expect(screen.getByText('gpt-two')).toBeInTheDocument();
    expect(getSessionSpans).not.toHaveBeenCalled();
  });

  test('a card in the listing opens that trace hop chain', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(await screen.findByText('gpt-two'));

    expect(getSessionSpans).toHaveBeenCalledWith('t2');
  });

  // A Core-internal root can fire long after the hop it belongs to, so the earliest span is not reliably the
  // entry hop — and the entry hop is the one whose history is the session.
  test('opens a trace on its entry hop rather than on its earliest span', async () => {
    const user = userEvent.setup();
    getSessionSpans.mockResolvedValue({
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
    await user.click(await screen.findByRole('button', { name: SessionsTraceI18nKey.TraceBackToList }));

    expect(screen.getByText('gpt-two')).toBeInTheDocument();
  });

  // Two stacked headers would leave the reader unsure which of them the figures belong to. The body stays
  // mounted, so it is the hiding that has to be asserted.
  test('hides the session header and the listing while a trace is open', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(await screen.findByText('gpt-two'));
    await screen.findByRole('button', { name: SessionsTraceI18nKey.TraceBackToList });

    const hidden = screen.getByText('session header').closest('.hidden');

    expect(hidden).toBeTruthy();
    expect(hidden).toHaveAttribute('inert');
  });

  // Body grants reach only the span inspector's tabs inside an open trace, so a caller holding none of them
  // changes nothing here: the listing renders from the session's recorded calls, with no body read to
  // withhold and so nothing to explain.
  test('renders the listing unchanged for a caller who can read no body column', async () => {
    renderView({ bodyGrants: { isRequestReadable: false, isResponseReadable: false } });

    expect(await screen.findByText('gpt-one')).toBeInTheDocument();
    expect(screen.queryByRole('tab')).toBeNull();
  });

  // Nothing to open, but the view still has something to say. The listing resolves its own traces, so
  // emptiness is a property of that read.
  test('a session with no recorded traces states so rather than reporting an error', async () => {
    getSessionTracePage.mockResolvedValue({ success: true, response: { groups: [], hasMore: false } });
    renderView();

    expect(await screen.findByText(SessionsTraceI18nKey.TraceListEmpty)).toBeInTheDocument();
    expect(screen.getByText(SessionsTraceI18nKey.TraceListEmptyHintLive)).toBeInTheDocument();
    expect(getSessionSpans).not.toHaveBeenCalled();
  });

  test('a failed trace read is reported as a failure, distinctly from an empty listing', async () => {
    getSessionTracePage.mockResolvedValue({ success: false });
    renderView();

    expect(await screen.findByText(SessionsTraceI18nKey.TraceListLoadFailed)).toBeInTheDocument();
    expect(screen.queryByText(SessionsTraceI18nKey.TraceListEmpty)).toBeNull();
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
    await screen.findByRole('button', { name: SessionsTraceI18nKey.TraceBackToList });

    expect(headerRenders.mock.calls.length).toBeGreaterThan(1);
  });
});

// The overlay is the only thing standing between the reader and the view, so every path out of loading has to
// clear it. A read that rejects rather than returning a failed result — the service unreachable, the session
// gone — used to leave it up for good.
describe('SessionDetailView — opening a trace', () => {
  const openFirstTrace = async () => {
    const user = userEvent.setup();
    await user.click(await screen.findByText('gpt-one'));
  };

  test('clears the loader when the read rejects, and says the trace could not be read', async () => {
    getSessionSpans.mockRejectedValue(new Error('fetch failed'));
    renderView();

    await openFirstTrace();

    expect(screen.queryByRole('status', { name: BasicI18nKey.Loading })).toBeNull();
    expect(screen.getByText(SessionsTraceI18nKey.TraceLoadFailed)).toBeInTheDocument();
  });

  test('clears the loader when the read reports a failure', async () => {
    getSessionSpans.mockResolvedValue({ success: false, response: undefined });
    renderView();

    await openFirstTrace();

    expect(screen.queryByRole('status', { name: BasicI18nKey.Loading })).toBeNull();
    expect(screen.getByText(SessionsTraceI18nKey.TraceLoadFailed)).toBeInTheDocument();
  });

  // A loaded chain under a spinner reads as a chain that never loaded.
  test('shows no overlay over an opened trace', async () => {
    renderView();

    await openFirstTrace();

    expect(screen.queryByRole('status', { name: BasicI18nKey.Loading })).toBeNull();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });
});
