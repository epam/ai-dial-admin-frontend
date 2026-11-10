import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColDef } from 'ag-grid-community';
import { describe, expect, test, vi } from 'vitest';

import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { ActionMenuOperationI18nKey, KeysI18nKey, RolesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { DialKeyResource } from '@/src/models/dial/resource';
import { DialRole } from '@/src/models/dial/role';
import KeyRoles from '../KeyRoles';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: vi.fn(() => false),
}));

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ rowData, columnDefs }: { rowData: DialRole[]; columnDefs: ColDef[] }) => {
    const actions = columnDefs.find((column) => column.field === ACTIONS_COLUMN_CEL_ID)?.cellRendererParams?.items as
      | ActionMenuOperationDeclaration<DialRole>[]
      | undefined;
    return (
      <div>
        {`grid:${rowData.length}`}
        {rowData.flatMap((role) =>
          (actions || []).map((action) => (
            <button key={`${role.name}-${action.id}`} onClick={() => action.onClick(role)}>
              {`${action.label} ${role.name}`}
            </button>
          )),
        )}
      </div>
    );
  },
}));

vi.mock('@/src/components/EntityView/AddEntitiesGrid', () => ({
  default: ({ isModalOpen, onApply }: { isModalOpen: boolean; onApply: (roles: DialRole[]) => void }) =>
    isModalOpen ? <button onClick={() => onApply([{ name: 'reader', description: '' }])}>ApplyRoles</button> : null,
}));

const roles: DialRole[] = [
  { name: 'admin', description: 'Administrator' },
  { name: 'reader', description: 'Reader' },
];

const baseAsset: DialKeyResource = {
  name: 'my-key',
  path: 'my-key',
  folderId: '',
} as unknown as DialKeyResource;

const renderKeyRoles = (asset: Partial<DialKeyResource> = {}, onChange = vi.fn()) =>
  render(<KeyRoles asset={{ ...baseAsset, ...asset }} roles={roles} onChange={onChange} />);

describe('KeyRoles', () => {
  beforeEach(() => {
    vi.mocked(useIsReadOnlyAdmin).mockReturnValue(false);
  });

  test('Shows the empty-state label when no bearer roles are assigned', () => {
    renderKeyRoles();

    expect(screen.getByText(KeysI18nKey.BearerRolesNotAvailable)).toBeInTheDocument();
  });

  test('Shows the grid when bearer roles are already assigned', () => {
    renderKeyRoles({ roles: ['admin'] });

    expect(screen.getByText('grid:1')).toBeInTheDocument();
  });

  test('Renders the Roles heading with the number of granted roles', () => {
    renderKeyRoles({ roles: ['admin'] });

    expect(screen.getByRole('heading', { name: `${TabsI18nKey.Roles}: 1` })).toBeInTheDocument();
  });

  test('Renders the Add Roles button for a write admin', () => {
    renderKeyRoles();

    expect(screen.getByRole('button', { name: RolesI18nKey.AddRoles })).toBeInTheDocument();
  });

  test('Calls onChange with added role names when Add Roles is confirmed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderKeyRoles({}, onChange);

    await user.click(screen.getByRole('button', { name: RolesI18nKey.AddRoles }));
    await user.click(screen.getByText('ApplyRoles'));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ roles: ['reader'] }));
  });

  test('opens a synthetic role by its encoded name without changing membership', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderKeyRoles({ roles: ['missing %?#'] }, onChange);

    await user.click(screen.getByRole('button', { name: `${ActionMenuOperationI18nKey.Open_in_new_tab} missing %?#` }));

    expect(open).toHaveBeenCalledWith('/platform-roles/missing%20%25%3F%23', '_blank');
    expect(onChange).not.toHaveBeenCalled();
    open.mockRestore();
  });

  test('removes the selected role without changing the other bearer roles', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderKeyRoles({ roles: ['admin', 'missing'] }, onChange);

    await user.click(screen.getByRole('button', { name: `${ActionMenuOperationI18nKey.Remove} admin` }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ roles: ['missing'] }));
  });

  test('lets a read-only admin open a role without offering removal', async () => {
    vi.mocked(useIsReadOnlyAdmin).mockReturnValue(true);
    const user = userEvent.setup();
    const onChange = vi.fn();
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderKeyRoles({ roles: ['admin'] }, onChange);

    await user.click(screen.getByRole('button', { name: `${ActionMenuOperationI18nKey.Open_in_new_tab} admin` }));

    expect(open).toHaveBeenCalledWith('/platform-roles/admin', '_blank');
    expect(
      screen.queryByRole('button', { name: `${ActionMenuOperationI18nKey.Remove} admin` }),
    ).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    open.mockRestore();
  });

  test('Does not render the Add Roles button for a read-only admin', () => {
    vi.mocked(useIsReadOnlyAdmin).mockReturnValue(true);

    renderKeyRoles();

    expect(screen.queryByRole('button', { name: RolesI18nKey.AddRoles })).not.toBeInTheDocument();
  });
});
