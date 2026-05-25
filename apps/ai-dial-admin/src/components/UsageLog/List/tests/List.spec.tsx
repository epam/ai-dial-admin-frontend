import { describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { ApplicationRoute } from '@/src/types/routes';
import { TabsI18nKey, TelemetryI18nKey } from '@/src/constants/i18n';

import List from '@/src/components/UsageLog/List/List';
import { TRACES_QUERY } from '@/src/constants/telemetry';
import { USAGE_LOG_TRACES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';

const showNotificationSpy = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification: showNotificationSpy }),
}));

describe('List', () => {
  const timeRange = {
    startDate: new Date('2026-04-01T00:00:00.000Z'),
    endDate: new Date('2026-04-02T00:00:00.000Z'),
  };

  test('renders the list with the provided column config and label', () => {
    const getData = vi.fn().mockResolvedValue({
      success: true,
      response: { data: [], headers: ['completion_time'] },
    });

    render(
      <List
        route={ApplicationRoute.UsageLog}
        getData={getData}
        query={TRACES_QUERY}
        columnDefs={USAGE_LOG_TRACES_COLUMNS}
        listLabel={TabsI18nKey.Traces}
        emptyDataTitle={TelemetryI18nKey.NoTracesTitle}
        timeRange={timeRange}
        entityName={null}
      />,
    );

    expect(screen.getByRole('heading', { name: TabsI18nKey.Traces })).toBeInTheDocument();
  });

  test('accepts an onGridReady prop without errors', () => {
    const getData = vi.fn().mockResolvedValue({ success: true, response: { data: [], headers: [] } });
    const onGridReady = vi.fn();

    expect(() =>
      render(
        <List
          route={ApplicationRoute.UsageLog}
          getData={getData}
          query={TRACES_QUERY}
          columnDefs={USAGE_LOG_TRACES_COLUMNS}
          listLabel={TabsI18nKey.Traces}
          emptyDataTitle={TelemetryI18nKey.NoTracesTitle}
          timeRange={timeRange}
          entityName={null}
          onGridReady={onGridReady}
        />,
      ),
    ).not.toThrow();
  });

  test('initial fetch sends no limit, no offset, and the user time range in where.$and', async () => {
    const getData = vi.fn().mockResolvedValue({
      success: true,
      response: { data: [], headers: ['completion_time', 'model'] },
    });

    render(
      <List
        route={ApplicationRoute.UsageLog}
        getData={getData}
        query={TRACES_QUERY}
        columnDefs={USAGE_LOG_TRACES_COLUMNS}
        listLabel={TabsI18nKey.Traces}
        emptyDataTitle={TelemetryI18nKey.NoTracesTitle}
        timeRange={timeRange}
        entityName={null}
      />,
    );

    await waitFor(() => expect(getData).toHaveBeenCalledTimes(1));
    const firstCall = getData.mock.calls[0][0];
    expect(firstCall.query.limit).toBeUndefined();
    expect(firstCall.query.offset).toBeUndefined();
    expect(firstCall.query.where?.$and).toEqual(
      expect.arrayContaining([
        { $gte: { left: '_time', right: "'2026-04-01T00:00:00.000Z'" } },
        { $lt: { left: '_time', right: "'2026-04-02T00:00:00.000Z'" } },
      ]),
    );
  });

  test('does not fire a second fetch when initial response is empty (end-of-data)', async () => {
    const getData = vi.fn().mockResolvedValue({
      success: true,
      response: { data: [], headers: ['completion_time'] },
    });

    render(
      <List
        route={ApplicationRoute.UsageLog}
        getData={getData}
        query={TRACES_QUERY}
        columnDefs={USAGE_LOG_TRACES_COLUMNS}
        listLabel={TabsI18nKey.Traces}
        emptyDataTitle={TelemetryI18nKey.NoTracesTitle}
        timeRange={timeRange}
        entityName={null}
      />,
    );

    await waitFor(() => expect(getData).toHaveBeenCalledTimes(1));
    await new Promise((r) => setTimeout(r, 50));
    expect(getData).toHaveBeenCalledTimes(1);
  });

  test('re-fetches from offset=0 when timeRange changes', async () => {
    const getData = vi.fn().mockResolvedValue({
      success: true,
      response: { data: [], headers: ['completion_time'] },
    });

    const { rerender } = render(
      <List
        route={ApplicationRoute.UsageLog}
        getData={getData}
        query={TRACES_QUERY}
        columnDefs={USAGE_LOG_TRACES_COLUMNS}
        listLabel={TabsI18nKey.Traces}
        emptyDataTitle={TelemetryI18nKey.NoTracesTitle}
        timeRange={timeRange}
        entityName={null}
      />,
    );

    await waitFor(() => expect(getData).toHaveBeenCalledTimes(1));

    const newTimeRange = {
      startDate: new Date('2026-04-02T00:00:00.000Z'),
      endDate: new Date('2026-04-03T00:00:00.000Z'),
    };

    rerender(
      <List
        route={ApplicationRoute.UsageLog}
        getData={getData}
        query={TRACES_QUERY}
        columnDefs={USAGE_LOG_TRACES_COLUMNS}
        listLabel={TabsI18nKey.Traces}
        emptyDataTitle={TelemetryI18nKey.NoTracesTitle}
        timeRange={newTimeRange}
        entityName={null}
      />,
    );

    await waitFor(() => expect(getData).toHaveBeenCalledTimes(2));
    const secondCall = getData.mock.calls[1][0];
    expect(secondCall.query.offset).toBeUndefined();
    expect(secondCall.query.where?.$and).toEqual(
      expect.arrayContaining([
        { $gte: { left: '_time', right: "'2026-04-02T00:00:00.000Z'" } },
        { $lt: { left: '_time', right: "'2026-04-03T00:00:00.000Z'" } },
      ]),
    );
  });

  test('auto-fetches the next day when a day returns empty (multi-day range, newest first)', async () => {
    const getData = vi.fn().mockResolvedValue({
      success: true,
      response: { data: [], headers: ['completion_time'] },
    });

    const multiDayRange = {
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      endDate: new Date('2026-04-04T00:00:00.000Z'),
    };

    render(
      <List
        route={ApplicationRoute.UsageLog}
        getData={getData}
        query={TRACES_QUERY}
        columnDefs={USAGE_LOG_TRACES_COLUMNS}
        listLabel={TabsI18nKey.Traces}
        emptyDataTitle={TelemetryI18nKey.NoTracesTitle}
        timeRange={multiDayRange}
        entityName={null}
      />,
    );

    await waitFor(() => expect(getData).toHaveBeenCalledTimes(3));

    const firstCall = getData.mock.calls[0][0];
    expect(firstCall.query.where?.$and).toEqual(
      expect.arrayContaining([
        { $gte: { left: '_time', right: "'2026-04-03T00:00:00.000Z'" } },
        { $lt: { left: '_time', right: "'2026-04-04T00:00:00.000Z'" } },
      ]),
    );

    const lastCall = getData.mock.calls[2][0];
    expect(lastCall.query.where?.$and).toEqual(
      expect.arrayContaining([
        { $gte: { left: '_time', right: "'2026-04-01T00:00:00.000Z'" } },
        { $lt: { left: '_time', right: "'2026-04-02T00:00:00.000Z'" } },
      ]),
    );

    await new Promise((r) => setTimeout(r, 50));
    expect(getData).toHaveBeenCalledTimes(3);
  });

  test('stops auto-fetching once a day returns enough rows to enable scrolling', async () => {
    const headers = ['completion_time'];
    const enoughRows = Array.from({ length: 150 }, (_, i) => [`2026-04-03T00:00:0${i % 10}.000Z`]);
    const getData = vi
      .fn()
      .mockResolvedValueOnce({ success: true, response: { data: enoughRows, headers } })
      .mockResolvedValue({ success: true, response: { data: [], headers } });

    const multiDayRange = {
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      endDate: new Date('2026-04-04T00:00:00.000Z'),
    };

    render(
      <List
        route={ApplicationRoute.UsageLog}
        getData={getData}
        query={TRACES_QUERY}
        columnDefs={USAGE_LOG_TRACES_COLUMNS}
        listLabel={TabsI18nKey.Traces}
        emptyDataTitle={TelemetryI18nKey.NoTracesTitle}
        timeRange={multiDayRange}
        entityName={null}
      />,
    );

    await waitFor(() => expect(getData).toHaveBeenCalledTimes(1));
    await new Promise((r) => setTimeout(r, 50));
    expect(getData).toHaveBeenCalledTimes(1);
  });

  test('initial fetch sends orderBy [{ $desc: "_time" }]', async () => {
    const getData = vi.fn().mockResolvedValue({
      success: true,
      response: { data: [], headers: ['completion_time'] },
    });

    render(
      <List
        route={ApplicationRoute.UsageLog}
        getData={getData}
        query={TRACES_QUERY}
        columnDefs={USAGE_LOG_TRACES_COLUMNS}
        listLabel={TabsI18nKey.Traces}
        emptyDataTitle={TelemetryI18nKey.NoTracesTitle}
        timeRange={timeRange}
        entityName={null}
      />,
    );

    await waitFor(() => expect(getData).toHaveBeenCalledTimes(1));
    const firstCall = getData.mock.calls[0][0];
    expect(firstCall.query.orderBy).toEqual([{ $desc: '_time' }]);
  });

  test('error response shows a notification and does not append rows', async () => {
    showNotificationSpy.mockClear();

    const goodResponse = {
      success: true as const,
      response: {
        data: [['2026-04-02T12:00:00.000Z'], ['2026-04-02T13:00:00.000Z']],
        headers: ['completion_time'],
      },
    };
    const errorResponse = {
      success: false as const,
      errorHeader: 'Backend exploded',
      errorMessage: 'something failed',
      requestId: 'req-123',
    };
    const getData = vi
      .fn()
      .mockResolvedValueOnce(goodResponse)
      .mockResolvedValue(errorResponse);

    render(
      <List
        route={ApplicationRoute.UsageLog}
        getData={getData}
        query={TRACES_QUERY}
        columnDefs={USAGE_LOG_TRACES_COLUMNS}
        listLabel={TabsI18nKey.Traces}
        emptyDataTitle={TelemetryI18nKey.NoTracesTitle}
        timeRange={{
          startDate: new Date('2026-04-01T00:00:00.000Z'),
          endDate: new Date('2026-04-03T00:00:00.000Z'),
        }}
        entityName={null}
      />,
    );

    // Auto-fetch: first window succeeds (2 rows, < MIN_ROWS_TO_ENABLE_SCROLL),
    // second window errors. Only one error notification should fire — the auto-fetch
    // chain stops once we hit the error.
    await waitFor(() => expect(getData).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(showNotificationSpy).toHaveBeenCalledTimes(1));

    const notification = showNotificationSpy.mock.calls[0][0];
    expect(notification.title).toBe('Backend exploded');
    expect(notification.description).toBe('something failed');
    expect(notification.requestId).toBe('req-123');
  });

});
