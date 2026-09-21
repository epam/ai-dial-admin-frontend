import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import ShareBreakdown from '@/src/components/Analytics/Usage/Charts/ShareBreakdown';
import { BreakdownRow, BreakdownTab, RequestState } from '@/src/components/Analytics/Usage/models';
import { EMPTY_MEASURES } from '@/src/components/Analytics/Usage/utils/folds';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';

const loaded = <T,>(data: T): RequestState<T> => ({ data, isLoading: false, hasFailed: false });

const row = (id: string, calls: number): BreakdownRow => ({
  id,
  label: id,
  isFallbackLabel: false,
  measures: { ...EMPTY_MEASURES, calls },
});

const ROWS = [row('gpt-4o', 50), row('claude-sonnet', 30), row('gemini', 20)];

type Props = Parameters<typeof ShareBreakdown>[0];

const renderCard = (props: Partial<Props> = {}) =>
  render(
    <ShareBreakdown
      rows={loaded<BreakdownRow[]>(ROWS)}
      tab={BreakdownTab.Models}
      windowTotal={100}
      isFullOpen={false}
      onShowAll={vi.fn()}
      onHideAll={vi.fn()}
      {...props}
    />,
  );

describe('ShareBreakdown', () => {
  test('names every slice of the ring in its legend', () => {
    renderCard();

    expect(screen.getByText('gpt-4o')).toBeTruthy();
    expect(screen.getByText('claude-sonnet')).toBeTruthy();
  });

  test('states each slice as calls and as a share of the window', () => {
    renderCard();

    expect(screen.getByText('50')).toBeTruthy();
    expect(screen.getByText('50%')).toBeTruthy();
  });

  test('puts the window total in the hole of the ring', () => {
    renderCard();

    expect(screen.getByText('100')).toBeTruthy();
    expect(screen.getByText(AnalyticsUsageI18nKey.DonutTotal)).toBeTruthy();
  });

  test('states that the window held nothing rather than drawing an empty ring', () => {
    renderCard({ rows: loaded<BreakdownRow[]>([]), windowTotal: 0 });

    expect(screen.getByText(AnalyticsUsageI18nKey.DonutEmptySubtitle)).toBeTruthy();
    expect(screen.getByText(AnalyticsUsageI18nKey.DonutEmptyCenter)).toBeTruthy();
  });

  test('asks for the full list from the card control', async () => {
    const user = userEvent.setup();
    const onShowAll = vi.fn();
    renderCard({ onShowAll });

    await user.click(screen.getByRole('button', { name: AnalyticsUsageI18nKey.ViewAll }));

    expect(onShowAll).toHaveBeenCalledOnce();
  });

  test('offers a search over the list once the dialog is open', () => {
    renderCard({ isFullOpen: true });

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByRole('textbox', { name: AnalyticsUsageI18nKey.SearchPlaceholder })).toBeTruthy();
  });

  test('keeps the silhouette and states the empty window when the request failed', () => {
    renderCard({ rows: { data: null, isLoading: false, hasFailed: true } });

    expect(screen.getByText(AnalyticsUsageI18nKey.DonutEmptyCenter)).toBeTruthy();
  });
});
