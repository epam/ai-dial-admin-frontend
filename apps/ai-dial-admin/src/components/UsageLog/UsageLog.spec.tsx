import { getByRole, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import userEvent from '@testing-library/user-event';

import { ButtonsI18nKey, TelemetryI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { getDashboardData } from '@/src/app/[lang]/dashboard/actions';
import UsageLog from './UsageLog';
import { EntityViewTab } from '@/src/components/EntityView/View/utils';

vi.mock('@/src/app/[lang]/dashboard/actions', () => ({
  getDashboardData: vi.fn(() => Promise.resolve({ data: null })),
}));

describe('UsageLog', () => {
  const user = userEvent.setup();

  test('renders UsageLog title and data', async () => {
    render(<UsageLog route={ApplicationRoute.UsageLog} />);

    const refreshButton = screen.getByRole('button', { name: ButtonsI18nKey.Refresh });
    expect(refreshButton).toBeInTheDocument();

    await user.click(refreshButton);

    expect(vi.mocked(getDashboardData)).toHaveBeenCalled();
  });

  test('renders UsageLog with perdefined entity', async () => {
    render(<UsageLog route={ApplicationRoute.Models} entityView={EntityViewTab.Traces} />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: TelemetryI18nKey.TracesTitle })).toBeInTheDocument();
      expect(screen.queryByRole('tab')).toBeFalsy();
    });
  });

  test('renders TimeFilter component', async () => {
    render(<UsageLog route={ApplicationRoute.UsageLog} />);

    const menu = screen.getByRole('menuitem', { name: /Last 2d/i });

    expect(menu).toBeInTheDocument();

    await user.click(menu);

    const menuItem = screen.getByRole('menuitem', { name: /Last 1h/i });

    expect(menuItem).toBeInTheDocument();

    await user.click(menuItem);

    expect(screen.getByRole('menuitem', { name: /Last 1h/i })).toBeInTheDocument();
  });
});
