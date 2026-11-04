import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import DashboardSwitcher from '@/src/components/Analytics/CustomDashboards/Switcher/DashboardSwitcher';
import { ButtonsI18nKey, CustomDashboardsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { createDashboard } from '@/src/app/[lang]/dashboards/custom-actions';
import { DashboardCreatePermissions, DashboardListItem, DashboardVisibility } from '@/src/models/analytics/dashboard';
import { ApplicationRoute } from '@/src/types/routes';
import { getDashboardHref } from '@/src/utils/analytics/dashboard-request';

vi.mock('@/src/app/[lang]/dashboards/custom-actions', () => ({ createDashboard: vi.fn() }));

const ALL_CREATE: DashboardCreatePermissions = { create_private: true, create_public: true };

const push = vi.fn();

const DASHBOARDS: DashboardListItem[] = [
  {
    id: 'd-1',
    name: 'Costs',
    visibility: DashboardVisibility.Private,
    updated_at: '2026-10-01T00:00:00Z',
    permissions: { write: true, publish: true },
  },
  {
    id: 'd-2',
    name: 'Latency',
    visibility: DashboardVisibility.Private,
    updated_at: '2026-10-02T00:00:00Z',
    permissions: { write: true, publish: true },
  },
];

describe('DashboardSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  });

  const renderSwitcher = (props?: {
    dashboards?: DashboardListItem[];
    currentId?: string;
    createPermissions?: DashboardCreatePermissions;
  }) => render(<DashboardSwitcher dashboards={DASHBOARDS} createPermissions={ALL_CREATE} {...props} />);

  const openCreateModal = async (createPermissions: DashboardCreatePermissions) => {
    renderSwitcher({ createPermissions });
    const user = await openSwitcher();
    await user.click(await screen.findByRole('button', { name: CustomDashboardsI18nKey.CreateDashboard }));
    expect(await screen.findByRole('button', { name: ButtonsI18nKey.Create })).toBeTruthy();
    return user;
  };

  const openSwitcher = async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('combobox', { name: CustomDashboardsI18nKey.Switcher }));
    return user;
  };

  test('lists the usage dashboard followed by every custom dashboard', async () => {
    renderSwitcher();
    await openSwitcher();

    expect(await screen.findByRole('option', { name: 'Costs' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Latency' })).toBeTruthy();
    expect(screen.getByRole('option', { name: CustomDashboardsI18nKey.UsageDashboard })).toBeTruthy();
  });

  test('offers Create dashboard when no custom dashboard exists', async () => {
    renderSwitcher({ dashboards: [] });
    await openSwitcher();

    expect(await screen.findByRole('button', { name: CustomDashboardsI18nKey.CreateDashboard })).toBeTruthy();
    expect(screen.getByRole('option', { name: CustomDashboardsI18nKey.UsageDashboard })).toBeTruthy();
  });

  test('navigates to the picked custom dashboard', async () => {
    renderSwitcher();
    const user = await openSwitcher();

    await user.click(await screen.findByRole('option', { name: 'Latency' }));

    expect(push).toHaveBeenCalledWith(getDashboardHref('d-2'));
  });

  test('navigates to the usage dashboard when it is picked from a custom one', async () => {
    renderSwitcher({ currentId: 'd-1' });
    const user = await openSwitcher();

    await user.click(await screen.findByRole('option', { name: CustomDashboardsI18nKey.UsageDashboard }));

    expect(push).toHaveBeenCalledWith(ApplicationRoute.Dashboard);
  });

  test('separates the dashboards from Create dashboard', async () => {
    renderSwitcher();
    await openSwitcher();

    expect(await screen.findByRole('button', { name: CustomDashboardsI18nKey.CreateDashboard })).toBeTruthy();
    expect(screen.getByRole('separator')).toBeTruthy();
  });

  test('opens the create modal from the footer without navigating', async () => {
    renderSwitcher();
    const user = await openSwitcher();

    await user.click(await screen.findByRole('button', { name: CustomDashboardsI18nKey.CreateDashboard }));

    expect(await screen.findByRole('button', { name: ButtonsI18nKey.Create })).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
  });

  test('offers the visibility on create to a caller the service lets create a public dashboard', async () => {
    await openCreateModal(ALL_CREATE);

    expect(screen.getByRole('combobox', { name: new RegExp(CustomDashboardsI18nKey.Visibility) })).toBeTruthy();
  });

  test('offers no visibility on create to a caller who may create only private dashboards', async () => {
    await openCreateModal({ create_private: true, create_public: false });

    expect(screen.queryByRole('combobox', { name: new RegExp(CustomDashboardsI18nKey.Visibility) })).toBeNull();
  });

  test('creates a public dashboard for a caller who may create only public dashboards', async () => {
    vi.mocked(createDashboard).mockResolvedValue({ success: false });
    const user = await openCreateModal({ create_private: false, create_public: true });

    expect(screen.queryByRole('combobox', { name: new RegExp(CustomDashboardsI18nKey.Visibility) })).toBeNull();
    fireEvent.change(screen.getByRole('textbox', { name: new RegExp(EntityFieldsI18nKey.name) }), {
      target: { value: 'Ops' },
    });
    const create = screen.getByRole('button', { name: ButtonsI18nKey.Create });
    await waitFor(() => expect(create).toBeEnabled());
    await user.click(create);

    await vi.waitFor(() =>
      expect(createDashboard).toHaveBeenCalledWith(expect.objectContaining({ visibility: DashboardVisibility.Public })),
    );
  });

  test('offers no Create dashboard to a caller the service lets create none', async () => {
    renderSwitcher({ createPermissions: { create_private: false, create_public: false } });
    await openSwitcher();

    expect(await screen.findByRole('option', { name: 'Costs' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: CustomDashboardsI18nKey.CreateDashboard })).toBeNull();
  });
});
