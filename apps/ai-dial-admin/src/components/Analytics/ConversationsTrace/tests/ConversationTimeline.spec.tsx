import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentProps } from 'react';
import { describe, expect, test, vi } from 'vitest';

import ConversationTimeline from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationTimeline';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import {
  ConversationMessage,
  ConversationTraceGroup,
  ConversationTranscript,
  MessageRole,
  RatingCounts,
  TranscriptState,
} from '@/src/models/analytics/conversations-trace';

const turn = (traceId: string, overrides: Partial<ConversationTraceGroup> = {}): ConversationTraceGroup => ({
  traceId,
  startedAt: 1,
  spans: 3,
  tokens: 16366,
  price: 0.045,
  failedSpans: 0,
  chips: [],
  responseIds: [],
  cards: [],
  elidedCardCount: 0,
  isRootRecorded: true,
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
  traceFigures: TURNS,
  ...overrides,
});

const renderTimeline = (props: Partial<ComponentProps<typeof ConversationTimeline>> = {}) =>
  render(
    <ConversationTimeline
      transcript={transcript()}
      traceRatings={new Map<string, RatingCounts>([['t1', { rating_up: 1, rating_down: 0 }]])}
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
        traceFigures: [turn('t1', { tokens: 1, price: 0.001 }), turn('t2', { tokens: 99999, price: 0.9 })],
      }),
    });

    expect(screen.getByText('100 K', { exact: false })).toBeInTheDocument();
    expect(screen.queryByText('$0.001')).toBeNull();
  });

  test('renders a message whose turn is absent from the bounded turn list', () => {
    renderTimeline({
      transcript: transcript({ messages: [message(MessageRole.Assistant, 'orphan', 'missing')] }),
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
      transcript: transcript({
        messages: [message(MessageRole.Assistant, 'a', 't2')],
        traceFigures: [turn('t1'), turn('t2')],
      }),
      onOpenTrace,
    });

    await user.click(screen.getByText(ConversationsTraceI18nKey.TraceOpen));

    expect(onOpenTrace).toHaveBeenCalledWith(expect.objectContaining({ traceId: 't2' }));
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
  test('reports a failed read as a failure rather than as an absence', () => {
    renderTimeline({ transcript: { state: TranscriptState.LoadFailed, messages: [], loadedTurns: null } });

    expect(screen.getByText(ConversationsTraceI18nKey.TranscriptLoadFailed)).toBeInTheDocument();
    expect(screen.queryByText(ConversationsTraceI18nKey.TranscriptNoMessages)).toBeNull();
  });

  // The figures ride along with the transcript that produced them, so an answer keeps its own message even
  // where no figures resolved for its trace — rather than the two failing together.
  test('renders the messages when no figures resolved for their traces', () => {
    renderTimeline({ transcript: transcript({ traceFigures: [] }) });

    expect(screen.getByText('q')).toBeInTheDocument();
    expect(screen.getByText('a')).toBeInTheDocument();
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
