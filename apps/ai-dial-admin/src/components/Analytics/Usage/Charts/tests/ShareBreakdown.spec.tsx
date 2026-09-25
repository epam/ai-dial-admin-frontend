import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import ShareBreakdown from '@/src/components/Analytics/Usage/Charts/ShareBreakdown';
import {
  BreakdownRow,
  BreakdownTab,
  DonutMetric,
  RequestState,
  UsageView,
} from '@/src/components/Analytics/Usage/models';
import { EMPTY_MEASURES } from '@/src/components/Analytics/Usage/utils/folds';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';

const loaded = <T,>(data: T): RequestState<T> => ({ data, isLoading: false, hasFailed: false });

const row = (id: string, calls: number, spend = 0): BreakdownRow => ({
  id,
  label: id,
  isFallbackLabel: false,
  measures: { ...EMPTY_MEASURES, calls, spend },
});

const ROWS = [row('gpt-4o', 50), row('claude-sonnet', 30), row('gemini', 20)];

type Props = Parameters<typeof ShareBreakdown>[0];

const renderCard = (props: Partial<Props> = {}) =>
  render(
    <ShareBreakdown
      rows={loaded<BreakdownRow[]>(ROWS)}
      tab={BreakdownTab.Models}
      view={UsageView.Llm}
      metric={DonutMetric.Calls}
      renderedMetric={props.metric ?? DonutMetric.Calls}
      onMetricChange={vi.fn()}
      windowTotalCalls={100}
      windowTotalSpend={100}
      isFullOpen={false}
      hasMoreRows={false}
      isReadingMore={false}
      onLoadMoreRows={vi.fn()}
      onShowAll={vi.fn()}
      onHideAll={vi.fn()}
      {...props}
    />,
  );

const scrollLegendToEnd = (list: HTMLElement) => {
  Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 800 });
  Object.defineProperty(list, 'clientHeight', { configurable: true, value: 320 });
  Object.defineProperty(list, 'scrollTop', { configurable: true, value: 480 });
  fireEvent.scroll(list);
};

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
    renderCard({ rows: loaded<BreakdownRow[]>([]), windowTotalCalls: 0 });

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

  test('reads the next rows once the dialog legend is scrolled to its end', () => {
    const onLoadMoreRows = vi.fn();
    renderCard({ isFullOpen: true, hasMoreRows: true, onLoadMoreRows });

    scrollLegendToEnd(within(screen.getByRole('dialog')).getByRole('list'));

    expect(onLoadMoreRows).toHaveBeenCalledOnce();
  });

  test('reads nothing further once the window has no rows left', () => {
    const onLoadMoreRows = vi.fn();
    renderCard({ isFullOpen: true, hasMoreRows: false, onLoadMoreRows });

    scrollLegendToEnd(within(screen.getByRole('dialog')).getByRole('list'));

    expect(onLoadMoreRows).not.toHaveBeenCalled();
  });

  test('says it is reading the next rows while a block is in flight', () => {
    renderCard({ isFullOpen: true, isReadingMore: true });

    expect(within(screen.getByRole('dialog')).getByRole('status')).toBeTruthy();
  });

  test('says nothing of the sort once the block has arrived', () => {
    renderCard({ isFullOpen: true, isReadingMore: false });

    expect(within(screen.getByRole('dialog')).queryByRole('status')).toBeNull();
  });
});

describe('ShareBreakdown metric', () => {
  test('offers the cost split in the LLM view', () => {
    renderCard();

    expect(screen.getByText(AnalyticsUsageI18nKey.DonutMetricCost)).toBeInTheDocument();
  });

  test('offers no cost split in the MCP view, where a row carries no price', () => {
    renderCard({ view: UsageView.Mcp, tab: BreakdownTab.McpServers });

    expect(screen.queryByText(AnalyticsUsageI18nKey.DonutMetricCost)).toBeNull();
  });

  test('splits the ring by spend and states money once the cost metric is chosen', () => {
    renderCard({
      metric: DonutMetric.Cost,
      windowTotalSpend: 80,
      rows: loaded<BreakdownRow[]>([row('gpt-4o', 50, 60), row('claude-sonnet', 30, 20)]),
    });

    expect(screen.getByText(AnalyticsUsageI18nKey.DonutSubtitleCost)).toBeInTheDocument();
    expect(screen.getByText('$60.00')).toBeInTheDocument();
  });

  test('reports the chosen metric so the ranking can be re-taken on it', async () => {
    const user = userEvent.setup();
    const onMetricChange = vi.fn();
    renderCard({ onMetricChange });

    await user.click(screen.getByText(AnalyticsUsageI18nKey.DonutMetricCost));

    expect(onMetricChange).toHaveBeenCalledWith(DonutMetric.Cost);
  });
});

describe('ShareBreakdown dialog measures', () => {
  const PRICED = [row('gpt-4o', 50, 60), row('claude-sonnet', 30, 20)];

  test('states calls and cost side by side whichever measure the reader arrived with', () => {
    renderCard({
      isFullOpen: true,
      metric: DonutMetric.Calls,
      rows: loaded<BreakdownRow[]>(PRICED),
      windowTotalCalls: 80,
      windowTotalSpend: 80,
    });

    const dialog = within(screen.getByRole('dialog'));

    expect(dialog.getByText('50')).toBeInTheDocument();
    expect(dialog.getByText('$60.00')).toBeInTheDocument();
  });

  test('states one figure in the MCP view, which prices nothing', () => {
    renderCard({
      isFullOpen: true,
      view: UsageView.Mcp,
      tab: BreakdownTab.McpServers,
      rows: loaded<BreakdownRow[]>(PRICED),
      windowTotalCalls: 80,
      windowTotalSpend: null,
    });

    const dialog = within(screen.getByRole('dialog'));

    expect(dialog.getByText('50')).toBeInTheDocument();
    expect(dialog.queryByText('$60.00')).toBeNull();
  });
});

describe('ShareBreakdown re-ranking', () => {
  test('keeps the figures on screen while a new ranking is read', () => {
    renderCard({ isReadingMore: true });

    expect(screen.getByText('gpt-4o')).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsUsageI18nKey.DonutEmptyCenter)).toBeNull();
  });
});
