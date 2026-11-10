import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { ApplicationRoute } from '@/src/types/routes';
import RoutersList from '../List';

vi.mock('@/src/components/Assets/BaseAssetList/BaseAssetList', () => ({
  default: ({ view }: any) => <div>base-asset-list:{view}</div>,
}));

describe('RoutersList', () => {
  test('renders BaseAssetList scoped to the PlatformRouters view', () => {
    render(<RoutersList />);

    expect(screen.getByText(`base-asset-list:${ApplicationRoute.PlatformRouters}`)).toBeInTheDocument();
  });
});
