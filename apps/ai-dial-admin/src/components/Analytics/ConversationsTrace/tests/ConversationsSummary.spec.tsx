import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import ConversationsSummary from '@/src/components/Analytics/ConversationsTrace/Header/ConversationsSummary';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { ConversationSummary } from '@/src/models/analytics/conversations-trace';

const summary = (overrides: Partial<ConversationSummary> = {}): ConversationSummary => ({
  conversations: 11,
  isTruncated: false,
  rated: 9,
  negative: 2,
  cost: '0.533',
  ...overrides,
});

const renderSummary = (overrides: Partial<ConversationSummary> = {}, periodLabel = '7d') =>
  render(<ConversationsSummary summary={summary(overrides)} periodLabel={periodLabel} />);

describe('ConversationsSummary', () => {
  test('shows the conversation count', () => {
    renderSummary();

    expect(screen.getByText('11')).toBeInTheDocument();
  });

  test('shows the rated count as a fraction of the listed conversations', () => {
    renderSummary();

    expect(screen.getByText('9/11')).toBeInTheDocument();
  });

  test('shows how many conversations carry a negative rating', () => {
    renderSummary({ negative: 2 });

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('shows the cost with a currency prefix', () => {
    renderSummary();

    expect(screen.getByText('$0.533')).toBeInTheDocument();
  });

  test('labels the cost with the active period', () => {
    renderSummary({}, '30d');

    expect(screen.getByText(`${ConversationsTraceI18nKey.SummaryCost} 30d`)).toBeInTheDocument();
  });

  test('labels every pill from i18n', () => {
    renderSummary();

    expect(screen.getByText(ConversationsTraceI18nKey.SummaryConversations)).toBeInTheDocument();
    expect(screen.getByText(ConversationsTraceI18nKey.SummaryRated)).toBeInTheDocument();
    expect(screen.getByText(ConversationsTraceI18nKey.SummaryWith)).toBeInTheDocument();
  });

  test('renders zeros for an empty result rather than nothing', () => {
    renderSummary({ conversations: 0, rated: 0, negative: 0, cost: '0' });

    expect(screen.getByText('0/0')).toBeInTheDocument();
    expect(screen.getByText('$0')).toBeInTheDocument();
  });
});

describe('ConversationsSummary :: truncated result', () => {
  test('marks the conversation count as a lower bound when the page is full', () => {
    renderSummary({ conversations: 20, isTruncated: true });

    expect(screen.getByText('20+')).toBeInTheDocument();
  });

  test('shows an exact count when the result fits in one page', () => {
    renderSummary({ conversations: 11, isTruncated: false });

    expect(screen.getByText('11')).toBeInTheDocument();
    expect(screen.queryByText('11+')).not.toBeInTheDocument();
  });

  test('explains the narrower scope through a different hint when truncated', () => {
    renderSummary({ isTruncated: true });

    expect(screen.getAllByTitle(ConversationsTraceI18nKey.SummaryTruncatedHint).length).toBeGreaterThan(0);
    expect(screen.queryAllByTitle(ConversationsTraceI18nKey.SummaryScopeHint)).toHaveLength(0);
  });

  test('explains the page scope when not truncated', () => {
    renderSummary({ isTruncated: false });

    expect(screen.getAllByTitle(ConversationsTraceI18nKey.SummaryScopeHint).length).toBeGreaterThan(0);
    expect(screen.queryAllByTitle(ConversationsTraceI18nKey.SummaryTruncatedHint)).toHaveLength(0);
  });

  // The caveat qualifies the figure, so it must not be hover-only: a `title` on a plain div reaches neither
  // the keyboard nor a screen reader.
  test('exposes the scope caveat to the keyboard and to assistive technology', () => {
    renderSummary({ isTruncated: true });

    const pills = screen.getAllByRole('group');

    expect(pills.length).toBeGreaterThan(0);
    pills.forEach((pill) => expect(pill).toHaveAttribute('tabindex', '0'));
    expect(pills.some((pill) => pill.textContent?.includes(ConversationsTraceI18nKey.SummaryTruncatedHint))).toBe(true);
  });

  test('keeps the figure in the pill name rather than replacing it with the caveat', () => {
    renderSummary({ isTruncated: true, conversations: 20 });

    const [conversationsPill] = screen.getAllByRole('group');

    expect(conversationsPill).not.toHaveAttribute('aria-label');
    expect(conversationsPill.textContent).toContain('20+');
  });
});
