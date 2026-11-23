import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ApplicationRoute } from '@/src/types/routes';
import InterceptorsList from '../List';

vi.mock('@/src/components/Assets/TabbedAssetList/TabbedAssetList', () => ({
  default: ({ view }: any) => <div>base-asset-list:{view}</div>,
}));

describe('InterceptorsList', () => {
  test('renders TabbedAssetList scoped to the AssetsInterceptors view', () => {
    render(<InterceptorsList />);

    expect(screen.getByText(`base-asset-list:${ApplicationRoute.PlatformInterceptors}`)).toBeInTheDocument();
  });
});
