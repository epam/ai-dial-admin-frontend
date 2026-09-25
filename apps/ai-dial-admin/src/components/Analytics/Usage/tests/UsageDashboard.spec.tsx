import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import UsageDashboard from '@/src/components/Analytics/Usage/UsageDashboard';
import { AnalyticsUsageI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { StructuredQuery } from '@/src/models/analytics/query';

const executeQueryMock = vi.fn();
const showNotificationMock = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification: showNotificationMock, removeNotification: vi.fn() }),
}));
vi.mock('@/src/app/[lang]/queries/actions', () => ({
  executeQuery: (...args: unknown[]) => executeQueryMock(...args),
}));

// AG Grid and ECharts are the heavy children; this spec is about the page's wiring.
vi.mock('@/src/components/Grid/GridView/GridView', () => ({ default: () => <div role="grid" /> }));
vi.mock('@/src/components/Analytics/Common/HeatMap/HeatMapGrid', () => ({ default: () => <div role="grid" /> }));

const queriesSent = (): StructuredQuery[] => executeQueryMock.mock.calls.map(([query]) => query as StructuredQuery);

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
  executeQueryMock.mockReset();
  showNotificationMock.mockReset();
  executeQueryMock.mockResolvedValue({ success: true, response: { rows: [ANY_ROW] } });
});

describe('UsageDashboard', () => {
  test('renders the page and its widgets', async () => {
    render(<UsageDashboard />);

    expect(screen.getByRole('heading', { name: MenuI18nKey.Dashboard })).toBeTruthy();
    expect(screen.getByRole('region', { name: AnalyticsUsageI18nKey.DonutTitle })).toBeTruthy();
    expect(screen.getByRole('region', { name: AnalyticsUsageI18nKey.HeatmapTitle })).toBeTruthy();
    expect(screen.getByRole('region', { name: AnalyticsUsageI18nKey.BreakdownTitle })).toBeTruthy();

    await waitFor(() => expect(executeQueryMock).toHaveBeenCalled());
  });

  test('reads each window exactly once on mount, since comparison starts on', async () => {
    render(<UsageDashboard />);

    // Totals, buckets and the breakdown rows, each for the current window and the previous one,
    // plus the share chart's own ranking and the heatmap's independent week. An exact count, so a
    // window taken twice — which is what a snapshot re-taken in an effect produced — fails here.
    await waitFor(() => expect(executeQueryMock.mock.calls.length).toBe(8));
  });

  test('asks every query for the same entity', async () => {
    render(<UsageDashboard />);

    await waitFor(() => expect(executeQueryMock).toHaveBeenCalled());
    expect(queriesSent().every((query) => query.entity === 'dial_usage_log')).toBe(true);
  });

  test('leaves the split series unasked while the plain plot is the one showing', async () => {
    render(<UsageDashboard />);

    await waitFor(() => expect(executeQueryMock).toHaveBeenCalled());
    expect(groupings().some((grouping) => grouping === 'bucket+deployment')).toBe(false);
  });

  test('asks for the split series once that plot is chosen', async () => {
    const user = userEvent.setup();
    render(<UsageDashboard />);

    await waitFor(() => expect(executeQueryMock).toHaveBeenCalled());
    await user.click(screen.getByText(AnalyticsUsageI18nKey.TimeSeriesTabSplit));

    await waitFor(() => expect(groupings().some((grouping) => grouping === 'bucket+deployment')).toBe(true));
  });

  test('re-ranks the share chart on spend and keeps the ring up while it reads', async () => {
    const user = userEvent.setup();
    render(<UsageDashboard />);

    await waitFor(() => expect(executeQueryMock).toHaveBeenCalled());
    await user.click(screen.getByText(AnalyticsUsageI18nKey.DonutMetricCost));

    await waitFor(() => expect(queriesSent().some((query) => query.sort?.[0]?.field === 'spend')).toBe(true));
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

  test('renders the page when every request fails, stating the failure once', async () => {
    executeQueryMock.mockResolvedValue({ success: false, errorMessage: 'upstream refused' });

    render(<UsageDashboard />);

    // Nine requests failing the same way is one notification, not nine widgets each printing it.
    await waitFor(() => expect(showNotificationMock).toHaveBeenCalledOnce());
    expect(showNotificationMock).toHaveBeenCalledWith(expect.objectContaining({ description: 'upstream refused' }));
    expect(screen.queryByText('upstream refused')).toBeNull();
    expect(screen.getByRole('heading', { name: MenuI18nKey.Dashboard })).toBeTruthy();
  });
});
