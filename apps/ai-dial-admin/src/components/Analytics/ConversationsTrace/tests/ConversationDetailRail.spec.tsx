import { render, screen } from '@testing-library/react';
import { ComponentProps } from 'react';
import { describe, expect, test, vi } from 'vitest';

import ConversationDetailRail from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationDetailRail';
import ConversationTimeline from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationTimeline';
import {
  CONVERSATIONS_ENTITY,
  CONVERSATION_DETAIL_PANELS,
  FEEDBACK_ENTITY,
  PROVENANCE_MARKER_CLASS,
  UNAVAILABLE_VALUE,
} from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import {
  ColumnProvenance,
  ConversationDetailRow,
  ConversationFeedbackRow,
  MessageRole,
} from '@/src/models/analytics/conversations-trace';

const CONVERSATION: ConversationDetailRow = {
  chat_id: 'Lrr0e6L5bpTND3IY_dN0_',
  project_id: '',
  user_hash: 'db7327ba3decd351',
  turn_count: 12,
  first_request_time: '2026-07-22T11:50:28.506Z',
  last_request_time: '2026-07-22T12:00:52.157Z',
  prompt_tokens: 4293420,
  completion_tokens: 70174,
  total_tokens: 4363594,
  total_price: '10.79380012',
  success_count: 0,
  duration_ms: 0,
  avg_duration_ms: 0,
  deployments: ['anthropic_switchyard-model', 'anthropic.claude-opus-4-8'],
};

const FEEDBACK: ConversationFeedbackRow[] = [
  { response_id: 'chatcmpl-a', rate: 1, request_time: '2026-07-20T19:12:59.268Z' },
  { response_id: 'chatcmpl-b', rate: 0, request_time: '2026-07-20T19:12:56.486Z' },
];

const setup = (
  feedback: ConversationFeedbackRow[] = FEEDBACK,
  total: number | null = feedback.length,
  ratings = { rating_up: 2, rating_down: 0 },
) =>
  render(
    <ConversationDetailRail conversation={CONVERSATION} feedback={feedback} feedbackTotal={total} ratings={ratings} />,
  );

describe('ConversationDetailRail', () => {
  test('renders the usage, metadata and feedback panels', () => {
    setup();

    for (const key of [
      ConversationsTraceI18nKey.DetailPanelUsage,
      ConversationsTraceI18nKey.DetailPanelMetadata,
      ConversationsTraceI18nKey.DetailPanelFeedback,
    ]) {
      expect(screen.getByText(key)).toBeInTheDocument();
    }
  });

  // Every panel states the entity it read from, so no group of values on the page is unattributed.
  test('names the source each panel reads from', () => {
    setup();

    expect(screen.getAllByText(CONVERSATIONS_ENTITY).length).toBeGreaterThan(0);
    expect(screen.getByText(FEEDBACK_ENTITY)).toBeInTheDocument();
  });

  test('every panel definition carries a real source entity', () => {
    for (const { provenance } of CONVERSATION_DETAIL_PANELS) {
      expect(provenance).not.toBe(ColumnProvenance.None);
    }
  });

  test('the usage panel reports real token and cost values', () => {
    setup();

    expect(screen.getByText(ConversationsTraceI18nKey.DetailTokensIn)).toBeInTheDocument();
    expect(screen.getByText('4.3 M')).toBeInTheDocument();
    expect(screen.getByText('70.2 K')).toBeInTheDocument();
    expect(screen.getByText('$10.8')).toBeInTheDocument();
  });

  test('the metadata panel marks trace and region unavailable', () => {
    setup();

    for (const key of [ConversationsTraceI18nKey.DetailTrace, ConversationsTraceI18nKey.DetailRegion]) {
      const label = screen.getByText(key);
      expect(label.parentElement).toHaveTextContent(UNAVAILABLE_VALUE);
    }
  });

  // The rollup carries the deployments, so marking the row unavailable would misreport data already fetched.
  test('the metadata panel states the deployments the rollup carries', () => {
    setup();

    const label = screen.getByText(ConversationsTraceI18nKey.DetailDeployment);

    expect(label.parentElement).toHaveTextContent('anthropic_switchyard-model, anthropic.claude-opus-4-8');
    expect(label.parentElement).not.toHaveTextContent(UNAVAILABLE_VALUE);
  });

  // A conversation that ran took time, so a recorded 0 means the backend never measured it. The grid states
  // the same thing about the same conversation.
  test('an unmeasured duration renders as the unavailable marker rather than as a zero', () => {
    setup();

    const label = screen.getByText(ConversationsTraceI18nKey.DetailDuration);

    expect(label.parentElement).toHaveTextContent(UNAVAILABLE_VALUE);
  });

  test('a zero success count renders as a number, not as the unavailable marker', () => {
    setup();

    const label = screen.getByText(ConversationsTraceI18nKey.DetailSuccessful);
    expect(label.parentElement).toHaveTextContent('0');
    expect(label.parentElement).not.toHaveTextContent(UNAVAILABLE_VALUE);
  });

  test('an empty project renders its own empty presentation, not the marker', () => {
    setup();

    const label = screen.getByText(ConversationsTraceI18nKey.Project);
    expect(label.parentElement).toHaveTextContent(ConversationsTraceI18nKey.DetailEmptyValue);
    expect(label.parentElement).not.toHaveTextContent(UNAVAILABLE_VALUE);
  });

  test('lists each rating with its direction, and marks turn and comment unavailable', () => {
    setup();

    expect(screen.getByText(ConversationsTraceI18nKey.DetailRatingPositive)).toBeInTheDocument();
    expect(screen.getByText(ConversationsTraceI18nKey.DetailRatingNegative)).toBeInTheDocument();
    expect(screen.getAllByText(ConversationsTraceI18nKey.DetailTurn, { exact: false })).toHaveLength(2);
    expect(screen.getAllByText(ConversationsTraceI18nKey.DetailComment, { exact: false })).toHaveLength(2);
  });

  test('an unrated conversation states so rather than rendering an empty list', () => {
    setup([], 0);

    expect(screen.getByText(ConversationsTraceI18nKey.DetailNoRatings)).toBeInTheDocument();
  });

  test('a truncated rating list declares itself partial', () => {
    setup(FEEDBACK, 6);

    expect(screen.getByText(ConversationsTraceI18nKey.DetailFeedbackPartial)).toBeInTheDocument();
  });

  test('a complete rating list makes no partial claim', () => {
    setup(FEEDBACK, 2);

    expect(screen.queryByText(ConversationsTraceI18nKey.DetailFeedbackPartial)).not.toBeInTheDocument();
  });

  test('every provenance a panel can carry maps to a marker colour', () => {
    for (const provenance of Object.values(ColumnProvenance)) {
      expect(PROVENANCE_MARKER_CLASS[provenance]).toBeTruthy();
    }
    for (const { provenance } of CONVERSATION_DETAIL_PANELS) {
      expect(PROVENANCE_MARKER_CLASS[provenance]).toBeTruthy();
    }
  });
});

describe('ConversationTimeline', () => {
  const TURNS = [{ trace_id: 't1', started: 1, hops: 3, tokens: 16366, cost: '0.045' }];

  const renderTimeline = (props: Partial<ComponentProps<typeof ConversationTimeline>> = {}) =>
    render(
      <ConversationTimeline
        messages={[]}
        turns={[]}
        turnRatings={[]}
        hasTurnsLoadError={false}
        turnCount={null}
        onOpenTrace={vi.fn()}
        {...props}
      />,
    );

  const MESSAGES = [{ role: MessageRole.User, content: 'q' }];

  test('falls back to the placeholder when no message content could be read', () => {
    renderTimeline();

    expect(screen.getByText(ConversationsTraceI18nKey.DetailMessagesUnavailable)).toBeInTheDocument();
  });

  // A failed turns query also yields no messages, and reporting that as "not recorded" would present an
  // outage as a fact about the conversation.
  test('reports a failed turns query rather than claiming no messages were recorded', () => {
    renderTimeline({ hasTurnsLoadError: true });

    expect(screen.getByText(ConversationsTraceI18nKey.DetailTurnsLoadFailed)).toBeInTheDocument();
    expect(screen.queryByText(ConversationsTraceI18nKey.DetailMessagesUnavailable)).not.toBeInTheDocument();
  });

  test('renders the transcript as user and assistant messages', () => {
    renderTimeline({
      messages: [
        { role: MessageRole.User, content: 'Give me US GDP' },
        { role: MessageRole.Assistant, content: 'Plan: use datasets' },
      ],
      turns: TURNS,
      turnRatings: [{ rating_up: 1, rating_down: 0 }],
    });

    expect(screen.getByText('Give me US GDP')).toBeInTheDocument();
    expect(screen.getByText('Plan: use datasets')).toBeInTheDocument();
    expect(screen.queryByText(ConversationsTraceI18nKey.DetailMessagesUnavailable)).not.toBeInTheDocument();
  });

  // The nth assistant reply carries the nth turn's metrics; pairing is positional because the reply is
  // reconstructed from a request body and has no span of its own.
  test('attaches the turn tokens and cost to the assistant message', () => {
    renderTimeline({
      messages: [
        { role: MessageRole.User, content: 'q' },
        { role: MessageRole.Assistant, content: 'a' },
      ],
      turns: TURNS,
      turnRatings: [{ rating_up: 1, rating_down: 0 }],
    });

    expect(screen.getByText('16.4 K', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('$0.045')).toBeInTheDocument();
  });

  // Mock content presented as real traffic would mislead on an analytics page, so the notice is part of the
  // contract, not decoration.
  test('labels the transcript as sample data whenever messages render', () => {
    renderTimeline({ messages: [{ role: MessageRole.User, content: 'q' }], turns: TURNS });

    expect(screen.getByText(ConversationsTraceI18nKey.DetailSampleMessages)).toBeInTheDocument();
  });

  // The list is bounded, so on a long conversation the turns on screen are a stated limit rather than the
  // conversation's length — leaving that unsaid reads as a complete transcript.
  test('discloses the bound when the turn list is clipped', () => {
    renderTimeline({ messages: MESSAGES, turns: TURNS, turnCount: 911 });

    expect(screen.getByText(ConversationsTraceI18nKey.DetailTurnsTruncated)).toBeInTheDocument();
  });

  test('discloses nothing when every turn loaded', () => {
    renderTimeline({ messages: MESSAGES, turns: TURNS, turnCount: 1 });

    expect(screen.queryByText(ConversationsTraceI18nKey.DetailTurnsTruncated)).not.toBeInTheDocument();
  });

  // A disclosure needs a real second number; "showing 1 of —" states nothing.
  test('discloses nothing when the rollup carries no turn count', () => {
    renderTimeline({ messages: MESSAGES, turns: TURNS, turnCount: null });

    expect(screen.queryByText(ConversationsTraceI18nKey.DetailTurnsTruncated)).not.toBeInTheDocument();
  });

  test('shows no sample-data notice when there is nothing to label', () => {
    renderTimeline();

    expect(screen.queryByText(ConversationsTraceI18nKey.DetailSampleMessages)).not.toBeInTheDocument();
  });

  // The design puts a rating under each assistant reply; ratings carry no trace id, so they are attributed
  // to the turn that had started when they were submitted.
  test('an assistant message shows its turn ratings', () => {
    renderTimeline({
      messages: [
        { role: MessageRole.User, content: 'q' },
        { role: MessageRole.Assistant, content: 'a' },
      ],
      turns: TURNS,
      turnRatings: [{ rating_up: 3, rating_down: 1 }],
    });

    expect(screen.getByText(ConversationsTraceI18nKey.RatingUp).parentElement).toHaveTextContent('3');
    expect(screen.getByText(ConversationsTraceI18nKey.RatingDown).parentElement).toHaveTextContent('1');
  });

  test('only an assistant message can open a trace', () => {
    const onOpenTrace = vi.fn();
    renderTimeline({
      messages: [
        { role: MessageRole.User, content: 'q' },
        { role: MessageRole.Assistant, content: 'a' },
      ],
      turns: TURNS,
      onOpenTrace,
    });

    expect(screen.getAllByText(ConversationsTraceI18nKey.TraceOpen)).toHaveLength(1);
  });

  test('no end-of-conversation note is rendered', () => {
    renderTimeline({ messages: [{ role: MessageRole.User, content: 'q' }], turns: TURNS });

    expect(screen.queryByText(/end of conversation/i)).not.toBeInTheDocument();
  });

  test('a message with no matching turn still renders its content', () => {
    renderTimeline({ messages: [{ role: MessageRole.Assistant, content: 'orphan' }] });

    expect(screen.getByText('orphan')).toBeInTheDocument();
  });
});
