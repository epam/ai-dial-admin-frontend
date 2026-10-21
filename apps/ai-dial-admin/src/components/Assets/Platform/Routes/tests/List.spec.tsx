import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ApplicationRoute } from '@/src/types/routes';
import RoutesList from '../List';

vi.mock('@/src/components/Assets/BaseAssetList/BaseAssetList', () => ({
  default: ({ view }: any) => <div>base-asset-list:{view}</div>,
}));

describe('RoutesList', () => {
  test('renders BaseAssetList scoped to the PlatformRoutes view', () => {
    render(<RoutesList />);

    expect(screen.getByText(`base-asset-list:${ApplicationRoute.PlatformRoutes}`)).toBeInTheDocument();
  });
});
