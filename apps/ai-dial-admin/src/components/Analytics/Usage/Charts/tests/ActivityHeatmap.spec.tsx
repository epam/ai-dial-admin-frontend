import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import ActivityHeatmap from '@/src/components/Analytics/Usage/Charts/ActivityHeatmap';
import { BucketPoint, RequestState } from '@/src/components/Analytics/Usage/models';
import { UsageView } from '@/src/components/Analytics/Usage/models';
import { HeatmapWeek } from '@/src/components/Analytics/Usage/use-heatmap-week';
import { EMPTY_MEASURES } from '@/src/components/Analytics/Usage/utils/folds';
import { getWeekRange } from '@/src/components/Analytics/Usage/utils/weeks';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';

// The grid is AG Grid; this spec is about the card around it, not about the library.
vi.mock('@/src/components/Analytics/Common/HeatMap/HeatMapGrid', () => ({
  default: ({ rowData }: { rowData: unknown[] }) => <div role="grid" aria-rowcount={rowData.length} />,
}));

const loaded = <T,>(data: T): RequestState<T> => ({ data, isLoading: false, hasFailed: false });

const busyWeek: BucketPoint[] = [
  { bucketMs: new Date(2026, 8, 16, 10).getTime(), measures: { ...EMPTY_MEASURES, calls: 12 } },
];

const week = (offset: number): HeatmapWeek => ({
  week: getWeekRange(offset, new Date(2026, 8, 17)),
  weekOffset: offset,
  buckets: loaded<BucketPoint[]>([]),
  onPreviousWeek: vi.fn(),
  onNextWeek: vi.fn(),
  onCurrentWeek: vi.fn(),
});

const renderHeatmap = (overrides: Partial<HeatmapWeek> = {}, view: UsageView = UsageView.Llm) =>
  render(<ActivityHeatmap heatmap={{ ...week(0), ...overrides }} view={view} />);

describe('ActivityHeatmap', () => {
  test('names the timezone the grid is drawn in', () => {
    renderHeatmap({ buckets: loaded(busyWeek) });

    expect(screen.getByText(AnalyticsUsageI18nKey.HeatmapSubtitle)).toBeTruthy();
  });

  test('states that a week recorded nothing instead of dropping the grid', () => {
    renderHeatmap();

    expect(screen.getByText(AnalyticsUsageI18nKey.HeatmapEmptySubtitle)).toBeTruthy();
    expect(screen.getByRole('grid')).toBeTruthy();
  });

  test('states the two ends of the intensity scale', () => {
    renderHeatmap();

    expect(screen.getByText(AnalyticsUsageI18nKey.HeatmapScaleLow)).toBeTruthy();
    expect(screen.getByText(AnalyticsUsageI18nKey.HeatmapScaleHigh)).toBeTruthy();
  });

  test('steps back a week from the control', async () => {
    const user = userEvent.setup();
    const onPreviousWeek = vi.fn();
    renderHeatmap({ onPreviousWeek });

    await user.click(screen.getByRole('button', { name: AnalyticsUsageI18nKey.HeatmapPreviousWeek }));

    expect(onPreviousWeek).toHaveBeenCalledOnce();
  });

  test('refuses to step forward past the current week', () => {
    renderHeatmap();

    expect(screen.getByRole('button', { name: AnalyticsUsageI18nKey.HeatmapNextWeek }).hasAttribute('disabled')).toBe(
      true,
    );
  });

  test('offers the way back once the reader has stepped away from the current week', async () => {
    const user = userEvent.setup();
    const onCurrentWeek = vi.fn();
    renderHeatmap({ ...week(2), onCurrentWeek });

    await user.click(screen.getByRole('button', { name: AnalyticsUsageI18nKey.HeatmapCurrentWeek }));

    expect(onCurrentWeek).toHaveBeenCalledOnce();
  });

  test('renders the loader rather than an empty grid while a week arrives', () => {
    renderHeatmap({ buckets: { data: null, isLoading: true, hasFailed: false } });

    expect(screen.queryByRole('grid')).toBeNull();
  });

  test('keeps the grid and states the empty week when the request failed', () => {
    renderHeatmap({ buckets: { data: null, isLoading: false, hasFailed: true } });

    expect(screen.getByRole('grid')).toBeTruthy();
    expect(screen.getByText(AnalyticsUsageI18nKey.HeatmapEmptySubtitle)).toBeTruthy();
  });

  test('offers the figure the grid paints, calls or cost', () => {
    renderHeatmap({ buckets: loaded(busyWeek) });

    expect(screen.getByText(AnalyticsUsageI18nKey.HeatmapMetricCalls)).toBeTruthy();
    expect(screen.getByText(AnalyticsUsageI18nKey.HeatmapMetricCost)).toBeTruthy();
  });

  test('offers no cost in the MCP view, whose rows carry no price', () => {
    renderHeatmap({ buckets: loaded(busyWeek) }, UsageView.Mcp);

    expect(screen.queryByText(AnalyticsUsageI18nKey.HeatmapMetricCost)).toBeNull();
  });
});
