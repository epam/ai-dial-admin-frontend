import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentProps } from 'react';
import { describe, expect, test, vi } from 'vitest';

import ConversationTimeline from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationTimeline';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import {
  ConversationMessage,
  ConversationTranscript,
  ConversationTurnRow,
  MessageRole,
  TranscriptState,
} from '@/src/models/analytics/conversations-trace';

const turn = (traceId: string, overrides: Partial<ConversationTurnRow> = {}): ConversationTurnRow => ({
  trace_id: traceId,
  started: 1,
  hops: 3,
  failed_hops: 0,
  tokens: 16366,
  cost: '0.045',
  duration_ms: 1200,
  ...overrides,
});

const TURNS = [turn('t1')];

const message = (role: MessageRole, content: string | null, traceId = 't1'): ConversationMessage => ({
  role,
  content,
  trace_id: traceId,
});

const transcript = (overrides: Partial<ConversationTranscript> = {}): ConversationTranscript => ({
  state: TranscriptState.Available,
  messages: [message(MessageRole.User, 'q'), message(MessageRole.Assistant, 'a')],
  loadedTurns: 1,
  ...overrides,
});

const renderTimeline = (props: Partial<ComponentProps<typeof ConversationTimeline>> = {}) =>
  render(
    <ConversationTimeline
      transcript={transcript()}
      turns={TURNS}
      turnRatings={[{ rating_up: 1, rating_down: 0 }]}
      hasTurnsLoadError={false}
      turnCount={1}
      onOpenTrace={vi.fn()}
      {...props}
    />,
  );

describe('ConversationTimeline', () => {
  test('renders the recorded messages as user and assistant turns', () => {
    renderTimeline({
      transcript: transcript({
        messages: [
          message(MessageRole.User, 'Give me US GDP'),
          message(MessageRole.Assistant, 'Pulled from the national accounts dataset.'),
        ],
      }),
    });

    expect(screen.getByText('Give me US GDP')).toBeInTheDocument();
    expect(screen.getByText('Pulled from the national accounts dataset.')).toBeInTheDocument();
  });

  test('attaches the turn tokens and cost to the assistant message', () => {
    renderTimeline();

    expect(screen.getByText('16.4 K', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('$0.045')).toBeInTheDocument();
  });

  // The transcript and the turn list are separately bounded reads, so a positional match would attach one
  // turn's figures to another turn's words.
  test('matches an assistant message to its turn by trace id, not by position', () => {
    renderTimeline({
      transcript: transcript({
        messages: [message(MessageRole.User, 'q', 't2'), message(MessageRole.Assistant, 'a', 't2')],
      }),
      turns: [turn('t1', { tokens: 1, cost: '0.001' }), turn('t2', { tokens: 99999, cost: '0.9' })],
      turnRatings: [
        { rating_up: 0, rating_down: 0 },
        { rating_up: 0, rating_down: 0 },
      ],
    });

    expect(screen.getByText('100 K', { exact: false })).toBeInTheDocument();
    expect(screen.queryByText('$0.001')).toBeNull();
  });

  test('renders a message whose turn is absent from the bounded turn list', () => {
    renderTimeline({
      transcript: transcript({ messages: [message(MessageRole.Assistant, 'orphan', 'missing')] }),
      turns: TURNS,
    });

    expect(screen.getByText('orphan')).toBeInTheDocument();
  });

  // A response with no text put its output somewhere else — commonly tool calls — and a blank bubble would
  // read as an assistant that said nothing.
  test.each([
    ['null content', null],
    ['empty content', ''],
  ])('renders the placeholder for an assistant reply with %s', (_label, content) => {
    renderTimeline({ transcript: transcript({ messages: [message(MessageRole.Assistant, content)] }) });

    expect(screen.getByText(UNAVAILABLE_VALUE)).toBeInTheDocument();
  });

  test('only an assistant message can open a trace', () => {
    renderTimeline();

    expect(screen.getAllByText(ConversationsTraceI18nKey.TraceOpen)).toHaveLength(1);
  });

  test('opening a trace passes the turn the message belongs to', async () => {
    const user = userEvent.setup();
    const onOpenTrace = vi.fn();
    renderTimeline({
      transcript: transcript({ messages: [message(MessageRole.Assistant, 'a', 't2')] }),
      turns: [turn('t1'), turn('t2')],
      turnRatings: [
        { rating_up: 0, rating_down: 0 },
        { rating_up: 0, rating_down: 0 },
      ],
      onOpenTrace,
    });

    await user.click(screen.getByText(ConversationsTraceI18nKey.TraceOpen));

    expect(onOpenTrace).toHaveBeenCalledWith(expect.objectContaining({ trace_id: 't2' }), 2);
  });

  test('discloses the bound when the transcript read was clipped', () => {
    renderTimeline({ transcript: transcript({ loadedTurns: 200 }), turnCount: 911 });

    expect(screen.getByText(ConversationsTraceI18nKey.TranscriptTurnsTruncated)).toBeInTheDocument();
  });

  test('discloses nothing when every turn loaded', () => {
    renderTimeline({ transcript: transcript({ loadedTurns: 1 }), turnCount: 1 });

    expect(screen.queryByText(ConversationsTraceI18nKey.TranscriptTurnsTruncated)).toBeNull();
  });

  // A disclosure needs a real second number; "showing 1 of —" states nothing.
  test('discloses nothing when the rollup carries no turn count', () => {
    renderTimeline({ turnCount: null });

    expect(screen.queryByText(ConversationsTraceI18nKey.TranscriptTurnsTruncated)).toBeNull();
  });
});

// Each cause says something different about the conversation, so collapsing them would state something false
// about three conversations out of four.
describe('ConversationTimeline — absent transcripts', () => {
  const emptyState = (state: TranscriptState) =>
    renderTimeline({ transcript: { state, messages: [], loadedTurns: null } });

  test('states that the caller cannot read the transcript', () => {
    emptyState(TranscriptState.ColumnsUnavailable);

    expect(screen.getByText(ConversationsTraceI18nKey.TranscriptColumnsUnavailable)).toBeInTheDocument();
  });

  // Messages were recorded; they cannot be attributed. Saying "no messages" would be false.
  test('states that the transcript cannot be reconstructed, not that nothing was recorded', () => {
    emptyState(TranscriptState.NotReconstructable);

    expect(screen.getByText(ConversationsTraceI18nKey.TranscriptNotReconstructable)).toBeInTheDocument();
    expect(screen.queryByText(ConversationsTraceI18nKey.TranscriptNoMessages)).toBeNull();
  });

  test('states that an old conversation has aged out of the hop log', () => {
    emptyState(TranscriptState.Expired);

    expect(screen.getByText(ConversationsTraceI18nKey.TranscriptExpired)).toBeInTheDocument();
  });

  test('states that a recent conversation recorded nothing', () => {
    emptyState(TranscriptState.NoMessages);

    expect(screen.getByText(ConversationsTraceI18nKey.TranscriptNoMessages)).toBeInTheDocument();
  });

  test('reports a failure as a failure rather than an absence', () => {
    emptyState(TranscriptState.LoadFailed);

    expect(screen.getByText(ConversationsTraceI18nKey.TranscriptLoadFailed)).toBeInTheDocument();
    expect(screen.queryByText(ConversationsTraceI18nKey.TranscriptNoMessages)).toBeNull();
  });

  // A failed turn read outranks a state that would otherwise claim the conversation recorded nothing.
  test('reports a failed turn read rather than an absence when there is nothing to show', () => {
    renderTimeline({
      transcript: { state: TranscriptState.NoMessages, messages: [], loadedTurns: null },
      hasTurnsLoadError: true,
    });

    expect(screen.getByText(ConversationsTraceI18nKey.TranscriptLoadFailed)).toBeInTheDocument();
    expect(screen.queryByText(ConversationsTraceI18nKey.TranscriptNoMessages)).toBeNull();
  });

  // The messages are real and worth showing, so the failure is stated above them rather than replacing them.
  test('keeps a resolved transcript when only the turn figures failed, and says so', () => {
    renderTimeline({ transcript: transcript(), hasTurnsLoadError: true });

    expect(screen.getByText('q')).toBeInTheDocument();
    expect(screen.getByText(ConversationsTraceI18nKey.DetailTurnsLoadFailed)).toBeInTheDocument();
  });

  test('renders a different statement for each cause', () => {
    const titles = [
      ConversationsTraceI18nKey.TranscriptColumnsUnavailable,
      ConversationsTraceI18nKey.TranscriptNotReconstructable,
      ConversationsTraceI18nKey.TranscriptExpired,
      ConversationsTraceI18nKey.TranscriptNoMessages,
      ConversationsTraceI18nKey.TranscriptLoadFailed,
    ];
    const states = [
      TranscriptState.ColumnsUnavailable,
      TranscriptState.NotReconstructable,
      TranscriptState.Expired,
      TranscriptState.NoMessages,
      TranscriptState.LoadFailed,
    ];

    states.forEach((state, index) => {
      const { unmount } = emptyState(state);

      expect(screen.getByText(titles[index])).toBeInTheDocument();
      titles.filter((_, other) => other !== index).forEach((other) => expect(screen.queryByText(other)).toBeNull());
      unmount();
    });
  });
});
