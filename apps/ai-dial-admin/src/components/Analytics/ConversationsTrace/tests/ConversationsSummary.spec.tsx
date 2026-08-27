import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import ConversationsSummary from '@/src/components/Analytics/ConversationsTrace/Header/ConversationsSummary';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { ConversationPeriodSummary } from '@/src/models/analytics/conversations-trace';

const PERIOD: ConversationPeriodSummary = {
  totals: { conversations: 212, cost: '654.070540769000' },
  ratings: { rated: 19, negative: 13 },
};

interface Options {
  period?: ConversationPeriodSummary | null;
  periodLabel?: string;
}

const renderSummary = ({ period = PERIOD, periodLabel = '7d' }: Options = {}) =>
  render(<ConversationsSummary period={period} periodLabel={periodLabel} />);

const srOnlyTexts = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('.sr-only')).map((node) => node.textContent);

// The pill is a group named by the figure it holds, so it is reachable by that accessible name.
const pillFor = (label: string) => screen.getAllByRole('group').find((pill) => pill.textContent?.includes(label));

describe('ConversationsSummary', () => {
  test('shows the period conversation count, with no approximation marker', () => {
    renderSummary();

    expect(screen.getByText('212')).toBeInTheDocument();
    expect(screen.queryByText('212+')).not.toBeInTheDocument();
  });

  test('rounds the period cost for display', () => {
    renderSummary();

    expect(screen.getByText('$654.071')).toBeInTheDocument();
  });

  test('reads a numeric cost as well as a string one', () => {
    renderSummary({ period: { totals: { conversations: 1, cost: 0.5335 }, ratings: { rated: 0, negative: 0 } } });

    expect(screen.getByText('$0.534')).toBeInTheDocument();
  });

  test('shows how many conversations in the period carry a rating', () => {
    renderSummary();

    expect(pillFor(ConversationsTraceI18nKey.SummaryRated)).toHaveTextContent('19');
  });

  // Ratings are bounded by when they were submitted and conversations by when they were last active, so a
  // ratio over the conversation count would not be a proportion and could read above one.
  test('shows the rated count without a denominator', () => {
    renderSummary();

    expect(screen.queryByText('19/212')).not.toBeInTheDocument();
    expect(screen.queryByText(/\/212$/)).not.toBeInTheDocument();
  });

  test('shows how many conversations in the period carry a negative rating', () => {
    renderSummary();

    expect(screen.getByText('13')).toBeInTheDocument();
  });

  test('names the period in visible text on every pill', () => {
    renderSummary({ periodLabel: '30d' });

    expect(screen.getAllByText('30d')).toHaveLength(4);
  });

  test('states on every pill that it covers the period', () => {
    renderSummary();

    expect(screen.getAllByTitle(ConversationsTraceI18nKey.SummaryPeriodHint)).toHaveLength(4);
  });

  // The visible caption names the period; the hint says the grid's filters do not narrow the figure. That
  // second fact is the whole point of the change, so it must not be hover-only.
  test('carries the period hint as screen-reader-only text alongside the visible caption', () => {
    const { container } = renderSummary();

    expect(srOnlyTexts(container).filter((text) => text === ConversationsTraceI18nKey.SummaryPeriodHint)).toHaveLength(
      4,
    );
  });

  test('reports unavailability to assistive technology, not only in the tooltip', () => {
    const { container } = renderSummary({ period: null });

    expect(
      srOnlyTexts(container).filter((text) => text === ConversationsTraceI18nKey.SummaryUnavailableHint),
    ).toHaveLength(4);
  });

  // The rated count no longer depends on the conversation count, so a failed totals aggregate leaves it
  // standing rather than blanking it.
  test('the rated count stands when only the conversation count is unresolved', () => {
    renderSummary({ period: { ratings: { rated: 19, negative: 13 } } });

    expect(pillFor(ConversationsTraceI18nKey.SummaryRated)).toHaveTextContent('19');
    expect(pillFor(ConversationsTraceI18nKey.SummaryConversations)).toHaveTextContent('—');
  });

  test('no pill claims to cover only the conversations loaded so far', () => {
    const { container } = renderSummary();

    expect(container.textContent).not.toContain('Loaded');
  });

  // Rendering zeros would assert an empty period that was never established.
  test('reports the count and cost as unavailable when their aggregate failed', () => {
    renderSummary({ period: { ratings: { rated: 19, negative: 13 } } });

    expect(pillFor(ConversationsTraceI18nKey.SummaryConversations)).toHaveTextContent('—');
    expect(screen.getAllByTitle(ConversationsTraceI18nKey.SummaryUnavailableHint).length).toBeGreaterThan(0);
  });

  test('keeps the count and cost standing when only the rating aggregate failed', () => {
    renderSummary({ period: { totals: { conversations: 212, cost: '10' } } });

    expect(screen.getByText('212')).toBeInTheDocument();
    expect(screen.getByText('$10')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  // Both halves describe the same population, so the denominator is never filled in from elsewhere.
  test('reports the rated ratio as unavailable when its denominator is unresolved', () => {
    renderSummary({ period: { ratings: { rated: 19, negative: 13 } } });

    expect(screen.queryByText('19/212')).not.toBeInTheDocument();
    expect(screen.queryByText(/^19\//)).not.toBeInTheDocument();
  });

  test('reports every figure as unavailable when the whole summary failed', () => {
    renderSummary({ period: null });

    expect(screen.getAllByText('—')).toHaveLength(4);
    expect(screen.getAllByTitle(ConversationsTraceI18nKey.SummaryUnavailableHint)).toHaveLength(4);
  });

  // A sum over an empty period comes back null: that is zero, not a failed request.
  test('renders an empty period as zero cost, not as unavailable', () => {
    renderSummary({ period: { totals: { conversations: 0, cost: null }, ratings: { rated: 0, negative: 0 } } });

    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.queryByText('—')).not.toBeInTheDocument();
    expect(screen.queryByTitle(ConversationsTraceI18nKey.SummaryUnavailableHint)).not.toBeInTheDocument();
  });
});
