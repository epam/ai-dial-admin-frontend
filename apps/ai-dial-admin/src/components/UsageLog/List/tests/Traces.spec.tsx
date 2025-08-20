import { describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ApplicationRoute } from '@/src/types/routes';
import { ButtonsI18nKey, TelemetryI18nKey } from '@/src/constants/i18n';

import Traces from '@/src/components/UsageLog/List/Traces';

describe('Traces', () => {
  const user = userEvent.setup();

  test('should render Traces component correctly', async () => {
    const getData = vi.fn().mockReturnValue({
      success: true,
      response: { data: [['2025-08-11T00:10:05.654Z']], headers: ['completion_time'] },
    });

    render(<Traces route={ApplicationRoute.UsageLog} getData={getData} />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: TelemetryI18nKey.TracesTitle })).toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: ButtonsI18nKey.Export })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: ButtonsI18nKey.Columns })).toBeInTheDocument();
    });
  });

  test('show ColumnPanel when Columns button is clicked', async () => {
    const getData = vi.fn().mockReturnValue({
      success: true,
      response: { data: [['2025-08-11T00:10:05.654Z']], headers: ['completion_time'] },
    });

    render(<Traces route={ApplicationRoute.UsageLog} getData={getData} />);

    await waitFor(() => {
      user.click(screen.getByRole('button', { name: ButtonsI18nKey.Columns }));

      expect(screen.getByRole('toolbar', { name: ButtonsI18nKey.Columns })).toBeInTheDocument();
    });
  });
});
