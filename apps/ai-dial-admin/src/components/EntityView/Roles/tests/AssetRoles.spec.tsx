import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { EntitiesI18nKey, RolesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { DialRole } from '@/src/models/dial/role';
import { ApplicationRoute } from '@/src/types/routes';
import AssetRoles from '../AssetRoles';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: vi.fn(() => false),
}));

let capturedRowData: unknown;
let capturedColumnDefs: { field?: string }[] | undefined;
let capturedEmptyDataProps: { title?: string } | undefined;
let capturedIsEmptyData: boolean | undefined;

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: (props: {
    rowData?: unknown;
    columnDefs?: { field?: string }[];
    emptyDataProps?: { title?: string };
    getIsEmptyData?: () => boolean;
  }) => {
    capturedRowData = props.rowData;
    capturedColumnDefs = props.columnDefs;
    capturedEmptyDataProps = props.emptyDataProps;
    capturedIsEmptyData = props.getIsEmptyData?.();
    return <section aria-label="roles-grid" />;
  },
}));

const roles: DialRole[] = [
  { name: 'admin', description: 'Admin role' },
  { name: 'viewer', description: 'Viewer role' },
];

describe('AssetRoles', () => {
  test('shows a header with a live count of granted roles', () => {
    render(
      <AssetRoles
        view={ApplicationRoute.PlatformModels}
        asset={{ userRoles: ['admin', 'viewer'] }}
        roles={roles}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText(`${TabsI18nKey.Roles}: 2`)).toBeInTheDocument();
  });

  test('renders the Add roles button as a primary button when available to specific roles', () => {
    render(
      <AssetRoles view={ApplicationRoute.PlatformModels} asset={{ userRoles: [] }} roles={roles} onChange={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: RolesI18nKey.AddRoles })).toBeInTheDocument();
  });

  test('hides the Add roles button when available to all users', () => {
    render(
      <AssetRoles
        view={ApplicationRoute.PlatformModels}
        asset={{ userRoles: undefined }}
        roles={roles}
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: RolesI18nKey.AddRoles })).not.toBeInTheDocument();
  });

  test('turns the "available to specific roles" toggle on, setting userRoles to an empty array', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AssetRoles
        view={ApplicationRoute.PlatformModels}
        asset={{ userRoles: undefined }}
        roles={roles}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('checkbox', { hidden: true }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith({ userRoles: [] });
  });

  test('turns the "available to specific roles" toggle off, clearing userRoles to undefined', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AssetRoles
        view={ApplicationRoute.PlatformModels}
        asset={{ userRoles: ['admin'] }}
        roles={roles}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('checkbox', { hidden: true }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith({ userRoles: undefined });
  });

  test('shows "No Roles" as the empty state when no role is assigned', () => {
    render(
      <AssetRoles view={ApplicationRoute.PlatformModels} asset={{ userRoles: [] }} roles={roles} onChange={vi.fn()} />,
    );

    expect(capturedIsEmptyData).toBe(true);
    expect(capturedEmptyDataProps?.title).toBe(EntitiesI18nKey.NoRoles);
  });

  test('shows the model-specific "not available" notification when userRoles is an empty array', () => {
    render(
      <AssetRoles view={ApplicationRoute.PlatformModels} asset={{ userRoles: [] }} roles={roles} onChange={vi.fn()} />,
    );

    expect(screen.getByText(RolesI18nKey.NotAvailableModel)).toBeInTheDocument();
  });

  test('shows the route-specific "not available" notification on the Assets > Routes view', () => {
    render(
      <AssetRoles view={ApplicationRoute.PlatformRoutes} asset={{ userRoles: [] }} roles={roles} onChange={vi.fn()} />,
    );

    expect(screen.getByText(RolesI18nKey.NotAvailableRoute)).toBeInTheDocument();
  });

  test('hides the "not available" notification when userRoles is undefined', () => {
    render(
      <AssetRoles
        view={ApplicationRoute.PlatformModels}
        asset={{ userRoles: undefined }}
        roles={roles}
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryByText(RolesI18nKey.NotAvailableModel)).not.toBeInTheDocument();
  });

  test('hides the "not available" notification when userRoles is populated', () => {
    render(
      <AssetRoles
        view={ApplicationRoute.PlatformModels}
        asset={{ userRoles: ['admin'] }}
        roles={roles}
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryByText(RolesI18nKey.NotAvailableModel)).not.toBeInTheDocument();
  });

  test('renders a row for every assigned role, including one absent from the fetched list', () => {
    render(
      <AssetRoles
        view={ApplicationRoute.PlatformModels}
        asset={{ userRoles: ['admin', 'not-in-list'] }}
        roles={roles}
        onChange={vi.fn()}
      />,
    );

    expect(capturedRowData).toEqual([
      { name: 'admin', description: 'Admin role' },
      { name: 'not-in-list', description: '' },
    ]);
  });

  test('includes a remove action column when not read-only', () => {
    render(
      <AssetRoles
        view={ApplicationRoute.PlatformModels}
        asset={{ userRoles: ['admin'] }}
        roles={roles}
        onChange={vi.fn()}
      />,
    );

    expect(capturedColumnDefs?.some((col) => col.field === ACTIONS_COLUMN_CEL_ID)).toBe(true);
  });

  test('a read-only admin sees granted roles without the toggle, Add button, or remove action column', async () => {
    const { useIsReadOnlyAdmin } = await import('@/src/hooks/use-is-read-only-admin');
    vi.mocked(useIsReadOnlyAdmin).mockReturnValue(true);

    render(
      <AssetRoles
        view={ApplicationRoute.PlatformModels}
        asset={{ userRoles: ['admin'] }}
        roles={roles}
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: RolesI18nKey.AddRoles })).not.toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    expect(capturedColumnDefs?.some((col) => col.field === ACTIONS_COLUMN_CEL_ID)).toBe(false);
    vi.mocked(useIsReadOnlyAdmin).mockReturnValue(false);
  });
});
