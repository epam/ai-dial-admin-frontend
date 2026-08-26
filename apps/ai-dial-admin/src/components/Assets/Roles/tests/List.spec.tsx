import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ApplicationRoute } from '@/src/types/routes';
import RolesList from '../List';

vi.mock('@/src/components/Assets/BaseAssetList/BaseAssetList', () => ({
  default: ({ view }: any) => <div>base-asset-list:{view}</div>,
}));

describe('RolesList', () => {
  test('renders BaseAssetList scoped to the AssetsRoles view', () => {
    render(<RolesList />);

    expect(screen.getByText(`base-asset-list:${ApplicationRoute.AssetsRoles}`)).toBeInTheDocument();
  });
});
