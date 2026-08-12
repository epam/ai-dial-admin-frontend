import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import ConversationsToolbar from '@/src/components/Analytics/ConversationsTrace/Toolbar/ConversationsToolbar';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { FeedbackFilter } from '@/src/models/analytics/conversations-trace';
import { TimeRange } from '@/src/models/time-range';

const TIME_RANGE: TimeRange = {
  startDate: new Date('2026-07-21T00:00:00.000Z'),
  endDate: new Date('2026-07-28T00:00:00.000Z'),
};

const renderToolbar = (overrides: Partial<Parameters<typeof ConversationsToolbar>[0]> = {}) => {
  const props = {
    search: '',
    onSearchChange: vi.fn(),
    timePeriod: '7d',
    onTimePeriodChange: vi.fn(),
    timeRange: TIME_RANGE,
    onTimeRangeChange: vi.fn(),
    feedback: FeedbackFilter.All,
    onFeedbackChange: vi.fn(),
    ...overrides,
  };

  render(<ConversationsToolbar {...props} />);
  return props;
};

describe('ConversationsToolbar', () => {
  test('renders the search box with its placeholder', () => {
    renderToolbar();

    expect(screen.getByPlaceholderText(ConversationsTraceI18nKey.SearchPlaceholder)).toBeInTheDocument();
  });

  test('shows the current search term rather than owning it', () => {
    renderToolbar({ search: 'acme' });

    expect(screen.getByPlaceholderText(ConversationsTraceI18nKey.SearchPlaceholder)).toHaveValue('acme');
  });

  test('reports each typed character to its owner', async () => {
    const user = userEvent.setup();
    const { onSearchChange } = renderToolbar();

    await user.type(screen.getByPlaceholderText(ConversationsTraceI18nKey.SearchPlaceholder), 'a');

    expect(onSearchChange).toHaveBeenCalledWith('a');
  });

  test('renders the time period control with the active preset', () => {
    renderToolbar();

    expect(screen.getByRole('button', { name: /7d/ })).toBeInTheDocument();
  });

  test('reports a chosen preset to its owner', async () => {
    const user = userEvent.setup();
    const { onTimePeriodChange, onTimeRangeChange } = renderToolbar();

    await user.click(screen.getByRole('button', { name: /7d/ }));
    await user.click(screen.getByRole('button', { name: 'Last 24h' }));

    expect(onTimePeriodChange).toHaveBeenCalledWith('24h');
    expect(onTimeRangeChange).toHaveBeenCalled();
  });

  test('renders the feedback filter alongside search and time', () => {
    renderToolbar();

    expect(screen.getByText(ConversationsTraceI18nKey.Feedback)).toBeInTheDocument();
  });
});

describe('ConversationsToolbar :: feedback filter', () => {
  const segment = (name: string) => screen.getByRole('tab', { name });

  test('offers all four feedback states', () => {
    renderToolbar();

    expect(segment(ConversationsTraceI18nKey.FeedbackAll)).toBeInTheDocument();
    expect(segment(ConversationsTraceI18nKey.FeedbackRated)).toBeInTheDocument();
    expect(segment(ConversationsTraceI18nKey.FeedbackPositive)).toBeInTheDocument();
    expect(segment(ConversationsTraceI18nKey.FeedbackNegative)).toBeInTheDocument();
  });

  test.each([
    [ConversationsTraceI18nKey.FeedbackPositive, FeedbackFilter.Positive],
    [ConversationsTraceI18nKey.FeedbackNegative, FeedbackFilter.Negative],
    [ConversationsTraceI18nKey.FeedbackRated, FeedbackFilter.Rated],
  ])('clicking %s reports %s to its owner', async (label, expected) => {
    const user = userEvent.setup();
    const { onFeedbackChange } = renderToolbar();

    await user.click(segment(label));

    expect(onFeedbackChange).toHaveBeenCalledWith(expected);
  });

  test('shows the current feedback state rather than owning it', () => {
    renderToolbar({ feedback: FeedbackFilter.Negative });

    expect(segment(ConversationsTraceI18nKey.FeedbackNegative)).toHaveAttribute('aria-selected', 'true');
    expect(segment(ConversationsTraceI18nKey.FeedbackAll)).toHaveAttribute('aria-selected', 'false');
  });

  test('defaults to All, which narrows nothing', () => {
    renderToolbar();

    expect(segment(ConversationsTraceI18nKey.FeedbackAll)).toHaveAttribute('aria-selected', 'true');
  });

  // The placeholder must name only what search reaches: the conversation id and the project.
  test('promises only the fields search can match', () => {
    renderToolbar();

    expect(screen.getByPlaceholderText(ConversationsTraceI18nKey.SearchPlaceholder)).toBeInTheDocument();
  });
});
