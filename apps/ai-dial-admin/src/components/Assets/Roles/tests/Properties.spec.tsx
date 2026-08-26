import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { RolesI18nKey } from '@/src/constants/i18n';
import { DialRoleResource } from '@/src/models/dial/resource';
import RoleAssetProperties from '../Properties';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: vi.fn(() => false),
}));

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: () => <section aria-label="role-sharing" />,
}));

const baseAsset = {
  name: 'my-role',
  path: 'my-role',
  folderId: '',
} as DialRoleResource;

const renderProperties = (asset: Partial<DialRoleResource> = {}) =>
  render(<RoleAssetProperties asset={{ ...baseAsset, ...asset }} isSkipRefresh onChange={vi.fn()} />);

describe('Role asset Properties', () => {
  test('Should render the cost-limit toggle', () => {
    renderProperties();

    expect(screen.getByText(RolesI18nKey.SetCostLimits)).toBeInTheDocument();
  });

  test('Should render the sharing grid header', () => {
    renderProperties();

    expect(screen.getByText(RolesI18nKey.Sharing)).toBeInTheDocument();
  });

  test('Should offer no display name control, since a Core role resource carries none', () => {
    renderProperties();

    expect(screen.queryByRole('textbox', { name: /display name/i })).not.toBeInTheDocument();
  });
});
