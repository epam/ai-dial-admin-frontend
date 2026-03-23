import { describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ApplicationRoute } from '@/src/types/routes';
import { ButtonsI18nKey, TabsI18nKey, TelemetryI18nKey } from '@/src/constants/i18n';

import List from '@/src/components/UsageLog/List/List';
import { TRACES_QUERY } from '@/src/constants/telemetry';
import { USAGE_LOG_TRACES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';

describe('List', () => {
  const user = userEvent.setup();

  test('should render List component correctly', () => {
    const getData = vi.fn().mockReturnValue({
      success: true,
      response: { data: [['2025-08-11T00:10:05.654Z']], headers: ['completion_time'] },
    });

    render(
      <List
        route={ApplicationRoute.UsageLog}
        getData={getData}
        query={TRACES_QUERY}
        columnDefs={USAGE_LOG_TRACES_COLUMNS}
        title={TabsI18nKey.Traces}
        emptyDataTitle={TelemetryI18nKey.NoTracesTitle}
      />,
    );

    waitFor(() => {
      expect(screen.getByRole('heading', { name: TabsI18nKey.Traces })).toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();
      //expect(screen.getByRole('button', { name: ButtonsI18nKey.Export })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: ButtonsI18nKey.Columns })).toBeInTheDocument();
    });
  });

  test('should show ColumnPanel when Columns button is clicked', () => {
    const getData = vi.fn().mockReturnValue({
      success: true,
      response: { data: [['2025-08-11T00:10:05.654Z']], headers: ['completion_time'] },
    });

    render(
      <List
        route={ApplicationRoute.UsageLog}
        getData={getData}
        query={TRACES_QUERY}
        columnDefs={USAGE_LOG_TRACES_COLUMNS}
        listLabel={TabsI18nKey.Traces}
        emptyDataTitle={TelemetryI18nKey.NoTracesTitle}
      />,
    );

    waitFor(() => {
      user.click(screen.getByRole('button', { name: ButtonsI18nKey.Columns }));

      expect(screen.getByRole('toolbar', { name: ButtonsI18nKey.Columns })).toBeInTheDocument();
    });
  });
});
