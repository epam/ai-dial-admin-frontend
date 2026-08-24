import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentProps } from 'react';
import { describe, expect, test, vi } from 'vitest';

import ConversationTraceList from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationTraceList';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { ConversationTurnRow } from '@/src/models/analytics/conversations-trace';

const turn = (traceId: string, overrides: Partial<ConversationTurnRow> = {}): ConversationTurnRow => ({
  trace_id: traceId,
  started: 1787218895000,
  hops: 3,
  failed_hops: 0,
  tokens: 16366,
  cost: '0.045',
  duration_ms: 1200,
  ...overrides,
});

const TURNS = [turn('t1'), turn('t2')];

const renderList = (props: Partial<ComponentProps<typeof ConversationTraceList>> = {}) =>
  render(
    <ConversationTraceList
      turns={TURNS}
      turnRatings={[
        { rating_up: 1, rating_down: 0 },
        { rating_up: 0, rating_down: 2 },
      ]}
      questions={new Map()}
      hasTurnsLoadError={false}
      turnCount={2}
      onOpenTrace={vi.fn()}
      {...props}
    />,
  );

describe('ConversationTraceList', () => {
  test('renders one row per recorded trace, numbered in order', () => {
    renderList();

    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByText('t1')).toBeInTheDocument();
    expect(screen.getByText('t2')).toBeInTheDocument();
  });

  test('states each turn own hops, tokens, cost and duration', () => {
    renderList({ turns: [turn('t1')], turnRatings: [{ rating_up: 0, rating_down: 0 }], turnCount: 1 });

    expect(screen.getByText('16.4 K', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('$0.045')).toBeInTheDocument();
    expect(screen.getByText('1.2s')).toBeInTheDocument();
    expect(screen.getByText(ConversationsTraceI18nKey.DetailHopsShort, { exact: false })).toBeInTheDocument();
  });

  test('opens the hop chain for the row that was activated', async () => {
    const user = userEvent.setup();
    const onOpenTrace = vi.fn();
    renderList({ onOpenTrace });

    await user.click(screen.getByText('t2'));

    expect(onOpenTrace).toHaveBeenCalledWith(expect.objectContaining({ trace_id: 't2' }), 2);
  });

  // Every row is a real button, so the list is reachable by keyboard without any extra wiring.
  test('each trace is activated from the keyboard', async () => {
    const user = userEvent.setup();
    const onOpenTrace = vi.fn();
    renderList({ onOpenTrace });

    await user.tab();
    await user.keyboard('{Enter}');

    expect(onOpenTrace).toHaveBeenCalledWith(expect.objectContaining({ trace_id: 't1' }), 1);
  });

  test('renders the placeholder for a turn whose start time could not be read', () => {
    renderList({ turns: [turn('t1', { started: 'not-a-time', duration_ms: null })], turnCount: 1 });

    expect(screen.getAllByText(UNAVAILABLE_VALUE).length).toBeGreaterThan(0);
  });

  test('discloses the bound when the turn list was clipped', () => {
    renderList({ turnCount: 911 });

    expect(screen.getByText(ConversationsTraceI18nKey.TranscriptTurnsTruncated)).toBeInTheDocument();
  });

  test('discloses nothing when every turn loaded', () => {
    renderList({ turnCount: 2 });

    expect(screen.queryByText(ConversationsTraceI18nKey.TranscriptTurnsTruncated)).toBeNull();
  });

  // The rollup is refreshed periodically while the hop log is written live, so a young conversation can have
  // no turns yet. Nothing failed, so it must not read as a failure.
  test('states that no traces were recorded rather than reporting an error', () => {
    renderList({ turns: [], turnRatings: [], turnCount: 0 });

    expect(screen.getByText(ConversationsTraceI18nKey.TraceListEmpty)).toBeInTheDocument();
    expect(screen.queryByText(ConversationsTraceI18nKey.TraceListLoadFailed)).toBeNull();
  });

  test('reports a failed turn read as a failure', () => {
    renderList({ turns: [], turnRatings: [], hasTurnsLoadError: true });

    expect(screen.getByText(ConversationsTraceI18nKey.TraceListLoadFailed)).toBeInTheDocument();
    expect(screen.queryByText(ConversationsTraceI18nKey.TraceListEmpty)).toBeNull();
  });
});

// The question the turn answered is what a reader scans a list of turns for; the number and trace id identify
// it once found.
describe('ConversationTraceList — turn titles', () => {
  const QUESTIONS = new Map([
    ['t1', "What are Swiss Re's views on cyber insurance?"],
    ['t2', 'let us go with 2022-2026 YTD'],
  ]);

  test('titles each row with that turn own question', () => {
    renderList({ questions: QUESTIONS });

    expect(screen.getByText("What are Swiss Re's views on cyber insurance?")).toBeInTheDocument();
    expect(screen.getByText('let us go with 2022-2026 YTD')).toBeInTheDocument();
  });

  test('keeps the turn number and the trace id as the subtitle', () => {
    renderList({ questions: QUESTIONS });

    expect(screen.getByText('t1')).toBeInTheDocument();
    expect(screen.getAllByText(ConversationsTraceI18nKey.TraceTurn, { exact: false }).length).toBe(2);
  });

  // A conversation with no entry hop, or a caller whose schema withheld the body columns, has no transcript —
  // and the turn list has to keep working.
  test('falls back to the turn number when the turn has no question', () => {
    renderList({ questions: new Map() });

    expect(screen.getAllByText(ConversationsTraceI18nKey.TraceTurn, { exact: false }).length).toBe(2);
    expect(screen.getByText('t1')).toBeInTheDocument();
  });

  test('falls back per turn, so a partially readable transcript still titles what it can', () => {
    renderList({ questions: new Map([['t2', 'only the second question']]) });

    expect(screen.getByText('only the second question')).toBeInTheDocument();
    expect(screen.getAllByText(ConversationsTraceI18nKey.TraceTurn, { exact: false }).length).toBe(2);
  });
});
