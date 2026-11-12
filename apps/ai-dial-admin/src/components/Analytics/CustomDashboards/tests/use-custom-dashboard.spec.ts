import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { replaceDashboard, resolveInlineWidgetQuery } from '@/src/app/[lang]/dashboards/custom-actions';
import { useCustomDashboard } from '@/src/components/Analytics/CustomDashboards/use-custom-dashboard';
import { CustomDashboardsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import {
  Dashboard,
  DashboardVisibility,
  DashboardWidget,
  WidgetInlineQuery,
  WidgetQuery,
  WidgetQueryKind,
} from '@/src/models/analytics/dashboard';
import { QueryResultView } from '@/src/models/analytics/query-builder';
import { SavedQueryTimeMode } from '@/src/models/analytics/saved-query';
import { getWidgetQueryKey } from '@/src/utils/analytics/widget-source';

vi.mock('@/src/app/[lang]/dashboards/custom-actions', () => ({
  replaceDashboard: vi.fn(),
  resolveInlineWidgetQuery: vi.fn(),
  resolveWidgetQuery: vi.fn(),
}));

const inline = (sql: string): WidgetInlineQuery => ({ name: 'Inline', sql, result_view: QueryResultView.Table });
// What Edit settings writes back for an inline SQL widget.
const sqlPatch = (sql: string) => ({ row_limit: 100, inline_query: inline(sql) });
const composite = (sql: string): WidgetQuery => ({ kind: WidgetQueryKind.CompositeSql, savedQuery: inline(sql), sql });

const WIDGET: DashboardWidget = {
  id: 'w-1',
  inline_query: inline('SELECT 1'),
  row_limit: 100,
  layout: { x: 0, y: 0, w: 6, h: 4 },
};
const KEY = getWidgetQueryKey(WIDGET);

const DASHBOARD: Dashboard = {
  id: 'd-1',
  name: 'Costs',
  visibility: DashboardVisibility.Private,
  time: { mode: SavedQueryTimeMode.Relative, period: '7d' },
  widgets: [WIDGET],
  generation: 3,
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
  permissions: { write: true, publish: true },
};

const STORED_QUERY = composite('SELECT 1');

const renderDashboard = (isInitiallyEditing = true) =>
  renderHook(() => useCustomDashboard({ dashboard: DASHBOARD, queries: { [KEY]: STORED_QUERY } }, isInitiallyEditing));

const deferred = <T>() => {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

describe('useCustomDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('restores the stored inline query on Discard after its SQL was edited', async () => {
    vi.mocked(resolveInlineWidgetQuery).mockResolvedValue(composite('SELECT 2'));
    const { result } = renderDashboard(false);

    act(() => result.current.onEdit());
    act(() => result.current.onUpdateWidget('w-1', sqlPatch('SELECT 2')));
    await waitFor(() => expect(result.current.queries[KEY]).toEqual(composite('SELECT 2')));

    act(() => result.current.onDiscard());

    expect(result.current.queries[KEY]).toBe(STORED_QUERY);
    expect(result.current.widgets[0].inline_query?.sql).toBe('SELECT 1');
  });

  test('drops a re-resolution that lands after Discard', async () => {
    const pending = deferred<WidgetQuery>();
    vi.mocked(resolveInlineWidgetQuery).mockReturnValue(pending.promise);
    const { result } = renderDashboard();

    act(() => result.current.onUpdateWidget('w-1', sqlPatch('SELECT 2')));
    act(() => result.current.onDiscard());
    await act(async () => pending.resolve(composite('SELECT 2')));

    expect(result.current.queries[KEY]).toBe(STORED_QUERY);
  });

  test('keeps the latest inline re-resolution when an earlier one answers last', async () => {
    const first = deferred<WidgetQuery>();
    const second = deferred<WidgetQuery>();
    vi.mocked(resolveInlineWidgetQuery).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { result } = renderDashboard();

    act(() => result.current.onUpdateWidget('w-1', sqlPatch('SELECT 2')));
    act(() => result.current.onUpdateWidget('w-1', sqlPatch('SELECT 3')));
    await act(async () => second.resolve(composite('SELECT 3')));
    await act(async () => first.resolve(composite('SELECT 2')));

    expect(result.current.queries[KEY]).toEqual(composite('SELECT 3'));
  });

  test('keeps the draft and says the dashboard changed elsewhere when the save is stale', async () => {
    vi.mocked(replaceDashboard).mockResolvedValue({ success: false, status: 409, errorMessage: 'stale' });
    const { result } = renderDashboard();

    act(() => result.current.onRemoveWidget('w-1'));
    await act(async () => result.current.onSave());

    expect(replaceDashboard).toHaveBeenCalledWith(DASHBOARD.id, expect.objectContaining({ widgets: [] }), 3);
    expect(result.current.isEditing).toBe(true);
    expect(useNotification().showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: CustomDashboardsI18nKey.ChangedElsewhere }),
    );
  });

  test('leaves saving and reports an error when the save is rejected', async () => {
    vi.mocked(replaceDashboard).mockRejectedValue(new Error('network'));
    const { result } = renderDashboard();

    act(() => result.current.onRemoveWidget('w-1'));
    await act(async () => result.current.onSave());

    expect(result.current.isSaving).toBe(false);
    expect(result.current.isEditing).toBe(true);
    expect(useNotification().showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: ErrorI18nKey.Error }),
    );
  });

  test('fails a widget whose query resolution is rejected, and resolves it again on retry', async () => {
    vi.mocked(resolveInlineWidgetQuery).mockRejectedValueOnce(new Error('network'));
    const { result } = renderDashboard();

    await act(async () => result.current.onUpdateWidget('w-1', sqlPatch('SELECT 2')));
    expect(result.current.queries[KEY]).toEqual({ kind: WidgetQueryKind.Failed });

    vi.mocked(resolveInlineWidgetQuery).mockResolvedValueOnce(composite('SELECT 2'));
    await act(async () => result.current.onRetryQuery(result.current.widgets[0]));

    expect(result.current.queries[KEY]).toEqual(composite('SELECT 2'));
  });

  test('resolves a failed query again on Refresh', async () => {
    vi.mocked(resolveInlineWidgetQuery).mockRejectedValueOnce(new Error('network'));
    const { result } = renderDashboard();
    await act(async () => result.current.onUpdateWidget('w-1', sqlPatch('SELECT 2')));
    expect(result.current.queries[KEY]).toEqual({ kind: WidgetQueryKind.Failed });

    vi.mocked(resolveInlineWidgetQuery).mockResolvedValueOnce(composite('SELECT 2'));
    await act(async () => result.current.onRefresh());

    expect(result.current.queries[KEY]).toEqual(composite('SELECT 2'));
    expect(result.current.refreshToken).toBe(1);
  });

  test('recomputes a preset range from now on Refresh', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T00:00:00Z'));
    const { result } = renderDashboard(false);
    const before = result.current.timeFilter.timeRange.endDate.getTime();

    vi.setSystemTime(new Date('2026-11-01T01:00:00Z'));
    act(() => result.current.onRefresh());

    expect(result.current.timeFilter.timeRange.endDate.getTime()).toBeGreaterThan(before);
    vi.useRealTimers();
  });

  test('keeps the time range on Cancel when edit mode changed nothing, so no widget runs again', () => {
    const { result } = renderDashboard(false);
    const before = result.current.timeFilter.timeRange;

    act(() => result.current.onEdit());
    act(() => result.current.onDiscard());

    expect(result.current.isEditing).toBe(false);
    expect(result.current.timeFilter.timeRange).toBe(before);
  });

  test('puts the stored period back on Discard after the period was changed in edit mode', () => {
    const { result } = renderDashboard(false);

    act(() => result.current.onEdit());
    act(() => result.current.onTimePeriodChange('30d'));
    expect(result.current.timeFilter.timePeriod).toBe('30d');

    act(() => result.current.onDiscard());

    expect(result.current.timeFilter.timePeriod).toBe('7d');
  });
});
