import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { RolesI18nKey } from '@/src/constants/i18n';
import { DialRole } from '@/src/models/dial/role';
import { ApplicationRoute } from '@/src/types/routes';
import AssetRoles from '../AssetRoles';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: vi.fn(() => false),
}));

let capturedRowData: unknown;
let capturedColumnDefs: { field?: string }[] | undefined;

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: (props: { rowData?: unknown; columnDefs?: { field?: string }[] }) => {
    capturedRowData = props.rowData;
    capturedColumnDefs = props.columnDefs;
    return <section aria-label="roles-grid" />;
  },
}));

const roles: DialRole[] = [
  { name: 'admin', description: 'Admin role' },
  { name: 'viewer', description: 'Viewer role' },
];

describe('AssetRoles', () => {
  test('renders the Add roles button', () => {
    render(
      <AssetRoles view={ApplicationRoute.AssetsModels} asset={{ userRoles: [] }} roles={roles} onChange={vi.fn()} />,
    );

    expect(screen.getByTitle(RolesI18nKey.AddRoles)).toBeInTheDocument();
  });

  test('shows the model-specific empty state when no role is assigned', () => {
    render(
      <AssetRoles view={ApplicationRoute.AssetsModels} asset={{ userRoles: [] }} roles={roles} onChange={vi.fn()} />,
    );

    expect(screen.getByText(RolesI18nKey.NotAvailableModel)).toBeInTheDocument();
  });

  test('shows the route-specific empty state on the Assets > Routes view', () => {
    render(
      <AssetRoles view={ApplicationRoute.AssetsRoutes} asset={{ userRoles: [] }} roles={roles} onChange={vi.fn()} />,
    );

    expect(screen.getByText(RolesI18nKey.NotAvailableRoute)).toBeInTheDocument();
  });

  test('renders a row for every assigned role, including one absent from the fetched list', () => {
    render(
      <AssetRoles
        view={ApplicationRoute.AssetsModels}
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
        view={ApplicationRoute.AssetsModels}
        asset={{ userRoles: ['admin'] }}
        roles={roles}
        onChange={vi.fn()}
      />,
    );

    expect(capturedColumnDefs?.some((col) => col.field === ACTIONS_COLUMN_CEL_ID)).toBe(true);
  });

  test('hides the Add roles button and the remove action column for a read-only admin', async () => {
    const { useIsReadOnlyAdmin } = await import('@/src/hooks/use-is-read-only-admin');
    vi.mocked(useIsReadOnlyAdmin).mockReturnValue(true);

    render(
      <AssetRoles
        view={ApplicationRoute.AssetsModels}
        asset={{ userRoles: ['admin'] }}
        roles={roles}
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryByTitle(RolesI18nKey.AddRoles)).not.toBeInTheDocument();
    expect(capturedColumnDefs?.some((col) => col.field === ACTIONS_COLUMN_CEL_ID)).toBe(false);
    vi.mocked(useIsReadOnlyAdmin).mockReturnValue(false);
  });
});
