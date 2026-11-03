import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import {
  createDashboard,
  getDashboard,
  listDashboards,
  replaceDashboard,
} from '@/src/app/[lang]/dashboards/custom-actions';
import AddToDashboardModal from '@/src/components/Analytics/CustomDashboards/AddToDashboard/AddToDashboardModal';
import { ButtonsI18nKey, CustomDashboardsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { Dashboard, DashboardVisibility } from '@/src/models/analytics/dashboard';
import { QueryResultView } from '@/src/models/analytics/query-builder';
import { SavedQuery, SavedQueryScope } from '@/src/models/analytics/saved-query';

vi.mock('@/src/app/[lang]/dashboards/custom-actions', () => ({
  createDashboard: vi.fn(),
  getDashboard: vi.fn(),
  listDashboards: vi.fn(),
  replaceDashboard: vi.fn(),
}));

const SAVED_QUERY = { id: 'q-1', name: 'Spend by model' } as SavedQuery;

const DASHBOARD: Dashboard = {
  id: 'd-1',
  name: 'Costs',
  visibility: DashboardVisibility.Private,
  widgets: [{ id: 'w-1', saved_query_id: 'q-9', row_limit: 50, layout: { x: 0, y: 0, w: 12, h: 4 } }],
  generation: 3,
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
  permissions: { write: true, publish: true },
};

const ADDED_WIDGET = {
  id: expect.any(String),
  saved_query_id: 'q-1',
  title: undefined,
  row_limit: 100,
  layout: { x: 0, y: 4, w: 6, h: 4 },
};

const listOf = (canWriteShared: boolean, canCreatePrivate = true) => ({
  success: true,
  response: {
    dashboards: [
      {
        id: 'd-1',
        name: 'Costs',
        visibility: DashboardVisibility.Private,
        updated_at: DASHBOARD.updated_at,
        permissions: { write: true, publish: true },
      },
      {
        id: 'd-2',
        name: 'Latency',
        visibility: DashboardVisibility.Private,
        updated_at: DASHBOARD.updated_at,
        permissions: { write: true, publish: true },
      },
      {
        id: 'd-4',
        name: 'Shared',
        visibility: DashboardVisibility.Public,
        updated_at: DASHBOARD.updated_at,
        permissions: { write: canWriteShared, publish: canWriteShared },
      },
    ],
    permissions: { create_private: canCreatePrivate, create_public: true },
  },
});

describe('AddToDashboardModal', () => {
  const onClose = vi.fn();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listDashboards).mockResolvedValue(listOf(true));
    vi.mocked(getDashboard).mockResolvedValue({ success: true, response: DASHBOARD });
    vi.mocked(replaceDashboard).mockResolvedValue({ success: true, response: DASHBOARD });
  });

  const renderModal = () => render(<AddToDashboardModal savedQuery={SAVED_QUERY} onClose={onClose} />);

  const openPicker = async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('combobox', { name: new RegExp(CustomDashboardsI18nKey.Switcher) }));
    return user;
  };

  test('lists custom dashboards and Create dashboard, without the usage dashboard', async () => {
    renderModal();
    await openPicker();

    expect(await screen.findByRole('option', { name: 'Costs' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Latency' })).toBeTruthy();
    expect(screen.getByRole('button', { name: CustomDashboardsI18nKey.CreateDashboard })).toBeTruthy();
    expect(screen.queryByRole('option', { name: CustomDashboardsI18nKey.UsageDashboard })).toBeNull();
  });

  test('leaves out of the picker a dashboard the caller may not write', async () => {
    vi.mocked(listDashboards).mockResolvedValue(listOf(false));
    renderModal();
    await openPicker();

    expect(await screen.findByRole('option', { name: 'Costs' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: 'Shared' })).toBeNull();
  });

  test('offers no Create dashboard to a caller the service lets create no private dashboard', async () => {
    vi.mocked(listDashboards).mockResolvedValue(listOf(true, false));
    renderModal();
    await openPicker();

    expect(await screen.findByRole('option', { name: 'Costs' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: CustomDashboardsI18nKey.CreateDashboard })).toBeNull();
  });

  test('adds a personal query to a public dashboard as an inline copy', async () => {
    const shared: Dashboard = { ...DASHBOARD, id: 'd-4', name: 'Shared', visibility: DashboardVisibility.Public };
    vi.mocked(getDashboard).mockResolvedValue({ success: true, response: shared });
    render(
      <AddToDashboardModal
        savedQuery={{ ...SAVED_QUERY, scope: SavedQueryScope.Personal, sql: 'SELECT 1' }}
        onClose={onClose}
      />,
    );
    const user = await openPicker();

    await user.click(await screen.findByRole('option', { name: 'Shared' }));
    expect(await screen.findByText(CustomDashboardsI18nKey.PersonalQueryCopied)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Add }));

    await act(async () => {});

    expect(onClose).toHaveBeenCalledOnce();
    expect(replaceDashboard).toHaveBeenCalledWith(
      'd-4',
      expect.objectContaining({
        visibility: DashboardVisibility.Public,
        widgets: [
          DASHBOARD.widgets[0],
          {
            id: expect.any(String),
            title: 'Spend by model',
            row_limit: 100,
            inline_query: { name: 'Spend by model', sql: 'SELECT 1', result_view: QueryResultView.Table },
            layout: { x: 0, y: 4, w: 6, h: 4 },
          },
        ],
      }),
      3,
    );
  });

  test('does not warn about a copy when a personal query goes to a private dashboard', async () => {
    render(<AddToDashboardModal savedQuery={{ ...SAVED_QUERY, scope: SavedQueryScope.Personal }} onClose={onClose} />);
    const user = await openPicker();

    await user.click(await screen.findByRole('option', { name: 'Costs' }));

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Add })).toBeEnabled();
    expect(screen.queryByText(CustomDashboardsI18nKey.PersonalQueryCopied)).toBeNull();
  });

  test('keeps Add unavailable until a dashboard is picked', async () => {
    renderModal();

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Add })).toBeDisabled();

    const user = await openPicker();
    await user.click(await screen.findByRole('option', { name: 'Costs' }));

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Add })).toBeEnabled();
  });

  test('appends a Medium widget with a row limit of 100 below the lowest one, in one replace', async () => {
    renderModal();
    const user = await openPicker();

    await user.click(await screen.findByRole('option', { name: 'Costs' }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Add }));

    await act(async () => {});

    expect(onClose).toHaveBeenCalledOnce();
    expect(getDashboard).toHaveBeenCalledWith('d-1');
    expect(replaceDashboard).toHaveBeenCalledOnce();
    expect(replaceDashboard).toHaveBeenCalledWith(
      'd-1',
      expect.objectContaining({ name: 'Costs', widgets: [DASHBOARD.widgets[0], ADDED_WIDGET] }),
      3,
    );
    expect(useNotification().showNotification).toHaveBeenCalledOnce();
  });

  test('stays open, usable and reports an error when the replace is rejected', async () => {
    vi.mocked(replaceDashboard).mockRejectedValue(new Error('network'));
    renderModal();
    const user = await openPicker();

    await user.click(await screen.findByRole('option', { name: 'Costs' }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Add }));

    await act(async () => {});

    expect(useNotification().showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: ErrorI18nKey.Error }),
    );
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Add })).toBeEnabled();
    expect(onClose).not.toHaveBeenCalled();
  });

  test('stays open and reports the error when the replace fails', async () => {
    vi.mocked(replaceDashboard).mockResolvedValue({ success: false, errorMessage: 'stale' });
    renderModal();
    const user = await openPicker();

    await user.click(await screen.findByRole('option', { name: 'Costs' }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Add }));

    await act(async () => {});

    expect(useNotification().showNotification).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Add })).toBeEnabled();
    expect(onClose).not.toHaveBeenCalled();
  });

  test('switches the picker to a name field on Create dashboard and creates it with the widget', async () => {
    vi.mocked(createDashboard).mockResolvedValue({ success: true, response: { ...DASHBOARD, id: 'd-3' } });
    renderModal();
    const user = await openPicker();

    await user.click(await screen.findByRole('button', { name: CustomDashboardsI18nKey.CreateDashboard }));
    const nameField = await screen.findByRole('textbox', {
      name: new RegExp(CustomDashboardsI18nKey.NewDashboardName),
    });

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Add })).toBeDisabled();

    // Per-keystroke typing drops characters in the kit field under jsdom, so the value is set in one change.
    fireEvent.change(nameField, { target: { value: ' Fresh ' } });
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Add }));

    await act(async () => {});

    expect(onClose).toHaveBeenCalledOnce();
    expect(replaceDashboard).not.toHaveBeenCalled();
    expect(createDashboard).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Fresh', widgets: [{ ...ADDED_WIDGET, layout: { x: 0, y: 0, w: 6, h: 4 } }] }),
    );
  });
});
