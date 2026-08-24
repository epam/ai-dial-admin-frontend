import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentProps } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import ConversationDetailView from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationDetailView';
import { BasicI18nKey, ConversationsTraceI18nKey } from '@/src/constants/i18n';
import {
  ConversationDetailRow,
  ConversationTranscript,
  ConversationTurnRow,
  HopTextsState,
  MessageRole,
  TranscriptState,
} from '@/src/models/analytics/conversations-trace';

const getConversationSpans = vi.fn();
const getConversationHopBodies = vi.fn();

vi.mock('@/src/app/[lang]/conversations-trace/actions', () => ({
  getConversationSpans: (...args: unknown[]) => getConversationSpans(...args),
  getConversationHopBodies: (...args: unknown[]) => getConversationHopBodies(...args),
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
  chat_id: 'chat-1',
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

const turn = (traceId: string): ConversationTurnRow => ({
  trace_id: traceId,
  started: 1,
  hops: 2,
  failed_hops: 0,
  tokens: 10,
  cost: '0.001',
  duration_ms: 100,
});

const TURNS = [turn('t1'), turn('t2')];

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
    <ConversationDetailView
      conversation={CONVERSATION}
      feedback={null}
      turns={TURNS}
      transcript={transcript()}
      nowMs={1000}
      hasTurnsLoadError={false}
      {...props}
    />,
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
});

describe('ConversationDetailView', () => {
  test('offers both views and starts on the transcript', () => {
    renderView();

    expect(switchOption(ConversationsTraceI18nKey.ViewChat)).toHaveAttribute('aria-selected', 'true');
    expect(switchOption(ConversationsTraceI18nKey.ViewTrace)).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByText('q')).toBeInTheDocument();
  });

  // Switching to Trace lands on the list of the conversation's traces rather than dropping into one turn's
  // hop chain, so a reader who has not chosen a turn is shown the choice instead of an arbitrary default.
  test('switching to Trace lists the traces and reads no spans yet', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(switchOption(ConversationsTraceI18nKey.ViewTrace));

    expect(screen.getAllByText(ConversationsTraceI18nKey.TraceTurn, { exact: false })).toHaveLength(2);
    expect(getConversationSpans).not.toHaveBeenCalled();
  });

  test('a trace in the list opens that turn hop chain', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(switchOption(ConversationsTraceI18nKey.ViewTrace));
    await user.click(screen.getByText('t2'));

    expect(getConversationSpans).toHaveBeenCalledWith('chat-1', 't2');
  });

  test('a per-turn control on a message opens the trace on that turn', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByText(ConversationsTraceI18nKey.TraceOpen));

    expect(getConversationSpans).toHaveBeenCalledWith('chat-1', 't1');
  });

  // A reader who reached a hop chain from the trace list should not be dropped back onto the transcript.
  test('returning from a trace lands on the view it was opened from', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(switchOption(ConversationsTraceI18nKey.ViewTrace));
    await user.click(screen.getByText('t2'));
    await user.click(await screen.findByRole('button', { name: ConversationsTraceI18nKey.TraceBackToTranscript }));

    expect(switchOption(ConversationsTraceI18nKey.ViewTrace)).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByText(ConversationsTraceI18nKey.TraceTurn, { exact: false }).length).toBeGreaterThan(0);
  });

  test('returning from a trace opened from the transcript lands back on the transcript', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByText(ConversationsTraceI18nKey.TraceOpen));
    await user.click(await screen.findByRole('button', { name: ConversationsTraceI18nKey.TraceBackToTranscript }));

    expect(switchOption(ConversationsTraceI18nKey.ViewChat)).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('q')).toBeInTheDocument();
  });

  // Two stacked headers would leave the reader unsure which of them the figures belong to. The body stays
  // mounted so the switch keeps its choice, so it is the hiding that has to be asserted.
  test('the conversation header and switch are hidden while a trace is open', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByText(ConversationsTraceI18nKey.TraceOpen));
    await screen.findByRole('button', { name: ConversationsTraceI18nKey.TraceBackToTranscript });

    const hidden = switchOption(ConversationsTraceI18nKey.ViewChat).closest('.hidden');

    expect(hidden).toBeTruthy();
    expect(hidden).toHaveAttribute('inert');
  });

  // A control that disappears leaves the reader unable to tell an unavailable view from one that does not
  // exist, so the option is disabled and its reason is stated.
  test('disables the Chat option when the caller cannot read the body columns', () => {
    renderView({
      transcript: { state: TranscriptState.ColumnsUnavailable, messages: [], loadedTurns: null },
    });

    expect(switchOption(ConversationsTraceI18nKey.ViewChat)).toBeDisabled();
    // A distinct sentence from the empty state's own explanation: the same text twice on one screen reads as
    // a rendering bug rather than as emphasis.
    expect(screen.getByText(ConversationsTraceI18nKey.ViewChatUnavailable)).toBeInTheDocument();
  });

  // An empty transcript is a Chat view with something to say; disabling it would replace that with silence.
  test.each([
    ['not reconstructable', TranscriptState.NotReconstructable],
    ['aged out', TranscriptState.Expired],
    ['never recorded', TranscriptState.NoMessages],
  ])('keeps the Chat option enabled for a transcript that is %s', (_label, state) => {
    renderView({ transcript: { state, messages: [], loadedTurns: null } });

    expect(switchOption(ConversationsTraceI18nKey.ViewChat)).toBeEnabled();
  });

  // Nothing to open, but the view still has something to say — which is why the switch no longer refuses it.
  test('a conversation with no turns switches to an empty trace list', async () => {
    const user = userEvent.setup();
    renderView({ turns: [], transcript: transcript({ messages: [], loadedTurns: 0 }) });

    await user.click(switchOption(ConversationsTraceI18nKey.ViewTrace));

    expect(screen.getByText(ConversationsTraceI18nKey.TraceListEmpty)).toBeInTheDocument();
    expect(getConversationSpans).not.toHaveBeenCalled();
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

    await user.click(screen.getByText(ConversationsTraceI18nKey.TraceOpen));
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
