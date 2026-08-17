import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import ConversationsSummary from '@/src/components/Analytics/ConversationsTrace/Header/ConversationsSummary';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { ConversationSummary, ConversationTotals } from '@/src/models/analytics/conversations-trace';

const TOTALS: ConversationTotals = { conversations: 212, cost: '654.070540769000' };

const SUMMARY: ConversationSummary = { rated: 3, negative: 2 };

interface Options {
  totals?: ConversationTotals | null;
  summary?: ConversationSummary;
  loadedCount?: number;
  periodLabel?: string;
}

const renderSummary = ({ totals = TOTALS, summary = SUMMARY, loadedCount = 100, periodLabel = '7d' }: Options = {}) =>
  render(
    <ConversationsSummary totals={totals} summary={summary} loadedCount={loadedCount} periodLabel={periodLabel} />,
  );

describe('ConversationsSummary', () => {
  // The count comes from its own query over the whole filtered result, not from the rows loaded.
  test('shows the whole-result conversation count, with no approximation marker', () => {
    renderSummary({ loadedCount: 100 });

    expect(screen.getByText('212')).toBeInTheDocument();
    expect(screen.queryByText('212+')).not.toBeInTheDocument();
    expect(screen.queryByText('100')).not.toBeInTheDocument();
  });

  test('rounds the whole-result cost for display', () => {
    renderSummary();

    expect(screen.getByText('$654.071')).toBeInTheDocument();
  });

  test('reads a numeric cost as well as a string one', () => {
    renderSummary({ totals: { conversations: 1, cost: 0.5335 } });

    expect(screen.getByText('$0.534')).toBeInTheDocument();
  });

  test('shows the rated count against the rows loaded so far', () => {
    renderSummary({ loadedCount: 100 });

    expect(screen.getByText('3/100')).toBeInTheDocument();
  });

  test('shows how many loaded conversations carry a negative rating', () => {
    renderSummary();

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  // Two pills are whole-result figures and two cover the loaded rows; each has to say which.
  test('states the scope each pill reports', () => {
    renderSummary();

    expect(screen.getAllByTitle(ConversationsTraceI18nKey.SummaryResultHint)).toHaveLength(2);
    expect(screen.getAllByTitle(ConversationsTraceI18nKey.SummaryLoadedHint)).toHaveLength(2);
  });

  test('names the loaded scope in visible text on the loaded-scope pills', () => {
    renderSummary();

    expect(screen.getAllByText(ConversationsTraceI18nKey.SummaryLoadedScope)).toHaveLength(2);
  });

  test('does not also carry the loaded-scope caveat as screen-reader-only text', () => {
    const { container } = renderSummary();
    const hidden = Array.from(container.querySelectorAll('.sr-only')).map((node) => node.textContent);

    expect(hidden).not.toContain(ConversationsTraceI18nKey.SummaryLoadedHint);
  });

  test('keeps the whole-result hint as screen-reader-only text', () => {
    const { container } = renderSummary();
    const hidden = Array.from(container.querySelectorAll('.sr-only')).map((node) => node.textContent);

    expect(hidden.filter((text) => text === ConversationsTraceI18nKey.SummaryResultHint)).toHaveLength(2);
  });

  test('names the period on the cost pill', () => {
    renderSummary({ periodLabel: '30d' });

    expect(screen.getByText(`${ConversationsTraceI18nKey.SummaryCost} 30d`)).toBeInTheDocument();
  });

  // Rendering zeros would assert an empty result that was never established.
  test('reports the whole-result figures as unavailable when the totals query failed', () => {
    renderSummary({ totals: null });

    expect(screen.getAllByText('—')).toHaveLength(2);
    expect(screen.getAllByTitle(ConversationsTraceI18nKey.SummaryUnavailableHint)).toHaveLength(2);
  });

  // A sum over an empty result comes back null. That is zero, not a failure — reporting it as
  // unavailable would claim the request broke when it answered correctly.
  test('renders an empty result as zero cost, not as unavailable', () => {
    renderSummary({ totals: { conversations: 0, cost: null }, loadedCount: 0 });

    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.queryByText('—')).not.toBeInTheDocument();
    expect(screen.queryByTitle(ConversationsTraceI18nKey.SummaryUnavailableHint)).not.toBeInTheDocument();
  });

  test('still reports the loaded-scope counts when the totals are unavailable', () => {
    renderSummary({ totals: null, loadedCount: 20 });

    expect(screen.getByText('3/20')).toBeInTheDocument();
  });
});
