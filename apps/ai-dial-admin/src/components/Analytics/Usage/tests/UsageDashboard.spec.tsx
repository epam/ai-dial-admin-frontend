import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import UsageDashboard from '@/src/components/Analytics/Usage/UsageDashboard';
import { AnalyticsUsageI18nKey, ButtonsI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { StructuredQuery } from '@/src/models/analytics/query';

const runQueryMock = vi.fn();
const showNotificationMock = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification: showNotificationMock, removeNotification: vi.fn() }),
}));
// The page reads through the shared runner, which owns cancellation; this spec is about the page's
// wiring, so the runner is the seam.
const RUNNER = { runQuery: (...args: unknown[]) => runQueryMock(...args), runSql: vi.fn() };
vi.mock('@/src/components/Analytics/Common/use-analytics-query', () => ({
  useAnalyticsQuery: () => RUNNER,
}));

// AG Grid and ECharts are the heavy children; this spec is about the page's wiring.
vi.mock('@/src/components/Grid/GridView/GridView', () => ({ default: () => <div role="grid" /> }));
vi.mock('@/src/components/Common/HeatMap/HeatMapGrid', () => ({ default: () => <div role="grid" /> }));

const queriesSent = (): StructuredQuery[] => runQueryMock.mock.calls.map(([query]) => query as StructuredQuery);

// Refresh is disabled while any of the dashboard's reads is in flight, so it coming back is the page
// saying every read it started has landed. The extra flush lets any effect that landing set off run.
const settled = async () => {
  await waitFor(() => expect(screen.getByRole('button', { name: ButtonsI18nKey.Refresh })).toBeEnabled());
  await act(async () => {});
};

const groupings = () => queriesSent().map((query) => (query.group_by ?? []).join('+'));

// One row that satisfies every fold: a bucket, a dimension value and the measure aliases. The share
// chart's ranking has to come back non-empty, because the split series is drawn from the names it
// resolved.
const ANY_ROW = {
  bucket: '2026-09-17T12:00:00.000Z',
  deployment: 'gpt-4o',
  parent_deployment: 'app',
  project_id: 'project',
  calls: 10,
  callers: 2,
  failed: 1,
  spend: 4,
};

beforeEach(() => {
  runQueryMock.mockReset();
  showNotificationMock.mockReset();
  runQueryMock.mockResolvedValue({ isSuccess: true, result: { rows: [ANY_ROW] } });
});

describe('UsageDashboard', () => {
  test('renders the page and its widgets', async () => {
    render(<UsageDashboard />);

    expect(screen.getByRole('heading', { name: MenuI18nKey.Dashboard })).toBeTruthy();
    expect(screen.getByRole('region', { name: AnalyticsUsageI18nKey.DonutTitle })).toBeTruthy();
    expect(screen.getByRole('region', { name: AnalyticsUsageI18nKey.HeatmapTitle })).toBeTruthy();
    expect(screen.getByRole('region', { name: AnalyticsUsageI18nKey.BreakdownTitleTop })).toBeTruthy();

    await vi.waitFor(() => expect(runQueryMock).toHaveBeenCalled());
  });

  test('reads each window exactly once on mount, since comparison starts on', async () => {
    render(<UsageDashboard />);

    // Totals, buckets and the breakdown rows, each for the current window and the previous one,
    // plus the share chart's own ranking and the heatmap's independent week. An exact count, so a
    // window taken twice — which is what a snapshot re-taken in an effect produced — fails here.
    await settled();
    expect(runQueryMock).toHaveBeenCalledTimes(8);
  });

  test('asks every query for the same entity', async () => {
    render(<UsageDashboard />);

    await settled();
    expect(queriesSent()).toHaveLength(8);
    expect(queriesSent().every((query) => query.entity === 'dial_usage_log')).toBe(true);
  });

  test('leaves the split series unasked while the plain plot is the one showing', async () => {
    render(<UsageDashboard />);

    await settled();
    expect(runQueryMock).toHaveBeenCalledTimes(8);
    expect(groupings().some((grouping) => grouping === 'bucket+deployment')).toBe(false);
  });

  test('asks for the split series once that plot is chosen', async () => {
    const user = userEvent.setup();
    render(<UsageDashboard />);

    await vi.waitFor(() => expect(runQueryMock).toHaveBeenCalled());
    await user.click(screen.getByText(AnalyticsUsageI18nKey.TimeSeriesTabSplit));

    await vi.waitFor(() => expect(groupings().some((grouping) => grouping === 'bucket+deployment')).toBe(true));
  });

  test('re-ranks the share chart on spend and keeps the ring up while it reads', async () => {
    const user = userEvent.setup();
    render(<UsageDashboard />);

    await vi.waitFor(() => expect(runQueryMock).toHaveBeenCalled());
    await user.click(screen.getByText(AnalyticsUsageI18nKey.DonutMetricCost));

    await vi.waitFor(() => expect(queriesSent().some((query) => query.sort?.[0]?.field === 'spend')).toBe(true));
    await settled();
    expect(screen.getByText(AnalyticsUsageI18nKey.DonutTitle)).toBeTruthy();
    expect(screen.queryByText(AnalyticsUsageI18nKey.DonutEmptyCenter)).toBeNull();
  });

  test('offers no spend plot in the MCP view, which records no price', async () => {
    const user = userEvent.setup();
    render(<UsageDashboard />);

    expect(screen.getByText(AnalyticsUsageI18nKey.TimeSeriesTabCost)).toBeTruthy();

    await user.click(screen.getByRole('combobox', { name: AnalyticsUsageI18nKey.ViewByLabel }));
    await user.click(screen.getByRole('option', { name: AnalyticsUsageI18nKey.ViewMcp }));

    expect(screen.queryByText(AnalyticsUsageI18nKey.TimeSeriesTabCost)).toBeNull();
  });

  test('reloads every widget from route rows on switching to Routes, keeping the comparison', async () => {
    const user = userEvent.setup();
    render(<UsageDashboard />);

    await settled();
    runQueryMock.mockClear();

    await user.click(screen.getByRole('combobox', { name: AnalyticsUsageI18nKey.ViewByLabel }));
    await user.click(screen.getByRole('option', { name: AnalyticsUsageI18nKey.ViewRoutes }));

    // The same eight reads against the new view: comparison stays on, so each window is read again.
    await settled();
    expect(runQueryMock).toHaveBeenCalledTimes(8);
    expect(groupings().filter((grouping) => grouping === 'route_owner')).toHaveLength(3);
    expect(
      (screen.getByRole('combobox', { name: AnalyticsUsageI18nKey.CompareLabel }) as HTMLInputElement).value,
    ).toContain(AnalyticsUsageI18nKey.ComparePreviousPeriod);
    expect(screen.queryByText(AnalyticsUsageI18nKey.TimeSeriesTabCost)).toBeNull();
  });

  test('renders the page when every request fails, stating the failure once', async () => {
    runQueryMock.mockResolvedValue({ isSuccess: false, result: null, error: 'upstream refused' });

    render(<UsageDashboard />);

    // Nine requests failing the same way is one notification, not nine widgets each printing it.
    await settled();
    expect(showNotificationMock).toHaveBeenCalledOnce();
    expect(showNotificationMock).toHaveBeenCalledWith(expect.objectContaining({ description: 'upstream refused' }));
    expect(screen.queryByText('upstream refused')).toBeNull();
    expect(screen.getByRole('heading', { name: MenuI18nKey.Dashboard })).toBeTruthy();
  });

  // Cancellation is what happens when the operator leaves mid-load. The page they went to is not the
  // place to raise an alarm about the one they left.
  test('says nothing when its requests are cancelled', async () => {
    runQueryMock.mockResolvedValue({ isSuccess: false, result: null, isCancelled: true });

    render(<UsageDashboard />);

    // A cancelled read leaves its widget loading for good, so Refresh never comes back: wait instead for
    // every read to have been issued and answered, then let the page react to the answers.
    await vi.waitFor(() => expect(runQueryMock).toHaveBeenCalledTimes(8));
    await Promise.all(runQueryMock.mock.results.map(({ value }) => value));
    await act(async () => {});
    expect(showNotificationMock).not.toHaveBeenCalled();
  });
});
