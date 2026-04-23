import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import UsageLog from './UsageLog';

const purgeInfiniteCache = vi.fn();

vi.mock('@/src/app/[lang]/dashboard/actions', () => ({
  getDashboardData: vi.fn(() => Promise.resolve({ success: true, response: { headers: [], data: [] } })),
}));

// Stand-in for the real List — fires onGridReady synchronously so UsageLog's
// gridApiRef is populated and Refresh's purgeInfiniteCache call is observable
// (jsdom does not actually run ag-Grid).
vi.mock('@/src/components/UsageLog/List/List', () => ({
  default: (props: { listLabel?: string; onGridReady?: (event: { api: unknown }) => void }) => {
    useEffect(() => {
      props.onGridReady?.({ api: { purgeInfiniteCache } });
    }, [props]);
    return props.listLabel ? <h1>{props.listLabel}</h1> : null;
  },
}));

describe('UsageLog', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    purgeInfiniteCache.mockClear();
  });

  test('renders the Refresh button', () => {
    render(<UsageLog route={ApplicationRoute.UsageLog} />);
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Refresh })).toBeInTheDocument();
  });

  test('clicking Refresh purges the infinite cache', async () => {
    render(<UsageLog route={ApplicationRoute.UsageLog} />);
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Refresh }));
    expect(purgeInfiniteCache).toHaveBeenCalled();
  });

  test('renders UsageLog with a predefined entity', async () => {
    render(<UsageLog route={ApplicationRoute.Models} entityView={EntityViewTab.Traces} />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: TabsI18nKey.Traces })).toBeInTheDocument();
      expect(screen.queryByRole('tab')).toBeFalsy();
    });
  });

  test('renders TimeFilter component', async () => {
    render(<UsageLog route={ApplicationRoute.UsageLog} />);

    const menu = screen.getByText(/Last 2d/i);
    expect(menu).toBeInTheDocument();
    await user.click(menu);

    const menuItem = screen.getByText(/Last 1h/i);
    expect(menuItem).toBeInTheDocument();
    await user.click(menuItem);

    expect(screen.getByText(/Last 1h/i)).toBeInTheDocument();
  });
});
