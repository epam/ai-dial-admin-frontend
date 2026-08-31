import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { KeysI18nKey, RolesI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { DialKeyResource } from '@/src/models/dial/resource';
import { DialRole } from '@/src/models/dial/role';
import KeyRoles from '../KeyRoles';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: vi.fn(() => false),
}));

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ rowData }: { rowData: unknown[] }) => <div>{`grid:${rowData.length}`}</div>,
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

  test('Renders the Add Roles button for a write admin', () => {
    renderKeyRoles();

    expect(screen.getByTitle(RolesI18nKey.AddRoles)).toBeInTheDocument();
  });

  test('Calls onChange with added role names when Add Roles is confirmed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderKeyRoles({}, onChange);

    await user.click(screen.getByTitle(RolesI18nKey.AddRoles));
    await user.click(screen.getByText('ApplyRoles'));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ roles: ['reader'] }));
  });

  test('Does not render the Add Roles button for a read-only admin', () => {
    vi.mocked(useIsReadOnlyAdmin).mockReturnValue(true);

    renderKeyRoles();

    expect(screen.queryByTitle(RolesI18nKey.AddRoles)).not.toBeInTheDocument();
  });
});
