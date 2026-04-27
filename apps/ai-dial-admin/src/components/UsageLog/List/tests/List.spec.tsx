import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ApplicationRoute } from '@/src/types/routes';
import { TabsI18nKey, TelemetryI18nKey } from '@/src/constants/i18n';

import List from '@/src/components/UsageLog/List/List';
import { TRACES_QUERY } from '@/src/constants/telemetry';
import { USAGE_LOG_TRACES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';

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
});
