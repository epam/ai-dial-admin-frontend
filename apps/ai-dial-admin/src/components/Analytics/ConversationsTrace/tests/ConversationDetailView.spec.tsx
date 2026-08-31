import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentProps } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import ConversationDetailView from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationDetailView';
import { BasicI18nKey, ConversationsTraceI18nKey } from '@/src/constants/i18n';
import {
  ConversationDetailRow,
  ConversationTranscript,
  HopTextsState,
  MessageRole,
  TranscriptState,
} from '@/src/models/analytics/conversations-trace';

const getConversationSpans = vi.fn();
const getConversationHopBodies = vi.fn();
const getConversationTracePage = vi.fn();
const getConversationTranscript = vi.fn();

vi.mock('@/src/app/[lang]/conversations-trace/actions', () => ({
  getConversationSpans: (...args: unknown[]) => getConversationSpans(...args),
  getConversationHopBodies: (...args: unknown[]) => getConversationHopBodies(...args),
  getConversationTracePage: (...args: unknown[]) => getConversationTracePage(...args),
  getConversationTranscript: (...args: unknown[]) => getConversationTranscript(...args),
}));

// Counting stub: the header sits above the switch, so its render count is the direct measure of whether
// choosing a view re-renders the page around it.
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

const transcript = (overrides: Partial<ConversationTranscript> = {}): ConversationTranscript => ({
  state: TranscriptState.Available,
  messages: [
    { role: MessageRole.User, content: 'q', trace_id: 't1' },
    { role: MessageRole.Assistant, content: 'a', trace_id: 't1' },
  ],
  loadedTurns: 2,
  ...overrides,
});

const renderView = (props: Partial<ComponentProps<typeof ConversationDetailView>> = {}) =>
  render(
    <ConversationDetailView conversation={CONVERSATION} feedback={null} isTranscriptReadable nowMs={1000} {...props} />,
  );

const switchOption = (key: string) => screen.getByRole('tab', { name: key });

beforeEach(() => {
  vi.clearAllMocks();
  getConversationSpans.mockResolvedValue({
    success: true,
    response: { spans: [{ core_span_id: 's1', core_parent_span_id: null, request_time: 1 }], total: 1 },
  });
  // Opening a chain selects its first hop, which reads that hop's texts — one hop, on demand.
  getConversationHopBodies.mockResolvedValue({
    success: true,
    response: { state: HopTextsState.Available, sent: 'a prompt', received: 'an answer', toolCalls: [] },
  });
  getConversationTracePage.mockResolvedValue({
    success: true,
    response: { groups: [traceGroup('t1', 'gpt-one'), traceGroup('t2', 'gpt-two')], hasMore: false },
  });
  getConversationTranscript.mockResolvedValue({
    success: true,
    response: { ...transcript(), traceFigures: [traceGroup('t1', 'gpt-one')] },
  });
});

describe('ConversationDetailView', () => {
  test('offers both views and starts on the trace listing', async () => {
    renderView();

    expect(switchOption(ConversationsTraceI18nKey.ViewTrace)).toHaveAttribute('aria-selected', 'true');
    expect(switchOption(ConversationsTraceI18nKey.ViewChat)).toHaveAttribute('aria-selected', 'false');
    expect(await screen.findByText('gpt-one')).toBeInTheDocument();
  });

  // Switching to Trace lands on the list of the conversation's traces rather than dropping into one turn's
  // hop chain, so a reader who has not chosen a turn is shown the choice instead of an arbitrary default.
  test('the trace listing names each recorded call and reads no spans yet', async () => {
    renderView();

    expect(await screen.findByText('gpt-one')).toBeInTheDocument();
    expect(screen.getByText('gpt-two')).toBeInTheDocument();
    expect(getConversationSpans).not.toHaveBeenCalled();
  });

  test('a card in the listing opens that trace hop chain', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(await screen.findByText('gpt-two'));

    expect(getConversationSpans).toHaveBeenCalledWith({ id: 'chat-1', source: 'chat_id' }, 't2');
  });

  test('a per-turn control on a message opens the trace on that turn', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(switchOption(ConversationsTraceI18nKey.ViewChat));
    await user.click(await screen.findByText(ConversationsTraceI18nKey.TraceOpen));

    expect(getConversationSpans).toHaveBeenCalledWith({ id: 'chat-1', source: 'chat_id' }, 't1');
  });

  // A reader who reached a hop chain from the trace list should not be dropped back onto the transcript.
  test('returning from a trace lands on the view it was opened from', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(await screen.findByText('gpt-two'));
    await user.click(await screen.findByRole('button', { name: ConversationsTraceI18nKey.TraceBackToTranscript }));

    expect(switchOption(ConversationsTraceI18nKey.ViewTrace)).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('gpt-two')).toBeInTheDocument();
  });

  test('returning from a trace opened from the transcript lands back on the transcript', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(switchOption(ConversationsTraceI18nKey.ViewChat));
    await user.click(await screen.findByText(ConversationsTraceI18nKey.TraceOpen));
    await user.click(await screen.findByRole('button', { name: ConversationsTraceI18nKey.TraceBackToTranscript }));

    expect(switchOption(ConversationsTraceI18nKey.ViewChat)).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('q')).toBeInTheDocument();
  });

  // Two stacked headers would leave the reader unsure which of them the figures belong to. The body stays
  // mounted so the switch keeps its choice, so it is the hiding that has to be asserted.
  test('the conversation header and switch are hidden while a trace is open', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(switchOption(ConversationsTraceI18nKey.ViewChat));
    await user.click(await screen.findByText(ConversationsTraceI18nKey.TraceOpen));
    await screen.findByRole('button', { name: ConversationsTraceI18nKey.TraceBackToTranscript });

    const hidden = switchOption(ConversationsTraceI18nKey.ViewChat).closest('.hidden');

    expect(hidden).toBeTruthy();
    expect(hidden).toHaveAttribute('inert');
  });

  // A control that disappears leaves the reader unable to tell an unavailable view from one that does not
  // exist, so the option is disabled and its reason is stated.
  test('disables the Chat option when the caller cannot read the body columns', () => {
    renderView({ isTranscriptReadable: false });

    expect(switchOption(ConversationsTraceI18nKey.ViewChat)).toBeDisabled();
    // A distinct sentence from the empty state's own explanation: the same text twice on one screen reads as
    // a rendering bug rather than as emphasis.
    expect(screen.getByText(ConversationsTraceI18nKey.ViewChatUnavailable)).toBeInTheDocument();
  });

  // Gating is a schema fact; the transcript's other states are facts about the rows, resolved by the body
  // read. So an empty transcript never disables the option — it states its cause inside the Chat view.
  test.each([
    ['not reconstructable', TranscriptState.NotReconstructable],
    ['aged out', TranscriptState.Expired],
    ['never recorded', TranscriptState.NoMessages],
  ])('keeps the Chat option enabled for a transcript that is %s', async (_label, state) => {
    getConversationTranscript.mockResolvedValue({
      success: true,
      response: { state, messages: [], loadedTurns: null },
    });
    const user = userEvent.setup();
    renderView();

    expect(switchOption(ConversationsTraceI18nKey.ViewChat)).toBeEnabled();

    await user.click(switchOption(ConversationsTraceI18nKey.ViewChat));

    expect(switchOption(ConversationsTraceI18nKey.ViewChat)).toHaveAttribute('aria-selected', 'true');
  });

  // Nothing to open, but the view still has something to say — which is why the switch no longer refuses it.
  // The listing now resolves its own traces, so emptiness is a property of that read rather than of the
  // turns the page handed down.
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

  // The view switch owns its state below the header, so choosing a view re-renders the body and nothing
  // above it. Re-rendering the page for a local choice is the thing this structure exists to avoid.
  test('choosing a view does not re-render the page around it', async () => {
    const user = userEvent.setup();
    renderView();

    expect(headerRenders).toHaveBeenCalledOnce();

    await user.click(switchOption(ConversationsTraceI18nKey.ViewTrace));
    await user.click(switchOption(ConversationsTraceI18nKey.ViewChat));

    expect(headerRenders).toHaveBeenCalledOnce();
  });

  // Opening a trace does re-render the page: the header has to give way to the trace's own identity.
  test('opening a trace does re-render the page', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(switchOption(ConversationsTraceI18nKey.ViewChat));
    await user.click(await screen.findByText(ConversationsTraceI18nKey.TraceOpen));
    await screen.findByRole('button', { name: ConversationsTraceI18nKey.TraceBackToTranscript });

    expect(headerRenders.mock.calls.length).toBeGreaterThan(1);
  });
});

// The overlay is the only thing standing between the reader and the view, so every path out of loading has to
// clear it. A read that rejects rather than returning a failed result — the service unreachable, the session
// gone — used to leave it up for good.
describe('ConversationDetailView — opening a trace', () => {
  const openFirstTrace = async () => {
    const user = userEvent.setup();
    await user.click(switchOption(ConversationsTraceI18nKey.ViewTrace));
    await user.click(screen.getByText('t1'));
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
