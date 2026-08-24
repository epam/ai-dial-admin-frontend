import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import ConversationEventStream from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationEventStream';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { HopEvent, HopEventType } from '@/src/models/analytics/conversations-trace';

const event = (line: number, type: HopEventType, over: Partial<HopEvent> = {}): HopEvent => ({
  key: `k${line}`,
  line,
  type,
  label: `label-${line}`,
  detail: null,
  span: { core_span_id: `s${line}` } as HopEvent['span'],
  startedAtMs: 1787218895000,
  tokens: null,
  reasoningTokens: null,
  cost: null,
  hops: null,
  durationMs: null,
  hasNoRecordedResult: false,
  ...over,
});

const EVENTS: HopEvent[] = [
  event(1, HopEventType.TurnStart, { label: 'why 2021-2025?', span: null }),
  event(2, HopEventType.Session, { label: 'initialize' }),
  event(3, HopEventType.Embedding, { label: 'text-embedding-3' }),
  event(4, HopEventType.ToolCall, { label: 'rag_search', detail: '{"q":"cyber"}' }),
  event(5, HopEventType.ToolResult, { label: 'rag_search' }),
  event(6, HopEventType.Text, { label: 'gpt' }),
  event(7, HopEventType.TurnComplete, { span: null, hops: 384, tokens: 3667333, cost: '3.678', durationMs: 523263 }),
];

const renderStream = (events = EVENTS, onSelectSpan = vi.fn()) =>
  render(<ConversationEventStream events={events} selectedSpanId={null} onSelectSpan={onSelectSpan} />);

// Scoped to the filter group: a filter's visible label is the same word its rows carry in the type column.
const filters = () => within(screen.getByRole('group', { name: ConversationsTraceI18nKey.StreamFilterLabel }));
const filterFor = (key: string) => filters().getByRole('button', { name: new RegExp(key) });
const rows = () => within(screen.getByRole('group', { name: ConversationsTraceI18nKey.StreamLabel }));

describe('ConversationEventStream', () => {
  // Everything on by default: opening a turn with two thirds of it already hidden makes the reader's judgement
  // for them.
  test('shows every category by default', () => {
    renderStream();

    expect(screen.getByText('initialize')).toBeInTheDocument();
    expect(screen.getByText('text-embedding-3')).toBeInTheDocument();
    expect(screen.getAllByText('rag_search')).toHaveLength(2);
  });

  // The control names its category and nothing else; how much of the stream is showing is stated once, beside
  // the filters, rather than nine times inside them.
  test('offers one filter per category, naming it without a count', () => {
    renderStream();

    expect(filterFor(ConversationsTraceI18nKey.EventSession)).toHaveTextContent(ConversationsTraceI18nKey.EventSession);
    expect(filterFor(ConversationsTraceI18nKey.EventToolCall)).not.toHaveTextContent(/\d/);
    expect(screen.getByText(ConversationsTraceI18nKey.StreamShowing, { exact: false })).toBeInTheDocument();
  });

  // Reading a turn is asking "show me the tool calls", so that is one click rather than switching eight others
  // off.
  test('isolates a category on click, hiding every other', async () => {
    const user = userEvent.setup();
    renderStream();

    await user.click(filterFor(ConversationsTraceI18nKey.EventEmbedding));

    expect(rows().getByText('text-embedding-3')).toBeInTheDocument();
    expect(rows().queryByText('initialize')).toBeNull();
    expect(rows().queryAllByText('rag_search')).toHaveLength(0);
  });

  // The same control narrows and restores, so nothing else has to be found to get back.
  test('releases the isolated category when it is clicked again', async () => {
    const user = userEvent.setup();
    renderStream();
    const filter = filterFor(ConversationsTraceI18nKey.EventEmbedding);

    await user.click(filter);
    expect(rows().queryByText('initialize')).toBeNull();

    await user.click(filter);

    expect(rows().getByText('initialize')).toBeInTheDocument();
  });

  // A toggle whose only feedback is a colour is invisible to a screen reader.
  test('states which category is isolated programmatically', async () => {
    const user = userEvent.setup();
    renderStream();
    const filter = filterFor(ConversationsTraceI18nKey.EventSession);

    expect(filter).toHaveAttribute('aria-pressed', 'false');
    expect(filterFor(ConversationsTraceI18nKey.StreamTabAll)).toHaveAttribute('aria-pressed', 'true');

    await user.click(filter);

    expect(filter).toHaveAttribute('aria-pressed', 'true');
    expect(filterFor(ConversationsTraceI18nKey.EventEmbedding)).toHaveAttribute('aria-pressed', 'false');
  });

  test('restores every category through the all control', async () => {
    const user = userEvent.setup();
    renderStream();

    await user.click(filterFor(ConversationsTraceI18nKey.EventEmbedding));
    expect(rows().queryByText('initialize')).toBeNull();

    await user.click(filterFor(ConversationsTraceI18nKey.StreamTabAll));

    expect(rows().getByText('initialize')).toBeInTheDocument();
  });

  // Every filter stays operable, All included: the pressed state says which one is active, and a disabled
  // control drops the active filter out of the tab order.
  test('states which filter is active without disabling it', () => {
    renderStream();

    const all = filterFor(ConversationsTraceI18nKey.StreamTabAll);

    expect(all).toBeEnabled();
    expect(all).toHaveAttribute('aria-pressed', 'true');
    expect(filterFor(ConversationsTraceI18nKey.EventText)).toHaveAttribute('aria-pressed', 'false');
  });

  // Every category stays selectable, whether or not the turn recorded any: isolating one is how a reader asks
  // "were there any errors", and the answer has to be sayable.
  test('keeps every category selectable, including ones the turn never recorded', () => {
    renderStream();

    expect(filterFor(ConversationsTraceI18nKey.EventError)).toBeEnabled();
    expect(filterFor(ConversationsTraceI18nKey.EventSession)).toBeEnabled();
  });

  // A filtered view still has to say where in the turn you are, so line numbers come from the unfiltered
  // stream and are not renumbered.
  // The number is the row's place in the whole turn, so narrowing must not renumber what survives.
  test('keeps the unfiltered line numbers when rows are hidden', async () => {
    const user = userEvent.setup();
    renderStream();

    await user.click(filterFor(ConversationsTraceI18nKey.EventToolCall));

    expect(rows().getByText('4')).toBeInTheDocument();
    expect(rows().queryByText('1')).toBeNull();
    expect(rows().queryByText('2')).toBeNull();
  });

  test('states how many of the stream is showing', () => {
    renderStream();

    expect(screen.getByText(ConversationsTraceI18nKey.StreamShowing, { exact: false })).toBeInTheDocument();
  });

  test('opens the hop a row came from', async () => {
    const onSelectSpan = vi.fn();
    const user = userEvent.setup();
    renderStream(EVENTS, onSelectSpan);

    await user.click(screen.getAllByText('rag_search')[0]);

    expect(onSelectSpan).toHaveBeenCalledWith('s4');
  });

  // A synthetic frame event has no hop, so it is not offered as a control at all.
  test('a frame row is not a control', () => {
    renderStream();

    expect(rows().getByText('why 2021-2025?')).toBeInTheDocument();
    expect(screen.queryAllByRole('button').filter((row) => row.textContent?.includes('why 2021-2025?'))).toHaveLength(
      0,
    );
  });

  // The frame frames the whole turn, so a narrowed view answers with its category alone.
  test('drops the frame once a category is isolated, and restores it with all', async () => {
    const user = userEvent.setup();
    renderStream();

    await user.click(filterFor(ConversationsTraceI18nKey.EventEmbedding));

    expect(rows().queryByText('why 2021-2025?')).toBeNull();
    expect(rows().getByText('text-embedding-3')).toBeInTheDocument();

    await user.click(filterFor(ConversationsTraceI18nKey.StreamTabAll));

    expect(rows().getByText('why 2021-2025?')).toBeInTheDocument();
  });

  test('closes with the turn own totals', () => {
    renderStream();

    expect(screen.getByText(/384/)).toBeInTheDocument();
    expect(screen.getByText(/3\.7 M/)).toBeInTheDocument();
    expect(screen.getByText(/\$3\.7/)).toBeInTheDocument();
  });

  // 85 tools requested against 57 results logged: the rest never crossed a network boundary.
  test('says when a tool request has no recorded result', () => {
    renderStream([event(1, HopEventType.ToolCall, { label: 'finish_iteration', hasNoRecordedResult: true })]);

    expect(screen.getByText(ConversationsTraceI18nKey.EventNoRecordedResult)).toBeInTheDocument();
  });

  // The reasoning text is not recorded anywhere; the count is its only trace.
  test('states a reasoning row token count rather than an empty cell', () => {
    renderStream([event(1, HopEventType.Thinking, { label: 'gpt', reasoningTokens: 264 })]);

    expect(screen.getByText(ConversationsTraceI18nKey.EventReasoningTokens, { exact: false })).toBeInTheDocument();
  });

  test('states each row type', () => {
    renderStream();

    expect(rows().getByText(ConversationsTraceI18nKey.EventToolCall)).toBeInTheDocument();
    expect(rows().getByText(ConversationsTraceI18nKey.EventToolResult)).toBeInTheDocument();
    expect(rows().getByText(ConversationsTraceI18nKey.EventText)).toBeInTheDocument();
  });

  // The frame is always emitted, so a turn with no hops arrives as two events rather than none — guarding on
  // the stream's length left it showing a question and a totals line with nothing between them.
  test('states that a turn recorded no hops, rather than showing a bare frame', () => {
    renderStream([
      event(1, HopEventType.TurnStart, { label: 'why 2021-2025?', span: null }),
      event(2, HopEventType.TurnComplete, { span: null, hops: 0 }),
    ]);

    expect(screen.getByText(ConversationsTraceI18nKey.TraceNoSpans)).toBeInTheDocument();
    expect(screen.queryByText('why 2021-2025?')).toBeNull();
  });

  // Isolating a category the turn has none of is a legitimate question with an answer: none.
  test('says the turn recorded none of an isolated category', async () => {
    const user = userEvent.setup();
    renderStream();

    await user.click(filterFor(ConversationsTraceI18nKey.EventError));

    expect(rows().getByText(ConversationsTraceI18nKey.StreamNoEvents)).toBeInTheDocument();
    expect(rows().queryByText('why 2021-2025?')).toBeNull();
  });

  test('drops the empty message as soon as a category with events is isolated', async () => {
    const user = userEvent.setup();
    renderStream();

    await user.click(filterFor(ConversationsTraceI18nKey.EventError));
    await user.click(filterFor(ConversationsTraceI18nKey.EventSession));

    expect(rows().queryByText(ConversationsTraceI18nKey.StreamNoEvents)).toBeNull();
    expect(rows().getByText('initialize')).toBeInTheDocument();
  });

  test('states when a turn recorded nothing at all', () => {
    renderStream([]);

    expect(screen.getByText(ConversationsTraceI18nKey.TraceNoSpans)).toBeInTheDocument();
  });
});
